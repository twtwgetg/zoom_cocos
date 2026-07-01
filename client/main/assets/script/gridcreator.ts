import { _decorator, Component, Node, Sprite, UITransform, Vec2, instantiate, director, Prefab, math, Vec3, tween, Label, Color, Button, SpriteFrame, input, Input, KeyCode } from 'cc';
import { Main } from './main';
import { LevelMgr, GameMode, GameType } from './levelmgr';
import { frm_main } from './ui/frm_main';
import { item_tools } from './item/item_tools';
import { tools } from './tools';
import { TObject } from './Card/TObject';
import { TBlock } from './Card/TBlock';
const { ccclass, property } = _decorator;


@ccclass('gridcreator')
export class gridcreator extends Component {

    @property
    wid: number = 5;
    @property
    hei: number = 10;
    @property(Prefab)
    item: Prefab = null!;
    @property(Node)
    container: Node = null!;
    @property(Node)
    card_container: Node = null!;
    @property(Prefab)
    item_line: Prefab = null!;
    public static map: (number | number[])[][] = [];
    public gridsize: number = 100;
    private level_cur: number = 0;
    private pl: SpriteFrame[] = [];
    @property(Node)
    bg: Node = null!;
    private gameOver: boolean = false; // 婵炴挸鎲￠崹娆戠磼閹惧瓨灏嗛柡宥呮搐缁?
    private isBoardMoving: boolean = false;
    private boardMoveUnlockTimer: any = null;

    // 婵烇綀顕ф慨鐐层€掗崨濠傜亞缂侇偉顕ч悗鐑藉矗濮椻偓閸?
    public gameType: GameType = GameType.NORMAL;

    // 婵烇綀顕ф慨鐐哄礂閻撳寒鍟囬柟顒夋贡etter闁哄倽顫夌涵?
    public get isSanxiaoMode(): boolean {
        return this.gameType === GameType.SANXIAO;
    }

    public get isLayerSplitMode(): boolean {
        return this.gameType === GameType.LAYER_SPLIT;
    }
    public get isLianliankanMode(): boolean {
        return this.gameType === GameType.NORMAL;
    }
    public get isInfiniteMode(): boolean {
        return this.gameType === GameType.INFINITE;
    }
    public get isMemMode(): boolean {
        return this.gameType === GameType.MEM;
    }
    public get NeedJiShi(): boolean {
        return this.gameType === GameType.NORMAL;
    }

    public get IsBoardMoving(): boolean {
        return this.isBoardMoving;
    }

    public LockBoardInput(duration: number) {
        this.lockBoardInput(duration);
    }

    private lockBoardInput(duration: number) {
        if (this.boardMoveUnlockTimer) {
            clearTimeout(this.boardMoveUnlockTimer);
            this.boardMoveUnlockTimer = null;
        }

        this.isBoardMoving = true;
        this.boardMoveUnlockTimer = setTimeout(() => {
            this.isBoardMoving = false;
            this.boardMoveUnlockTimer = null;
        }, Math.ceil(duration * 1000) + 80);
    }

    private unlockBoardInput() {
        if (this.boardMoveUnlockTimer) {
            clearTimeout(this.boardMoveUnlockTimer);
            this.boardMoveUnlockTimer = null;
        }
        this.isBoardMoving = false;
    }

    onLoad() {
        // 婵炲鍔岄崬鑺ョ鐎ｂ晜顐?
        this.registEvents();
    }

    private registEvents() {
        // 閺夆晜鐟╅崳鐑藉磻閸ヮ亶鍟嶮ain闁哄嫷鍨粩瀛樼▔椤忓嫬寮块悘鐐╁亾闁汇劌瀚花銊︾閸撲緡鍚€闁荤偛妫涚悮顐︽晬鐏炶姤韬珻ocos濞戞搩鍘艰ぐ鍙夌閵夈倕鈻忛柣鈶╂殜irector闁瑰瓨鐗為崵婊呪偓瑙勭煯缁犵喐绂嶇€ｂ晜顐界紒鐙呯磿閹﹪宕?

        Main.RegistEvent('event_tixing',(x)=>{
            const children = this.card_container.children;
            for (const child of children) {
                const p = child.getComponent('TObject') as TObject;
                if (!p) continue;

                if (p.Tixing()) {
                    break;
                }
            }
        });

        Main.RegistEvent('CARD_ANIMATIONS_COMPLETE', (x)=>{
            if(this.gameType === GameType.LAYER_SPLIT){
                this.updateAllCardMaskStatus();
            }
            else{

            }
        })

        Main.RegistEvent('event_move_to_container', (x)=>{
            const children = this.card_container.children;
            for (const child of children) {
                for(let i=0;i<child.children.length;i++){
                    const p = child.children[i].getComponent('TObject') as TObject;
                    if (!p) continue;
                    p.updateMaskStatus();
                }
            }
        });

        Main.RegistEvent('GET_CARD_GUIDE', (x)=>{
            const children = this.card_container.children;
            for (const child of children) {
                const p = child.getComponent('TObject') as TObject;
                if (!p) continue;

                let tx = p.GetTixing();
                if(tx.length>0){
                    return tx;
                }
            }
        });
        Main.RegistEvent('game_lose', (x)=>{
            this.clear();
            this.gameOver = true;
            this.initFruzon(); // 婵繐绲块垾妯恒€掗崨瀛樼彑闁告劕鍢插畵鍫ユ偐閼哥鍋撴担鍛婂閻庤纰嶅鍌炲闯?
            return null;
        })
        Main.RegistEvent('game_win', (x)=>{
            this.clear();
            this.gameOver = true;
            this.initFruzon(); // 婵繐绲块垾妯恒€掗崨瀛樼彑闁告劕鍢插畵鍫ユ偐閼哥鍋撴担鍛婂閻庤纰嶅鍌炲闯?

            // 婵炴挸鎲￠崹娆撴嚄濠婂啫鐒洪柡鍐硾瑜板倿寮ㄩ幆褍褰犻柛妞烩偓鎰佹闁?
            this.distributeLevelRewards(x);

            return null;
        })
        Main.RegistEvent('event_showfront', (x)=>{

            for (const child of this.card_container.children) {
                const p = child.getComponent('TObject') as any;
                if (!p) continue;
                p.Select(3000);
            }
            return null;
        })

        Main.RegistEvent('event_brush', (x)=>{
            this.brushkind();
            return null;
        });

        // 婵烇綀顕ф慨鐐寸鐎ｂ晜顐介柨娑欎亢楠炲繘宕ｉ弽顐ょЧ闁哄秶鍘ч崹鍗烆嚈閸濆嫭鐝ら悗鍦仒缁?
        Main.RegistEvent('event_get_gridcreator', () => {
            return this;
        });

        // 婵烇綀顕ф慨鐐寸鐎ｂ晜顐介柨娑欎亢楠炲繘宕ｉ弽顐ょЧ闁哄秹妫块懙鎴︽儍閸曨偆鎽嶉柤鍝勫€婚崑?
        Main.RegistEvent('event_get_grid_children', () => {
            if(this.isLayerSplitMode){
                for(let i=0;i<this.card_container.children.length;i++){
                    const layerx = this.card_container.children[i];
                    if(layerx.children.length>0){
                        return layerx.children;
                    }
                }
                return [];
            }
            return this.card_container.children;
        });

        // 婵烇綀顕ф慨鐐寸鐎ｂ晜顐介柨娑欑椤ュ懘寮婚妷褏绉归柡宥夋？閼垫垿寮伴姘剨閺夆晜蓱濠€渚€宕￠敍鍕杺闁挎稑鐗忛弫銈嗙鎼粹€崇€婚悘鐐插€歌ぐ鏃堝礉閻樿‖浣割嚕韫囥儳绀?
        Main.RegistEvent('event_has_cards_in_grid', () => {
            // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剚韬柛鎺戞閻即宕ｉ悩鎻掝潱婵☆垪鈧磭纭€濞戞挸顑戠槐婵嬫閳ь剛鎲版担璇℃⒕闁哄被鍎卞﹢鎾炊閻愵剚娈堕柟?
            if (this.isLayerSplitMode) {
                for(let layer = 0; layer < this.card_container.children.length;layer++){
                    const layerx = this.card_container.children[layer];
                    if(layerx.children.length>0){
                        return true;
                    }
                }
                // 濠碘€冲€归悘澶愬箥閳ь剟寮垫径澶岀Т缂傚喚鍣ｉ崗妯荤▔閾忓厜鏁勯柨娑樼焷椤曗晠寮版惔銏㈡⒕闁哄牆顦畷閬嶆偋鐏炶偐鍟?
                return false;
            } else {
                // 闁革负鍔嶅▍姗€鏌呭顒戒礁顕ｈ箛搴ｇ憮闁挎稑鏈ˉ鍛村蓟閵夈劌螡闁绘劘顫夐弳鐔兼煂?
                return this.card_container.children.length > 0;
            }
        });

        // 婵烇綀顕ф慨鐐寸鐎ｂ晜顐介柨娑欑缁旇崵绮氶搹鍦Ч闁哄秹妫块懙鎴︽儍閸曨剙顣查柡鍫濐槸瀹曢亶鎮у畝瀣闁活潿鍔嬬花顒勫礆閸℃婀撮柛娆戝Т婵偛螣閳ュ磭纭€濠㈡儼绮剧憴锕傚籍鐠佸湱绀?
        Main.RegistEvent('event_clear_grid_cards', () => {
            this.clear();
            return null;
        });

        // 婵烇綀顕ф慨鐐寸鐎ｂ晜顐介柨娑欑濡绮堥崫鍕€婚柡浣规緲閼村﹪宕欓悜妯绘珡闁哄绮ｇ槐娆撴偨閵娿倗鑹鹃柛鎺戞閻即宕ｉ悩鎻掝潱婵☆垪鈧磭纭€闁?
        Main.RegistEvent('event_show_score_popup', (position) => {
            if (position) {
                this.showScorePopup(position);
            }
            return null;
        });

        // 婵烇綀顕ф慨鐐寸鐎ｂ晜顐介柨娑欒壘閻ㄣ垽宕￠敍鍕杺濞寸姴楠稿畷鍗炍ｉ悾灞濃晠宕堕悙鐢电Ч闁哄秶銆嬬槐娆撴偨閵娿倗鑹鹃柛鎺戞閻即宕ｉ悩鎻掝潱婵☆垪鈧磭纭€闁?
        Main.RegistEvent('event_move_card_to_grid', (cardNode) => {
            if (cardNode && cardNode instanceof Node) {
                this.moveCardToGrid(cardNode);
            } else {
                console.warn('闁哄啰濮甸弲銉╂儍閸曨偄骞㈤柣妤€鐭佹俊顓㈡倷閻熸澘妫橀柡?', cardNode);
            }
            return null;
        });

        let that =this;
        Main.RegistEvent('event_zhengli', async ()=>{

            //濠碘€冲€归悘澶娿€掗崨濠傜亞缂備焦鎸诲顐ｇ閸☆厾绀夐梺顓ㄧ导缁犵偟浜搁崣妯肩憹闁圭瑳鍡╂斀
            if(this.gameOver)
                return null;

             // 闁轰礁顕幃濠囧础閿涘嫬顣?
            that.zhengli();
            that.checkLeft();

            if (that.card_container.children.length === 0) {
                frm_main.isPause = true;

                // 缂佹稑顦欢?.5缂?
                await new Promise(resolve => setTimeout(resolve, 500));

                // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敂鑳闁哄啰濞€濡惧搫螣閳ュ磭纭€
                if (this.isInfiniteMode) {
                    // 闁哄啰濞€濡惧搫螣閳ュ磭纭€濞戞挸顑堣闁告瑦鍨跺Λ銈夋⒔閹邦劷浣割嚕韫囨艾鍔忛柛鎺嗘櫃缁ㄣ劍绂?
                    Main.DispEvent('game_win_infinite');
                } else {
                    // 闁哄拋鍣ｉ埀顒佺鑶╃€殿喖绻嬬粭鍛喆閿曗偓瑜板倿寮查鈧埀顒佷亢閸庛劑宕氶埡鈧花銊︾?
                    Main.DispEvent('game_win',LevelMgr.level);
                }
            }
        });

        Main.RegistEvent('event_play', () => {
            //闂佹彃绉甸弻濠傤嚕閳ь剚鎱ㄧ€ｅ墎绀夐梺顓ㄧ导缁犵偤宕氶悩缁樼彑濞戞柨顑呮晶鐘绘儍閸曨偆鏆伴柡鍐硾濞呮帡鏁嶅畝鍕╂慨婵勫灲閸ｅ憡寰勫鍩挎洟宕?
            this.gameOver = false; // 闂佹彃绉堕悿鍡椼€掗崨濠傜亞缂備焦鎸诲顐﹀冀閸パ呯
            this.initFruzon();
        });
        Main.RegistEvent('event_resettime',(x)=>{
                        // Clear existing timeout if any
            console.log('Start time cooldown');
            this.initFruzon();
            Main.DispEvent('event_fruszon',true);

            // 闁哄秷顫夊畵渚€宕楅崘鎻掑耿闂傚懏鍎崇€瑰磭鎷崘鈺傛闁告劕鍢插畵鍫ュ籍閸洘锛?
            const cooldownTime = LevelMgr.getToolCooldown(LevelMgr.level);
            console.log(`Current level: ${LevelMgr.level + 1}, cooldown: ${cooldownTime / 1000}s`);
            Main.DispEvent("event_msg_top",{msg: `Cooldown: ${cooldownTime / 1000}s`});
            this.resetTimeoutId = setTimeout(()=>{
                console.log('Time cooldown ended');
                Main.DispEvent('event_fruszon',false);
                this.resetTimeoutId = null;
            }, cooldownTime);
            console.log('闁告劕鍢插畵鍫⑩偓瑙勭濡炲倿宕抽埆鏈?', this.resetTimeoutId);
        });
        Main.RegistEvent('event_isfruszon', () => {
            const isCooling = this.resetTimeoutId !== null;
            console.log('婵☆偀鍋撻柡灞诲劚閸犲酣宕＄€电笑闁?', isCooling, '閻庤纰嶅鍌炲闯閳湆:', this.resetTimeoutId);
            return isCooling;
        });
    }
    initFruzon(){
        if (this.resetTimeoutId) {
            console.log('婵炴挸鎳樺▍搴㈢▕鐎ｎ亜顤呴柣銊ュ閸犲酣宕￠弶鎴犳毎闁哄啳娉涘▍?', this.resetTimeoutId);
            clearTimeout(this.resetTimeoutId);
            this.resetTimeoutId = null;
            Main.DispEvent('event_fruszon',false);
        }
        console.log('Cooldown state reset');
    }
    resetTimeoutId: any=null;
    checkLeft() {
        let hasconnect = false;
        let trytimes = 10;

        while (!hasconnect && trytimes > 0) {
            trytimes--;
            const children = this.card_container.children;

            for (const child of children) {
                const p = child.getComponent(TObject);
                if (p && p.HasConnect()) {
                    hasconnect = true;
                    break;
                }
            }

            if (!hasconnect) {
                const xs = this.card_container.getComponentsInChildren(TObject);
                if (xs.length > 1) {
                    console.log('No connection, reshuffle');
                    this.brushkind();
                }
            }
        }
    }

    get plSprites(): SpriteFrame[] {
        // 閺夆晜鐟╅崳鐑芥閳ь剛鎲版笟鈧埀顒€鍊块崢顥﹐cos闁汇劌瀚粊顐⑩攦閹邦垰绠柛娆愮墬閺岀喎顕?
        // 闁稿娲╅鏄卆in.DispEvent闁哄嫷鍨粩瀛樼▔椤忓嫬寮块悘鐐╁亾濞存粌顑勫▎銏ゅ礆閸℃绲洪柛鎴ｅГ閺?
        return Main.DispEvent('EVENT_GETPLSPRITES');// (director.emit('EVENT_GETRES') as unknown) as Sprite[];
    }

    clear(){
        this.unlockBoardInput();
        this.card_container.removeAllChildren();
    }
    /**
     * 閻犱焦婢樼换鍌毼熼垾宕囩
     * @param wid
     * @param hei
     * @returns
     */
    CreateMem(wid: number, hei: number) {
        this.gameOver = false;
        // 缁绢収鍠曠换姘辨媼閸撗呮瀭婵炴挸鎲￠崹娆戠尵鐠囪尙鈧攱绋夋ウ娆惧敹闊洤妫欒啯鐎?
        this.gameType = GameType.MEM;

        // 閻犱礁澧介悿鍡欑磾閹寸偟澹愰悘蹇撴惈椤?
        this.wid = wid;
        this.hei = hei;

        // 婵炴挸鎳愰埞鏍嚍閸屾粌浠?
        this.clear();

        // 闁告帗绻傞～鎰板礌閺嵮勫嬀闁?
        gridcreator.map = [];
        for (let i = 0; i < this.wid + 2; i++) {
            gridcreator.map[i] = [];
            for (let j = 0; j < this.hei + 2; j++) {
                gridcreator.map[i][j] = 0;
            }
        }

        // 閻犱緤绱曢悾鑽ょ磾閹寸偟澹愬鍫嗗啰姣?
        const parentRect = this.node.getComponent(UITransform)!;
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;

        const cellWidth = availableWidth / this.wid;
        const cellHeight = availableHeight / this.hei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(180, this.gridsize);

        // 閻犱緤绱曢悾濠氬箑缂佹澹愰悗娑欏姈閺嗙喖宕仦绛嬪殸闁?
        const totalCells = this.wid * this.hei;
        const totalPairs = Math.floor(totalCells / 2);

        // 闁兼儳鍢茶ぐ鍥矗椤栨粍鏆忕紒顐ヮ嚙閻庣兘寮导鏉戞
        this.pl = this.plSprites;
        // 闁哄秷顫夊畵渚€寮介悡搴ｆ憤闁轰椒鍗抽崳铏规媼閸撗呮瀭闁告绱曟晶婵堢矓瀹ュ洩顫﹂柡浣峰嵆閸ｇ儤绋夐悜妯煎閻庢稒鍔栭弳鐔兼煂?4
        const availableTypes = Math.min(Math.max(4, Math.floor(totalCells / 4)), this.pl.length - 1); // 闁煎嘲鍟块惃?缂佸绉村畷閬嶆偋瀹€瀣闁哄牃鍋撳鑸电煯缁楀鎼鹃崨鎵畺闁告瑯鍨抽弫銈囩尵鐠囪尙鈧?
        if (availableTypes < 2) {
            console.error('Not enough image types');
            return;
        }

        // 闁汇垻鍠愰崹姘跺础閿涘嫬顤傞柨?闁挎稑鐗婇崹?濞戞搩浜濇晶鐘绘嚄閼恒儳啸闂傚嫨鍊х槐? 20闁挎稑鐗嗗畷閬嶆偋瀹€鈧～鎺旂尵娴兼瑧绀? 5闁挎稑鐗婇惁锛勭矓瀹ュ懎骞㈤柣妤€鏈弳鐔兼煂?缂備礁瀚哥槐? 300濞戞搩浜滃畷閬嶆偋?
        const cardTypes: number[] = [];

        // 濞戞挾鍎ら惁锛勭矓瀹ュ洩顫﹂柛銊ヮ儑閺佹捇骞?缂備礁瀚哥槐婵喰掕箛鏇犵煁3濞戞搩浜炲ù澶愬触瀹€鈧▓鎴﹀础閿涘嫬顤?
        for (let type = 1; type <= availableTypes; type++) {
            for (let group = 0; group < 5; group++) { // 5缂?
                for (let i = 0; i < 3; i++) { // 婵絽绻掔划?濞?
                    cardTypes.push(type);
                }
            }
        }

        // 闁瑰灚鎸风拹锟犲础閿涘嫬顤傜紒顐ヮ嚙閻庣兘寮幍顔剧煁
        this.Shuffle(cardTypes);

        // 闁汇垻鍠愰崹姘跺箥閳ь剟寮垫径澶岀Т缂?
        const positions: Vec2[] = [];
        for (let i = 0; i < this.wid; i++) {
            for (let j = 0; j < this.hei; j++) {
                positions.push(new Vec2(i + 1, j + 1));
            }
        }

        // 闁瑰灚鎸风拹鈩冩媴瀹ュ洨鏋?
        this.Shuffle(positions);

        // 闁汇垻鍠愰崹姘跺础閿涘嫬顣婚悗?
        for (let p = 0; p < totalPairs; p++) {
            const type = cardTypes[p * 2]; // 闁兼儳鍢茶ぐ鍥础閿涘嫬顤傜紒顐ヮ嚙閻?

            // 闁兼儳鍢茶ぐ鍥ㄧ▔閵堝嫰鍤嬪ù锝呯Ф閻?
            const pos1 = positions[p * 2];
            const pos2 = positions[p * 2 + 1];

            // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂?
            gridcreator.map[pos1.x][pos1.y] = type;
            gridcreator.map[pos2.x][pos2.y] = type;

            // 闁汇垻鍠愰崹姘跺础閿涘嫬顣?
            let card1 = this.SpawnCard(pos1, type);
            let card1Obj = card1.getComponent('TObject') as TObject;
            card1Obj.SetHideMode(true);
            let card2 = this.SpawnCard(pos2, type);
            let card2Obj = card2.getComponent('TObject') as TObject;
            card2Obj.SetHideMode(true);

        }

        this.PlayEffect();
    }
    get availableWidth(): number {
        const parentRect = this.node.getComponent(UITransform)!;
        return parentRect.width;
    }
    get availableHeight(): number {
        const parentRect = this.node.getComponent(UITransform)!;
        return parentRect.height;
    }

    private tweenBoardSize(width: number, height: number) {
        const bgTransform = this.bg.getComponent(UITransform)!;
        const from = {
            width: bgTransform.width,
            height: bgTransform.height,
        };

        tween(from)
            .to(0.28, { width, height }, {
                easing: 'sineOut',
                onUpdate: () => {
                    bgTransform.setContentSize(from.width, from.height);
                },
            })
            .call(() => {
                bgTransform.setContentSize(width, height);
            })
            .start();
    }

    Create(level_playing: number) {
        this.gameOver = false;
        // 缁绢収鍠曠换姘舵煂瀹ュ洨鏋傛繛鎾虫啞閸ㄦ瑧鐚剧拠鑼偓閿嬬▔閻戞ɑ鐝梺顐ｇ鑶╃€?
        this.gameType = GameType.NORMAL;
        this.level_cur = level_playing;

        // 婵炴挸鎳愰埞鏈bject闁挎稑鐗撳〒鍓佹啺娴ｅ湱澹岄柟璇″枛閻ゅ嫰姊介崨顓犳澖闁绘粍濯介惃鐔煎极鏉堝墽绀?
        // TObject.clear();

        // 闁兼儳鍢茶ぐ鍥礂閸愭彃骞㈤悗閫涚矙閻濐噣鏁嶉崼銉︿粯閻熸洑绀侀悿鍕偝閻х炒velmgr闁?
        this.wid = LevelMgr.getWid(level_playing);
        this.hei = LevelMgr.getHei(level_playing);

        // 婵炴挸鎳愰埞鏍嚍閸屾粌浠?
        this.clear();

        // 闁告帗绻傞～鎰板礌閺嵮勫嬀闁?
        gridcreator.map = [];
        for (let i = 0; i < this.wid + 2; i++) {
            gridcreator.map[i] = [];
            for (let j = 0; j < this.hei + 2; j++) {
                gridcreator.map[i][j] = 0;
            }
        }



        const fillRatio = this.wid <= 5 ? 0.98 : 0.92;
        const cellWidth = this.availableWidth * fillRatio / this.wid;
        const cellHeight = this.availableHeight * fillRatio / this.hei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(180, this.gridsize);

        const boardPadding = Math.max(56, this.gridsize * 0.36);
        const boardWidth = this.wid * this.gridsize + boardPadding * 2;
        const boardHeight = this.hei * this.gridsize + boardPadding * 2;
        this.tweenBoardSize(boardWidth, boardHeight);

        // 閻犱緤绱曢悾濠氬箑缂佹澹愰悗娑欏姈閺嗙喖宕仦绛嬪殸闁?
        const totalCells = this.wid * this.hei;
        const totalPairs = Math.floor(totalCells / 2);

        // 闁兼儳鍢茶ぐ鍥矗椤栨粍鏆忕紒顐ヮ嚙閻庣兘寮导鏉戞
        this.pl = this.plSprites;
        const availableTypes = this.pl.length - 1;
        if (availableTypes < 2) {
            console.error('Not enough image types');
            return;
        }

        // 闁汇垻鍠愰崹姘跺箥閳ь剟寮垫径澶岀Т缂?
        const positions: Vec2[] = [];
        for (let i = 0; i < this.wid; i++) {
            for (let j = 0; j < this.hei; j++) {
                positions.push(new Vec2(i + 1, j + 1));
            }
        }

        // 闁瑰灚鎸风拹鈩冩媴瀹ュ洨鏋?
        this.Shuffle(positions);

        // 闁兼儳鍢茶ぐ鍥礂閸愭彃骞㈤悹浣插墲閺嗙喖鏁嶉崼銉︿粯閻熸洑绀侀悿鍕偝閻х炒velmgr闁?
        const cardTypesCount = Math.min(Math.max(4, Math.floor(totalCells / 4)), availableTypes);
        // 闁汇垻鍠愰崹姘跺础閿涘嫬顣婚悗?- 闁哄秷顫夊畵浣姐亹閹惧啿顤呯紒娑橆槺妤犲洭宕仦鍓у煑闁规潙绻戣啯鐎殿喖绻戝▍銈夋嚄娴犲鍋撴径瀣仴闁告绱曟晶?
        const cardTypes: number[] = [];
        for (let i = 0; i < cardTypesCount*4; i++) {
            cardTypes.push(i + 1);
            cardTypes.push(i + 1); // 闁瑰瓨鍔曢顔记庣拠鎻掝潱
        }

        // 闁瑰灚鎸风拹锟犲础閿涘嫬顤傜紒顐ヮ嚙閻庣兘寮幍顔剧煁
        this.Shuffle(cardTypes);

        // 闁汇垻鍠愰崹姘跺础閿涘嫬顣婚悗?
        for (let p = 0; p < totalPairs; p++) {
            const type = cardTypes[p * 2]; // 闁兼儳鍢茶ぐ鍥础閿涘嫬顤傜紒顐ヮ嚙閻?

            // 闁兼儳鍢茶ぐ鍥ㄧ▔閵堝嫰鍤嬪ù锝呯Ф閻?
            const pos1 = positions[p * 2];
            const pos2 = positions[p * 2 + 1];

            // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂?
            gridcreator.map[pos1.x][pos1.y] = type;
            gridcreator.map[pos2.x][pos2.y] = type;

            // 闁汇垻鍠愰崹姘跺础閿涘嫬顣?
            this.SpawnCard(pos1, type);
            this.SpawnCard(pos2, type);
        }

        this.PlayEffect();
    }
    /**
     * 闁圭虎鍘介弬渚€宕欓崫鍕皻闁轰礁鐗婇悘?
     */
    PlayEffect() {
        // 閻犱緤绱曢悾缁樼▔椤撶偟濡囬柣鎰扳偓娑氱Т缂?
        const centerX = 0;
        const centerY = 0;

        // 闁告帗绋戠紓鎾寸▔閳ь剚绋夐鍛缂備礁瀚鐢碘偓娑櫭崑宥夊箥閳ь剟寮垫径灞剧暠闁告绱曟晶鏍礉閵娧勬毎Promise
        const cardPromises: Promise<void>[] = [];

        if(this.gameType == GameType.LAYER_SPLIT){
            // 闁告帒妫楅惇浼村矗閻樻彃顫ｆ俊顖椻偓宕囩闁挎稑濂旂粭澶愬箻椤撶喐鏉归柛鏂诲妿閺?
            for(let layer = 0; layer < this.totallayer; layer++){
                let layerNode = this.card_container.children[layer];
                let layerChildren = layerNode.children;

                for(let i = 0; i < layerChildren.length; i++) {
                    const child = layerChildren[i];
                    const card = child.getComponent('TObject') as TObject;
                    if (card) {
                        // 闁兼儳鍢茶ぐ鍥础閿涘嫬顣婚柣銊ュ閸ㄥ灚鎱ㄧ€ｂ晝绉寸紓?
                        const originalPosition = child.position.clone();
                        // 闁汇垻鍠愰崹姘舵⒕韫囨梹绨氶柣銊ュ娴犳盯姊块崱鏇犵Т缂傚喚鍣槐娆撳捶閵娿倛鍘煫鍥у暟閸嬶綁姊介崟顔剧闁?
                        const randomOffsetX = (Math.random() - 0.5) * 76;
                        const randomOffsetY = (Math.random() - 0.5) * 76;
                        const gatherPos = new Vec3(
                            centerX + randomOffsetX,
                            centerY + randomOffsetY,
                            originalPosition.z
                        );
                        card.oldpos = child.position.clone(); // 濞ｅ洦绻傞悺銊╁储閻斿娼楀ù锝呯Ф閻?
                        // 闁稿繐鐗嗛惃銏ゅ箥閳ь剟寮垫径濠傚耿闁绘娲ㄤ簺闁告柣鍔岄崺宀勬⒕韫囨梹绨氶柤杈ㄥ哺濞夛附鎷呭鍥╂瀭
                        child.setPosition(gatherPos);
                    }
                }
            }
        }
        else{
            // 濞戞挾鍎ら惁鈩冪▔椤忓嫬骞㈤柣妤€娲ら崹鍗烆嚈閸濆嫬袟闁?
            for(let i = 0; i < this.card_container.children.length; i++) {
                const child = this.card_container.children[i];
                const card = child.getComponent('TObject') as TObject;
                if (card) {
                    // 濞ｅ洦绻傞悺銊╁储閻斿娼楀ù锝呯Ф閻?
                    const originalPosition = child.position.clone();

                    // 闁汇垻鍠愰崹姘舵⒕韫囨梹绨氶柣銊ュ娴犳盯姊块崱鏇犵Т缂傚喚鍣槐娆撳捶閵娿倛鍘煫鍥у暟閸嬶綁姊介崟顔剧闁?
                    const randomOffsetX = (Math.random() - 0.5) * 76;
                    const randomOffsetY = (Math.random() - 0.5) * 76;
                    const gatherPos = new Vec3(
                        centerX + randomOffsetX,
                        centerY + randomOffsetY,
                        originalPosition.z
                    );
                    card.oldpos = child.position.clone(); // 濞ｅ洦绻傞悺銊╁储閻斿娼楀ù锝呯Ф閻?
                    // 闁稿繐鐗嗛惃銏ゅ箥閳ь剟寮垫径濠傚耿闁绘娲ㄤ簺闁告柣鍔岄崺宀勬⒕韫囨梹绨氶柤杈ㄥ哺濞夛附鎷呭鍥╂瀭
                    child.setPosition(gatherPos);
                }
            }
        }


        // 鐎点倖鍎肩换?.5缂佸甯掗幃妤呭箻椤撶喐鏉箃UpdateCardPositions闁告柣鍔庨弫?
        this.lockBoardInput(0.85);
        setTimeout(() => {
            this.tUpdateCardPositions(0.55, () => {
                Main.DispEvent('CARD_ANIMATIONS_COMPLETE');
            });
        }, 250);
    }

    private tUpdateCardPositions(time=0.3, onComplete?: () => void) {
        this.lockBoardInput(time);

        // 閻犱緤绱曢悾缁樼▔椤撶偟濡囬柣鎰扳偓娑氱Т缂?
        const centerX = 0;
        const centerY = 0;

        // 閻犱緤绱曢悾濠氭閳ь剛鎲版担鐟扳挃閻炴稑鑻慨鈺呮偨閼姐倖鐣遍悗娑欏姌婵☆參鎮欑憴鍕闂?
        let allcard=[];
        let totalAnimatedChildren = 0;
        if(this.gameType == GameType.LAYER_SPLIT){
            // 闁告帒妫楅惇浼村矗閻樻彃顫ｆ俊顖椻偓宕囩闁挎稑濂旂粭澶愬箻椤撶喐鏉归柛鏂诲妿閺?
            for(let layer = 0; layer < this.totallayer; layer++){
                let layerNode = this.card_container.children[layer];
                let layerChildren = layerNode.children;

                for(let i = 0; i < layerChildren.length; i++) {
                    const child = layerChildren[i];
                    const card = child.getComponent('TObject') as TObject;
                    if (card) {
                        totalAnimatedChildren++;
                        allcard.push(card);
                    }
                }
            }
        }
        else{
            // 濞戞挾鍎ら惁鈩冪▔椤忓嫬骞㈤柣妤€娲ら崹鍗烆嚈閸濆嫬袟闁?
            const children = this.card_container.children;
            for (const child of children) {
                const tobj = child.getComponent('TObject') as TObject;
                if (tobj && tobj.x !== undefined && tobj.y !== undefined) {
                    totalAnimatedChildren++;
                    allcard.push(tobj);
                }
            }
        }

        // 濠碘€冲€归悘澶娾柦閳╁啯绠掗梻鍥ｅ亾閻熸洑绀佹慨鈺呮偨閼姐倖鐣遍悗娑欏姌婵☆參鎮欓惂鍝ョ闁烩晛鐡ㄧ敮鎾箥瑜戦、鎴犫偓鐟版湰閸ㄦ岸宕堕悙鍓佹
        if (totalAnimatedChildren === 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        let completedAnimations = 0;

        for (const tobj of allcard) {
            // 婵烇綀顕ф慨鐐电矚閸濆嫧鍋撻崗纰辨⒕闁哄被鍎荤槐婵嬫⒓閸欏鍓総obj濞戞挾鐨爑ll闁哄啳娉涢崵顓㈡偝娴煎瓨鏅╅悹?
            if (!tobj || tobj.x === undefined || tobj.y === undefined) {
                continue;
            }
            const child = tobj.node;
            //let pos = this.tref.add(new Vec2((tobj.x) * this.gridsize, (tobj.y) * this.gridsize));
            const targetPos = tobj.oldpos;

            // 閻犱礁澧介悿鍡涘礆濠靛棭娼楀ù锝呯Ф閻ゅ棙绋夋潪鎷屽幀闊洤鍟伴崑锝夋晬鐏炵晫鏉介柣婊勫閸ㄥ酣鎮欓崨濠冩珡闁?
            child.setPosition(new Vec3(centerX, centerY, 0));

            // 婵烇綀顕ф慨鐐烘⒕韫囨梹绨氱紓鍌楁櫆閺備線宕仦鐐棆閺夌儐鍓欓崹鍨叏鐎ｎ亖鍋撶涵椋庣濠⒀呭仜瀹搁亶鎮ラ崱娆忎划闁轰礁鐗婇悘?
            const randomScale = 0.1 + Math.random() * 0.3;
            const randomRotation = (Math.random() - 0.5) * 60;
            child.setScale(new Vec3(randomScale, randomScale, 1));
            child.angle = randomRotation;

            // 濞达綀娉曢弫顦歸een闁告柣鍔庨弫鍓р偓鍦仧楠炲洭鎮ラ崱娆忎划鐎殿喖绻愰惈宥咁嚕閳ь剟寮崼鐔轰函
            tween(child).stop();
            tween(child)
                .to(time, {
                    position: targetPos,
                    scale: new Vec3(1, 1, 1),
                    angle: 0
                }, {
                    easing: 'backOut', // 濞达綀娉曢弫銈夊炊閻愯尪鍓ㄧ紓鍌涙尭婵晠鏁嶇仦绛嬫澔鐎殿喛娅ｉ崹搴ㄦ倷閸涘﹤濡?
                    onComplete: () => {
                        // 闁告柣鍔庨弫鍓р偓鐟版湰閸ㄦ岸宕ユ惔锝傗偓妯荤┍濠靛洦浠樼紓浣哥墔缂嶅懐绱旈绛嬪妧缁?
                        child.setPosition(targetPos);

                        // 濠⒀呭仜婵偟鈧懓鏈崹姘辨媼閳╁啯娈?
                        completedAnimations++;

                        // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敂钘夘暡闁哄牆顦慨鈺呮偨婵犳艾鍘寸€瑰憡褰冮悾顒勫箣?
                        if (completedAnimations >= totalAnimatedChildren && onComplete) {
                            onComplete();
                        }
                    }
                })
                .start();
        }

        tween(this.bg)
            .to(time * 0.5, {
                scale: new Vec3(1.15, 1.15, 1),
            }, {
                easing: 'sineOut',
            })
            .to(time * 0.5, {
                scale: new Vec3(1, 1, 1),
            }, {
                easing: 'sineIn',
            })
            .start();
    }
    // 闁轰礁顕幃濠囧礈閳衡偓缂嶆垿宕￠敍鍕暬濞达絽绉堕悿?
    public zhengli():void {
        // 闁革负鍔嶅Λ銈夋⒔閹邦劷浣割嚕韫囧海鐟撳☉鎾崇Ч濞撳墎鎲版担瑙勬闁荤偛妫楁慨娑㈡嚄?
        if (this.isInfiniteMode) {
            return;
        }

        // 闁哄秷顫夊畵渚€宕楅崘鎻掑耿缂侇偉顕ч悗鐑藉极鐎靛憡鍊?
        switch (this.level_cur % 8) {
            case 1:
                break;
            case 2:
                this.xiangxia();
                break;
            case 3:
                this.xiangshang();
                break;
            case 4:
                this.toleft();
                break;
            case 5:
                this.toright();
                break;
            case 6:
                this.tocentx();
                break;
            case 7:
                this.tocentery();
                break;
            default:
                break;
        }

        // 闁哄洤鐡ㄩ弻濠囧础閿涘嫬顣诲ù锝呯Ф閻?
        this.UpdateCardPositions();
    }

    private tocentery() {
        const centerY = (this.hei + 1) / 2;

        for (let x = 1; x <= this.wid; x++) {
            // 闁告碍鍨崇粭鍌炲极鐎靛憡鍊?
            for (let y = Math.floor(centerY); y > 0; y--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let bottomy = y; bottomy > 0; bottomy--) {
                        if (gridcreator.map[x][bottomy] !== 0) {
                            this.MoveCard(x, bottomy, x, y);
                            break;
                        }
                    }
                }
            }

            // 闁告碍鍨崇粭鍛村极鐎靛憡鍊?
            for (let y = Math.floor(centerY); y <= this.hei; y++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let topy = y; topy <= this.hei; topy++) {
                        if (gridcreator.map[x][topy] !== 0) {
                            this.MoveCard(x, topy, x, y);
                            break;
                        }
                    }
                }
            }
        }

        this.UpdateCardPositions();
    }

    private tocentx() {
        const centerX = (this.wid + 1) / 2;

        for (let y = 1; y <= this.hei; y++) {
            // 闁告碍鍨垫稊蹇涘极鐎靛憡鍊?
            for (let x = Math.floor(centerX); x > 0; x--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let leftX = x; leftX > 0; leftX--) {
                        if (gridcreator.map[leftX][y] !== 0) {
                            this.MoveCard(leftX, y, x, y);
                            break;
                        }
                    }
                }
            }

            // 闁告碍鍨佃ぐ鎼佸极鐎靛憡鍊?
            for (let x = Math.floor(centerX); x <= this.wid; x++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let leftX = x; leftX <= this.wid; leftX++) {
                        if (gridcreator.map[leftX][y] !== 0) {
                            this.MoveCard(leftX, y, x, y);
                            break;
                        }
                    }
                }
            }
        }

        this.UpdateCardPositions();
    }

    private toright() {
        for (let y = 1; y <= this.hei; y++) {
            for (let x = this.wid; x >= 1; x--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let leftX = x - 1; leftX >= 1; leftX--) {
                        if (gridcreator.map[leftX][y] !== 0) {
                            this.MoveCard(leftX, y, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private MoveCard(fromX: number, fromY: number, toX: number, toY: number) {
        // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂堥柡浣哄瀹?
        gridcreator.map[toX][toY] = gridcreator.map[fromX][fromY];
        gridcreator.map[fromX][fromY] = 0;

        // 闁哄洤鐡ㄩ弻濠囧础閿涘嫬顣诲ù锝呯Ф閻ゅ棙绌遍埄鍐х礀
        const card = this.FindCardAt(fromX - 1, fromY - 1);
        if (card) {
            card.x = toX - 1;
            card.y = toY - 1;
            card.node.name = `${card.x},${card.y}`;
        }
    }

    private toleft() {
        for (let y = 1; y <= this.hei; y++) {
            for (let x = 1; x <= this.wid; x++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let rightX = x + 1; rightX <= this.wid; rightX++) {
                        if (gridcreator.map[rightX][y] !== 0) {
                            this.MoveCard(rightX, y, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private xiangshang() {
        for (let x = 1; x <= this.wid; x++) {
            for (let y = this.hei; y >= 1; y--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let downY = y - 1; downY >= 1; downY--) {
                        if (gridcreator.map[x][downY] !== 0) {
                            this.MoveCard(x, downY, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private xiangxia() {
        for (let x = 1; x <= this.wid; x++) {
            for (let y = 1; y <= this.hei; y++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let upY = y + 1; upY <= this.hei; upY++) {
                        if (gridcreator.map[x][upY] !== 0) {
                            this.MoveCard(x, upY, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private FindCardAt(x: number, y: number): any {
        const children = this.card_container.children;
        for (const child of children) {
            const tobj = child.getComponent('TObject') as any;
            if (tobj && tobj.x === x && tobj.y === y) {
                return tobj;
            }
        }
        return null;
    }

    private UpdateCardPositions(time=0.3) {
        const children = this.card_container.children;
        let hasMovingCard = false;

        for (const child of children) {
            const tobj = child.getComponent('TObject') as any;
            // 婵烇綀顕ф慨鐐电矚閸濆嫧鍋撻崗纰辨⒕闁哄被鍎荤槐婵嬫⒓閸欏鍓総obj濞戞挾鐨爑ll闁哄啳娉涢崵顓㈡偝娴煎瓨鏅╅悹?
            if (!tobj || tobj.x === undefined || tobj.y === undefined) {
                continue;
            }

            let pos = this.tref.add(new Vec2((tobj.x) * this.gridsize, (tobj.y) * this.gridsize));
            const targetPos = new Vec3(pos.x, pos.y, 0);

            // 闁告瑯浜濆﹢浣姐亹閹惧啿顤呭ù锝呯Ф閻ゅ棙绋夋惔锝嗙獥闁哄秴娲ｇ紞鍛磾椤旇崵鐟濋柛姘湰濡炲倿骞嶅鍡椻挃閻炴稑鑻慨鈺呮偨?
            if (child.position.x != targetPos.x || child.position.y != targetPos.y) {
                hasMovingCard = true;
                // 濞达綀娉曢弫顦歸een闁告柣鍔庨弫鍓р偓鍦仧楠炲洭鐛搹顐ゆ嫧濞达絽绉朵簺闁轰礁鐗婇悘?
                tween(child).stop();
                tween(child)
                    .to(time, { position: targetPos }, {
                        easing: 'sineOut',
                        onComplete: () => {
                            // 闁告柣鍔庨弫鍓р偓鐟版湰閸ㄦ岸宕ユ惔锝傗偓妯荤┍濠靛洦浠樼紓浣哥墔缂嶅懐绱旈绛嬪妧缁?
                            child.setPosition(targetPos);
                        }
                    })
                    .start();
            }
        }

        if (hasMovingCard) {
            this.lockBoardInput(time);
        }
    }

    get tref(): Vec2 {
        const rect = this.node.getComponent(UITransform);
        // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆厼娼戦柛鏃傚Т椤曨噣宕氶崱妤冩勾闁告瑧濮存慨鐐参熼垾宕囩闁汇劌瀚弫顕€骞?
        const width = (this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode) ? this.infiniteWid : this.wid;
        const height = (this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode) ? this.infiniteHei : this.hei;
        const refx = (rect.width - width * this.gridsize) / 2;
        const refy = (rect.height - height * this.gridsize) / 2;
        return new Vec2(refx-rect.width/2, refy-rect.height/2);
    }

    private applyCardGridLayout(cardNode: Node): void {
        const rect = cardNode.getComponent(UITransform);
        if (!rect) {
            return;
        }

        rect.setContentSize(this.gridsize, this.gridsize);
        rect.anchorPoint = new Vec2(0, 0);
        cardNode.getComponent(TObject)?.refreshVisualLayout();
    }

    private MoveCardNode(cx: Node, mapPos: Vec2) {
        cx.name = `${mapPos.x - 1},${mapPos.y - 1}`;

        this.applyCardGridLayout(cx);
        // 濞ｅ浂鍠栭ˇ鏌ユ晬濮樻墎鈧ɑ绌卞┑鍡楃€婚悘鐐插€歌ぐ鏃堝礉閻樿‖浣割嚕韫囧海鐦嶅ù锝堟硶閺併倕顫㈤敐鍥ｂ偓姗€鎯冮崟顐ゆ狗濞戞搩鍙冮埀顒佹缁?
        let pos =this.tref.add(new Vec2((mapPos.x - 1) * this.gridsize, (mapPos.y - 1) * this.gridsize));
        //閻犱礁澧介悿鍞昬ct闁汇劌瀚紞鍛磾?
        cx.setPosition(pos.x, pos.y);
    }

    private SpawnCard(mapPos: Vec2, type: number) {
        const cx = instantiate(this.item);
        this.card_container.addChild(cx);
        this.applyCardGridLayout(cx);

        // 閻犱礁澧介悿鍡欏垝閸撗傜触
        const xx = this.pl[type] as SpriteFrame;
        const tobj = cx.getComponent('TObject') as TObject;
        // 婵炲鍔嶉崜浼存晬濮濈敘pPos闁哄嫷鍨伴悢鈧ù?闁汇劌瀚崒銊ヮ嚕閺囶亞绀夐柤鏉胯嫰瀹曢亶鎮у畝鈧▓鎲?y閻忕偟鍋為埀顑嫭笑闁糕晞妗ㄧ花?闁汇劌瀚崒銊ヮ嚕?
        tobj?.SetSprite(mapPos.x - 1, mapPos.y - 1, type, xx, this);

        // 濞戞挾鍎ゆ晶宥夊嫉婢跺瑔浣割嚕韫囨柨娼戦柛鏃傚Т閸ゎ參宕烽崫鍕楅柣顫串缁辨繃瀵奸悩鐑╁亾閹烘垵骞㈤柣妤€鐬肩悮顐﹀垂鐎ｎ兘鈧ɑ绌卞┑瀣吂闁哄牏鍎ら埀?
        this.addCardEntranceAnimation(cx, mapPos, type);

        // 闁革负鍔屽ú鍫曟⒕閻愵儫浣割嚕韫囧海鐟撻柨娑樺鐠愮喖寮婚幇顏嗘槀闁告绱曟晶婵喦庣拠鎻掝潱閻熸瑥妫滈～搴ㄧ嵁閸欏顥嶉柡浣哥墛閻?
        if (LevelMgr.gameMode === GameMode.HARD) {
            // 30%闁汇劌瀚々褔鎮抽崶銊ユ綉闁告梻濮鹃～瀣喆婢跺﹤鍙￠柟鐢靛閺呫儵寮?
            if (Math.random() < 0.3) {
                this.addVisualInterference(cx, type);
            }
        }
        return cx;
    }

    /**
     * 濞戞挸鎼畷閬嶆偋鐏炴儳娼戦柛鏃傚Ь椤鎲存径濠傚彙闁圭數澧楅弲銉╁几濠婃劗绀勫ù鐘叉噹濠€顏堝炊娴煎瓨顕涙俊顖椻偓宕囩濞戞挸顑勬繛鍥偨椤帞绀?
     */
    private addVisualInterference(cardNode: Node, cardType: number) {
        // 婵烇綀顕ф慨鐐寸▔閳ь剚绋夐鍕９闂侇偄绻戝Σ鎴︽儍閸曨垯绱曠紓鍐ｆ櫅閻即鏁嶇仦鐓庘枏闁告绱曟晶婵嬪即閹绢喗顕涢悹鍥ф閸?
        const mask = new Node('interferenceMask');
        cardNode.addChild(mask);

        const maskSprite = mask.addComponent(Sprite);
        // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆収鍔€缁绢収鍠涢鏇犵磾閻ｅ檵riteFrame闁挎稑濂旂划鐕琾rite闁轰焦澹嗙划宥嗙▔椤撯€崇闁告瑦娼﹑riteFrame
        if (this.pl[cardType] && this.pl[cardType]) {
            maskSprite.spriteFrame = this.pl[cardType]; // 濞达綀娉曢弫銈夋儎缁嬫寧鍊辩紒顐ヮ嚙閻庣兘鎯冮崟顓犵勘闁诲繘娼ч幎?
        }
        maskSprite.color = new Color(255, 255, 255, 100); // 闁告锕埀顒€绻戝Σ鎴︽儌閸婄喎顥?

        // 閻犱礁澧介悿鍡涙焼椤旀儳鍏婇悘鐐插€诲▓鎴炴媴瀹ュ洨鏋傞柛婊冭嫰閵囧洨浜?
        const cardTransform = cardNode.getComponent(UITransform);
        if (cardTransform) {

            let maskTransform = mask.getComponent(UITransform);
            if(maskTransform==null){
               maskTransform =mask.addComponent(UITransform);
            }
            maskTransform.setContentSize(cardTransform.contentSize);
            maskTransform.anchorPoint = new Vec2(0.5, 0.5);
            mask.setPosition(0, 0, 0);
        }

        // 婵烇綀顕ф慨鐐存姜鐠囪弓绨抽柣銊ュ濡棙娼浣规珡闁哄绮ｇ槐婵囨媴閸喖骞㈤柣妤€鏈ú鍧楁⒕閹规劗妲曢柛?
        cardNode.angle = (Math.random() - 0.5) * 10; // 闂傚懎绻戝┃鈧柡鍐儓濞?5闁?閹?
    }

    /**
     * 婵烇綀顕ф慨鐐哄础閿涘嫬顤傞柛鎴濇惈濠р偓闁告柣鍔庨弫楣冨极閸喓浜?
     */
    private addCardEntranceAnimation(cardNode: Node, mapPos: Vec2, cardType: number) {
        // 閻犱緤绱曢悾濠氭儎椤旂晫鍨煎ù锝呯Ф閻?
        const targetPos2D = this.tref.add(new Vec2((mapPos.x - 1) * this.gridsize, (mapPos.y - 1) * this.gridsize));
        const targetPos = new Vec3(targetPos2D.x, targetPos2D.y, 0);

        cardNode.setPosition(targetPos);
        // 闁哄秷顫夊畵浣搞€掗崨濠傜亞婵☆垪鈧磭纭€闂侇偄顦扮€氥劍绋夊鍛€遍柣銊ュ婵晠鎮界紒妯绘珡闁?
        // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆厼娼戦柛鏃傚Т椤曨噣宕氶崱妤冩勾闁告瑧濮存慨鐐参熼垾宕囩闁汇劌瀚弫顕€骞?
        if (this.isSanxiaoMode) {
            // 濞戞挸顦扮粔宄拔熼垾宕囩闁挎稒鑹鹃幓鈺呮焻閻旇櫣鏆嗘繛韫兌濞堟垿宕濋妸褎鏆?
            cardNode.setScale(new Vec3(0.1, 0.1, 0.1));
            this.addSanxiaoEntranceAnimation(cardNode, targetPos, cardType);
        } else if (this.isLayerSplitMode) {
            // 闁告帒妫楅惇浼村矗閻樻彃顫ｆ俊顖椻偓宕囩闁挎稒鐭繛鍥偨閵娧冾棗閻庤姘ㄥ▓鎴﹀礉閵娧勬毎闁轰礁鐗婇悘?
                           // 閻犱礁澧介悿鍡涘礆濠靛棭娼楅柣妯垮煐閳?
            cardNode.setScale(new Vec3(0.1, 0.1, 0.1));
            this.addLayerSplitEntranceAnimation(cardNode, targetPos, cardType);
        } else if(this.isInfiniteMode  )
        {
            cardNode.setScale(new Vec3(0.1, 0.1, 0.1));

            this.addLayerSplitEntranceAnimation(cardNode, targetPos, cardType);
        }
        else {
            cardNode.setScale(new Vec3(1, 1, 1));
            // 閺夆晝鍋犵换娑㈡儑鐎ｎ倎浣割嚕韫囥儳绐楀☉鎾存緲閻︽粍寰勫顓犲闁汇劌瀚慨鈺呮偨?
            //this.addLianlianEntranceAnimation(cardNode, targetPos, cardType);
        }

        // 閻犱礁澧介悿鍡涘嫉閳ь剛绱掗崼婊呯Т缂傚喚鍠栭幏鐗堝緞瑜嶉惃?
        this.applyCardGridLayout(cardNode);
        cardNode.name = `${mapPos.x - 1},${mapPos.y - 1}`;
    }

    // 闂傚牊鐟﹂埀顑挎祰椤撴悂寮弶鎸庣彜闁挎稑鐬奸垾妯荤┍濠靛洨妲ㄦ繛鍠°倗娈堕柣顫姂閸忔﹢寮垫径澶岀憹闁告艾鐬煎▓鎴︽⒕韫囨梹绨氱紒澶婄Т閻?
    private static animationCounter: number = 0;

    // 閺夆晝鍋犵换娑㈡儑鐎ｎ倎浣割嚕韫囨挸袟闁汇垼宕电悮顐﹀垂鐎ｅ墎绀?1閻炴稏鍔庨妵姘跺嫉椤忓嫬鐏ュ┑顔碱儏鐎垫煡鏁?-5閻炴稏鍔庨妵姘跺礂閾氬倻绉奸柛鏂诲妿閺佸墽鐚剧拠鑼偓鐑芥晬?
    private static lianlianAnimationType: number = -1;

    /**
     * 闁汇垻鍠愰崹姘跺即閺夋垯鍋ㄩ柣銊ュ濞堛垽寮甸崫鍕楅柣銏ｅ吹鐞氼偊宕?
     */
    private getRandomAnimationType(position: Vec3, cardType: number, maxTypes: number): number {
        // 濞达綀娉曢弫銈囨媼閳╁啯娈堕柛锝冨妿閳ユɑ绌卞┑鍥╂Ж婵炲枴銈囨闁活潿鍔戦崗姗€寮垫径澶岀憹闁告艾鐬煎▓鎴︽⒕韫囨梹绨氱紓浣规尰閻?
        gridcreator.animationCounter++;

        // 濞达綀娉曢弫銈夊嫉閳ь剛绮婚埀顒勫础閺囩姵绾柟鎭掑劤濞堟垿寮憴鍕€婇柨娑欐皑濞插潡骞掗妷銈呪枏闁烩懇鍨th.random()
        // 閺夆晜鐟﹂悧閬嶅矗椤栨瑤绨扮痪顓у枙缁绘岸鎯囬悢鍓插妧闁汇劌瀚板▓銏ゅ嫉閻戞ǚ鍋?
        return Math.floor(Math.random() * maxTypes);
    }

    /**
     * 闂佹彃绉堕悿鍡樻交閻愬墎绠鹃柣顏勵儐鑶╃€殿喖绻愭慨鈺呮偨閼姐倛顫﹂柛銊ヮ儜缁辨瑥袙韫囨棏鍋х€殿喒鍋撳┑顔碱儐閺屽﹤銆掗崨濠傜亞闁哄啯鍎奸惃鐔兼偨椤帞绀?
     */
    public static resetLianlianAnimationType(): void {
        gridcreator.lianlianAnimationType = -1;
    }

    /**
     * 濞戞挸顦扮粔宄拔熼垾宕囩闁告垵鎼┃鈧柛鏂诲妿閺侀箖鏁嶉崼婵囧渐闂侇偆鍠撻悾婵喢烘笟濠勭
     */
    private addSanxiaoEntranceAnimation(cardNode: Node, targetPos: Vec3, cardType: number) {
        const animationType = this.getRandomAnimationType(targetPos, cardType, 3);

        switch (animationType) {
            case 0: // 闊浂鍋婇埀顒傚枔缂傚寮ㄩ悙顒佹珡闁?
                cardNode.setScale(new Vec3(0.8, 0.8, 1));
                tween(cardNode)
                    .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            case 1: // 闊浂鍋婇埀顒傚枑鐠愪即宕楅妷锔芥珡闁?
                const sprite = cardNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 128);
                    tween(sprite)
                        .to(0.2, { color: new Color(255, 255, 255, 255) })
                        .start();
                }
                tween(cardNode)
                    .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            case 2: // 閺夌偠顕ф禍鏇烆嚕绾懐鍎查柡浣哥墛閻?
                cardNode.setScale(new Vec3(0.8, 0.8, 1));
                tween(cardNode)
                    .to(0.15, { scale: new Vec3(1, 1, 1) })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            default:
                tween(cardNode)
                    .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
        }
    }

    /**
     * 閺夆晝鍋犵换娑㈡儑鐎ｎ倎浣割嚕韫囨挸姣夐柛锕€鎼慨鈺呮偨娴兼瑧绀勭紓浣哄枍缁旀挳寮崼鐔轰函闁?
     */
    private addLianlianEntranceAnimation(cardNode: Node, targetPos: Vec3, cardType: number) {
        if (gridcreator.lianlianAnimationType === -1) {
            gridcreator.lianlianAnimationType = Math.floor(Math.random() * 6);
        }
        const animationType = gridcreator.lianlianAnimationType;

        switch (animationType) {
            case 0: // 缂傚倵鏅滈弬浣割嚕绾懐鍎查柡浣哥墛閻?
                cardNode.setScale(new Vec3(0.5, 0.5, 1));
                tween(cardNode)
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            case 1: // 闁哄啫顑堝ù鍡欑磽閳哄倹鏉归柡浣哥墛閻?
                cardNode.setRotationFromEuler(new Vec3(0, 0, 180));
                tween(cardNode)
                    .parallel(
                        tween().to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' }),
                        tween().to(0.4, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'sineOut' })
                    )
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            case 2: // 濞寸姴绨肩粭鍌炲棘鐟欏嫬绔撮柦鈧懞銉︽珡闁?
                cardNode.setScale(new Vec3(1, 1, 1));
                cardNode.setPosition(targetPos.x, targetPos.y + 300, 0);
                tween(cardNode)
                    .to(0.5, { position: targetPos }, {
                        easing: 'sineOut',
                        onUpdate: (target, ratio) => {
                            const rotation = Math.sin(ratio * Math.PI * 3) * 10;
                            target.setRotationFromEuler(new Vec3(0, 0, rotation));
                        }
                    })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            case 3: // 婵烇絺鈧啿寮崇紓鍌楁櫆閺備線寮崼鐔轰函
                cardNode.setScale(new Vec3(0.5, 0.5, 1));
                const sprite = cardNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 0);
                    tween(sprite)
                        .to(0.4, { color: new Color(255, 255, 255, 255) })
                        .start();
                }
                tween(cardNode)
                    .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            case 4: // 鐎归潻绠戣ぐ鎼佸箺閸ャ劍鍟橀柡浣哥墛閻?
                cardNode.setScale(new Vec3(0.1, 0.1, 1));
                tween(cardNode)
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        tween(cardNode)
                            .to(0.1, { position: new Vec3(targetPos.x - 15, targetPos.y, 0) })
                            .to(0.1, { position: new Vec3(targetPos.x + 15, targetPos.y, 0) })
                            .to(0.1, { position: targetPos })
                            .call(() => {
                                cardNode.setScale(new Vec3(1, 1, 1));
                            })
                            .start();
                    })
                    .start();
                break;

            case 5: // 鐎殿喚顢婇悜锔剧磼閸曨偅鍊ら柡浣哥墛閻?
                cardNode.setScale(new Vec3(0.3, 0.3, 1));
                cardNode.setPosition(targetPos.x, targetPos.y - 200, 0);
                tween(cardNode)
                    .parallel(
                        tween().to(0.4, { position: targetPos }, { easing: 'sineOut' }),
                        tween().to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    )
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
            }
    }

    /**
     * 闁告帒妫楅惇浼村矗閻樻彃顫ｆ俊顖椻偓宕囩闁告垵鎼┃鈧柛鏂诲妿閺?
     */
    private addLayerSplitEntranceAnimation(cardNode: Node, targetPos: Vec3, cardType: number) {
        const animationType = this.getRandomAnimationType(targetPos, cardType, 3);

        switch (animationType) {
            case 0: // 缂傚倵鏅滈弬渚€宕仦鐐棆閺夌儐鍓涚划宥夊触閸喐娅忛柡?
                cardNode.setScale(new Vec3(0.1, 0.1, 1));
                cardNode.eulerAngles = new Vec3(0, 0, 180);
                tween(cardNode)
                    .parallel(
                        tween().to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' }),
                        tween().to(0.4, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'sineOut' })
                    )
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            case 1: // 濞寸姴绨肩粭鍌炲棘鐟欏嫬绔撮柦鈧懞銉︽珡闁?
                cardNode.setScale(new Vec3(1, 1, 1));
                cardNode.setPosition(targetPos.x, targetPos.y + 200, 0);
                tween(cardNode)
                    .to(0.5, { position: targetPos }, {
                        easing: 'bounceOut'
                    })
                    .start();
                break;

            case 2: // 婵烇絺鈧啿寮抽柡浣哥墛閻?
                const sprite = cardNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 0);
                    tween(sprite)
                        .to(0.4, { color: new Color(255, 255, 255, 255) })
                        .start();
                }
                tween(cardNode)
                    .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;

            default:
                tween(cardNode)
                    .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
        }
    }

    private Shuffle<T>(list: T[]): void {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
    }

    public brushkind() {
        // 闁衡偓閸洘鑲犻柟纰樺亾闁哄牆顦晶鎸庢媴濞嗘垶鐣盩Object閻庡湱鍋樼欢?
        const remainingCards: any[] = [];
        const children = this.card_container.children;

        for (const child of children) {
            const tobj = child.getComponent('TObject') as any;
            remainingCards.push(tobj);
        }

        // 婵☆偀鍋撻柡灞诲劜閺嗙喖鏌岃箛鏃€笑闁告熬缂氱拹鐔煎磻閼稿灚娈?
        const count = remainingCards.length;
        if (count % 2 !== 0) {
            console.warn('Invalid brush candidate count');
            return;
        }

        // 闁汇垻鍠愰崹姘跺棘閹殿喛顫﹂柛銊ヮ儏閸亞鎮?
        const newTypes: number[] = [];

        // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剚韬柛鎺戞閻即宕ｉ悩鎻掝潱婵☆垪鈧磭纭€濞戞挸顑戠槐婵嬫閳ь剛鎲版担鍝勵棗婵炲牆锕らˇ鈺呮偠?
        if (this.isLayerSplitMode) {
            // 闁革负鍔岄崹搴ｄ沪閸屾艾缍岄柛鏃傚У鑶╃€殿喖绻嬬粭鍛存晬瀹€鈧垾妯荤┍濠靛洨妲ㄧ紒澶婄Ф鐞氼偊宕圭€ｎ偅娈堕梺鎻掔箲濡?闁汇劌瀚埀顒€绉甸弳?
            const typeCounts: { [key: number]: number } = {};

            // 闁衡偓閸洘鑲犵憸鐗堟尭婢х娀骞嶉埀顒勫嫉婢跺﹤骞㈤柣妤€鐬煎▓鎴犵尵鐠囪尙鈧?
            for (let i = 0; i < remainingCards.length; i++) {
                if (remainingCards[i] && remainingCards[i].type !== undefined) {
                    const type = remainingCards[i].type;
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                }
            }

            // 闁汇垻鍠愰崹姘跺棘閹殿喗鐣辩紒顐ヮ嚙閻庣兘宕氬Δ鍕┾偓鍐晬瀹€鈧垾妯荤┍濠靛洨妲ㄧ紒澶婄Ф鐞氼偊宕圭€ｎ偅娈堕梺鎻掔箲濡?闁汇劌瀚埀顒€绉甸弳?
            const availableTypes = Math.min(15, this.pl.length - 1); // 闁硅矇鍐ㄧ厬闁?5缂佸绉剁悮顐﹀垂鐎ｂ晙绨伴柛鎰嫅缁辨繃鏅堕悙鎻掝潱闂傚懏鍎崇€?
            const typesToUse: number[] = [];

            // 闁稿繐鐗婇崸濠囧礉閻橀潧绠涢柡鍫濐槺濞堟垹鐚剧拠鑼偓?
            for (const type in typeCounts) {
                const typeNum = parseInt(type);
                const currentCount = typeCounts[type];
                const remainder = currentCount % 3;

                // 濞戞挾鍎ら惁锛勭矓瀹ュ洩顫﹂柛銊ヮ儐閸у﹪宕濋悩鍝勫枙濠㈠墎鍠撳▓鎴﹀础閿涘嫬顤傚ù锝呯仢閸欓箖寮导鏉戞闁瑰瓨鍔掔拹?闁汇劌瀚埀顒€绉甸弳?
                for (let i = 0; i < currentCount + (remainder > 0 ? 3 - remainder : 0); i++) {
                    typesToUse.push(typeNum);
                }
            }

            // 濠碘€冲€归悘澶愬础閿涘嫬顤傞柡浣峰嵆閸ｇ儤绋夊鍫濆枙闁挎稑鏈崸濠囧礉閻樿櫕鐓€闁汇劌瀚悮顐﹀垂?
            while (typesToUse.length < remainingCards.length) {
                const newType = Math.floor(Math.random() * availableTypes) + 1;
                // 婵烇綀顕ф慨?鐎殿喚濮峰ù澶愬触瀹€鈧悮顐﹀垂鐎ｎ剚鐣遍柛妤嬬磿婢?
                for (let i = 0; i < 3; i++) {
                    typesToUse.push(newType);
                }
            }

            // 濠碘€冲€归悘澶愬础閿涘嫬顤傞柡浣峰嵆閸ｈ櫣鎼鹃崨鎵畺闂傚洠鍋撻悷鏇氳兌濞堟垿寮导鏉戞闁挎稑鐬间簺闂傚嫨鍊曢ˇ鎸庢媴濞嗘垶鐣遍柛妤嬬磿婢?
            while (typesToUse.length > remainingCards.length) {
                typesToUse.pop();
            }

            // 闁瑰灚鎸风拹锛勭尵鐠囪尙鈧兘宕氬Δ鍕┾偓?
            this.Shuffle(typesToUse);
            newTypes.push(...typesToUse);
        } else {
            // 闁革负鍔嶅▍姗€鏌呭顒戒礁顕ｈ箛搴ｇ憮闁挎稑濂旀繛鍥偨閵娿儱鏂ч柡澶堝劤濞堟垿寮憴鍕€?
            for (let i = 0; i < remainingCards.length; i++) {
                // 婵烇綀顕ф慨鐐电矚閸濆嫧鍋撻崗纰辨⒕闁哄被鍎荤槐婵嬫⒓閸欏鍓鹃悹鍥嚙瑜板檳ull闁汇劌澧杫pe閻忕偟鍋為埀?
                if (remainingCards[i] && remainingCards[i].type !== undefined) {
                    newTypes.push(remainingCards[i].type);
                }
            }

            // 闁瑰灚鎸风拹锛勭尵鐠囪尙鈧兘宕氬Δ鍕┾偓?
            this.Shuffle(newTypes);
        }

        // 閹煎瓨姊婚弫銈夊棘閹殿喛顫﹂柛?
        for (let i = 0; i < remainingCards.length; i++) {
            const card = remainingCards[i];
            const newType = newTypes[i];

            // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂堥柡浣哄瀹?
            const mapPos = new Vec2(card.x + 1, card.y + 1);

            // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剚韬柛鎺戞閻即宕ｉ悩鎻掝潱婵☆垪鈧磭纭€濞戞挸顑戠槐婵嬫閳ь剛鎲版担鍝勵棗婵炲牆锕らˇ鈺呮偠閸℃鍕鹃柛銉у亾閺嗙喖骞?
            if (this.isLayerSplitMode) {
                // 闁革负鍔岄崹搴ｄ沪閸屾艾缍岄柛鏃傚У鑶╃€殿喖绻嬬粭鍛存晬瀹€鈧垾妯荤┍濠靛鍤夊ù锝呯Ф閻ゅ棝鎳涢崘鑼瘜闁哄牆顦粩鏉戭嚕閻樻彃骞㈤柣?
                const cell = gridcreator.map[mapPos.x][mapPos.y];
                if (Array.isArray(cell)) {
                    if (cell.length === 0) {
                        // 濠碘€冲€归悘澶娾柦閳╁啯绠掗柛妤嬬磿婢ф繈鏁嶇仦鎯ф綉闁告梻濮崇粩鏉戭嚕?
                        cell.push(newType);
                    } else {
                        // 濠碘€冲€归悘澶愬嫉婢跺﹤骞㈤柣妤€鐭夌槐婵嬪即鐎涙ɑ鐓€濡炪倛娉涢惇浼村础閿涘嫬顤?
                        cell[cell.length - 1] = newType;
                    }
                }
            } else {
                // 闁革负鍔嶅▍姗€鏌呭顒戒礁顕ｈ箛搴ｇ憮闁挎稑鐬煎ú鍧楀箳閵夛附绾柡鍌涙緲濠€鎾炊閻愵剚娈堕柟?
                gridcreator.map[mapPos.x][mapPos.y] = newType;
            }

            // 闁哄洤鐡ㄩ弻濠囧础閿涘嫬顣婚柡鍕⒔閵?
            if (newType < this.pl.length) {
                this.applyCardGridLayout(card.node);
                card.SetSprite(card.x, card.y, newType, this.pl[newType], this);
            } else {
                console.error(`err type ${newType}`);
            }
        }

        // 婵炴挸鎳愰埞鏍箥閳ь剟寮垫径濠傚耿闁绘濂旂粭鍌炴儍閸曨剙绲归梺杈ㄥ笚閻栵綀绠?
        for (const card of remainingCards) {
            card.unSel(); // 婵炴挸鎳樺▍搴ㄦ焻婢跺鍘柣妯垮煐閳ь兛绀侀幏浼村箵閹版澘鏅柡宥呮搐缁?
        }

        console.log(`Refreshed ${count} cards`);
    }

    // 婵☆偀鍋撻柡灞诲劙鐞氳鲸绋夐鍕耿闁绘娲﹀Σ鎼佸触閿曗偓瑜板弶绂掗妷銊х闁?
    public static CanConnect(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        // 婵烇綀顕ф慨鐐电矚閸濆嫧鍋撻崗纰辨⒕闁?
        if (!gridcreator.map) {
            console.error("gridcreator.map is null");
            return false;
        }

        // 婵☆偀鍋撻柡灞诲劚濞兼寮介崶銊π﹂柛姘鹃檮濠€渚€寮?
        if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0 ||
            x1 >= gridcreator.map.length || y1 >= (gridcreator.map[x1] ? gridcreator.map[x1].length : 0) ||
            x2 >= gridcreator.map.length || y2 >= (gridcreator.map[x2] ? gridcreator.map[x2].length : 0)) {
            console.warn("Invalid coordinates for CanConnect:", x1, y1, x2, y2);
            return false;
        }

        if (x1 === x2 && y1 === y2) {
            return false;
        }

        // 婵☆偀鍋撻柡灞诲劤鐞氼偊宕圭€ｎ偅笑闁告熬濡囧ù澶愬触鐏炶偐鐟☉鎾崇С鐠愮喓绮?
        // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剦妲遍柣鐐叉閸ㄥ海浠﹂崒姘秾闁告梻濮佃啯鐎殿喖绻嬬粭鍛存儍閸曨剚娈剁紓浣稿鐞氼偊宕?
        const cell1 = gridcreator.map[x1][y1];
        const cell2 = gridcreator.map[x2][y2];

        // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敂鑳闁告帒妫楅惇浼村矗閻樻彃顫ｆ俊顖椻偓宕囩闁挎稑鐗婇弳鐔虹磼閸曨叀顫﹂柛銊ヮ儜缁?
        if (Array.isArray(cell1) && Array.isArray(cell2)) {
            // 闁革负鍔岄崹搴ｄ沪閸屾丹浣割嚕韫囧海鐟撻柨娑樻湰閻︻喗娼忛崘顔衡偓濠勪沪閸屾艾骞㈤柣妤€鐬肩悮顐﹀垂?
            if (cell1.length === 0 || cell2.length === 0) {
                return false;
            }
            const type1 = cell1[cell1.length - 1]; // 濡炪倛娉涢惇浼村础閿涘嫬顤?
            const type2 = cell2[cell2.length - 1]; // 濡炪倛娉涢惇浼村础閿涘嫬顤?
            if (type1 <= 0 || type2 <= 0 || type1 !== type2) {
                return false;
            }
        } else if (typeof cell1 === 'number' && typeof cell2 === 'number') {
            // 闁革负鍔嶅▍姗€鏌呭顒戒礁顕ｈ箛搴ｇ憮闁挎稑鐬煎ú鍧楀箳閵夛妇妲烽弶鍫濆暟鐞氼偊宕?
            if (cell1 <= 0 || cell2 <= 0 || cell1 !== cell2) {
                return false;
            }
        } else {
            // 缂侇偉顕ч悗閿嬬▔瀹ュ懎鐖遍梺?
            return false;
        }

        // 婵☆偀鍋撻柡灞诲劤濞插潡骞掗妷銊х闁?
        if (gridcreator.IsDirectlyConnected(x1, y1, x2, y2)) {
            poslist.push(new Vec2(x1, y1));
            poslist.push(new Vec2(x2, y2));
            return true;
        }

        // 婵☆偀鍋撻柡灞诲劙缁斿瓨绋夐鍥ㄧギ鐎?
        if (gridcreator.IsConnectedWithOneTurn(x1, y1, x2, y2, poslist)) {
            return true;
        }

        // 婵☆偀鍋撻柡灞诲劙鐞氳鲸绋夐鍥ㄧギ鐎?
        if (gridcreator.IsConnectedWithTwoTurns(x1, y1, x2, y2, poslist)) {
            return true;
        }

        return false;
    }

    // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敂鐐函闁规亽鍎寸换娑㈠箳?
    private static IsDirectlyConnected(x1: number, y1: number, x2: number, y2: number): boolean {
        // 婵烇綀顕ф慨鐐电矚閸濆嫧鍋撻崗纰辨⒕闁?
        if (!gridcreator.map) {
            return false;
        }

        // 婵ɑ娼欓柦鈺傛交閻愭潙澶?
        if (x1 === x2) {
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);
            for (let y = startY + 1; y < endY; y++) {
                // 婵烇綀顕ф慨鐐存綇閸︻厽娅曟俊顐熷亾闁?
                if (y < 0 || y >= gridcreator.map[x1].length) {
                    return false;
                }
                // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剦妲遍柣鐐叉閸ㄥ海浠﹂崒姘秾闁告梻濮佃啯鐎殿喖绻嬬粭鍛存儍閸曨剚娈剁紓浣稿鐞氼偊宕?
                const cell = gridcreator.map[x1][y];
                if ((Array.isArray(cell) && cell.length > 0) ||
                    (typeof cell === 'number' && cell !== 0)) {
                    return false;
                }
            }
            return true;
        }

        // 闁搞劌鍊诲ú鎸庢交閻愭潙澶?
        if (y1 === y2) {
            const startX = Math.min(x1, x2);
            const endX = Math.max(x1, x2);
            for (let x = startX + 1; x < endX; x++) {
                // 婵烇綀顕ф慨鐐存綇閸︻厽娅曟俊顐熷亾闁?
                if (x < 0 || x >= gridcreator.map.length || y1 < 0 || y1 >= gridcreator.map[x].length) {
                    return false;
                }
                // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剦妲遍柣鐐叉閸ㄥ海浠﹂崒姘秾闁告梻濮佃啯鐎殿喖绻嬬粭鍛存儍閸曨剚娈剁紓浣稿鐞氼偊宕?
                const cell = gridcreator.map[x][y1];
                if ((Array.isArray(cell) && cell.length > 0) ||
                    (typeof cell === 'number' && cell !== 0)) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    // 婵☆偀鍋撻柡灞诲劙缁斿瓨绋夐鍥ㄧギ鐎殿噮鍨电换娑㈠箳?
    private static IsConnectedWithOneTurn(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        // 婵烇綀顕ф慨鐐电矚閸濆嫧鍋撻崗纰辨⒕闁?
        if (!gridcreator.map) {
            return false;
        }

        // 闁活潿鍔嬬花顒傗偓娑櫭崑宥夊箥閹冪厒闁汇劌瀚惌鎯ь嚗?
        const paths: Vec2[][] = [];

        // 閺夌儐鍓欓梿鍡涙倷?: (x1, y2)
        // 婵烇綀顕ф慨鐐存綇閸︻厽娅曟俊顐熷亾闁?
        if (x1 >= 0 && x1 < gridcreator.map.length &&
            y2 >= 0 && y2 < gridcreator.map[x1].length &&
            x2 >= 0 && x2 < gridcreator.map.length &&
            y2 >= 0 && y2 < gridcreator.map[x2].length) {
            // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剦妲遍柣鐐叉閸ㄥ海浠﹂崒姘秾闁告梻濮佃啯鐎殿喖绻嬬粭鍛存儍閸曨剚娈剁紓浣稿鐞氼偊宕?
            const cellXY = gridcreator.map[x1][y2];
            const isEmpty = (Array.isArray(cellXY) && cellXY.length === 0) ||
                           (typeof cellXY === 'number' && cellXY === 0);

            if (isEmpty &&
                gridcreator.IsDirectlyConnected(x1, y1, x1, y2) &&
                gridcreator.IsDirectlyConnected(x1, y2, x2, y2)) {
                const path: Vec2[] = [];
                path.push(new Vec2(x1, y1));
                path.push(new Vec2(x1, y2));
                path.push(new Vec2(x2, y2));
                paths.push(path);
            }
        }

        // 閺夌儐鍓欓梿鍡涙倷?: (x2, y1)
        // 婵烇綀顕ф慨鐐存綇閸︻厽娅曟俊顐熷亾闁?
        if (x2 >= 0 && x2 < gridcreator.map.length &&
            y1 >= 0 && y1 < gridcreator.map[x2].length &&
            x2 >= 0 && x2 < gridcreator.map.length &&
            y2 >= 0 && y2 < gridcreator.map[x2].length) {
            // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剦妲遍柣鐐叉閸ㄥ海浠﹂崒姘秾闁告梻濮佃啯鐎殿喖绻嬬粭鍛存儍閸曨剚娈剁紓浣稿鐞氼偊宕?
            const cellXY = gridcreator.map[x2][y1];
            const isEmpty = (Array.isArray(cellXY) && cellXY.length === 0) ||
                           (typeof cellXY === 'number' && cellXY === 0);

            if (isEmpty &&
                gridcreator.IsDirectlyConnected(x1, y1, x2, y1) &&
                gridcreator.IsDirectlyConnected(x2, y1, x2, y2)) {
                const path: Vec2[] = [];
                path.push(new Vec2(x1, y1));
                path.push(new Vec2(x2, y1));
                path.push(new Vec2(x2, y2));
                paths.push(path);
            }
        }

        // 濠碘€冲€归悘澶愬箥閹冪厒濞存粌妫滈惌鎯ь嚗閸曞墎绀夐梺顐㈩槹鐎氥劑寮甸埀顒勬儗椤撶姵鐣遍悹渚灠缁?
        if (paths.length > 0) {
            // 閻犱緤绱曢悾璇残掕箛鏃€钂嬮悹渚灠缁剁偤鎯冮崟顖涙瘣閹艰揪绠戦懟鐔兼焻婢跺顏ラ柡鍫氬亾闁活収鍘惧▓?
            let shortestPath = paths[0];
            let shortestLength = Infinity;

            for (const path of paths) {
                // 閻犱緤绱曢悾鑽ゆ崉椤栨氨绐為梻鈧崹顔碱唺闁挎稑鐗婂ù鏍传閸儯鈧垹鎹勫┑鍫€查柨?
                let pathLength = 0;
                for (let k = 0; k < path.length - 1; k++) {
                    pathLength += Math.abs(path[k].x - path[k+1].x) + Math.abs(path[k].y - path[k+1].y);
                }

                if (pathLength < shortestLength) {
                    shortestLength = pathLength;
                    shortestPath = path;
                }
            }

            // 閻忓繐妫欏〒鍫曟儗椤擄紕鐔呯€垫澘瀚ˇ鏌ュ礆鐠哄搫鐓俻oslist濞?
            poslist.splice(0, poslist.length, ...shortestPath);
            return true;
        }

        return false;
    }

    // 婵☆偀鍋撻柡灞诲劙鐞氳鲸绋夐鍥ㄧギ鐎殿噮鍨电换娑㈠箳?
    private static IsConnectedWithTwoTurns(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        // 婵烇綀顕ф慨鐐电矚閸濆嫧鍋撻崗纰辨⒕闁?
        if (!gridcreator.map || gridcreator.map.length === 0) {
            return false;
        }

        const rows = gridcreator.map.length;
        const cols = gridcreator.map[0].length;

        // 闁活潿鍔嬬花顒傗偓娑櫭崑宥夊嫉閳ь剟鎯岄锛勭唴鐎?
        let shortestPath: Vec2[] | null = null;
        let shortestLength = Infinity;

        for (let i = 0; i < rows; i++) {
            // 婵烇綀顕ф慨鐐存綇閸︻厽娅曟俊顐熷亾闁?
            if (i >= gridcreator.map.length) continue;

            for (let j = 0; j < cols; j++) {
                // 婵烇綀顕ф慨鐐存綇閸︻厽娅曟俊顐熷亾闁?
                if (j >= gridcreator.map[i].length) continue;

                // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剦妲遍柣鐐叉閸ㄥ海浠﹂崒姘秾闁告梻濮佃啯鐎殿喖绻嬬粭鍛存儍閸曨剚娈剁紓浣稿鐞氼偊宕?
                const cell = gridcreator.map[i][j];
                const isEmpty = (Array.isArray(cell) && cell.length === 0) ||
                               (typeof cell === 'number' && cell === 0);

                if (isEmpty) {
                    // 婵☆偀鍋撻柡?x1,y1)闁?i,j)闁告劕绉撮崺?x2,y2)闁哄嫷鍨伴幆浣规交閻愯　鍋?
                    const tempList: Vec2[] = [];
                    if (gridcreator.IsDirectlyConnected(x1, y1, i, j) && gridcreator.IsConnectedWithOneTurn(i, j, x2, y2, tempList)) {
                        // 闁哄瀚伴埀顒傚Т閻ｎ剟寮壕瀣唴鐎?
                        const fullPath: Vec2[] = [];
                        fullPath.push(new Vec2(x1, y1));
                        fullPath.push(new Vec2(i, j));
                        fullPath.push(...tempList.slice(1)); // 闁告绮敮鈧梺鎻掔Т椤︽煡鎯冮崟顓у剳濞戞挴鍋撳☉鎿冧簽閸?

                        // 閻犱緤绱曢悾鑽ゆ崉椤栨氨绐為梻鈧崹顔碱唺闁挎稑鐗婂ù鏍传閸儯鈧垹鎹勫┑鍫€查柨?
                        let pathLength = 0;
                        for (let k = 0; k < fullPath.length - 1; k++) {
                            pathLength += Math.abs(fullPath[k].x - fullPath[k+1].x) + Math.abs(fullPath[k].y - fullPath[k+1].y);
                        }

                        // 闁哄洤鐡ㄩ弻濠囧嫉閳ь剟鎯岄锛勭唴鐎?
                        if (pathLength < shortestLength) {
                            shortestLength = pathLength;
                            shortestPath = fullPath;
                        }
                    }
                }
            }
        }

        // 濠碘€冲€归悘澶愬箥閹冪厒濞存粌妫滈惌鎯ь嚗閸曞墎绀夐悘蹇撴閸欑偓寰勫鍛厬闁告帞娈恛slist濞?
        if (shortestPath !== null) {
            poslist.splice(0, poslist.length, ...shortestPath);
            return true;
        }

        return false;
    }

    // 婵烇綀顕ф慨鐐哄籍閻樼粯顎欐俊顖椻偓宕囩闁烩晝顭堥崣褔宕ｅ鈧崳?
    private infiniteWid: number = 10;
    private infiniteHei: number = 10;

    // 闁告帗绋戠紓鎾诲籍閻樼粯顎欐俊顖椻偓宕囩闁稿繐鍟垮畷?
    CreateInfiniteMode(width: number, height: number) {
        this.infiniteWid = width;
        this.infiniteHei = height;
        this.gameOver = false;
        // 缁绢収鍠曠换姘辨媼閸撗呮瀭婵炴挸鎲￠崹娆戠尵鐠囪尙鈧攱绋夐悜妯伙骏闂傚嫭鍔栬啯鐎?
        this.gameType = GameType.INFINITE;

        // 婵炴挸鎳愰埞鏈bject
        // TObject.clear();

        // 婵炴挸鎳愰埞鏍嚍閸屾粌浠?
        this.clear();

        // 闁告帗绻傞～鎰板礌閺嵮勫嬀闁?
        gridcreator.map = [];
        for (let i = 0; i < this.infiniteWid + 2; i++) {
            gridcreator.map[i] = [];
            for (let j = 0; j < this.infiniteHei + 2; j++) {
                gridcreator.map[i][j] = 0;
            }
        }

        // 閻犱緤绱曢悾鑽ょ磾閹寸偟澹愬鍫嗗啰姣?
        const parentRect = this.node.getComponent(UITransform)!;
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;

        const cellWidth = availableWidth / this.infiniteWid;
        const cellHeight = availableHeight / this.infiniteHei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(150, this.gridsize);

        // 閻犱緤绱曢悾濠氬箑缂佹澹愰悗娑欏姈閺嗙喖宕仦绛嬪殸闁?
        const totalCells = this.infiniteWid * this.infiniteHei;
        const totalPairs = Math.floor(totalCells / 2); // 濞戞挴鍋撻柛妤€锕ら敐鐐哄礂?

        // 闁兼儳鍢茶ぐ鍥矗椤栨粍鏆忕紒顐ヮ嚙閻庣兘寮导鏉戞
        this.pl = this.plSprites;
        const availableTypes = this.pl.length - 1;
        if (availableTypes < 2) {
            console.error('Not enough image types');
            return;
        }

        // 闁汇垻鍠愰崹姘跺箥閳ь剟寮垫径澶岀Т缂?
        const positions: Vec2[] = [];
        for (let i = 0; i < this.infiniteWid; i++) {
            for (let j = 0; j < this.infiniteHei; j++) {
                positions.push(new Vec2(i + 1, j + 1));
            }
        }

        // 闁瑰灚鎸风拹鈩冩媴瀹ュ洨鏋?
        this.Shuffle(positions);

        // 闁告瑯浜滈敐鐐哄礂閸涱剛顏遍柛妤€锕﹀▓鎴炴媴瀹ュ洨鏋?
        const fillCount = Math.floor(totalPairs / 2);

        // 闁汇垻鍠愰崹姘跺础閿涘嫬顣婚悗?
        for (let p = 0; p < fillCount; p++) {
            // 闂傚懎绻戝┃鈧紒顐ヮ嚙閻?
            const type = Math.floor(Math.random() * availableTypes) + 1;

            // 闁兼儳鍢茶ぐ鍥ㄧ▔閵堝嫰鍤嬪ù锝呯Ф閻?
            const pos1 = positions[p * 2];
            const pos2 = positions[p * 2 + 1];

            // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂?
            gridcreator.map[pos1.x][pos1.y] = type;
            gridcreator.map[pos2.x][pos2.y] = type;

            // 闁汇垻鍠愰崹姘跺础閿涘嫬顣?
            this.SpawnCard(pos1, type);
            this.SpawnCard(pos2, type);
        }

        console.log(`Infinite mode created: ${this.infiniteWid}x${this.infiniteHei}, filled ${fillCount * 2} cards`);
    }

    // 闁汇垻鍠愰崹姘跺棘閺夊灝骞㈤柣妤€鑻顕€鏁嶉崼銏℃殢濞存粌瀛╁Λ銈夋⒔閹邦劷浣割嚕韫囥儳绀?
    // 閺夆晜鏌ㄥú鏉ue閻炴稏鍔庨妵姘辩磾閹寸偟澹愮€圭寮跺褔寮悩宕囥€婇柣銏㈠枑閸ㄦ岸寮撮弶鎴▼闁告绱曟晶?
    generateNewPair(): boolean {
        // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敂鑳闁哄啰濞€濡惧搫螣閳ュ磭纭€
        if (!this.isInfiniteMode) {
            return false;
        }

        // 闁哄被鍎叉竟姗€骞嶉埀顒勫嫉婢跺备鏁勫ù锝呯Ф閻?
        const emptyPositions: Vec2[] = [];
        for (let x = 1; x <= this.infiniteWid; x++) {
            for (let y = 1; y <= this.infiniteHei; y++) {
                if (gridcreator.map[x][y] === 0) {
                    emptyPositions.push(new Vec2(x, y));
                }
            }
        }

        // 濠碘€冲€归悘澶岀矚鏉炴壆绉寸紓鍐惧枛閻垱绂?濞戞搩浜风槐婵堟嫚鐎涙ɑ顫栫紓鍐╁灦閻楃顔忛崣澶婂К
        if (emptyPositions.length < 2) {
            console.log('Grid is full, cannot generate new pair');
            return true;
        }

        // 闂傚懎绻戝┃鈧梺顐㈩槹鐎氥劍绋夐妶鍕殝缂佸矁妗ㄧ紞鍛磾?
        this.Shuffle(emptyPositions);
        const pos1 = emptyPositions[0];
        const pos2 = emptyPositions[1];

        // 闂傚懎绻戝┃鈧梺顐㈩槹鐎氥劑宕￠敍鍕杺缂侇偉顕ч悗鐑芥晬閸繍鏉婚柛鏃傚Х鐞氼偊宕圭€ｎ偅娈堕梺鎻掔箣娴滄帡骞撻幇鎵蒋闂傚懏鍎崇€规娊鏁?
        const availableTypes = Math.min(10, this.pl.length - 1); // 闁哄牃鍋撳鑸电煯婵炲洭鎮?0缂佸绉剁悮顐﹀垂?
        if (availableTypes < 1) {
            console.error('No available card type');
            return false;
        }

        const type = Math.floor(Math.random() * availableTypes) + 1;

        // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂?
        gridcreator.map[pos1.x][pos1.y] = type;
        gridcreator.map[pos2.x][pos2.y] = type;

        // 闁汇垻鍠愰崹姘跺础閿涘嫬顣?
        this.SpawnCard(pos1, type);
        this.SpawnCard(pos2, type);

        console.log(`闁汇垻鍠愰崹姘跺棘閺夊灝骞㈤柣妤€鑻顕€鏁嶅畝鈧悮顐﹀垂? ${type}闁挎稑濂旂紞鍛磾? (${pos1.x},${pos1.y}) 闁?(${pos2.x},${pos2.y})`);

        // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敃鈧崙鈥愁煥?
        return emptyPositions.length === 2; // 濠碘€冲€归悘澶嬬▕鐎ｎ亜顤呴柛娆樹簼濠€?濞戞搩浜為埞鏍ㄦ媴瀹ュ洨鏋傞柨娑樼灱楠炲洭宕烽妸銉ュ殥婵?
    }

    // 闁告帗绋戠紓鎾寸▔婢跺啸婵☆垪鈧磭纭€闁稿繐鍟垮畷?
    CreateSanxiaoMode(width: number, height: number) {
        this.gameOver = false;
        // 缁绢収鍠曠换姘辨媼閸撗呮瀭婵炴挸鎲￠崹娆戠尵鐠囪尙鈧攱绋夋潪鎵憦婵炴垵鐗婅啯鐎?
        this.gameType = GameType.SANXIAO;
        // 濞达綀娉曢弫銈嗗閻樻彃寮抽柣銊ュ瀵剟寮幏宀婂晭缂傚喚鍠氱紞澶愬冀閻撳孩妲€閻?
        this.infiniteWid = width;
        this.infiniteHei = height;

        // 婵炴挸鎳愰埞鏈bject
        // TObject.clear();

        // 婵炴挸鎳愰埞鏍嚍閸屾粌浠?
        this.clear();

        // 闁告帗绻傞～鎰板礌閺嵮勫嬀闁?
        gridcreator.map = [];
        for (let i = 0; i < this.infiniteWid + 2; i++) {
            gridcreator.map[i] = [];
            for (let j = 0; j < this.infiniteHei + 2; j++) {
                gridcreator.map[i][j] = 0;
            }
        }

        // 閻犱緤绱曢悾鑽ょ磾閹寸偟澹愬鍫嗗啰姣?
        const parentRect = this.node.getComponent(UITransform)!;
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;

        const cellWidth = availableWidth / this.infiniteWid;
        const cellHeight = availableHeight / this.infiniteHei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(150, this.gridsize);

        // 闁兼儳鍢茶ぐ鍥矗椤栨粍鏆忕紒顐ヮ嚙閻庣兘寮导鏉戞闁挎稑鐗嗛悢鈧ù婊冨閻楀摜鈧稒鍔栭弳鐔兼煂?4闁?
        this.pl = this.plSprites;
        // 闁哄秷顫夊畵渚€寮介悡搴ｆ憤闁轰椒鍗抽崳铏规媼閸撗呮瀭闁告绱曟晶婵堢矓瀹ュ洩顫﹂柡浣峰嵆閸ｇ儤绋夐悜妯煎閻庢稒鍔栭弳鐔兼煂?4
        const totalSanXiaoCells = this.infiniteWid * this.infiniteHei; // 閻犱緤绱曢悾濠氬箑缂佹澹愰悗娑欏姈閺?
        const availableTypes = Math.min(Math.max(4, Math.floor(totalSanXiaoCells / 4)), this.pl.length - 1); // 闁煎嘲鍟块惃?缂佸绉村畷閬嶆偋瀹€瀣闁哄牃鍋撳鑸电煯缁楀鎼鹃崨鎵畺闁告瑯鍨抽弫銈囩尵鐠囪尙鈧?
        if (availableTypes < 2) {
            console.error('Not enough image types');
            return;
        }

        // 濠靛鍋勯崢鏍极缂堢娀鍤嬬紓鍐╁灦閻?
        for (let x = 0; x < this.infiniteWid; x++) {
            for (let y = 0; y < this.infiniteHei; y++) {
                // 闂傚懎绻戝┃鈧紒顐ヮ嚙閻庣兘鏁嶉崼婊冣枏闁活潿鍔忕欢婵堜焊閹寸姵鐣辩紒顐ヮ嚙閻庨攱绂掗妷鈺傤€栧ù锝呴叄濮ｏ附鎯旈敂鑲╃
                const type = Math.floor(Math.random() * availableTypes) + 1;

                // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂?
                gridcreator.map[x + 1][y + 1] = type;

                // 闁汇垻鍠愰崹姘跺础閿涘嫬顣?
                const mapPos = new Vec2(x + 1, y + 1);
                this.SpawnCard(mapPos, type);
            }
        }

        console.log(`Sanxiao mode created: ${this.infiniteWid}x${this.infiniteHei}, types ${availableTypes}`);
    }
    totallayer = 4;

    /**
     * 闁告帗绋戠紓鎾诲礆閸℃婀撮柛娆戝Т婵偛螣閳ュ磭纭€闁稿繐鍟垮畷?
     */
    CreateLayerSplitMode(width: number, height: number) {
        this.gameOver = false;
        // 缁绢収鍠曠换姘辨媼閸撗呮瀭婵炴挸鎲￠崹娆戠尵鐠囪尙鈧攱绋夐崫鍕€婚悘鐐插€歌ぐ鏃堝礉閻樿‖浣割嚕?
        this.gameType = GameType.LAYER_SPLIT;
        // 濞达綀娉曢弫銈嗗閻樻彃寮抽柣銊ュ瀵剟寮幏宀婂晭缂傚喚鍠氱紞澶愬冀閻撳孩妲€閻?
        this.infiniteWid = 5;
        this.infiniteHei = 7;


        this.clear();

        // 閻犱緤绱曢悾鑽ょ磾閹寸偟澹愬鍫嗗啰姣?
        const parentRect = this.node.getComponent(UITransform)!;
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;

        const cellWidth = availableWidth / this.infiniteWid;
        const cellHeight = availableHeight / this.infiniteHei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(150, this.gridsize);



        //闁稿繐鐗愰鍝ョ不濡炲墽顏遍柛蹇撳船椤﹁法浜搁幋婵堟澖濞达絾鎸稿畷閬嶆偋瀹€瀣闁绘帟娉涢幃妤呮⒕韫囨梹绨氱€垫壋鍋撻柡宥囧帶閻℃瑩鏌屽畝鍕〃濠?

        // 闁兼儳鍢茶ぐ鍥矗椤栨粍鏆忕紒顐ヮ嚙閻庣兘寮导鏉戞
        this.pl = this.plSprites;
        // 闁哄秷顫夊畵渚€寮介悡搴ｆ憤闁轰椒鍗抽崳铏规媼閸撗呮瀭闁告绱曟晶婵堢矓瀹ュ洩顫﹂柡浣峰嵆閸ｇ儤绋夐悜妯煎閻庢稒鍔栭弳鐔兼煂?4
        const totalLayerCells = this.infiniteWid * this.infiniteHei *   this.totallayer; // 閻犱緤绱曢悾濠氬箑缂佹澹愰悗娑欏姈閺?


        let number =  Math.floor(totalLayerCells/3)*3;

        const availableTypes = Math.min(Math.max(4, Math.floor(totalLayerCells / 6)), this.pl.length - 1); // 闁煎嘲鍟块惃?缂佸绉村畷閬嶆偋瀹€瀣闁哄牃鍋撳鑸电煯缁楀鎼鹃崨鎵畺闁告瑯鍨抽弫銈囩尵鐠囪尙鈧?
        if (availableTypes < 2) {
            console.error('Not enough image types');
            return;
        }

        //闁告垵妫楅ˇ顒備沪閸屾繂螡闁?
        for(let layer = 1; layer <= this.totallayer; layer++){
            let layerx = new Node("layer" + layer);
            this.card_container.addChild(layerx);
            layerx.setPosition(Math.random() * this.gridsize- this.gridsize/2, Math.random() * this.gridsize- this.gridsize/2, layer);
        }

        let arr=new Array<TBlock>();
        for(let layer = 1; layer <= this.totallayer; layer++){
            for(let x = 0; x < this.infiniteWid; x++){
                for(let y = 0; y < this.infiniteHei; y++){
                    let block = new TBlock();
                    block.x = x;
                    block.y = y;
                    block.layer = layer;
                    arr.push(block);
                }
            }
        }
        this.Shuffle(arr);

        let pares=Math.floor(number/3*0.5);

        for(let i = 0; i < pares; i++){
            const type = Math.floor(Math.random() * availableTypes) + 1;
            for(let count = 1; count <=3; count++){
                let block = arr[i*3+count-1];
                // 闁兼儳鍢茶ぐ鍥╀沪閸屾繂螡闁?
                let layerx = this.card_container.getChildByName("layer" + block.layer);
                // 闂傚懎绻戝┃鈧ù锝呯Ф閻?
                const mapPos = new Vec2(block.x + 1, block.y + 1);
                // 闁汇垻鍠愰崹姘跺础閿涘嫬顣?
                this.SpawnLayeredCard(layerx, mapPos, type, block.layer);
            }
        }

        this.PlayEffect();
    }

    /**
     * 婵絽绻愰幎姘跺即鐎涙ɑ鐓€
     */
    protected update(dt: number): void {
        // 濠碘€冲€归悘澶愬箰婢跺鐟揇闂佹鍣槐婵嬪礆闁垮鐓€mask闁绘鍩栭埀?
        // if (input.isKeyDown(KeyCode.KEY_D)) {
        //     this.updateAllCardMaskStatus();
        // }
    }

    /**
     * 闁哄洤鐡ㄩ弻濠囧箥閳ь剟寮垫径濠傚耿闁绘鐬煎▓鎲乤sk闁绘鍩栭埀?
     */
    private updateAllCardMaskStatus() {
        for (let layer = 1; layer <= this.totallayer; layer++) {
            let layerx = this.card_container.getChildByName("layer" + layer);
            for(let c = 0; c < layerx.children.length; c++){
                let cx = layerx.children[c];
                let tobj = cx.getComponent('TObject') as any;
                if(tobj){
                    tobj.updateMaskStatus();
                }
            }
        }
    }
    /**
     * 闁汇垻鍠愰崹姘跺礆閸℃婀撮柛妤嬬磿婢?
     */
    private SpawnLayeredCard(layerx: Node, mapPos: Vec2, type: number, layer: number) {
        const cx = instantiate(this.item);
        layerx.addChild(cx);
        this.applyCardGridLayout(cx);

        // 閻犱礁澧介悿鍡欏垝閸撗傜触
        const xx = this.pl[type];
        const tobj = cx.getComponent('TObject') as any;
        if(tobj){
            tobj.layer = layer;
        }
        // 婵炲鍔嶉崜浼存晬濮濈敘pPos闁哄嫷鍨伴悢鈧ù?闁汇劌瀚崒銊ヮ嚕閺囶亞绀夐柤鏉胯嫰瀹曢亶鎮у畝鈧▓鎲?y閻忕偟鍋為埀顑嫭笑闁糕晞妗ㄧ花?闁汇劌瀚崒銊ヮ嚕?
        tobj?.SetSprite(mapPos.x - 1, mapPos.y - 1, type, xx, this);
        tobj?.UseMaJiangBg();
        // 濞戞挸鎼崹搴ｄ沪閸屾艾骞㈤柣妤€鏈崸濠囧礉閻橀潧顥楁繛鍫濓攻閻栵絿鎷?
        cx.name = `${mapPos.x - 1},${mapPos.y - 1}_layer${layer}`;

        // 婵烇綀顕ф慨鐐存媴瀹ュ泦鈺呭极閸喓浜ù鐘劜濡绮堥崫鍕秾闁?
        // 閻犱緤绱曢悾濠氬春閾忚鏀ㄥù锝呯Ф閻?
        let baseX = (mapPos.x - 1) * this.gridsize;
        let baseY = (mapPos.y - 1) * this.gridsize;

        // // 濠靛倸娲﹂弳鐔轰沪閸屾稒绡傜€归潻缂氱粭鍛村棘閻熼鐒婄紒澶庮嚙瀹曟劖绋夐鍛閻?
        // if (layer % 2 === 1) {
        //     baseX -= this.gridsize / 2; // 闁告碍鍨垫稊蹇涘磻韫囨泤鈺呭础婵犱線鍤嬮柡宥囧帶閻?
        //     baseY -= this.gridsize / 2; // 闁告碍鍨崇粭鍛村磻韫囨泤鈺呭础婵犱線鍤嬮柡宥囧帶閻?
        // }

        const targetPos2D = this.tref.add(new Vec2(baseX, baseY));
        const targetPos = new Vec3(targetPos2D.x, targetPos2D.y, layer); // 濞达綀娉曢弫顦犻弶鐐殿棎閵嗗啰绮堥崫鍕勾缂?
        cx.setPosition(targetPos);

        // 閻犱礁澧介悿鍡涘础閿涘嫬顤傞悘蹇撴惈椤?
        this.applyCardGridLayout(cx);
    }

    @property(Prefab)
    private scorePopupNode: Prefab = null;
    /**
     * 婵☆偀鍋撻柡灞诲劚閼荤喎鈽夐崼銉︾彑缂佹绠戦幃搴ㄥ级閳ュ弶顐介柣銊ュ瀹曢亶鎮у畝鈧划宥夊触閸剛绀勫☉鎾愁槹缁夊嘲螣閳ュ磭纭€闁?
     */
    /**
     * 闁革负鍔嶉弻鐔煎锤濡や胶啸濠㈣泛褰夌紞鍛磾椤旇姤鈻旂紒鈧?1闁告帒妫欒ぐ浣虹矆?
     */
    private showScorePopup(position: Vec3): void {
        try {
            // 闁告帗绋戠紓鎾诲礆閸℃ɑ娈堕柟缁樺姉閵囨岸鎳為崒婊冧化
            const scorePopup = instantiate(this.scorePopupNode);// new Node('ScorePopup');

            // 婵烇綀顕ф慨婵絀缂備礁瀚▎銏＄閵壯€鈧ɑ绌卞┑鍥跺妧缁绢収鍠氬▓鎴濄€掗崣澶屽帬閻忕偛鍊绘?
            const uiTransform = scorePopup.getComponent(UITransform);
            uiTransform.setContentSize(150, 80); // 濠⒀呭仜閵囧槮I缂備礁瀚▎銏″緞瑜嶉惃顒佺閵夆斁鍋撻崒姘卞畨闁哄洦娼欓妵鍥儍閸曨偆鎽熷ù?

            // 婵烇綀顕ф慨婵碼bel缂備礁瀚▎?
            const label = scorePopup.getComponent(Label);
            label.string = '+1';
            label.fontSize = 48; // 闁告梻濮撮妵鍥┾偓娑欍仦缂嶅寰勮閻?

            // 閻犱礁澧介悿鍡涙煂閹达絽顥忛柡鍌氭搐閻?
            label.color = new Color(255, 215, 0, 255);

            // 閻忓繑绻嗛惁顖滄媼閸撗呮瀭閻庢稒銇炵紞?- 闁革腹鈧悐cos Creator濞戞搩鍙忕槐婵嬪箣閹存粍绮﹂梻鍥ｅ亾閻熸洑鑳堕垾妯荤┍濠靛洦绠掗柡鍫濐槹閺呫儵鎯冮崟顐ゆ憻濞达絾鎹佺粊顐⑩攦?
            // 濠碘€冲€归悘澶愬嫉婢舵劗甯涢悹浣靛€曢悺褎鎷呴幙鍕濞达綀娉曢弫銈団偓鐟板枦缁遍亶宕ラ敃鈧崹顖涙媴鐠恒劍鏆忕紒顖濆吹缁儤顪€濡鍚囬悗娑欍仦缂?
            try {
                // 閻忓繑绻嗛惁顖涙媴鐠恒劍鏆忛柛鎰噽閻ゅ棛鈧稒銇炵紞瀣箣閺嵮冨殥闁告梻濮惧ù鍥儍閸曨偆鎽熷ù?
                if (label.font) {
                    // 閻庢稒銇炵紞瀣啅閹绘帞鎽犻柛锔荤厜缁辨繃绌卞┑鍥х槷濞戞挸绉磋ぐ?
                } else {
                    // 濠碘€冲€归悘澶愬籍閻樺磭銆婇悹浣稿⒔閻ゅ棛鈧稒銇炵紞瀣晬鐏炶棄鐏熼柤宄板暱閻垳娑甸鑽ょ闁稿繑婀圭划顒備沪閻愮补鍋撹椤掓粎娑甸娆惧晭缂?
                    console.warn('Font resource not explicitly set, using system default');
                }
            } catch (e) {
                console.warn('Failed to set font:', e);
            }

            // 閻犱礁澧介悿鍡涘棘閸ャ劍鎷遍悗闈涚秺缂嶅牓寮悷鎵
            try {
                label.horizontalAlign = Label.HorizontalAlign.CENTER;
                label.verticalAlign = Label.VerticalAlign.CENTER;
            } catch (e) {
                // 濠碘€冲€归悘澶嬬▔婵犲洦妗ㄩ柣銊ュ閺岀喎鈻旈弴鐐杭閻犳劑鍎荤槐婵囨媴鐠恒劍鏆忛柡鍥ь嚟閻ｆ繈宕￠弴鐘崇暠闁哄倻鎳撶槐?
                console.log('濞达綀娉曢弫銈嗩渶濡鍚囬悗闈涚秺缂嶅牓寮悷鎵');
            }

            // 闁告帗绻傞～鎰媼閸撗呮瀭濞戞挸鎼悾顒勫礂閵娾斁鍋撹箛鏃€顫栭柨娑樼灱閻℃垵顕ラ崨顓炲耿闁绘鏈粔閿嬪緞閸楃偞鍊甸柛鎰У濡绮?
            label.color = new Color(255, 215, 0, 0);

            // 閻犱礁澧介悿鍡涘嫉椤掆偓濠€鎾锤閹邦厾鍨?
            scorePopup.setPosition(position);

            // 婵烇綀顕ф慨鐐哄礆閺夎法绉奸柛鎾崇Х婵☆參鎮欓崷顓熺暠濞戞挸锕ｇ粩瀵哥棯瑜濈槐婵嬫焼閸喖甯虫鐐插级婢瑰牆銆掗崨濠傜亞
            if (this.node.parent) {
                this.node.parent.addChild(scorePopup);
            } else {
                // 濠碘€冲€归悘澶娾柦閳╁啯绠掗柣鏍ㄥ劶婵☆參鎮欓惂鍝ョ闁告帗鐟﹂崸濠囧礉閻樻彃鐓傜憸鐗堟尭婢х娀鎳為崒婊冧化濞达絾绮堢拹鐔稿緞閸モ晜鏆忛柡鍌濐潐椤?
                this.node.addChild(scorePopup);
            }

            // 濞ｅ洦绻傞悺銊╁礆濠靛棭娼楀Λ鐗堢矎婢?
            const originalColor = new Color(255, 215, 0, 255);

            // 濞达綀娉曢弫顦歸een闁告柣鍔庨弫楣冩晬濮橆剙甯ョ紒娑橆槸缁剁喖宕￠敍鍕杺婵炴垵鐗嗛妵鎴︽晬?.3缂佸甯槐姘舵晬瀹€鈧崝褔宕ユ惔銏♀枖缂佲偓閸濆嫬顫ｉ柛鎺戞瑜颁胶绮?
            tween(scorePopup)
                .delay(0.3) // 缂佹稑顦欢鐔煎础閿涘嫬顤傛繛鎴濈墕閵囨垿宕濋妸褎鏆伴悗鐟版湰閸?
                .call(() => {
                    // 闁告绱曟晶婵嗏槈閸縿浜奸柛姘嚱缁辨繂顕ｉ埀顒佹叏鐎ｎ偅鈻旂紒鈧崫鍕潱闁告帒妫欒ぐ浣虹矆?
                    label.color = originalColor;
                })
                .to(0.8, { position: new Vec3(position.x, position.y + 80, position.z) }, {
                    easing: 'sineOut',
                    onUpdate: (target, ratio) => {
                        // 闁革负鍔屾慨鈺呮偨閺勫繒绠栫紒瀣儎閼垫垿寮寸€涙ɑ鐓€缂傚倵鏅滈弬?
                        const scaleRatio = 1 + 0.8 * ratio; // 闁告梻濮撮妵鍥╃磽閳哄倹鏉归柡浣哥墛閻?
                        target.setScale(new Vec3(scaleRatio, scaleRatio, 1));

                        // 闁?.6缂佸甯婄换姘跺箰娴ｅ摜鏆氶柛蹇嬪妺缁楀鏌呰箛鏃€顫栭柨娑樿嫰閹?.5缂佸甯楃拹浼村礄?
                        if (ratio > 0.6) {
                            const fadeRatio = (ratio - 0.6) / 0.4;
                            const alpha = originalColor.a * (1 - fadeRatio);
                            label.color = new Color(originalColor.r, originalColor.g, originalColor.b, Math.floor(alpha));
                        }
                    }
                })
                .delay(0.3) // 缂佹稑顦欢鐔非庨垾鍐叉瘔閻庣懓鏈崹?
                .call(() => {
                    // 缁绢収鍠曠换姘跺礉閵娧勬毎缂備焦鎸诲顐﹀触鎼粹€虫櫃闂佸簱鍋撴慨?
                    if (scorePopup && scorePopup.isValid) {
                        scorePopup.destroy();
                    }
                })
                .start();
        } catch (error) {
            console.error('闁哄嫬澧介妵姘跺礆閸℃ɑ娈堕柟缁樺姉閵囨碍寰勬潏顐バ?', error);
        }
    }

    public async checkAndEliminateSanxiao(): Promise<boolean> {
        // 闁兼儳鍢茶ぐ鍥箥閳ь剟寮垫径濠傝婵炴垵鐗撳▍搴ㄦ儍閸曨偄骞㈤柣妤€鐬肩划宥夊触閸剛绀勫☉鎾规〃缁繝宕楅悡搴晣闁诡儸鍌滅闁伙絾鐟﹂婵嬪棘鐟欏嫮銆婇柨娑樺缁插墽鈧湱鍋ゅ顖涙媴鐠恒劍鏆廲heckAndEliminateSanxiaoForCards闁?
        const eliminableCards = this.findEliminableCards();

        if (eliminableCards.length > 0) {
            // 婵炴垵鐗撳▍搴ㄥ础閿涘嫬顤?
            for (const card of eliminableCards) {
                // 閻犱焦婢樼紞宥呪槈閸儲鐝熷ù锝呯Ф閻?
                const eliminatePos = card.node.position.clone();
                // 闁哄嫬澧介妵姘跺礆閸℃ɑ娈堕柟缁樺姉閵?
                this.showScorePopup(eliminatePos);

                // 闁哄秴娲╅鍥ㄧ▔閸濆嫬鍤掓繛鎴濈墦濞?
                card.released = true;
                // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂堥柡浣哄瀹?
                gridcreator.map[card.x + 1][card.y + 1] = 0;
            }

            // 缂佹稑顦欢鐔哥▔閳ь剛浜歌箛鏃戝斀闁哄啫鐖煎Λ鍧楀礃瀹ュ鏁樻慨锝勭瀹曢亶鎮у畝瀣閻犱讲鏅濈敮铏光偓鐟板濠€鍛村礆閻楀牏啸闂傚嫨鍊栭弲銉╁几?
            await new Promise(resolve => setTimeout(resolve, 300));

            // 濞寸姴楠稿┃鈧柡鍜佸灟閼垫垹绮旀繝姘彑妤犵偛鐖奸弨銏犘掓担绋垮耿闁?
            for (const card of eliminableCards) {
                // 闁烩晛鐡ㄧ敮鎾煥閳ь剙袙娴ｇ骞㈤柣妤€鐭佹俊顓㈡倷?
                card.node.destroy();
            }

            // 閻熸瑱绠戣ぐ鍌滅矓椤栨艾鐎诲褏鍋涙慨鐐寸鐎ｂ晜顐?- 婵絽绻戠粔鐑芥⒔閵堝嫮顏卞☉鎿冧簻瀹曢亶鎮х仦钘夘潱濞戞挴鍋撻柛?
            Main.DispEvent('event_add_jifen',eliminableCards.length);

            // 婵☆偀鍋撻柡灞诲劜閻栧爼骞嬭箛鏃€笑闁告熬濡囩划銊╁级閻曞倻绀勯柟纰樺亾闁哄牆顦畷閬嶆偋瀹€鍕幋鐎圭寮剁粔鐑芥⒔閵堝繒绀?
            if (this.node.children.length === 0) {
                frm_main.isPause = true;

                // 缂佹稑顦欢?.5缂?
                await new Promise(resolve => setTimeout(resolve, 500));

                // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敂鑳闁哄啰濞€濡惧搫螣閳ュ磭纭€
                if (this.isInfiniteMode) {
                    // 闁哄啰濞€濡惧搫螣閳ュ磭纭€濞戞挸顑堣闁告瑦鍨跺Λ銈夋⒔閹邦劷浣割嚕韫囨艾鍔忛柛鎺嗘櫃缁ㄣ劍绂?
                    Main.DispEvent('game_win_infinite');
                } else {
                    // 闁哄拋鍣ｉ埀顒佺鑶╃€殿喖绻嬬粭鍛喆閿曗偓瑜板倿寮查鈧埀顒佷亢閸庛劑宕氶埡鈧花銊︾?
                    Main.DispEvent('game_win',LevelMgr.level);
                }
                return true;
            }

            // 缂佹稑顦欢鐔哥▔閳ь剛浜歌箛鏃戝斀闁哄啫鐖煎Λ?
            await new Promise(resolve => setTimeout(resolve, 500));

            // 閻犱讲鏅涘畷閬嶆偋鐏炶偐鐟撻柦鈧挊澶涚稏闁稿繐鎳愰埞鏍ㄦ媴?
            await this.dropCardsDown();

            // 闁汇垻鍠愰崹姘跺棘閹殿喗鐣遍柛妤嬬磿婢ф繃绻呴銏犲笭缂佸矁妗ㄧ紞?
            this.generateNewCards();

            return true; // 闁哄牆顦扮粔鐑芥⒔閵堝棙鎯欏ù?
        }

        return false; // 婵炲备鍓濆﹢浣糕槈閸儲鐝熼柟鍨С缂?
    }

    /**
     * 婵☆偀鍋撻柡灞诲劚閼荤喎鈽夐崼銉︾彑闁圭娲ら悾楣冨础閿涘嫬顤傜憸鑸灪閸ㄦ岸鎯冮崟顓у剨闁告艾鐗婂顖涚閸撲焦鐣遍柛妤嬬磿婢ф繄绱掗崟顐ｅ€ら柨娑樼墔缁椾礁鈽夐崼鐔屼礁顕ｈ箛銉х
     * 闁告瑯浜濋ˉ鍛村蓟閵夈倗鐟㈤柟绋挎搐閻ｉ箖宕￠敍鍕杺闁烩晜鐡曠换娑溿亹閵忊€崇亣3濞戞搩浜濋崹銊︾閵夈倗鐟愰弶鈺冨仧閻㈠宕￠敍鍕杺闁汇劌瀚划宥夊触?
     */
    public async checkAndEliminateSanxiaoForCards(cards: any[]): Promise<boolean> {
        const eliminableCards = new Set();

        // 婵☆偀鍋撻柡灞诲劜閻︹剝绋夐鍛樄閻庤姘ㄥ▓鎴﹀础閿涘嫬顤?
        for (const card of cards) {
            // 婵☆偀鍋撻柡灞诲劜閾嗛柛姘灱缁绘稓绱?
            const horizontalCards = this.findHorizontalConnectedCards(card);
            if (horizontalCards.length >= 3) {
                for (const c of horizontalCards) {
                    eliminableCards.add(c);
                }
            }

            // 婵☆偀鍋撻柡灞诲劤閺冮亶宕ラ幋锝囩缂?
            const verticalCards = this.findVerticalConnectedCards(card);
            if (verticalCards.length >= 3) {
                for (const c of verticalCards) {
                    eliminableCards.add(c);
                }
            }
        }

        // 濠碘€冲€归悘澶愬嫉婢跺﹤璁叉繛鎴濈墦濞呭酣鎯冮崟顐㈠耿闁?
        if (eliminableCards.size > 0) {
            const eliminableCardsArray = Array.from(eliminableCards) as any[];

            // 婵炴垵鐗撳▍搴ㄥ础閿涘嫬顤?
            for (const card of eliminableCardsArray) {
                // 閻犱焦婢樼紞宥呪槈閸儲鐝熷ù锝呯Ф閻?
                const eliminatePos = (card as any).node.position.clone();
                // 闁哄嫬澧介妵姘跺礆閸℃ɑ娈堕柟缁樺姉閵?
                this.showScorePopup(eliminatePos);

                // 闁哄秴娲╅鍥ㄧ▔閸濆嫬鍤掓繛鎴濈墦濞?
                (card as any).released = true;
                // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂堥柡浣哄瀹?
                gridcreator.map[(card as any).x + 1][(card as any).y + 1] = 0;
            }

            // 缂佹稑顦欢鐔哥▔閳ь剛浜歌箛鏃戝斀闁哄啫鐖煎Λ鍧楀礃瀹ュ鏁樻慨锝勭瀹曢亶鎮у畝瀣閻犱讲鏅濈敮铏光偓鐟板濠€鍛村礆閻楀牏啸闂傚嫨鍊栭弲銉╁几?
            await new Promise(resolve => setTimeout(resolve, 300));

            // 濞寸姴楠稿┃鈧柡鍜佸灟閼垫垹绮旀繝姘彑妤犵偛鐖奸弨銏犘掓担绋垮耿闁?
            for (const card of eliminableCardsArray) {
                // 闁烩晛鐡ㄧ敮鎾煥閳ь剙袙娴ｇ骞㈤柣妤€鐭佹俊顓㈡倷?
                (card as any).node.destroy();
            }

            // 閻熸瑱绠戣ぐ鍌滅矓椤栨艾鐎诲褏鍋涙慨鐐寸鐎ｂ晜顐?- 婵絽绻戠粔鐑芥⒔閵堝嫮顏卞☉鎿冧簻瀹曢亶鎮х仦钘夘潱濞戞挴鍋撻柛?
            Main.DispEvent('event_add_jifen',eliminableCardsArray.length);
            // 缂佹稑顦欢鐔哥▔閳ь剛浜歌箛鏃戝斀闁哄啫鐖煎Λ?
            await new Promise(resolve => setTimeout(resolve, 500));

            // 閻犱讲鏅涘畷閬嶆偋鐏炶偐鐟撻柦鈧挊澶涚稏闁稿繐鎳愰埞鏍ㄦ媴?
            await this.dropCardsDown();

            // 闁汇垻鍠愰崹姘跺棘閹殿喗鐣遍柛妤嬬磿婢ф繃绻呴銏犲笭缂佸矁妗ㄧ紞?
            this.generateNewCards();

            return true; // 闁哄牆顦扮粔鐑芥⒔閵堝棙鎯欏ù?
        }

        return false; // 婵炲备鍓濆﹢浣糕槈閸儲鐝熼柟鍨С缂?
    }

    /**
     * 闁哄被鍎叉竟姗€骞嶉埀顒勫嫉婢跺﹤璁叉繛鎴濈墦濞呭酣鎯冮崟顐㈠耿闁绘鐬肩划宥夊触閸剛绀勫☉鎾愁槹缁夊嘲螣閳ュ磭纭€闁?
     */
    private findEliminableCards(): any[] {
        const eliminableCards: any[] = [];
        const processedCards = new Set();

        // 婵☆偀鍋撻柡灞诲劜閾嗛柛姘灱缁绘稓绱掗婵堢憦濞戞搩浜濋崹銊︾閵夈倗鐟愰柣鈺冾焾閹挾鐚剧拠鑼偓鐑芥儍閸曨偄骞㈤柣?
        for (let y = 0; y < this.infiniteHei; y++) {
            let count = 1;
            let currentType = -1;
            const sameTypeCards: any[] = [];

            for (let x = 0; x < this.infiniteWid; x++) {
                const card = this.findCardAt(x, y);
                if (card && !card.released) {
                    if (card.type === currentType) {
                        count++;
                        sameTypeCards.push(card);
                    } else {
                        // 婵☆偀鍋撻柡灞诲劙缁狅綁宕滃鍥ㄧ暠閺夆晝鍋熼悽濠氬础閿涘嫬顤傞柡鍕靛灠閹焦娼忛幆褍鐓傛繛鎴濈墦濞呭酣寮堕垾鍙夘偨
                        if (count >= 3 && currentType !== -1) {
                            for (const c of sameTypeCards) {
                                if (!processedCards.has(c)) {
                                    eliminableCards.push(c);
                                    processedCards.add(c);
                                }
                            }
                        }

                        // 闂佹彃绉堕悿鍡欐媼閳╁啯娈?
                        count = 1;
                        currentType = card.type;
                        sameTypeCards.length = 0;
                        sameTypeCards.push(card);
                    }
                } else {
                    // 闂侇剙娲ら崺宀€绮氭潪鎵Т闁瑰瓨鐗曢崙鈥斥槈閸儲鐝熼柣銊ュ瀹曢亶鎮у畝瀣婵☆偀鍋撻柡灞诲劙缁狅綁宕滃鍥ㄧ暠閺夆晝鍋熼悽濠氬础閿涘嫬顤傞柡鍕靛灠閹焦娼忛幆褍鐓傛繛鎴濈墦濞呭酣寮堕垾鍙夘偨
                    if (count >= 3 && currentType !== -1) {
                        for (const c of sameTypeCards) {
                            if (!processedCards.has(c)) {
                                eliminableCards.push(c);
                                processedCards.add(c);
                            }
                        }
                    }

                    // 闂佹彃绉堕悿鍡欐媼閳╁啯娈?
                    count = 0;
                    currentType = -1;
                    sameTypeCards.length = 0;
                }
            }

            // 婵☆偀鍋撻柡灞诲劜濞撳爼宕ユ惔婵堫伇缂備礁瀚换娑氱磼椤撶偛骞㈤柣?
            if (count >= 3 && currentType !== -1) {
                for (const c of sameTypeCards) {
                    if (!processedCards.has(c)) {
                        eliminableCards.push(c);
                        processedCards.add(c);
                    }
                }
            }
        }

        // 婵☆偀鍋撻柡灞诲劤閺冮亶宕ラ幋锝囩缂備緡鍘虹粭浣圭▔椤忓懎鐏楀ù鐘劙缁楀倿鎯勭粙鎸庡€辩紒顐ヮ嚙閻庣兘鎯冮崟顐㈠耿闁?
        for (let x = 0; x < this.infiniteWid; x++) {
            let count = 1;
            let currentType = -1;
            const sameTypeCards: any[] = [];

            for (let y = 0; y < this.infiniteHei; y++) {
                const card = this.findCardAt(x, y);
                if (card && !card.released) {
                    if (card.type === currentType) {
                        count++;
                        sameTypeCards.push(card);
                    } else {
                        // 婵☆偀鍋撻柡灞诲劙缁狅綁宕滃鍥ㄧ暠閺夆晝鍋熼悽濠氬础閿涘嫬顤傞柡鍕靛灠閹焦娼忛幆褍鐓傛繛鎴濈墦濞呭酣寮堕垾鍙夘偨
                        if (count >= 3 && currentType !== -1) {
                            for (const c of sameTypeCards) {
                                if (!processedCards.has(c)) {
                                    eliminableCards.push(c);
                                    processedCards.add(c);
                                }
                            }
                        }

                        // 闂佹彃绉堕悿鍡欐媼閳╁啯娈?
                        count = 1;
                        currentType = card.type;
                        sameTypeCards.length = 0;
                        sameTypeCards.push(card);
                    }
                } else {
                    // 闂侇剙娲ら崺宀€绮氭潪鎵Т闁瑰瓨鐗曢崙鈥斥槈閸儲鐝熼柣銊ュ瀹曢亶鎮у畝瀣婵☆偀鍋撻柡灞诲劙缁狅綁宕滃鍥ㄧ暠閺夆晝鍋熼悽濠氬础閿涘嫬顤傞柡鍕靛灠閹焦娼忛幆褍鐓傛繛鎴濈墦濞呭酣寮堕垾鍙夘偨
                    if (count >= 3 && currentType !== -1) {
                        for (const c of sameTypeCards) {
                            if (!processedCards.has(c)) {
                                eliminableCards.push(c);
                                processedCards.add(c);
                            }
                        }
                    }

                    // 闂佹彃绉堕悿鍡欐媼閳╁啯娈?
                    count = 0;
                    currentType = -1;
                    sameTypeCards.length = 0;
                }
            }

            // 婵☆偀鍋撻柡灞诲劜濞撳爼宕ユ惔婵堫伇缂備礁瀚换娑氱磼椤撶偛骞㈤柣?
            if (count >= 3 && currentType !== -1) {
                for (const c of sameTypeCards) {
                    if (!processedCards.has(c)) {
                        eliminableCards.push(c);
                        processedCards.add(c);
                    }
                }
            }
        }

        return eliminableCards;
    }

    /**
     * 闁哄被鍎叉竟姗€骞愰崶褏鏆伴柡鍌滄嚀閹粍绋夋繝鍛缂備緡鍘惧▓鎴︽儎缁嬫寧鍊辩紒顐ヮ嚙閻庣兘宕￠敍鍕杺
     */
    private findConnectedCardsInDirection(card: any, direction: 'horizontal' | 'vertical'): any[] {
        const connectedCards: any[] = [];
        const type = card.type;
        const startX = card.x;
        const startY = card.y;

        // 闁告碍鍨垫稊?濞戞挸锕ラ悡锟犲箥閹惧懐绀勫☉鎾崇Т鐎垫﹢骞忛鍐ㄦ闂婎剦鍋撶槐?
        for (let i = -1; ; i--) {
            const x = direction === 'horizontal' ? startX + i : startX;
            const y = direction === 'vertical' ? startY + i : startY;

            if (x < 0 || y < 0) break;

            const c = this.findCardAt(x, y);
            if (c && !c.released && c.type === type) {
                connectedCards.push(c);
            } else {
                break;
            }
        }

        // 婵烇綀顕ф慨鐐烘嚊椤忓洭鐓?
        connectedCards.push(card);

        // 闁告碍鍨佃ぐ?濞戞挸顑嗛悡锟犲箥閹惧懐绀勫☉鎾崇Т鐎垫﹢骞忛鍐ㄦ闂婎剦鍋撶槐?
        for (let i = 1; ; i++) {
            const x = direction === 'horizontal' ? startX + i : startX;
            const y = direction === 'vertical' ? startY + i : startY;

            if (x >= this.infiniteWid || y >= this.infiniteHei) break;

            const c = this.findCardAt(x, y);
            if (c && !c.released && c.type === type) {
                connectedCards.push(c);
            } else {
                break;
            }
        }

        return connectedCards;
    }

    /**
     * 闁哄被鍎叉竟姗€骞愰崶褏鏆伴柛妤嬬磿婢ф繂螣椤忓嫭鍊婚弶鈺冨仧閻㈠鎯冮崟顐㈠耿闁?
     */
    private findHorizontalConnectedCards(card: any): any[] {
        return this.findConnectedCardsInDirection(card, 'horizontal');
    }

    /**
     * 闁哄被鍎叉竟姗€骞愰崶褏鏆伴柛妤嬬磿婢ф繄鐥棃娑欏€婚弶鈺冨仧閻㈠鎯冮崟顐㈠耿闁?
     */
    private findVerticalConnectedCards(card: any): any[] {
        return this.findConnectedCardsInDirection(card, 'vertical');
    }

    /**
     * 闁哄秷顫夊畵渚€宕搁幇顓犲灱闁哄被鍎叉竟姗€宕￠敍鍕杺闁挎稑鐗呯粭浣糕槈閸唽浣割嚕韫囥儳绀?
     */
    private findCardAt(x: number, y: number): any {
        const children = this.node.children;
        for (const child of children) {
            const card = child.getComponent('TObject') as any;
            // 婵炲鍔嶉崜浼存晬濮橆剙骞㈤柣妤€鐬煎▓鎲嶉柛婊冪様閻忕偟鍋為埀顑嫭笑闁糕晞妗ㄧ花?闁汇劌瀚崒銊ヮ嚕閺囶亞绀夐柤鏉垮缁卞爼宕楅妷褎鐣眡,y闁哄嫷鍨伴悢鈧ù?闁汇劌瀚崒銊ヮ嚕閺囩偛娅?
            // 濞达絽妫楅顔界鎼粹剝韬紓鍐╁灦閻楀憡寰勯弽顐ｆ櫢闁瑰瓨鍔楀▓鎴﹀础閿涘嫬顤傞柨娑樼墕椤╊溈濞戞捇缂氱粈瀣极鐢喚绀嗛柨娑樻湰閸ㄦ粍绂掗鍕粯閻熸洑鑳舵竟鎺戔枔婵犲偆妲遍柣?
            if (card && card.x === x && card.y === y) {
                return card;
            }
        }
        return null;
    }

    /**
     * 閻犱讲鏅涘畷閬嶆偋鐏炶偐鐟愮紒澶庮嚙閿濈偤宕楅崨顖楁晞濞达絽绋勭槐娆愮▔婢跺啸婵☆垪鈧磭纭€闁? 濞ｅ浂鍠楅弫鍏肩▔妤﹀灝娈板☉鎾筹龚閳ь剙濂旂粭鍛箙椤愩垹甯?
     */
    private async dropCardsDown(): Promise<void> {
        // 閻庝絻顫夐惁鈩冪▔閳ь剟宕氬Δ鍕閻炴稑鑻ˇ鈺呮偠?
        for (let x = 0; x < this.infiniteWid; x++) {
            // 濞寸姴绨肩粭鍌氼嚗閳ь剚绋夌€ｎ偒姊鹃柡灞诲劜閻︹剝绋夐埀顒傛偘瀹€瀣濞ｅ浂鍠楅弫濂告晬濮橆偆鐭ゅ銈呯埣閸庢潙顕ｉ埀顒佹叏鐎ｎ亝鍊诲☉鎾愁儜缁?
            for (let y = 0; y < this.infiniteHei; y++) {
                // 濠碘€冲€归悘澶庛亹閹惧啿顤呭ù锝呯Ф閻ゅ棙绋夐搹鍏夋晞
                if (gridcreator.map[x + 1][y + 1] === 0) {
                    // 闁告碍鍨崇粭鍛村蓟閵夛箑顥濈紒妤婂厸缁斿瓨绋夐鍫熷缂佸苯鎼畷閬嶆偋瀹€瀣濞ｅ浂鍠楅弫濂告晬濮橆厽鏆☉鎾虫惈閹粍绋夌€ｎ偆鍙€闁瑰灚鎷濈槐?
                    for (let downY = y + 1; downY < this.infiniteHei; downY++) {
                        const card = this.findCardAt(x, downY);
                        if (card && !card.released) {
                            // 闁瑰灚鍎抽崺宀勫矗椤栨瑧鐟愮紒澶庡吹濞堟垿宕￠敍鍕杺闁挎稑鏈ú鍧楀棘閺夋寧鍕鹃柛銉у亾閺嗙喖骞?
                            gridcreator.map[x + 1][y + 1] = gridcreator.map[card.x + 1][card.y + 1];
                            gridcreator.map[card.x + 1][card.y + 1] = 0;

                            // 闁哄洤鐡ㄩ弻濠囧础閿涘嫬顤傚ù锝呯Ф閻ゅ棛浠﹂悙绮瑰亾?
                            card.x = x;
                            card.y = y;
                            card.node.name = `${card.x},${card.y}`;

                            // 閻犱緤绱曢悾濠氬棘妫颁胶绉寸紓?
                            const newPos = this.tref.add(new Vec2(card.x * this.gridsize, card.y * this.gridsize));

                            // 濞达綀娉曢弫顦歸een闁告柣鍔庨弫鍓р偓鍦仧楠炲洦绋夋繝鍕戔晠寮崼鐔轰函
                            tween(card.node)
                                .to(0.3, { position: new Vec3(newPos.x, newPos.y) }, { easing: 'bounceOut' })
                                .start();

                            // 閻犲搫鍟块崵顓㈠礃閸涱厾婀寸€甸偊浜為獮鍡涙晬瀹€鈧幋椋庣磼椤撶儐妲遍柣鐐叉缁楀懏绋夐埀顒佹媴瀹ュ洨鏋?
                            break;
                        }
                    }
                }
            }
        }

        // 缂佹稑顦欢鐔煎箥閳ь剟寮垫径灞濃晠宕濋妸銉バ楅柣銏ｎ嚙閻ｎ剟骞?
        await new Promise(resolve => setTimeout(resolve, 350));
    }

    /**
     * 闁汇垻鍠愰崹姘跺棘閹殿喗鐣遍柛妤嬬磿婢ф繃绻呴銏犲笭缂佸矁妗ㄧ紞鍛存晬閸粎鐟忔繛鎴濈墛鑶╃€殿喖楠忕槐? 濞ｅ浂鍠楅弫鍏肩▔妤﹀灝娈板☉鎾筹龚閳ь剙濂旂粭鍛箙椤愩垹甯?
     */
    private generateNewCards(): Promise<void> {
        return new Promise<void>((resolve) => {
            const riseAnimations: Promise<void>[] = [];

            // 濞寸姴楠告稊蹇涘礆閺夊灝绀佸璺哄閹﹤袙韫囧海顏遍柛?
            for (let x = 0; x < this.infiniteWid; x++) {
                // 闁衡偓閸洘鑲犵憸鐗堟尭婢х娀宕氬Δ鍐╃暠闁圭鍋撻柡鍫濐槺閳规牗鎷?
                const emptyPositions: {x: number, y: number}[] = [];
                for (let y = 0; y < this.infiniteHei; y++) {
                    const card = this.findCardAt(x, y);
                    if (!card || card.released) {
                        emptyPositions.push({x, y});
                    }
                }

                // 闁圭顦划鐘崇▔婵犲倸鐓傚☉鎾愁儑濞堟垶銇勯崫鍕濠㈣泛瀚幃濠勭矚鏉炴壆绉撮柨娑樿嫰閻ゅ嫰鎮虫０浣虹煠濞戞挸顑嗛弻鐔煎礆妫颁胶鐟愰柡鍌氭贡濞堟垶绻呴銏犲笭闁轰礁鐗婇悘?
                emptyPositions.sort((a, b) => a.y - b.y);

                // 濞寸姴绨肩粭鍌炲礆妫颁胶鐟撳璺哄閹﹦绮氭潪鎵Т闁挎稑鐗愮换鏍冀闁垮鐓€闁告绱曟晶婵囧濮橆偆鐭ゅ☉鎾愁儐閺岀喐绋夋繝鍌氱３濠靛鍋勯崢鏍ㄧ▔婵犲洦妗ㄩ柣銊ュ閳规牗鎷呭蹇曠
                for (let i = 0; i < emptyPositions.length; i++) {
                    const pos = emptyPositions[i];
                    const y = pos.y;
                    const x = pos.x;

                    // 闂傚懎绻戝┃鈧柣銏㈠枑閸ㄦ岸宕￠敍鍕杺缂侇偉顕ч悗鐑芥晬閸粌鈻忛柣顫妽濞叉寧寰勫杈ㄧ暠缂侇偉顕ч悗閿嬬閵夈劎绠诲☉鎾亾婵縿鍎茶ぐ浣诡殗濮椻偓濮ｏ附鎯旈敂鑲╃
                    const availableTypes = Math.min(6, this.pl.length - 1);
                    if (availableTypes >= 1) {
                        const type = Math.floor(Math.random() * availableTypes) + 1;

                        // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂堥柡浣哄瀹?
                        gridcreator.map[x + 1][y + 1] = type;

                        // 闁革负鍔庣紞澶愬冀閻撳海淇洪梺顔哄妺缁狅絾寰勯弽顐ｆ櫢闁瑰瓨鍔栭弻濠囧础閿涘嫬顤傞柨娑樼墔閹便劑寮ㄩ惂鍝ョ獥濞寸姴楠哥花鎶芥焾閵娧勬櫢闁瑰瓨鍔х槐?
                        const cx = instantiate(this.item);
                        this.node.addChild(cx);

                        // 閻犱礁澧介悿鍡涘础閿涘嫬顤傚ù锝呯Ф閻ゅ棝鏁嶉崼婵囪含缂傚啯鍨堕悧鍛婃償閺囥垹鍔ュ☉鏂款儏椤﹀鏁?
                        cx.name = `${x},${y}`;
                        this.applyCardGridLayout(cx);
                        // 閻犙冨槻椤劖鎷呭鍥╂瀭闁革负鍔庣紞澶愬冀閻撳海淇洪梺顔哄妺缁狅絾寰?
                        const startPos = this.tref.add(new Vec2(x * this.gridsize, this.infiniteHei * this.gridsize));
                        cx.setPosition(startPos.x, startPos.y);

                        // 閻犱礁澧介悿鍡欏垝閸撗傜触
                        const xx = this.pl[type];
                        const tobj = cx.getComponent('TObject') as any;
                        tobj?.SetSprite(x, y, type, xx, this);

                        // 閻犱緤绱曢悾濠氭儎椤旂晫鍨煎ù锝呯Ф閻?
                        const targetPos = this.tref.add(new Vec2(x * this.gridsize, y * this.gridsize));

                        // 闁告帗绋戠紓鎾寸▔婵犲倸纾抽柛鏂诲妿閺侀箖鎯冮崙鐪梠mise
                        const animationPromise = new Promise<void>((animationResolve) => {
                            tween(cx)
                                .to(0.5, { position: new Vec3(targetPos.x, targetPos.y) }, { easing: 'bounceOut' })
                                .call(() => animationResolve())
                                .start();
                        });

                        riseAnimations.push(animationPromise);
                    }
                }
            }

            // 缂佹稑顦欢鐔煎箥閳ь剟寮垫径澶岀憪闁告娲ゆ慨鈺呮偨鐠囪尙鏆氶柟?
            Promise.all(riseAnimations).then(() => {
                console.log('All new cards rise animation completed');
                resolve(); // 閻熸瑱绲鹃悗绲噐omise闁挎稑鐭侀妴鍐矆閾忚鏅搁柟瀛樺姈閺屽﹪宕￠敍鍕杺閻庣懓鏈崹?
            });
        });
    }

    /**
     * 閻忓繐妫楀畷閬嶆偋鐏炶偐鐭ら柛妞诲墲铦庣紒澶庮嚙濞叉牜绱旈幋鐐靛闁挎稑鐗忛弫銈嗙鎼粹€崇€婚悘鐐插€歌ぐ鏃堝礉閻樿‖浣割嚕韫囥儳绀?
     * @param cardNode 閻熸洑鑳朵簺闁搞儳鍋熺紞澶愬冀閼测晜鐣遍柛妤嬬磿婢ф繈鎳為崒婊冧化
     */
    public moveCardToGrid(cardNode: Node): void {
        if (!cardNode || !cardNode.isValid) {
            console.warn('Invalid card node, cannot move back to grid');
            return;
        }

        try {
            // 闁兼儳鍢茶ぐ鍥础閿涘嫬顤傞柣銊ュ毑Object缂備礁瀚▎?
            const tobj = cardNode.getComponent('TObject') as any;
            if (!tobj) {
                console.warn('Card has no TObject component, cannot move back to grid');
                return;
            }

            // 闁兼儳鍢茶ぐ鍥础閿涘嫬顤傜紒顐ヮ嚙閻?
            const cardType = tobj.type;

            // 闁哄被鍎叉竟妯肩磾閹寸偟澹愬☉鎿冨幘濞堟垹绮氭潪鎵Т缂?
            const emptyPosition = this.findEmptyGridPosition();
            if (!emptyPosition) {
                console.warn('No empty grid position, cannot move card back');
                return;
            }

            // 闁哄洤鐡ㄩ弻濠囧捶閺夋寧绂堥柡浣哄瀹?
            const mapX = emptyPosition.x + 1;
            const mapY = emptyPosition.y + 1;

            // 濞ｅ浂鍠栭ˇ鏌ユ晬濮橆剦妲遍柣鐐叉閸ㄥ海浠﹂崒姘秾闁告梻濮佃啯鐎殿喖绻嬬粭鍛存儍閸曨剚娈剁紓浣稿鐞氼偊宕?
            if (this.isLayerSplitMode) {
                // 闁革负鍔岄崹搴ｄ沪閸屾丹浣割嚕韫囧海鐟撻柨娑樿嫰閻ㄣ垽宕￠敍鍕杺婵烇綀顕ф慨鐐哄礆閹峰矈鍤夊ù锝呯Ф閻ゅ棝鎯冮崟顖樷偓濠勪沪?
                const cell = gridcreator.map[mapX][mapY] as number[];
                cell.push(cardType);
            } else {
                // 闁革负鍔嶅▍姗€鏌呭顒戒礁顕ｈ箛搴ｇ憮闁挎稑鐬煎ú鍧楀箳閵夘煈鍟庣紓鍐惧枛濠€鎾炊閻愵剚娈堕柟?
                gridcreator.map[mapX][mapY] = cardType;
            }

            // 闁哄洤鐡ㄩ弻濠囧础閿涘嫬顤傞柣銊ュ缂嶅懐绱旈鑲╂剑闁?
            tobj.x = emptyPosition.x;
            tobj.y = emptyPosition.y;
            tobj.node.name = `${tobj.x},${tobj.y}`;

            // 閻犱緤绱曢悾濠氭儎椤旂晫鍨煎ù锝呯Ф閻?
            const targetPos2D = this.tref.add(new Vec2(emptyPosition.x * this.gridsize, emptyPosition.y * this.gridsize));
            const targetPos = new Vec3(targetPos2D.x, targetPos2D.y, 0);

            // 閻犱礁澧介悿鍡涘础閿涘嫬顤傞悘蹇撴惈椤?
            this.applyCardGridLayout(cardNode);

            // 濞达綀娉曢弫銈夊礉閵娧勬毎閻忓繐妫楀畷閬嶆偋瀹€鈧簺闁搞儳鍋熺紞澶愬冀?
            tween(cardNode)
                .to(0.3, { position: targetPos, scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                .call(() => {
                    console.log(`闁告绱曟晶婵嗩啅閸欏鐏囬柛鏃傚枔浜涢柛銉у仧缂嶅寮界涵椋庣濞达絽绉堕悿? (${emptyPosition.x}, ${emptyPosition.y})`);

                    // 闂佹彃绉甸弻濠囧触椤栨粍鏆忛柛妤嬬磿婢ф繈鎯冮崟顓炰化闁告垼顕ф慨娑㈡嚄閺傘倗绀夌痪顓у枙缁绘岸宕ｉ娆庣鞍闁告劕绉甸濂告焻婢跺鍘鐐插浜涢柛鏂诲妼閸╁矂宕￠埄鍐?
                    const button = cardNode.getComponent(Button);
                    if (button) {
                        button.enabled = true;
                        console.log('Card button re-enabled');
                    }

                    // 缁绢収鍠曠换姘跺础閿涘嫬顤傚璺哄缁剟宕ｉ婊冧化闁告垼宕垫慨鎼佸箑?
                    cardNode.active = true;
                })
                .start();

        } catch (error) {
            console.error('閻忓繐妫楀畷閬嶆偋瀹€鈧簺闁搞儳鍋熺紞澶愬冀閸忓吋顦ч柛鎴炴そ閺?', error);
        }
    }

    /**
     * 闁哄被鍎叉竟妯肩磾閹寸偟澹愬☉鎿冨幘濞堟垹绮氭潪鎵Т缂?
     */
    private findEmptyGridPosition(): Vec2 | null {
        // 闁哄秷顫夊畵浣姐亹閹惧啿顤呮俊顖椻偓宕囩缁绢収鍠栭悾鍓х磾閹寸偟澹愰悘蹇撴惈椤?
        const width = this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode ? this.infiniteWid : this.wid;
        const height = this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode ? this.infiniteHei : this.hei;

        // 闁哄被鍎叉竟妯肩矚鏉炴壆绉寸紓?
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const mapX = x + 1;
                const mapY = y + 1;

                // 婵☆偀鍋撻柡灞诲劥椤曟碍鎷呭鍥╂瀭闁哄嫷鍨伴幆浣圭▔閾忓厜鏁?
                const cell = gridcreator.map[mapX][mapY];
                let isEmpty = false;

                if (this.isLayerSplitMode) {
                    // 闁革负鍔岄崹搴ｄ沪閸屾丹浣割嚕韫囧海鐟撻柨娑樻湰椤ュ懘寮婚妷锔芥缂備礁瀚Σ鎼佸触閿旇儻绀嬬紒?
                    isEmpty = Array.isArray(cell) && cell.length === 0;
                } else {
                    // 闁革负鍔嶅▍姗€鏌呭顒戒礁顕ｈ箛搴ｇ憮闁挎稑鏈ˉ鍛村蓟閵夛附笑闁告熬缂氱拹?
                    isEmpty = typeof cell === 'number' && cell === 0;
                }

                if (isEmpty) {
                    return new Vec2(x, y);
                }
            }
        }

        // 濠碘€冲€归悘澶娾柦閳╁啯绠掗柟鍨劤閸╁瞼绮氭潪鎵Т缂傚喚鍣槐婵囨交閺傛寧绀€null
        return null;
    }

    /**
     * 婵炴挸鎲￠崹娆撴嚄濠婂啫鐒洪柡鍐硾瑜板倿寮ㄩ幆褍褰犻柛妞烩偓鎰佹闁?
     * @param level 闁稿繐鍟垮畷閬嶅极鐢喚绀勫ù鐘茬┑ame_win濞存粌顑勫▎銏″閻樼儵鍋撻幒鐐电
     */
    private distributeLevelRewards(level: any): void {
        try {
            // 闁兼儳鍢茶ぐ鍥亹閹惧啿顤呴柛蹇撳暱瀹曢亶寮?
            const currentLevel = typeof level === 'number' ? level : LevelMgr.level;

            // 濞戞挸绉撮崯鈧柛娆愬灦閺備線宕楅崘鎻掑耿濠靛倹鐗曟慨鎶芥晬瀹€鍐ｅ亾鐏炵偓笑濠⒀呭仜婵偟绮旈姘€?
            // 婵絽绻嬮柌婊堝礂閸愭彃骞㈤柤铏矊閸╁嫭鏅堕悙鎻掝潱10闁告帒妫楅悢鈧痪顓涘亾缂佸鍨伴崹?
            const baseScore = 3;
            // 闂傚懎绻掑鍐礂閸愭彃骞㈠褏鍋涙慨鐐烘晬鐏炵瓔娈柛鏃囦含琚ч柛鎺戞缁″啯鏅堕悙鎻掝潱
            const levelBonus = Math.floor(currentLevel / 15); // 婵?0闁稿繑濞婇·鍌涘緞閺嵮屾澔闁?闁?
            const totalScore = baseScore + levelBonus;

            // 濠⒀呭仜婵偟绮旈姘€?
            Main.DispEvent('event_add_jifen', totalScore);

            console.log(`闁稿繐鍟垮畷?${currentLevel + 1} 闁艰櫕绮岄崺鍕晬瀹€鍐ㄧ鐎电増顨堣ⅶ闁? ${totalScore}`);

        } catch (error) {
            console.error('闁告瑦鍨堕弬渚€宕楅崘鎻掑耿濠靛倹鐗曟慨铏緞鏉堫偉袝:', error);
        }
    }

    /**
     * 闁哄秷顫夊畵渚€宕楅崘鎻掑耿闁兼儳鍢茶ぐ鍥ㄧ附閺嵮冃￠梺顒佹尭閸欒法鐚剧拠鑼偓鐑芥晬閸粎鐟rm_guanka.ts濞戞搩鍘惧▓鎴︽焻閺勫繒甯嗗ǎ鍥ㄧ箖鐎垫梹绋夐埀顒勬嚊鏉堝墽绀?
     * @param level 闁稿繐鍟垮畷閬嶅极?
     * @returns 濠靛倹鐗曟慨鎶芥焼閹惧啿寰旂紒顐ヮ嚙閻庣兘寮幍顔剧煁
     */
    private getLevelRewards(level: number): string[] {
        // 闁糕晞娅ｉ、鍛附閺嵮冃￠柨娑欑煯缁椾焦绋夐鍫滃闁?
        let rewards = ['remind', 'brush', 'time'];

        // 闂傚懎绻掑鍐礂閸愭彃骞㈠褏鍋涙慨鐐烘晬鐏炵瓔娈柛鏃堜憾娴滈箖宕楅柨瀣闂佹彃绻嬬弧鍐╂櫠閻愭彃顫ｉ柨娑樺缁叉儳袙韫囨洦娼氶梺顒佹尭閸欏潡寮导鏉戞濞戞挸绉风粔瀛樻交?濞?
        if (level > 10) {
            // 婵☆偀鍋撻柡灞诲劚缂嶅宕滃畡鐮甿ind闁轰椒鍗抽崳娲晬鐏炶偐鐟濋悺鎺戞嚀缁?濞?
            const currentRemind = tools.num_Remind;
            if (currentRemind < 5) {
                rewards.push('brush'); // 缂?1闁稿繐鍟跨槐鎴炴叏鐎ｎ亶妯嬬紓浣圭懁缁斿瓨绋夐鍕厱閻?
            }
        }
        if (level > 20) {
            // 婵☆偀鍋撻柡灞诲劚缂嶅宕滃畡绀絤e闁轰椒鍗抽崳娲晬鐏炶偐鐟濋悺鎺戞嚀缁?濞?
            const currentTime = tools.num_time;
            if (currentTime < 5) {
                rewards.push('time'); // 缂?1闁稿繐鍟跨槐鎴炴叏鐎ｎ亶妯嬬紓浣圭懁缁斿瓨绋夐鍛槯闂傚倹鎸虫禍楣冨礂?
            }
        }
        if (level > 30) {
            // 婵☆偀鍋撻柡灞诲劚缂嶅宕滃畡鐮甿ind闁轰椒鍗抽崳娲晬鐏炶偐鐟濋悺鎺戞嚀缁?濞?
            const currentRemind = tools.num_Remind;
            if (currentRemind < 5) {
                rewards.push('remind'); // 缂?1闁稿繐鍟跨槐鎴炴叏鐎ｎ亶妯嬬紓浣圭懁缁斿瓨绋夐鍛倒缂佲偓濞差亙澹曢柛?
            }
        }
        if (level > 40) {
            // 婵☆偀鍋撻柡灞诲劚缂嶅宕滃畡娉乽sh闁轰椒鍗抽崳娲晬鐏炶偐鐟濋悺鎺戞嚀缁?濞?
            const currentBrush = tools.num_brush;
            if (currentBrush < 5) {
                rewards.push('brush'); // 缂?1闁稿繐鍟跨槐鎴炴叏鐎ｎ亜鏅欏鑸垫皑缁増绋夐埀顒佺▔椤忓嫬鐓曢悗?
            }
        }

        // 缁绢収鍠曠换姘附閺嵮冃￠梺顒佹尭閸欏潡骞€缂佹ɑ娈跺☉鎾崇Х缁夊瓨娼?濞?
        if (rewards.length > 5) {
            rewards = rewards.slice(0, 5);
        }

        return rewards;
    }

    /**
     * 缂備胶鍠曢鍛婄附閺嵮冃￠柡浣峰嵆閸ｆ椽鏁嶉崼婊呯憿frm_guanka.ts濞戞搩鍘惧▓鎴︽焻閺勫繒甯嗗ǎ鍥ㄧ箖鐎垫梹绋夐埀顒勬嚊鏉堝墽绀?
     * @param rewards 濠靛倹鐗曟慨鎶藉极閹殿喚鐭?
     * @returns 濠靛倹鐗曟慨鎶藉极娴兼潙娅ょ紓浣哄枙椤撳摜鈧數顢婇挅?
     */
    private countRewards(rewards: string[]): { [key: string]: number } {
        const counts: { [key: string]: number } = {};

        rewards.forEach(rewardType => {
            counts[rewardType] = (counts[rewardType] || 0) + 1;
        });

        return counts;
    }

    /**
     * 婵烇綀顕ф慨鐐烘焼閹惧啿寰旈柛鎺撳鐢櫣鈧懓鐖兼禍楣冨礂闁垮鍩?
     * @param rewardType 濠靛倹鐗曟慨宕囩尵鐠囪尙鈧?
     * @param count 闁轰椒鍗抽崳?
     */
    private addItemToPlayer(rewardType: string, count: number): void {
        // 闂侇偅淇虹换鍐╃鐎ｂ晜顐界紒顖濆吹缁椽鏌呭杈╁弨濞戞捁宕甸弲顐︽閵忊€虫綉闁告梻濞€娴滈箖宕?
        Main.DispEvent('event_add_item', { type: rewardType, count: count });

        // 濞戞梻鍠庤ぐ鍙夌閵壯勭函闁规亽鍎插ú鍧楀棘閹殿喖璐熼悗纭呭煐閺嗙喖骞?
        // 閺夆晜鐟╅崳鐑藉磻閸ヮ亶鍟庨柡鍫濐槷缁斿瓨绋夐鍡楄礋閻庣鍩栭弳鐔煎箲椤旂虎鍚€闁荤偛妫楀▍鎺楀级閵夈儺妲遍柣鐐叉娴滈箖宕楅柨瀣綉闁?
        console.log(`婵烇綀顕ф慨鐐烘焼閹惧啿寰? ${rewardType} 閼?${count}`);
        if(rewardType === 'remind')
            tools.num_Remind += count;

        if(rewardType === 'brush')
            tools.num_brush += count;

        if(rewardType === 'time')
            tools.num_time += count;
    }
}
