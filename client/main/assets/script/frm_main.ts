import { _decorator, Component, Node } from 'cc';
import { gridcreator } from './gridcreator';
import { Main } from './main';
import { frmbase } from './frmbase';
const { ccclass, property } = _decorator;

@ccclass('frm_main')
export class frm_main extends frmbase {
    @property(gridcreator)
    public gridcreator: gridcreator = null!;
    protected onLoad(): void {
        super.onLoad();
        Main.RegistEvent("event_play",(x)=>{ 
            this.show();
            this.gridcreator.Create(x);
            return null;
        });
    }
    start() {

    }

    update(deltaTime: number) {
        
    }
}


