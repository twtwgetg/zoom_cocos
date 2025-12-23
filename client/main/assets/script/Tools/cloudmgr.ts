import { _decorator, Component, Node, Prefab, instantiate, tween, Vec3, UITransform, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('cloudmgr')
export class cloudmgr extends Component {
    @property(Prefab)
    prefab_cloud: Prefab = null;
    
    @property({ tooltip: "云朵移动速度" })
    cloudSpeed: number = 50;
    
    @property({ tooltip: "云朵生成间隔（秒）" })
    spawnInterval: number = 3;
    
    @property({ tooltip: "启动时初始云朵数量" })
    initialClouds: number = 5; // 设置为5片云彩
    
    @property({ tooltip: "最大云朵数量" })
    maxClouds: number = 5;
    
    @property({ tooltip: "云朵移动方向 0=左到右 1=右到左 2=上到下 3=下到上" })
    moveDirection: number = 0;
    
    @property({ tooltip: "云朵大小变化范围" })
    scaleRange: Vec3 = new Vec3(0.8, 1.2, 1);
    
    private cloudPool: Node[] = [];
    private activeClouds: Node[] = [];
    private containerSize: Vec3 = new Vec3();
    
    start() {
        // 获取容器大小
        this.updateContainerSize();
        
        // 初始化云朵对象池
        this.initCloudPool();
        
        // 创建初始云朵
        this.createInitialClouds();
        
        console.log('云朵管理器启动，容器大小:', this.containerSize);
    }
    
    /**
     * 更新容器大小
     */
    private updateContainerSize() {
        const transform = this.node.getComponent(UITransform);
        if (transform) {
            this.containerSize.set(transform.width, transform.height, 0);
        } else {
            // 如果没有UITransform，使用默认大小
            this.containerSize.set(800, 600, 0);
        }
    }
    
    /**
     * 初始化云朵对象池
     */
    private initCloudPool() {
        if (!this.prefab_cloud) {
            console.warn('云朵预制体未设置！');
            return;
        }
        
        // 预创建一些云朵节点到对象池
        for (let i = 0; i < this.maxClouds + 2; i++) {
            const cloudNode = instantiate(this.prefab_cloud);
            cloudNode.active = false;
            this.node.addChild(cloudNode);
            this.cloudPool.push(cloudNode);
        }
    }
    
    /**
     * 创建启动时的初始云朵
     */
    private createInitialClouds() {
        for (let i = 0; i < this.initialClouds; i++) {
            const cloud = this.getCloudFromPool();
            if (!cloud) {
                console.warn('无法从对象池获取云朵');
                continue;
            }
            
            // 设置云朵属性
            this.setupCloudProperties(cloud);
            
            // 在屏幕中间区域随机放置
            const randomPos = this.getRandomPositionInCenter();
            cloud.setPosition(randomPos);
            
            // 激活云朵
            cloud.active = true;
            this.activeClouds.push(cloud);
            
            // 启动慢速飘动动画
            this.startSlowDriftAnimation(cloud);
        }
        
        console.log(`创建了 ${this.initialClouds} 个初始云朵`);
    }
    
    /**
     * 获取屏幕中心区域的随机位置
     */
    private getRandomPositionInCenter(): Vec3 {
        const centerAreaWidth = this.containerSize.x * 0.8; // 中心区域占80%宽度
        const centerAreaHeight = this.containerSize.y * 0.8; // 中心区域占80%高度
        
        const x = (Math.random() - 0.5) * centerAreaWidth;
        const y = (Math.random() - 0.5) * centerAreaHeight;
        
        return new Vec3(x, y, 0);
    }
    
    /**
     * 启动慢速飘动动画（用于初始云朵）
     */
    private startSlowDriftAnimation(cloud: Node) {
        const currentPos = cloud.position.clone();
        const driftDistance = 50; // 飘动距离
        const driftDuration = 8 + Math.random() * 4; // 8-12秒的飘动周期
        
        // 随机飘动方向
        const angle = Math.random() * Math.PI * 2;
        const driftOffset = new Vec3(
            Math.cos(angle) * driftDistance,
            Math.sin(angle) * driftDistance,
            0
        );
        
        const targetPos = currentPos.clone().add(driftOffset);
        
        // 创建来回飘动的动画
        const driftTween = tween(cloud)
            .to(driftDuration, { position: targetPos }, { easing: 'smooth' })
            .to(driftDuration, { position: currentPos }, { easing: 'smooth' })
            .union() // 合并为一个完整动画
            .repeatForever(); // 无限循环
            
        driftTween.start();
        
        // 保存动画引用以便后续清理
        cloud['driftTween'] = driftTween;
    }
    
    /**
     * 从对象池获取云朵
     */
    private getCloudFromPool(): Node | null {
        for (let cloud of this.cloudPool) {
            if (!cloud.active) {
                return cloud;
            }
        }
        return null;
    }
    
    /**
     * 回收云朵到对象池
     */
    private recycleCloud(cloud: Node) {
        cloud.active = false;
        const index = this.activeClouds.indexOf(cloud);
        if (index > -1) {
            this.activeClouds.splice(index, 1);
        }
        // 停止所有动画
        tween(cloud).stop();
        
        // 停止飘动动画（如果存在）
        if (cloud['driftTween']) {
            cloud['driftTween'].stop();
            cloud['driftTween'] = null;
        }
    }
    
    /**
     * 生成新云朵
     */
    private spawnCloud() {
        if (this.activeClouds.length >= this.maxClouds) {
            return;
        }
        
        const cloud = this.getCloudFromPool();
        if (!cloud) {
            return;
        }
        
        // 设置云朵属性
        this.setupCloudProperties(cloud);
        
        // 设置起始位置
        const startPos = this.getStartPosition();
        cloud.setPosition(startPos);
        
        // 激活云朵
        cloud.active = true;
        this.activeClouds.push(cloud);
        
        // 开始移动动画
        this.startCloudMovement(cloud);
        
        console.log(`生成云朵，当前活跃云朵数量: ${this.activeClouds.length}`);
    }
    
    /**
     * 设置云朵属性（大小、透明度等）
     */
    private setupCloudProperties(cloud: Node) {
        // 随机缩放
        const randomScale = this.scaleRange.x + Math.random() * (this.scaleRange.y - this.scaleRange.x);
        cloud.setScale(randomScale, randomScale, 1);
        
        // 随机透明度
        const opacity = 150 + Math.random() * 105; // 150-255之间
        const sprite = cloud.getComponent(Sprite);
        // if (sprite) {
        //     const color = sprite.color.clone();
        //     color.a = opacity;
        //     sprite.color = color;
        // }
    }
    
    /**
     * 获取起始位置
     */
    private getStartPosition(): Vec3 {
        const halfWidth = this.containerSize.x / 2;
        const halfHeight = this.containerSize.y / 2;
        const margin = 100; // 边距
        
        switch (this.moveDirection) {
            case 0: // 左到右
                return new Vec3(
                    -halfWidth - margin,
                    -halfHeight + Math.random() * this.containerSize.y,
                    0
                );
            case 1: // 右到左
                return new Vec3(
                    halfWidth + margin,
                    -halfHeight + Math.random() * this.containerSize.y,
                    0
                );
            case 2: // 上到下
                return new Vec3(
                    -halfWidth + Math.random() * this.containerSize.x,
                    halfHeight + margin,
                    0
                );
            case 3: // 下到上
                return new Vec3(
                    -halfWidth + Math.random() * this.containerSize.x,
                    -halfHeight - margin,
                    0
                );
            default:
                return new Vec3(-halfWidth - margin, 0, 0);
        }
    }
    
    /**
     * 获取目标位置
     */
    private getTargetPosition(startPos: Vec3): Vec3 {
        const halfWidth = this.containerSize.x / 2;
        const halfHeight = this.containerSize.y / 2;
        const margin = 100;
        
        switch (this.moveDirection) {
            case 0: // 左到右
                return new Vec3(halfWidth + margin, startPos.y, 0);
            case 1: // 右到左
                return new Vec3(-halfWidth - margin, startPos.y, 0);
            case 2: // 上到下
                return new Vec3(startPos.x, -halfHeight - margin, 0);
            case 3: // 下到上
                return new Vec3(startPos.x, halfHeight + margin, 0);
            default:
                return new Vec3(halfWidth + margin, startPos.y, 0);
        }
    }
    
    /**
     * 开始云朵移动动画
     */
    private startCloudMovement(cloud: Node) {
        const startPos = cloud.position.clone();
        const targetPos = this.getTargetPosition(startPos);
        
        // 计算移动距离和时间
        const distance = Vec3.distance(startPos, targetPos);
        const duration = distance / this.cloudSpeed;
        
        // 添加轻微的飘动效果
        const floatOffset = new Vec3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            0
        );
        
        tween(cloud)
            .to(duration, { position: targetPos.add(floatOffset) }, {
                easing: 'smooth'
            })
            .call(() => {
                // 移动完成，回收云朵
                this.recycleCloud(cloud);
            })
            .start();
    }
    
    /**
     * 手动生成云朵（供外部调用）- 现在这个方法也不会生成新云彩
     */
    public createCloud() {
        // 空实现，因为我们不需要动态生成云彩
        console.log("createCloud 调用已被禁用，不会生成新的云彩");
    }
    
    /**
     * 清除所有云朵
     */
    public clearAllClouds() {
        for (let cloud of this.activeClouds.slice()) {
            this.recycleCloud(cloud);
        }
    }
    
    /**
     * 设置移动方向
     */
    public setMoveDirection(direction: number) {
        this.moveDirection = direction;
        console.log('设置云朵移动方向:', direction);
    }
    
    update(deltaTime: number) {
        // 移除定时生成云朵的逻辑，因为我们只需要初始的云彩
        // 不再生成新的云彩
    }
}

