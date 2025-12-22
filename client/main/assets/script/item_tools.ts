import { __private, _decorator, Button, Component, Label, Node, Sprite, SpriteFrame, Vec3 } from 'cc';
import { Main } from './main'; 
import { tools } from './tools';
import { titem } from './item/titem';
const { ccclass, property } = _decorator;
declare global {
    interface Wx {
        shareAppMessage?(options: WechatMiniprogram.ShareAppMessageToGroupOption): void;
    }
}

// 声明tt类型（抖音小程序）
declare const tt: any;
export enum enum_paly_type {
    LIANLIANKAN = 0,
    SANXIAO = 1,
    LAYERSPLIT=2, // 分层
    Mem=3,//记忆模式
}
export enum ToolsType{ 
    video = 0,
    share = 1,  
}
export enum ItemType{
    brush = 0,
    time = 1,
    remind = 2,  
    layer = 3,//层级叠加找齐道具
    ShowFront = 4,//记忆模式,翻开卡牌3秒钟
}
@ccclass('item_tools')
export class item_tools extends titem {
   

    @property(Button)
    node_video: Button = null!;
    @property(SpriteFrame)
    sprite_video: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_share: SpriteFrame = null!;
    @property(Sprite)
    image_icon_video: Sprite = null!;
    @property(Label)
    lbl_txt: Label = null!;

    init(arg0: { tp: ItemType; }, num: number) {
        this.setItemType(arg0);
        this.setNum(num);
        this.node.on(Button.EventType.CLICK,this.onClick,this); 
        Main.RegistEvent("event_itemchanged",(x)=>this.onItemChanged(x));
        Main.RegistEvent("update_tools",(x)=>this.brushTools());
        
        // 确保道具节点以正确的尺寸显示
        this.node.scale = new Vec3(1, 1, 1);
    }

    wechatShare(callBack?:any) {
        this.initativeShare(callBack); // 主动分享 
    }
// 主动分享
    // 在cocosCreator中增加一个UI按钮，设置点击事件即可，不再赘述
    public initativeShare(callBack?: any) {
        // 检查是否为抖音环境
        const tt = window['tt'];
        if (tt) {
            console.log('开始抖音分享');
            
            // 调用抖音分享API，通过设置withShareTicket为false来隐藏"捎句话"界面
            tt.shareAppMessage({
                title: '一起来连连看吧！', // 分享的标题
                path: '/pages/index/index?param=value', // 分享的路径，可携带参数
                withShareTicket: false, // 设置为false以隐藏"捎句话"界面
                //imageUrl: 'https://example.com/image.jpg', // 分享的图片
                success(res) {
                    console.log('抖音分享成功', res);
                    tt.showToast({title: '分享成功!',icon: 'success'});
                    callBack && callBack(true);
                },
                fail(err) {
                    console.log('抖音分享失败', err);
                    tt.showToast({title: '分享失败',icon: 'none'});
                    callBack && callBack(false);
                }
            });
            return;
        }

        // 微信环境的分享逻辑
        const wx = window['wx'];
        if (!wx) {
            callBack(true);
            console.log('当前环境非微信小程序');
            return;
        }

        console.log('开始微信分享'); // 分享成功后的回调
        wx.shareAppMessage({
            title: '一起来连连看吧！', // 分享的标题
            path: '/pages/index/index?param=value', // 分享的路径，可携带参数
            //imageUrl: 'https://example.com/image.jpg', // 分享的图片
            success(res) {
                    console.log('分享成功', res); // 分享成功后的回调
                    wx.showToast({title: '分享成功!',icon: 'success'});
                    callBack(true);
            },
            fail(err) {
                    console.log('分享失败', err); // 分享失败后的回调
                    wx.showToast({title: '分享失败',icon: 'none'});
                    callBack(false);
            } 
        }); 
    }

    start() {
        if(this.node_video){
            this.node_video.node.on(Button.EventType.CLICK,this.onClick,this);
        }
    }
    onClick() {
        console.log('onClick'+this.funtype);
        if (this.funtype == ToolsType.share) {
            this.wechatShare((x)=>{
                if(x){
                    console.log('分享成功,开始奖励'+this.itemtype);
                    if(this.itemtype== ItemType.time ){
                        tools.num_time++;
                    }
                    else if(this.itemtype==ItemType.remind){
                        tools.num_Remind++;
                    }
                    else if(this.itemtype==ItemType.brush){
                        tools.num_brush++;
                    } 
                    else if(this.itemtype==ItemType.layer){
                        tools.num_layer++;
                    }
                    else if(this.itemtype==ItemType.ShowFront){
                        tools.num_ShowFront++;
                    }
                    else{
                        console.error("itemtype error"+this.itemtype);
                    } 
                    Main.DispEvent("update_tools");
                }
                else{
                    console.error('分享失败');
                }
            });
        }
        else if(this.funtype==ToolsType.video) {
            Main.DispEvent("event_watchvideo");
        }
        else{
            console.error('道具使用错误'+this.funtype);
        }
    }
    

    funtype: ToolsType =  ToolsType.share;
    setFunType(type: number) {
        this.funtype = type;
        switch (type) {
            case ToolsType.video:
                this.image_icon_video.spriteFrame = this.sprite_video;
                this.lbl_txt.string="免费"
                this.lbl_num.string="×2";
                break;
            case ToolsType.share:
                this.image_icon_video.spriteFrame = this.sprite_share;
                this.lbl_txt.string="分享"
                this.lbl_num.string="×1";
                break;
            default:
                break;
        }
    }

    update(deltaTime: number) {}
}