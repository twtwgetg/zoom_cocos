import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('rot')
export class rot extends Component {
    
    @property(Number)
    rotationSpeed: number=60;
    start() {

    }

    update(deltaTime: number) {
        //UI旋转
        this.node.angle += this.rotationSpeed * deltaTime;
    }
}


