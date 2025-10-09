import { _decorator, Button, Color, Component, Label, Node, ProgressBar, Sprite, tween, Vec3 } from 'cc';
import { gridcreator } from './gridcreator';
import { Main } from './main';
import { frmbase } from './frmbase';
import { LevelMgr } from './levelmgr';
import { tools } from './tools';
import { ItemType } from './item_tools'; 
import { WeatherShaderManager } from './WeatherShaderManager';
import { ToutiaoEventMgr } from './ToutiaoEventMgr';
const { ccclass, property } = _decorator;

@ccclass('frm_main')
export class frm_main extends frmbase {
    @property(gridcreator)
    public gridcreator: gridcreator = null!;
    @property(Button)
    btn_refrush: Button = null!;

    @property(Button)
    btn_remind: Button = null!;
    @property(Button)
    btn_time: Button = null!;
    @property(Button)
    btn_pause: Button = null!;
    time_all: number = 0;
    time_now: number = 0;
    @property(ProgressBar)
    progress_time: ProgressBar = null!;
    public static isPause: boolean = true;
    @property(Label)
    lbl_guanka: Label = null!;
    level_playing: number = 0;

    @property(Node)
    ice_node: Node = null!;
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

    fruzonBar(f:boolean){
        if(!f){
            this.spr_bar.color=new Color(255,173,0,255);
            this.ice_node.active=false;
            this.jishi=true;
            // 冰封结束，渐变回正常颜色 #585858
            this.animateGridColor(new Color(88, 88, 88, 255), 0.5);
            // 取消天气效果
            this.deactivateWeatherEffect();
        }
        else{
            this.spr_bar.color=new Color(0,214,255,255);
            this.ice_node.active=true;
            this.jishi=false;
            // 冰封开始，渐变为冰封颜色 #00689C
            this.animateGridColor(new Color(0, 104, 156, 255), 0.5);
            // 激活天气效果
            this.activateWeatherEffect();
        }
    }
    protected onLoad(): void {
        super.onLoad();
        let that =this;
        Main.RegistEvent("event_play",(x)=>{ 
            this.show();
            // 上报进入关卡事件
            ToutiaoEventMgr.reportLevel(x);
            // 上报挑战事件（主动进入游戏）
            ToutiaoEventMgr.reportCharge();
            
            this.scheduleOnce(() => {
                this.gridcreator.Create(x);
                this.time_all = LevelMgr.getTimeAll(x);
                this.time_now = 0;
                this.jishi=true;
                frm_main.isPause = false;
                // 播放道具按钮入场动画
                this.playToolButtonsEntranceAnimation();
                // 执行你的拦截逻辑
            }, 0);
 
            this.level_playing = x;
            this.lbl_guanka.string = "第 "+(x+1)+" 关";

            return null;
        });

        Main.RegistEvent("event_restart",()=>{ 
            Main.DispEvent("event_play",this.level_playing); 
            return null;
        });
        Main.RegistEvent("event_fruszon",(f)=>{ 
            this.fruzonBar(f);
            return null;
        });
        Main.RegistEvent("update_tools",()=>{ 
            this.brushTools();
            return null;
        });
        Main.RegistEvent("event_begin",()=>{ 
            this.hide();
            return null;
        });

        this.btn_pause.node.on(Button.EventType.CLICK, () =>
        {
            
            Main.DispEvent("event_pause");
        }, this);
        this.btn_refrush.node.on(Button.EventType.CLICK, () =>
        {
            if(tools.num_brush>0)
            {
                tools.num_brush--;
                this.brushTools();
                Main.DispEvent("event_msg_top",{msg:"使用刷新道具"});
                Main.DispEvent("event_brush");
                // 上报使用道具事件
                ToutiaoEventMgr.reportUseItem(1); // 1表示刷新道具
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.brush,autouse:()=>{
                    // if(tools.num_brush>0)
                    // {
                    //     tools.num_brush--;
                        that.brushTools();
                        // 上报使用道具事件
                        ToutiaoEventMgr.reportUseItem(1); // 1表示刷新道具
                    //     Main.DispEvent("event_brush");    
                    // }
                    // else{

                    // }
                }});
            }
        }, this);
        this.btn_remind.node.on(Button.EventType.CLICK, () =>
        {
            if(tools.num_Remind>0){
                tools.num_Remind--;
                this.brushTools();
                Main.DispEvent("event_msg_top",{msg:"使用提醒道具..."});
                Main.DispEvent("event_tixing");
                // 上报使用道具事件
                ToutiaoEventMgr.reportUseItem(2); // 2表示提醒道具
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.remind,autouse:()=>{
                    // if(tools.num_Remind>0){
                    //     tools.num_Remind--;
                        that.brushTools();
                        // 上报使用道具事件
                        ToutiaoEventMgr.reportUseItem(2); // 2表示提醒道具
                    //     Main.DispEvent("event_tixing");    
                    // }
                }});
            }
        }, this); 
        this.btn_time.node.on(Button.EventType.CLICK,()=>{
            // 
            if(Main.DispEvent("event_isfruszon")){
                Main.DispEvent("event_msg_top",{msg:"时间冷却中..."});
            }
            else{
                if(tools.num_time>0){
                    tools.num_time--;
                    this.brushTools();
                    Main.DispEvent("event_resettime");     
                    Main.DispEvent("event_msg_top",{msg:"使用时间道具..."});
                    // 上报使用道具事件
                    ToutiaoEventMgr.reportUseItem(3); // 3表示时间道具
                }
                else{
                    console.log("no time");
    
                    Main.DispEvent("event_tools",{tp:ItemType.time,autouse:()=>{
                        // if(tools.num_time>0){
                        //     tools.num_time--;
                          that.brushTools();
                          // 上报使用道具事件
                          ToutiaoEventMgr.reportUseItem(3); // 3表示时间道具
                        //     Main.DispEvent("event_resettime");    
                        // }
                    }});
                }
            }
            
        },this);

        Main.RegistEvent("time_used",()=>{
            return this.time_now;
        });
        this.fruzonBar(false);

        this.brushTools();
    }
    brushTools(){ 
        this.btn_time.node.getChildByName("num").getComponent(Label).string = tools.num_time.toString();
        this.btn_remind.node.getChildByName("num").getComponent(Label).string = tools.num_Remind.toString();
        this.btn_refrush.node.getChildByName("num").getComponent(Label).string = tools.num_brush.toString();
    }
    start() {

    }
    jishi:boolean=false;
    update(deltaTime: number) {

        if(frm_main.isPause) 
            return;

        if(!this.jishi) 
            return;

        this.time_now += deltaTime; 
        this.progress_time.progress =1.0- this.time_now / this.time_all; 
        
        // 检查是否需要开始倒计时心跳音效（剩余时间小于10秒）
        const remainingTime = this.time_all - this.time_now;
        if (remainingTime <= 10 && !this.heartbeatPlaying) {
            // 开始播放心跳音效
            Main.DispEvent("event_heartbeat_start");
            this.heartbeatPlaying = true;
            this.lastHeartbeatTime = 0; // 重置心跳计时器
        }
        
        // 如果心跳音效正在播放，控制心跳节奏
        if (this.heartbeatPlaying) {
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
            this.jishi=false;
            // 停止心跳音效
            Main.DispEvent("event_heartbeat_stop");
            this.heartbeatPlaying = false;
            Main.DispEvent("game_lose",this.level_playing);
        }
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
        const toolButtons = [this.btn_remind, this.btn_time, this.btn_refrush];
        
        toolButtons.forEach((button, index) => {
            if (!button || !button.node) {
                console.warn(`道具按钮 ${index} 未找到`);
                return;
            }

            const originalPosition = button.node.position.clone();
            const originalScale = button.node.scale.clone();
            
            // 设置初始状态：在原位置下方100像素，缩放为0
            button.node.setPosition(originalPosition.x, originalPosition.y - 100, originalPosition.z);
            button.node.setScale(0, 0, 1);
            
            // 延迟播放，每个按钮间隔0.1秒
            const delay = index * 0.1;
            
            // 创建入场动画
            tween(button.node)
                .delay(delay)
                .parallel(
                    // 位置动画：从下方滑动到原位置
                    tween().to(0.6, { position: originalPosition }, {
                        easing: 'backOut' // 使用回弹效果
                    }),
                    // 缩放动画：从0缩放到原始大小
                    tween().to(0.6, { scale: originalScale }, {
                        easing: 'backOut'
                    })
                )
                .call(() => {
                    console.log(`道具按钮 ${index} 入场动画完成`);
                    // 添加一个小的弹跳效果来吸引注意
                    this.addAttentionBounce(button.node);
                })
                .start();
        });
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
                console.log('天气颜色渐变完成');
            })
            .start();
    }

}