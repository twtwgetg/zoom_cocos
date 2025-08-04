import { sys } from "cc";

export class PlayerPrefb 
{
    static getInt(param: string, defaultvalue: number) { 
        const levelStr = sys.localStorage.getItem(param);
        if(levelStr == null){
            return defaultvalue;
        }else{
            return parseInt(levelStr);
        }
    } 
    static setInt(param: string, arg1: number) { 
        sys.localStorage.setItem(param, arg1.toString());
    }
    
}