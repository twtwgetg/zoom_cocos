import { _decorator, Button, Color, Component, instantiate, Label, Node, Prefab, ProgressBar, Sprite, tween, Vec3 } from 'cc';
import { gridcreator } from './gridcreator';
import { Main } from './main';
import { frmbase } from './frmbase';
import { LevelMgr, GameMode } from './levelmgr';
import { tools } from './tools';
import { enum_paly_type, item_tools, ItemType } from './item_tools'; 
import { WeatherShaderManager } from './WeatherShaderManager';
import { ToutiaoEventMgr } from './ToutiaoEventMgr';
import { PlayerPrefb } from './PlayerPrefb';
import { TObject } from './TObject';
import { titem } from './item/titem';
import { JifenRewardManager } from './JifenRewardManager';
import { GameType } from './enums/GameType';
const { ccclass, property } = _decorator;

@ccclass('frm_main')
export class frm_main extends frmbase {
    @property(gridcreator)
    public gridcreator: gridcreator = null!;
    @property(Label)
    lbl_jifen: Label = null!;
    @property(Button)
    btn_pause: Button = null!;
    time_all: number = 0;
    time_now: number = 0;

    @property(Prefab)
    item_prefab: Prefab = null!;
    @property(Node)
    node_list: Node = null!;
    // 添加积分变量
    private jifen: number = 0; // 总积分
    private currentJifen: number = 0; // 本局积分
    // 添加初始时间道具数量变量
    private initialTimeCount: number = 0;
    @property(ProgressBar)
    progress_time: ProgressBar = null!;
    public static isPause: boolean = true;
    @property(Label)
    lbl_guanka: Label = null!;

    @property(Node)
    node_c: Node = null!;
    // 添加模式标签
    @property(Label)
    lbl_mode: Label = null!;

    /**
     * -1 表示无限模式
     * -2 表示三消模式
     * -3 表示层级叠加模式
     */
    level_playing: number = 0;

    // @property(Node)
    // ice_node: Node = null!;
    @property(Sprite)
    spr_bar: Sprite = null!;
     
    @property(Sprite)   
    spr_bg: Sprite = null!;
    // 添加天气管理器引用
    @property(WeatherShaderManager)
    weatherManager: WeatherShaderManager = null!;

    // 添加心跳音效相关变量
    private heartbeatPlaying: boolean = false;
    private lastHeartbeatTime: number = 0;
    private heartbeatInterval: number = 1.0; // 心跳间隔时间（秒）
    // 添加心跳暂停标志
    private heartbeatPaused: boolean = false;

    // 添加无限模式相关变量
    private isInfinityMode: boolean = false; // 是否为无限模式
    private infiniteModeGeneratorId: any = null; // 无限模式生成器ID
    private stopInfiniteModeGenerator: boolean = false; // 是否停止无限模式生成器
    static isInfinityMode: any;
    static stopInfiniteModeGenerator: boolean;
    
    /**
     * 添加无限模式生成器
     */
    private startInfiniteModeGenerator() {
        // 停止之前的生成器
        if (this.infiniteModeGeneratorId) {
            clearInterval(this.infiniteModeGeneratorId);
        }
        
        // 重置停止标志
        this.stopInfiniteModeGenerator = false;
        
        // 设置无限模式标志
        this.isInfinityMode = true;
        
        // 每5秒生成一对新卡牌（降低频率以降低难度）
        this.infiniteModeGeneratorId = setInterval(() => {
            // 检查游戏是否暂停、已结束或需要停止生成
            if (frm_main.isPause || !this.isInfinityMode || this.stopInfiniteModeGenerator) {
                return;
            }
            
            // 调用gridcreator生成新卡牌对
            if (this.gridcreator) {
                const isFull = this.gridcreator.generateNewPair();
                // 如果网格已满，游戏结束
                if (isFull) {
                    this.endInfiniteMode();
                }
            }
        }, 5000); // 从1000ms改为5000ms，降低生成频率以降低难度
    }
    
    fruzonBar(f:boolean){
        if(!f){
            this.spr_bar.color=new Color(255,173,0,255);
            //this.ice_node.active=false;
            // 只有在非无限模式下才恢复计时
            if (!this.isInfinityMode) {
                this.jishi=true;
            } else {
                // 在无限模式下，冰封结束后重置停止生成器标志
                this.stopInfiniteModeGenerator = false;
            }
            // 冰封结束，渐变回正常颜色 #585858
            this.animateGridColor(new Color(88, 88, 88, 255), 0.5);
            // 取消天气效果
            this.deactivateWeatherEffect();
            
            // 冰封结束时恢复心跳逻辑
            this.heartbeatPaused = false;
            // 重置心跳播放状态，让游戏循环重新评估是否需要播放心跳音效
            this.heartbeatPlaying = false;
        }
        else{
            this.spr_bar.color=new Color(0,214,255,255);
            //this.ice_node.active=true;
            this.jishi=false;
            // 冰封开始，渐变为冰封颜色 #00689C
            this.animateGridColor(new Color(0, 104, 156, 255), 0.5);
            // 激活天气效果
            this.activateWeatherEffect();
            
            // 冰封开始时暂停心跳逻辑
            this.heartbeatPaused = true;
            // 停止心跳音效
            Main.DispEvent("event_heartbeat_stop");
        }
    }
    /**
     * 添加填充道具功能
     * 连连看模式填充提醒，刷新，和冰封
     */
    fillItems(type:enum_paly_type){
        this.node_list.removeAllChildren();
        if(type==enum_paly_type.LIANLIANKAN){
            // 根据游戏模式调整道具数量
            let brushCount = tools.num_brush;
            let remindCount = tools.num_Remind;
            let timeCount = tools.num_time;
            
            // 在困难模式下减少道具数量
            if (LevelMgr.gameMode === GameMode.HARD) {
                brushCount = Math.max(1, Math.floor(brushCount * 0.7)); // 减少30%的刷新道具
                remindCount = Math.max(1, Math.floor(remindCount * 0.7)); // 减少30%的提醒道具
                timeCount = Math.max(1, Math.floor(timeCount * 0.7)); // 减少30%的时间道具
            }
            
            this.fillItem(ItemType.brush, brushCount);
            this.fillItem(ItemType.remind, remindCount);
            this.fillItem(ItemType.time, timeCount);
        }
        else if(type==enum_paly_type.Mem){
            this.fillItem(ItemType.ShowFront,tools.num_ShowFront);
        }
        else if(type==enum_paly_type.SANXIAO){
            
        }
        else if(type==enum_paly_type.LAYERSPLIT){ 
            this.fillItem(ItemType.layer,tools.num_layer);
        }
        else{
            console.error("未知的游戏模式"+type);
        }
    }
    fillItem(tp:ItemType, num:number){
        
        let item= instantiate(this.item_prefab);
        item.setParent(this.node_list);
        item.getComponent(titem).init({tp:tp},num);
        
        // 确保道具节点以正确的尺寸显示
        item.scale = new Vec3(1, 1, 1);
    
    }
    brushMode(x){

        this.lbl_mode.node.active=this.level_playing>0;

    }
    protected onLoad(): void {
        super.onLoad();
        let that =this;
        Main.RegistEvent("event_play",(x)=>{ 
            this.show();
            this.fillItems(enum_paly_type.LIANLIANKAN);
            // 上报进入关卡事件
            ToutiaoEventMgr.reportLevel(x);
            // 上报挑战事件（主动进入游戏）
            ToutiaoEventMgr.reportCharge();
            
            // 重置TObject中的静态变量
            TObject.resetStaticVariables();
            
            // 确保游戏类型被正确设置为普通模式
            if (this.gridcreator) {
                (this.gridcreator as any).gameType = 'normal';
            }
            
            this.scheduleOnce(() => {
                this.gridcreator.Create(x);
                this.time_all = LevelMgr.getTimeAll(x);
                this.time_now = 0;
                this.jishi=true;
                frm_main.isPause = false;
                // 播放道具按钮入场动画，但不显示三消模式的道具按钮
                if (x !== -2) { // 如果不是三消模式，才播放道具按钮动画
                    this.playToolButtonsEntranceAnimation();
                }
                // 执行你的拦截逻辑
            }, 0);

            this.level_playing = x;
            this.lbl_guanka.string = "第 "+(x+1)+" 关";
            
            // 显示当前游戏模式
            this.updateModeLabel();
            
            // 初始化积分并从本地存储加载
            this.loadJifen();
            this.updateJifenLabel();
            
            // 记录初始时间道具数量
            this.initialTimeCount = tools.num_time;
            
            // 重置时间警告状态
            this.timeWarningShown = false;
            
            // 重置卡牌消失检测
            this.lastCardRemovedTime = 0;
            this._lastCardCount = undefined;
            this.stopRemindButtonFlashing();
 

            // 显示时间进度条（仅在普通连连看模式下显示）
            this.brushMode(x);
            // 重置本局积分
            this.resetCurrentJifen();

            return null;
        });
        Main.RegistEvent("event_play_mem",(x)=>{ 
            this.show();
            this.fillItems(enum_paly_type.Mem);
            TObject.resetStaticVariables();
            // 确保游戏类型被正确设置为记忆模式
            if (this.gridcreator) {
                (this.gridcreator as any).gameType = 'mem';
            }
            
            this.scheduleOnce(() => {
                this.gridcreator.CreateMem(6,8);
            }, 0);

            this.level_playing = -4; // 无限模式使用特殊关卡编号
            this.lbl_guanka.string = "记忆模式";
        });
        // 添加无限模式事件处理
        Main.RegistEvent("event_play_infinite",(x)=>{ 
            this.show();
            this.fillItems(enum_paly_type.LIANLIANKAN);
            // 上报挑战事件（主动进入游戏）
            ToutiaoEventMgr.reportCharge();
            
            // 重置TObject中的静态变量
            TObject.resetStaticVariables();
            
            // 确保游戏类型被正确设置为无限模式
            if (this.gridcreator) {
                (this.gridcreator as any).gameType = 'infinite';
            }
            
            this.scheduleOnce(() => {
                // 创建无限模式关卡（8x10网格）
                this.gridcreator.CreateInfiniteMode(6, 8);
                // 无限模式不计时
                this.time_all = 0;
                this.time_now = 0;
                this.jishi=false; // 无限模式不使用计时器
                frm_main.isPause = false;
                // 播放道具按钮入场动画
                this.playToolButtonsEntranceAnimation();
                // 启动无限模式生成器
                this.startInfiniteModeGenerator();
            }, 0);

            this.level_playing = -1; // 无限模式使用特殊关卡编号
            this.lbl_guanka.string = "无限模式";
            
            // 显示当前游戏模式
            this.updateModeLabel();
            
            // 初始化积分并从本地存储加载
            this.loadJifen();
            this.updateJifenLabel();
            
            // 记录初始时间道具数量
            this.initialTimeCount = tools.num_time;
            
            // 重置时间警告状态
            this.timeWarningShown = false;
            
            // 重置卡牌消失检测
            this.lastCardRemovedTime = 0;
            this._lastCardCount = undefined;
            this.stopRemindButtonFlashing();
 
            // 隐藏时间进度条（无限模式不计时）
            if (this.progress_time && this.progress_time.node) {
                this.progress_time.node.active = false;
            }

            // 重置本局积分
            this.resetCurrentJifen();

            this.brushMode(-1);
            return null;
        });
        //添加分层叠加模式
        Main.RegistEvent("event_play_layersplit",()=>{
            this.show();
            this.fillItems(enum_paly_type.LAYERSPLIT);
            // 重置TObject中的静态变量
            TObject.resetStaticVariables();
            
            // 确保游戏类型被正确设置为分层叠加模式
            if (this.gridcreator) {
                (this.gridcreator as any).gameType = 'layer_split';
            }
            
            this.scheduleOnce(() => {
                // 添加保护性检查，确保gridcreator对象已正确初始化
                if (this.gridcreator) {
                    // 修改为8行5列网格
                    this.gridcreator.CreateLayerSplitMode(5, 8);
                    // 分层叠加模式不计时
                    this.time_all = 0;
                    this.time_now = 0;
                    this.jishi=false; // 分层叠加模式不使用计时器
                    frm_main.isPause = false;
                    // 播放道具按钮入场动画
                    this.playToolButtonsEntranceAnimation();
                } else {
                    console.error("gridcreator对象未正确初始化");
                }
            }, 0);

            this.level_playing = -3; // -3表示分层叠加模式
            this.brushMode(-3);
            this.lbl_guanka.string = "分层叠加模式";
            
            // 显示当前游戏模式
            this.updateModeLabel();
            
            // 初始化积分并从本地存储加载
            this.loadJifen();
            this.updateJifenLabel();
            
            // 记录初始时间道具数量
            this.initialTimeCount = tools.num_time;
            
            // 重置时间警告状态
            this.timeWarningShown = false;
            
            // 重置卡牌消失检测
            this.lastCardRemovedTime = 0;
            this._lastCardCount = undefined;
            this.stopRemindButtonFlashing();
 
            // 重置本局积分
            this.resetCurrentJifen();

            // 隐藏时间进度条（分层叠加模式不计时）
            if (this.progress_time && this.progress_time.node) {
                this.progress_time.node.active = false;
            }

        })
        // 添加三消模式事件处理
        Main.RegistEvent("event_play_sanxiao",()=>{ 
            this.show();
            this.fillItems(enum_paly_type.SANXIAO);
            // 上报挑战事件（主动进入游戏）
            ToutiaoEventMgr.reportCharge();
            
            // 重置TObject中的静态变量
            TObject.resetStaticVariables();
            
            this.scheduleOnce(() => {
                // 创建三消模式关卡（5x8网格）
                this.gridcreator.CreateSanxiaoMode(5, 8);
                // 三消模式不计时
                this.time_all = 0;
                this.time_now = 0;
                this.jishi = false; // 三消模式不使用计时器
                frm_main.isPause = false;
                // 播放道具按钮入场动画
                this.playToolButtonsEntranceAnimation();
            }, 0);

            this.level_playing = -2; // 三消模式使用特殊关卡编号
            this.lbl_guanka.string = "三消模式";
            
            // 显示当前游戏模式
            this.updateModeLabel();
            
            // 初始化积分并从本地存储加载
            this.loadJifen();
            this.updateJifenLabel();
            
            // 记录初始时间道具数量
            this.initialTimeCount = tools.num_time;
            
            // 重置时间警告状态
            this.timeWarningShown = false;
            
            // 重置卡牌消失检测
            this.lastCardRemovedTime = 0;
            this._lastCardCount = undefined;
            this.stopRemindButtonFlashing();
             
            // 隐藏时间进度条（三消模式不计时）
            if (this.progress_time && this.progress_time.node) {
                this.progress_time.node.active = false;
            }

            // 重置本局积分
            this.resetCurrentJifen();
            this.brushMode(-2);
            return null;
        });
        Main.RegistEvent("game_begin",()=>{
            this.hide();
        })
        Main.RegistEvent("event_restart",()=>{ 
            Main.DispEvent("event_play",this.level_playing); 
            return null;
        });
        Main.RegistEvent("event_fruszon",(f)=>{ 
            this.fruzonBar(f);
            return null;
        });
   
        Main.RegistEvent("event_begin",()=>{ 
            // 停止心跳音效
            Main.DispEvent("event_heartbeat_stop");
            // 重置心跳播放状态
            this.heartbeatPlaying = false;
            // 停止提醒道具按钮闪烁
            this.stopRemindButtonFlashing();
 
            this.hide();
            return null;
        });
        // 添加恢复游戏事件处理
        Main.RegistEvent("event_resume_game",()=>{ 
            // 重置心跳播放状态，让游戏循环重新评估是否需要播放心跳音效
            this.heartbeatPlaying = false;
            // 重置卡牌消失检测时间，避免暂停后立即触发闪烁
            this.lastCardRemovedTime = this.time_now;
            return null;
        });
        // 添加测试连连看模式修复的事件
        Main.RegistEvent("event_test_lianliankan",()=>{ 
            console.log("测试连连看模式连接功能");
            // 重置所有状态
            TObject.resetStaticVariables();
            
            // 确保游戏类型被正确设置为普通模式
            if (this.gridcreator) {
                (this.gridcreator as any).gameType = 'normal';
            }
            
            // 重新创建当前关卡
            this.gridcreator.Create(this.level_playing);
            
            return null;
        });
        // 注册积分增加事件处理
        Main.RegistEvent("event_add_jifen",(val)=>{ 
            this.addJifen(val);
            return null;
        });
        // 添加获取本局积分的事件
        Main.RegistEvent("event_get_current_jifen",()=>{ 
            return this.currentJifen;
        });
        // 添加获取剩余时间的事件
        Main.RegistEvent("event_get_remaining_time",()=>{ 
            // 只有在计时模式下才返回剩余时间，其他模式返回0
            if (this.jishi && this.time_all > 0) {
                const remainingTime = this.time_all - this.time_now;
                return Math.max(0, remainingTime); // 确保不返回负数
            }
            return 0; // 非计时模式返回0
        });
        // 修复：不应该在event_play事件监听器中再次触发event_play事件
        // 这里应该是处理其他需要在游戏开始时重置的状态
        Main.RegistEvent("event_play_reset",()=>{ 
            // 重置无限模式生成器停止标志
            this.stopInfiniteModeGenerator = false;
            
            return null;
        });
        // 添加获取下一个积分奖励信息的事件处理程序
        Main.RegistEvent("event_get_next_jifen_reward_info", (data) => {
            const { currentJifen } = data;
            return JifenRewardManager.getNextJifenRewardInfo(currentJifen);
        });

        this.btn_pause.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_pause",this.level_playing);
        }, this);


        Main.RegistEvent("time_used",()=>{
            return this.time_now;
        });
        this.fruzonBar(false);
 
    }
 
    
    /**
     * 更新模式标签显示
     */
    updateModeLabel() {
        if (this.lbl_mode) {
            if (LevelMgr.gameMode === GameMode.EASY) {
                this.lbl_mode.string = "简单模式";
                this.lbl_mode.color = new Color(0, 255, 0); // 绿色
            } else {
                this.lbl_mode.string = "困难模式";
                this.lbl_mode.color = new Color(255, 0, 0); // 红色
            }
        }
    }
    
    start() {

    }
    jishi:boolean=false;
    // 添加时间道具提醒相关变量
    private timeWarningShown: boolean = false; // 是否已显示时间警告
    private lastTimeWarningTime: number = 0; // 上次显示时间警告的时间
    
    // 添加卡牌消失检测相关变量
    private lastCardRemovedTime: number = 0; // 上次卡牌消失的时间
    private isRemindButtonFlashing: boolean = false; // 提醒道具按钮是否正在闪烁
    private remindButtonFlashTween: any = null; // 提醒道具按钮闪烁动画的引用
    private _lastCardCount: number | undefined = undefined; // 上一次的卡牌数量
    
    update(deltaTime: number) {

        if(frm_main.isPause) 
            return;

        if(!this.jishi) 
            return;

        this.time_now += deltaTime; 
        this.progress_time.progress =1.0- this.time_now / this.time_all; 
    
        // 检测卡牌消失时间
        this.checkCardRemovalTime();
    
        // 检查是否需要开始倒计时心跳音效（剩余时间小于10秒）
        const remainingTime = this.time_all - this.time_now;
    
        // 检查是否需要提醒玩家（剩余时间小于15秒）
        if (remainingTime <= 15 && !this.timeWarningShown) {
            // 无论是否有时间道具都显示提醒
            if (tools.num_time > 0) {
                // 有时间道具的情况
                Main.DispEvent("event_msg_top", {msg: "时间即将耗尽！点击时间道具增加时间"});
            } else {
                // 没有时间道具的情况
                Main.DispEvent("event_msg_top", {msg: "时间即将耗尽！"});
            }
            // 播放时间道具按钮动画以吸引注意
            this.playTimeButtonAnimation();
            this.timeWarningShown = true;
            this.lastTimeWarningTime = this.time_now;
        }
    
        // 每隔5秒重复提醒一次
        if (this.timeWarningShown && (this.time_now - this.lastTimeWarningTime) >= 5) {
            const currentRemainingTime = this.time_all - this.time_now;
            if (currentRemainingTime > 0 && currentRemainingTime <= 15) {
                if (tools.num_time > 0) {
                    // 有时间道具的情况
                    Main.DispEvent("event_msg_top", {msg: "时间即将耗尽！点击时间道具增加时间"});
                } else {
                    // 没有时间道具的情况
                    Main.DispEvent("event_msg_top", {msg: "时间即将耗尽！"});
                }
                this.playTimeButtonAnimation();
                this.lastTimeWarningTime = this.time_now;
            }
        }
    
        // 如果时间已经充足，重置提醒状态
        if (remainingTime > 20) {
            this.timeWarningShown = false;
        }
    
        // 只有在心跳未暂停时才处理心跳逻辑
        if (!this.heartbeatPaused && remainingTime <= 10 && !this.heartbeatPlaying) {
            // 开始播放心跳音效
            Main.DispEvent("event_heartbeat_start");
            this.heartbeatPlaying = true;
            this.lastHeartbeatTime = 0; // 重置心跳计时器
        }
    
        // 如果心跳音效正在播放且未暂停，控制心跳节奏
        if (!this.heartbeatPaused && this.heartbeatPlaying) {
            // 更新心跳计时器
            this.lastHeartbeatTime += deltaTime;
            
            // 根据剩余时间调整心跳间隔
            if (remainingTime > 3) {
                // 剩余时间大于3秒时，心跳间隔为1秒
                this.heartbeatInterval = 1.0;
            } else {
                // 剩余时间小于等于3秒时，心跳间隔为0.7秒
                this.heartbeatInterval = 0.7;
            }
            
            // 如果到了心跳时间，触发心跳音效
            if (this.lastHeartbeatTime >= this.heartbeatInterval) {
                Main.DispEvent("event_heartbeat_beat");
                this.lastHeartbeatTime = 0; // 重置心跳计时器
            }
        }
    
        if(this.time_now >= this.time_all) {
            // 只有在计时模式下才触发游戏失败，无限模式不计时
            // 无限模式通过isInfinityMode标志判断，普通模式通过jishi标志和time_all>0判断
            if (this.jishi && this.time_all > 0 && !this.isInfinityMode) {
                this.jishi=false;
                // 停止心跳音效
                Main.DispEvent("event_heartbeat_stop");
                this.heartbeatPlaying = false;
                Main.DispEvent("game_lose",this.level_playing);
            }
        }
    }
    
    /**
     * 检测卡牌消失时间，如果超过5秒没有卡牌消失，就让提醒道具闪烁
     */
    private checkCardRemovalTime() {
        // 只在游戏进行中检测
        if (frm_main.isPause || !this.jishi) {
            return;
        }
        
        // 获取当前卡牌数量
        const currentCardCount = this.gridcreator.node.children.length;
        
        // 如果卡牌数量发生变化（减少），更新上次卡牌消失时间
        if (!this.hasOwnProperty('_lastCardCount') || this._lastCardCount !== currentCardCount) {
            this.lastCardRemovedTime = this.time_now;
            this._lastCardCount = currentCardCount;
            
            // 停止提醒道具按钮的闪烁动画（如果正在播放）
            if (this.isRemindButtonFlashing) {
                this.stopRemindButtonFlashing();
            }
        }
        
        // 检查是否超过5秒没有卡牌消失
        const timeSinceLastRemoval = this.time_now - this.lastCardRemovedTime;
        if (timeSinceLastRemoval >= 5 && currentCardCount > 0) {
            // 检查玩家是否还有提醒道具
        
            // 开始播放提醒道具按钮的闪烁动画
            this.playRemindButtonFlashingAnimation(); 
        }
    }

    /**
     * 播放提醒道具按钮闪烁动画
     */
    private playRemindButtonFlashingAnimation() {
        // 如果已经在闪烁，则不重复播放
        if (this.isRemindButtonFlashing) {
            return;
        }
        let remind = this.getItemByType(ItemType.remind);
        // 检查提醒道具按钮是否存在
        if (!remind) {
            console.warn('提醒道具按钮未找到');
            return;
        }
        
        // 设置闪烁状态
        this.isRemindButtonFlashing = true;
        
        // 保存原始缩放
        const originalScale = remind.node.scale.clone();
        
        // 停止之前的动画
        if (this.remindButtonFlashTween) {
            this.remindButtonFlashTween.stop();
        }
        
        // 创建闪烁动画（通过改变缩放实现）
        this.remindButtonFlashTween = tween(remind.node)
            .repeatForever(
                tween()
                    .to(0.3, { scale: new Vec3(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z) })
                    .to(0.3, { scale: originalScale })
                    .to(0.3, { scale: new Vec3(originalScale.x * 1.1, originalScale.y * 1.1, originalScale.z) })
                    .to(0.3, { scale: originalScale })
            )
            .start();
}

    /**
     * 停止提醒道具按钮闪烁动画
     */
    private stopRemindButtonFlashing() {
        // 重置闪烁状态
        this.isRemindButtonFlashing = false;
        
        // 停止动画
        if (this.remindButtonFlashTween) {
            this.remindButtonFlashTween.stop();
            this.remindButtonFlashTween = null;
        }
        let remind = this.getItemByType(ItemType.remind);
        // 检查提醒道具按钮是否存在
        if (!remind) {
            console.warn('提醒道具按钮未找到');
            return;
        }
        // 停止所有动画
        tween(remind.node).stop();
        
        // 恢复原始缩放
        remind.node.scale = new Vec3(1, 1, 1);
    }

    /**
     * 获取初始时间道具数量（用于判断是否使用了时间道具）
     */
    private getInitialTimeCount(): number {
        return this.initialTimeCount;
    }
    getItemByType(type:ItemType): titem {
     
        let ret :titem = null   ;
        let items = this.node_list.getComponentsInChildren(titem);
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (item.itemtype == type)
                ret = item;
        }
        return ret;
    }
    /**
     * 播放时间道具按钮动画以吸引玩家注意
     */
    private playTimeButtonAnimation() 
    {
        let item = this.getItemByType(ItemType.time);
        if (!item) {
            return ;
        }
        
        
        // // 停止之前的动画
        tween(item.node).stop();
        
        // 保存原始状态
        const originalScale = item.node.scale.clone();
        const originalPosition = item.node.position.clone();
        
        // 创建吸引注意的动画序列
        tween(item.node)
            .repeat(3, // 重复3次
                tween()
                    .to(0.2, { scale: new Vec3(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z) })
                    .to(0.2, { scale: originalScale })
                    .to(0.1, { position: new Vec3(originalPosition.x + 5, originalPosition.y, originalPosition.z) })
                    .to(0.1, { position: new Vec3(originalPosition.x - 5, originalPosition.y, originalPosition.z) })
                    .to(0.1, { position: originalPosition })
            )
            .start();
    }
    
    /**
     * 为grid容器添加颜色渐变效果
     * @param targetColor 目标颜色
     * @param duration 渐变时间（秒）
     */
    private animateGridColor(targetColor: Color, duration: number) {
        if (!this.gridcreator || !this.gridcreator.node) {
            console.warn('无法找到grid节点');
            return;
        }

        const gridNode = this.gridcreator.node;
        const spriteComp = gridNode.getComponent(Sprite);
        
        if (!spriteComp) {
            console.warn('无法找到grid的Sprite组件');
            return;
        }

        const currentColor = spriteComp.color.clone();
        
        console.log('开始颜色渐变:', {
            from: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`,
            to: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`,
            duration: duration
        });

        // 停止之前的动画
        tween(spriteComp).stop();

        // 创建渐变动画，直接操作Sprite组件的color属性
        tween(spriteComp)
            .to(duration, { 
                color: targetColor 
            }, {
                easing: 'smooth' // 使用平滑缓动
            })
            .call(() => {
                console.log('颜色渐变完成:', `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`);
            })
            .start();
    }

    /**
     * 播放道具按钮入场动画
     * 三个按钮从底部向上滑动并带有缩放效果
     */
    private playToolButtonsEntranceAnimation() {
        // 如果是三消模式，不显示道具按钮
        // if (this.level_playing === -2) {
        //     return;
        // }
        
        // // 先确保所有道具按钮都显示
        // this.showToolButtons();
        
        // const toolButtons = [this.btn_remind, this.btn_time, this.btn_refrush];
        
        // toolButtons.forEach((button, index) => {
        //     if (!button || !button.node) {
        //         console.warn(`道具按钮 ${index} 未找到`);
        //         return;
        //     }

        //     const originalPosition = button.node.position.clone();
        //     const originalScale = button.node.scale.clone();
            
        //     // 设置初始状态：在原位置下方100像素，缩放为0
        //     button.node.setPosition(originalPosition.x, originalPosition.y - 100, originalPosition.z);
        //     button.node.setScale(0, 0, 1);
            
        //     // 延迟播放，每个按钮间隔0.1秒
        //     const delay = index * 0.1;
            
        //     // 创建入场动画
        //     tween(button.node)
        //         .delay(delay)
        //         .parallel(
        //             // 位置动画：从下方滑动到原位置
        //             tween().to(0.6, { position: originalPosition }, {
        //                 easing: 'backOut' // 使用回弹效果
        //             }),
        //             // 缩放动画：从0缩放到原始大小
        //             tween().to(0.6, { scale: originalScale }, {
        //                 easing: 'backOut'
        //             })
        //         )
        //         .call(() => {
        //             console.log(`道具按钮 ${index} 入场动画完成`);
        //             // 添加一个小的弹跳效果来吸引注意
        //             this.addAttentionBounce(button.node);
        //         })
        //         .start();
        // });
    }



    /**
     * 显示所有道具按钮
     */
    private showToolButtons() {
        // 显示刷新道具按钮
        // if (this.btn_refrush && this.btn_refrush.node) {
        //     this.btn_refrush.node.active = true;
        // }
        
        // // 显示提醒道具按钮
        // if (this.btn_remind && this.btn_remind.node) {
        //     this.btn_remind.node.active = true;
        // }
        
        // // 显示时间道具按钮
        // if (this.btn_time && this.btn_time.node) {
        //     this.btn_time.node.active = true;
        // }
    }
    


    /**
     * 为按钮添加注意力弹跳效果
     * @param buttonNode 按钮节点
     */
    private addAttentionBounce(buttonNode: Node) {
        const originalScale = buttonNode.scale.clone();
        
        tween(buttonNode)
            .delay(0.5) // 入场动画完成后稍作停顿
            .to(0.2, { scale: new Vec3(originalScale.x * 1.1, originalScale.y * 1.1, originalScale.z) })
            .to(0.2, { scale: originalScale })
            .to(0.15, { scale: new Vec3(originalScale.x * 1.05, originalScale.y * 1.05, originalScale.z) })
            .to(0.15, { scale: originalScale })
            .start();
    }
    
    /**
     * 激活天气效果（阴天效果）
     */
    private activateWeatherEffect() {
        console.log('激活天气效果');
        // 使用新的天气管理器激活天气效果
        if (this.weatherManager) {
            this.weatherManager.activateWeatherEffect();
        } else {
            // 如果没有天气管理器，使用旧的方法
            this.setWeatherColor(new Color(140, 140, 160, 255), 1.0);
        }
    }
    
    /**
     * 取消天气效果
     */
    private deactivateWeatherEffect() {
        console.log('取消天气效果');
        // 使用新的天气管理器取消天气效果
        if (this.weatherManager) {
            this.weatherManager.deactivateWeatherEffect();
        } else {
            // 如果没有天气管理器，使用旧的方法
            this.setWeatherColor(new Color(255, 255, 255, 255), 1.0);
        }
    }
    
    /**
     * 设置天气颜色（带渐变）
     */
    private setWeatherColor(targetColor: Color, duration: number) {
        // 确保spr_bg存在
        if (!this.spr_bg) {
            console.warn('背景Sprite不存在');
            return;
        }
        
        // 获取当前颜色
        const currentColor = this.spr_bg.color.clone();
        
        console.log('设置天气颜色:', {
            from: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`,
            to: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`,
            duration: duration
        });
        
        // 停止之前的动画
        tween(this.spr_bg).stop();
        
        // 创建颜色渐变动画
        tween(this.spr_bg)
            .to(duration, { 
                color: targetColor
            }, {
                easing: 'smooth'
            })
            .call(() => {
                console.log('主背景天气颜色渐变完成');
            })
            .start();
    }
    
    /**
     * 结束无限模式
     */
    private endInfiniteMode() {
        // 停止生成器
        if (this.infiniteModeGeneratorId) {
            clearInterval(this.infiniteModeGeneratorId);
            this.infiniteModeGeneratorId = null;
        }
        
        // 设置标志
        this.isInfinityMode = false;
        
        // 游戏结束处理
        Main.DispEvent("game_lose_infinite");
    }
    
    /**
     * 结束分层叠加模式
     */
    private endLayerSplitMode() {
        // 游戏结束处理
        Main.DispEvent("game_lose_layersplit");
    }
    
    // 重写hide方法，确保清理无限模式
    hide() {
        super.hide();
        
        // 清理无限模式
        if (this.infiniteModeGeneratorId) {
            clearInterval(this.infiniteModeGeneratorId);
            this.infiniteModeGeneratorId = null;
        }
        this.isInfinityMode = false;
    }
    
    // 添加积分相关方法
    /**
     * 增加积分
     */
    private addJifen(val:number) {
        const oldCurrentJifen = this.currentJifen;
        this.currentJifen+=val; // 本局积分+1
        this.jifen+=val; // 总积分+1
        
        // 使用动画效果更新本局得分显示
        this.animateJifenChange(oldCurrentJifen, this.currentJifen);
        
        // 更新总积分标签
        this.updateJifenLabel();
        // 保存总积分到本地存储
        this.saveJifen();
    }
    
    /**
     * 重置本局积分（每次游戏开始时调用）
     */
    private resetCurrentJifen() {
        this.currentJifen = 0;
        // if (this.lbl_curr) {
        //     this.lbl_curr.string = "0";
        // }
        // 总积分保持不变
        this.updateJifenLabel();
    }
    
    /**
     * 使用动画效果显示积分变化
     * @param startValue 起始值
     * @param endValue 结束值
     */
    private animateJifenChange(startValue: number, endValue: number) {
        // if (!this.lbl_curr) return;
        
        // // 根据数值变化大小调整动画持续时间，让每个数值都能看到
        // const valueDiff = endValue - startValue;
        // const duration = Math.min(0.5 + valueDiff * 0.3, 2.0); // 最大不超过2秒
        
        // // 停止之前的动画
        // tween(this.lbl_curr.node).stop();
        
        // // 使用tween实现数值累加动画效果
        // tween({ value: startValue })
        //     .to(duration, { value: endValue }, {
        //         onUpdate: (target) => {
        //             // 使用Math.floor确保每个整数都能显示，避免跳过中间数值
        //             const currentValue = Math.floor(target.value);
        //             this.lbl_curr.string = currentValue.toString(); 
        //         },
        //         easing: 'linear' // 使用线性缓动，让数值变化更均匀可见
        //     })
        //     .call(() => {
        //         // 动画结束，确保显示最终值
        //         this.lbl_curr.string = endValue.toString();
        //     })
        //     .start();
    }
    
    /**
     * 更新积分标签显示
     */
    private updateJifenLabel() {
        if (this.lbl_jifen) {
            this.lbl_jifen.string = "积分: " + this.jifen;
        }
    }
    
    /**
     * 从本地存储加载总积分
     */
    private loadJifen() {
        this.jifen = PlayerPrefb.getInt("jifen", 0); // 只加载总积分
        this.currentJifen = 0; // 本局积分始终从0开始
    }
    
    /**
     * 保存总积分到本地存储
     */
    private saveJifen() {
        PlayerPrefb.setInt("jifen", this.jifen); // 只保存总积分
    }
    
    /**
     * 重置总积分
     */
    private resetJifen() {
        this.jifen = 0;
        this.currentJifen = 0;
        this.updateJifenLabel();
        this.saveJifen();
    }
     

}
