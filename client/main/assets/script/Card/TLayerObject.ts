import { _decorator, Animation, Button, Color, Component, Prefab, resources, Sprite, SpriteFrame, tween, UITransform, Vec3 } from 'cc';
import { gridcreator } from '../gridcreator';
import { Main } from '../main';

const { ccclass, property } = _decorator;

@ccclass('TLayerObject')
export class TLayerObject extends Component {
    public layer: number = 0;
    public x: number = 0;
    public y: number = 0;
    public type: number = 0;
    public creator: gridcreator | null = null;
    public released: boolean = false;
    @property(Prefab)
    explore: Prefab = null!;
    @property(Sprite)
    public mask: Sprite = null!;
    @property(Sprite)
    public src: Sprite = null!;
    @property(SpriteFrame)
    public majiang: SpriteFrame = null!;

    private static layerSplitBg: SpriteFrame | null = null;
    private static layerSplitBgLoading = false;
    private static layerSplitBgWaiters: TLayerObject[] = [];

    start() {
        this.getComponent(Button)?.node.on('click', this.onLayerClick, this);
    }

    public SetSprite(i: number, j: number, type: number, spriteFrame: SpriteFrame, creator: gridcreator): void {
        this.type = type;
        this.creator = creator;
        this.x = i;
        this.y = j;
        this.released = false;
        if (this.src) {
            this.src.spriteFrame = spriteFrame;
        }
        this.refreshVisualLayout();
        this.setLayerSplitCoveredVisual(false);
    }

    public UseMaJiangBg(): void {
        const bg = this.node.getChildByName("bg")?.getComponent(Sprite);
        if (bg) {
            bg.spriteFrame = this.majiang;
        }
    }

    public UseLayerSplitBg(): void {
        const bgSprite = this.node.getChildByName("bg")?.getComponent(Sprite);
        if (!bgSprite) {
            return;
        }

        if (TLayerObject.layerSplitBg) {
            bgSprite.spriteFrame = TLayerObject.layerSplitBg;
            return;
        }

        bgSprite.spriteFrame = this.majiang;
        TLayerObject.layerSplitBgWaiters.push(this);
        if (TLayerObject.layerSplitBgLoading) {
            return;
        }

        TLayerObject.layerSplitBgLoading = true;
        resources.load("layersplit/card_3d_base/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            TLayerObject.layerSplitBgLoading = false;
            if (err || !spriteFrame) {
                console.warn("LayerSplit card bg load failed", err);
                TLayerObject.layerSplitBgWaiters = [];
                return;
            }

            TLayerObject.layerSplitBg = spriteFrame;
            const waiters = TLayerObject.layerSplitBgWaiters;
            TLayerObject.layerSplitBgWaiters = [];
            for (const waiter of waiters) {
                if (!waiter?.node?.isValid) {
                    continue;
                }
                const waiterBg = waiter.node.getChildByName("bg")?.getComponent(Sprite);
                if (waiterBg) {
                    waiterBg.spriteFrame = spriteFrame;
                }
            }
        });
    }

    public updateMaskStatus(): void {
        if (!this.creator || !(this.creator as any).isLayerSplitMode) {
            return;
        }

        const currentWorldRect = this.getLayerSplitBgWorldRect();
        if (!currentWorldRect) {
            return;
        }

        let isCovered = false;
        const layerRoot = this.creator.card_container;
        for (const layerNode of layerRoot.children) {
            for (const child of layerNode.children) {
                const other = child.getComponent(TLayerObject);
                if (!other || other.released || other === this || other.layer <= this.layer) {
                    continue;
                }

                const otherWorldRect = other.getLayerSplitBgWorldRect();
                isCovered = !!otherWorldRect
                    && otherWorldRect.xMax > currentWorldRect.xMin
                    && otherWorldRect.xMin < currentWorldRect.xMax
                    && otherWorldRect.yMax > currentWorldRect.yMin
                    && otherWorldRect.yMin < currentWorldRect.yMax;
                if (isCovered) {
                    break;
                }
            }
            if (isCovered) {
                break;
            }
        }

        this.setLayerSplitCoveredVisual(isCovered);
    }

    public setLayerSplitCoveredVisual(isCovered: boolean): void {
        const cardRect = this.node.getComponent(UITransform);
        const centerX = cardRect ? (0.5 - cardRect.anchorPoint.x) * cardRect.width : 0;
        const centerY = cardRect ? (0.5 - cardRect.anchorPoint.y) * cardRect.height : 0;

        if (this.mask) {
            this.mask.node.active = isCovered;
            this.mask.color = new Color(0, 0, 0, isCovered ? 60 : 0);
            this.mask.node.setPosition(centerX, centerY, 1);
        }
    }

    public refreshVisualLayout(): void {
        const cardRect = this.node.getComponent(UITransform);
        const iconRect = this.src?.node.getComponent(UITransform);
        if (!cardRect || !iconRect) {
            return;
        }

        const centerX = (0.5 - cardRect.anchorPoint.x) * cardRect.width;
        const centerY = (0.5 - cardRect.anchorPoint.y) * cardRect.height;
        const bgNode = this.node.getChildByName("bg");
        const bgRect = bgNode?.getComponent(UITransform);
        if (bgNode && bgRect) {
            bgRect.setContentSize(cardRect.width, cardRect.height);
            bgNode.setPosition(centerX, centerY, 0);
        }

        if (this.mask) {
            const maskRect = this.mask.node.getComponent(UITransform);
            maskRect?.setContentSize(cardRect.width, cardRect.height);
            this.mask.node.setPosition(centerX, centerY, 1);
        }

        const iconSize = Math.max(1, Math.min(cardRect.width, cardRect.height) * 0.78);
        iconRect.setContentSize(iconSize, iconSize);
        this.src.node.setPosition(centerX, centerY, 0);
    }

    public PlayEffect(cb?: () => void): void {
        const anim = this.node.getComponent(Animation);
        if (!anim) {
            this.node.removeFromParent();
            this.node.destroy();
            cb?.();
            return;
        }

        anim.once(Animation.EventType.FINISHED, () => {
            this.node.removeFromParent();
            this.node.destroy();
            cb?.();
        }, this);
        anim.play();
    }

    private getLayerSplitBgWorldRect() {
        const bgRect = this.node.getChildByName("bg")?.getComponent(UITransform);
        return (bgRect || this.node.getComponent(UITransform))?.getBoundingBoxToWorld();
    }

    private onLayerClick(): void {
        if (this.released || !this.creator || this.creator.IsBoardMoving) {
            return;
        }
        if (this.mask?.node.active) {
            const gridNode = this.creator.node;
            const originalPosition = gridNode.position.clone();
            tween(gridNode).stop();
            tween(gridNode)
                .by(0.05, { position: new Vec3(-3, 0, 0) })
                .by(0.1, { position: new Vec3(6, 0, 0) })
                .by(0.05, { position: new Vec3(-3, 0, 0) })
                .call(() => gridNode.setPosition(originalPosition))
                .start();
            return;
        }

        this.released = true;
        this.setLayerSplitCoveredVisual(false);
        Main.DispEvent("event_move_to_container", this.node);
    }
}
