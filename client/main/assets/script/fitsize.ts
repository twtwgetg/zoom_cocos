import { _decorator, Component, Node , ProgressBar, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('fitsize')
export class fitsize extends Component {
    pb: ProgressBar=  null!;
    start() {
        this.pb= this.node.getComponent(ProgressBar )!;
    }

    update(deltaTime: number) {
        this.pb.totalLength= this.node.getComponent(UITransform).contentSize.x;
        this.pb.node.getChildByName("Bar").position= new Vec3(-this.pb.totalLength/2,0.2,0);// this.pb.node.getChildByName("Bar").position= new Vec3(this.pb.totalLength/2,0,0);
    }
}


