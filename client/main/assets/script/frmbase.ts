import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('frmbase')
export class frmbase extends Component {
    // Start is called before the first frame update
 
    protected onLoad(): void {
        this.hide();
    }
    start() {
        // Start 方法保持不变
    }

    // Update is called once per frame
    update(deltaTime: number): void {
        // Update 方法保持不变
    }

    // 获取名为 "gb" 的子节点
    protected get gb(): Node | null {
        return this.node.getChildByName('gb');
    }

    // 显示界面
    public show(): void {
        const gbNode = this.gb;
        if (gbNode) {
            gbNode.active = true;
            this.OnShow();
        }
    }

    // 显示时的回调方法（虚方法）
    protected OnShow(): void {
        // 子类可以重写此方法
    }

    // 隐藏时的回调方法（虚方法）
    protected OnHide(): void {
        // 子类可以重写此方法
    }

    // 隐藏界面
    public hide(): void {
        const gbNode = this.gb;
        if (gbNode) {
            gbNode.active = false;
            this.OnHide();
        }
    }
}