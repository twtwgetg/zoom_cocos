import { _decorator, Component, Node, tween, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoveTo')
export class MoveTo extends Component {
    @property(Vec2)
    targetPos: Vec2 = new Vec2(0, 0);
    private oldPos: Vec2 = new Vec2(0, 0);
    @property(Number)
    delay: number = 0;
    start() {
        // 先把位置设置的偏移的位置存起来
        this.oldPos = this.node.position.clone();
        // 把目标位置设置为偏移的位置
        this.targetPos = this.node.position.clone().add(this.targetPos);
        this.targetPos.z = this.oldPos.z;
        
        this.node.setPosition(this.targetPos);

        setTimeout(() => {
            tween(this.node)
            .to(0.75, { position: this.oldPos })
            .start();
        }, this.delay * 1000);

        
        // tween(this.node)
        //     .to(0.75, { position: this.oldPos })
        //     .start(this.delay);

    }
}


