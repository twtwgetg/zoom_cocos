            import { _decorator, Component, SpriteFrame, SpriteAtlas } from 'cc';
import { Main } from './main';
            const { ccclass, property } = _decorator;
            
            @ccclass('LoadTwtAtlas')
            export class LoadTwtAtlas extends Component {
   
                @property(SpriteAtlas)
                spriteAtlas: SpriteAtlas = null;
                allsprites:string[] = [];
                pls:Array<SpriteFrame> = new Array<SpriteFrame>();
                // Enumerate all sprites
                enumerateAllSprites() {
                    if (this.spriteAtlas) {
                        // Use Object.keys for plain object
                        const spriteFrameNames = Object.keys(this.spriteAtlas.spriteFrames);
                        
                        console.log(`Total sprites in atlas: ${spriteFrameNames.length}`);
                        let that =this;
                        spriteFrameNames.forEach((name, index) => {
                            //console.log(`Sprite ${index}: ${name}`);
                            that.pls.push(that.spriteAtlas.getSpriteFrame(name));// this.spriteAtlas.getSpriteFrame(name);
                        });
                        
                        return spriteFrameNames;
                    } else {
                        console.warn('Sprite atlas is not assigned');
                        return [];
                    }
                }
            
                // getAllSpriteFrames(): SpriteFrame[] {
                //     if (this.spriteAtlas) {
                //         const spriteFrames: SpriteFrame[] = [];
                //         for (const name in this.spriteAtlas.spriteFrames) {
                //             const frame = this.spriteAtlas.spriteFrames[name];
                //             spriteFrames.push(frame);
                //             console.log(`Sprite Frame: ${name}`);
                //         }
                //         return spriteFrames;
                //     } else {
                //         console.warn('Sprite atlas is not assigned');
                //         return [];
                //     }
                // }
                protected onLoad(): void {
                    this.allsprites= this.enumerateAllSprites();

                    Main.RegistEvent("event_getallsprites", (x) =>{
                        return this.allsprites;
                    });
                    Main.RegistEvent("event_getsprite",(x)=>{
                        let name = this.allsprites[x];
                        let spriteFrame = this.spriteAtlas.getSpriteFrame(name)   ;
                        return spriteFrame;
                    });
                    Main.RegistEvent("EVENT_GETPLSPRITES",(x)=>{
                        return this.pls;
                    })
                } 
            }