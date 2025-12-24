import { _decorator, Component, Node, tween, UITransform, Vec2, Vec3 } from 'cc';
import { frmbase } from './frmbase';
import { Main } from '../main';
import { TObject } from '../Card/TObject';
import { PlayerPrefb } from '../PlayerPrefb';
const { ccclass, property } = _decorator;

@ccclass('frm_guide')
export class frm_guide extends frmbase {
    @property(Node)
    guide_node: Node = null!;
    @property(Node)
    guide_arrow: Node = null!;
    @property(Node)
    bg: Node = null!;
    @property(Node)
    mask: Node = null!;
    static isShow: any;
    static currCard: TObject | null = null;
    start() {
        Main.RegistEvent('GUIDE_SHOW', this.show_guide.bind(this));
    }
    protected OnShow(): void {
        frm_guide.isShow = true;
    }
    protected OnHide(): void {
        frm_guide.isShow = false;
    }
    
    show_guide(data: any) { 
        this.show(); 
        this.scheduleOnce(() => {
            this.bg.setParent(this.gb);
            // bg填充整个面板
            var uit = this.gb.getComponent(UITransform)!;
            this.bg.getComponent(UITransform)!.width = uit.width;
            this.bg.getComponent(UITransform)!.height = uit.height; 
            this.bg.setParent(this.mask);  
        }, 0);
        return null;
    }
    card: TObject[] = [];
    static state: number = 0;
    update(deltaTime: number) {
        if(!this.isShow){
            return ;
        }
        if(frm_guide.state==0)
        {
            // 指引开始
            // 先找一个卡牌
            this.card = Main.DispEvent('GET_CARD_GUIDE') as TObject[];
            if(this.card!=null && this.card.length>0){
                frm_guide.state = 1;
                //找到成对卡牌，开始
            }
        }
        else if(frm_guide.state==1){
            frm_guide.currCard = this.card[0];
            this.setGuidePos(this.card[0].node);
        }
        else if(frm_guide.state==2){
            frm_guide.currCard = this.card[1];
            this.setGuidePos(this.card[1].node); 
        }
        else if(frm_guide.state==3){
            if(PlayerPrefb.getInt('GuideStep',1)===1){
                frm_guide.state = 0;
                PlayerPrefb.setInt('GuideStep',2);
            }
            else if(PlayerPrefb.getInt('GuideStep',1)===2){
                frm_guide.state = 0;
                PlayerPrefb.setInt('GuideStep',3);
            }
            else if(PlayerPrefb.getInt('GuideStep',1)===3){
                frm_guide.state = 0;
                PlayerPrefb.setInt('GuideStep',4);
                this.hide();
            }
        }
    }
    async setGuidePos(node: Node) { 
        // // 设置mask的位置
        this.mask.setWorldPosition(node.worldPosition);
        this.mask.getComponent(UITransform).width = node.getComponent(UITransform).width;
        this.mask.getComponent(UITransform).height = node.getComponent(UITransform).height; 
        this.bg.setPosition(new Vec3(-this.mask.position.x, -this.mask.position.y, 0.0));     
 
             await Promise.all([
            new Promise<void>((resolve) => {
                tween(this.guide_arrow)
                    .to(0.1, { position: new Vec3(this.mask.position.x, this.mask.position.y) }, { easing: 'quadInOut' })
                    .call(() => resolve())
                    .start();
            }),
        ]);
        
    }
}


