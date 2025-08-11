import { __private, _decorator, Button, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { Main } from './main'; 
import { tools } from './tools';
const { ccclass, property } = _decorator;
declare global {
    interface Wx {
        shareAppMessage?(options: WechatMiniprogram.ShareAppMessageToGroupOption): void;
    }
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
            title: '分享标题', // 分享的标题
            path: '/pages/index/index?param=value', // 分享的路径，可携带参数
            imageUrl: 'https://example.com/image.jpg', // 分享的图片
            success(res) {
                    console.log('分享成功', res); // 分享成功后的回调
                    wx.showToast({
                    title: '分享成功',
                    icon: 'success'
                });
                callBack && callBack(true);
            },
            fail(err) {
                    console.log('分享失败', err); // 分享失败后的回调
                    wx.showToast({
                    title: '分享失败',
                    icon: 'none'
                });
                callBack && callBack(false);
            }

        });
        callBack(true);
    }

    start() {
        this.node_video.node.on(Button.EventType.CLICK,this.onClick,this);
    }
    onClick() {
        console.log('onClick'+this.funtype);
        if (this.funtype == 1) {
            this.wechatShare((x)=>{
                if(x==true){
                    if(this.itemtype==0){
                        tools.num_time++;
                    }
                    else if(this.itemtype==1){
                        tools.num_Remind++;
                    }
                    else if(this.itemtype==2){
                        tools.num_brush++;
                    }
                    //Main.DispEvent('update_tools');
                    
                }
                else{
                    console.log('分享失败');
                }
            });
        }
        else{
            //video
        }
    }
    itemtype: number = 0;
    dt:any
    setType(dt:any) {
        this.dt = dt;
        this.itemtype = dt.tp;
        switch (this.itemtype) {
            case 0: 
                this.image_icon.spriteFrame = this.sprite_time;
                break;
            case 1: 
                this.image_icon.spriteFrame = this.sprite_remind;
                break;
            case 2: 
                this.image_icon.spriteFrame = this.sprite_refrush;
                break;
            default:
                break;
        }
    }

    funtype: number = 0;
    setFunType(type: number) {
        this.funtype = type;
        switch (type) {
            case 0:
                this.image_icon_video.spriteFrame = this.sprite_video;
                break;
            case 1:
                this.image_icon_video.spriteFrame = this.sprite_share;
                break;
            default:
                break;
        }
    }

    update(deltaTime: number) {}
}