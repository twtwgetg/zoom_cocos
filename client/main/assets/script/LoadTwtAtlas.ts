            import { _decorator, Component, SpriteFrame, SpriteAtlas } from 'cc';
import { Main } from './main';
            const { ccclass, property } = _decorator;
            
            @ccclass('LoadTwtAtlas')
            export class LoadTwtAtlas extends Component {
            
                @property(SpriteAtlas)
                spriteAtlas: SpriteAtlas = null;
                allsprites:string[] = [];
                
                // Enumerate all sprites
                enumerateAllSprites() {
                    if (this.spriteAtlas) {
                        // Use Object.keys for plain object
                        const spriteFrameNames = Object.keys(this.spriteAtlas.spriteFrames);
                        
                        console.log(`Total sprites in atlas: ${spriteFrameNames.length}`);
                        
                        spriteFrameNames.forEach((name, index) => {
                            //console.log(`Sprite ${index}: ${name}`);
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
                }
                start() {
                   
                    //this.allsprites= this.getAllSpriteFrames();
                }
            }