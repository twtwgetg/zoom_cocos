import { __private, _decorator, Button, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { Main } from './main'; 
import { tools } from './tools';
const { ccclass, property } = _decorator;
declare global {
    interface Wx {
        shareAppMessage?(options: WechatMiniprogram.ShareAppMessageToGroupOption): void;
    }
}
export enum ToolsType{ 
    video = 0,
    share = 1,  
}
export enum ItemType{
    brush = 0,
    time = 1,
    remind = 2,  
}
@ccclass('item_tools')
export class item_tools extends Component {
    @property(SpriteFrame)
    sprite_time: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_remind: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_refrush: SpriteFrame = null!;
    @property(Sprite)
    image_icon: Sprite = null!;

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
    @property(Label)
    lbl_num: Label = null!;
    wechatShare(callBack?:any) {
        this.initativeShare(callBack); // 主动分享 
    }
// 主动分享
    // 在cocosCreator中增加一个UI按钮，设置点击事件即可，不再赘述
    public initativeShare(callBack?: any) {
        const wx = window['wx'];
        if (!wx) {
            callBack(true);
            console.log('当前环境非微信小程序');
            return;
        }

        console.log('开始分享'); // 分享成功后的回调
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
        this.node_video.node.on(Button.EventType.CLICK,this.onClick,this);
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
                    else{
                        console.error("itemtype error"+this.itemtype);
                    }
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
    itemtype: ItemType = ItemType.remind;
    dt:any
    setItemType(dt:any) {
        this.dt = dt;
        this.itemtype = dt.tp;
        switch (this.itemtype) {
            case ItemType.time: 
                this.image_icon.spriteFrame = this.sprite_time; 
                break;
            case ItemType.remind: 
                this.image_icon.spriteFrame = this.sprite_remind;
                break;
            case ItemType.brush: 
                this.image_icon.spriteFrame = this.sprite_refrush;
                break;
            default:
                break;
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