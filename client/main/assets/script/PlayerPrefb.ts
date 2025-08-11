import { sys } from "cc";

export class PlayerPrefb 
{
    static getInt(param: string, defaultvalue: number) { 
        const levelStr = sys.localStorage.getItem(param);

        // Check if levelStr is null, undefined, or empty string
        if (levelStr === null || levelStr === undefined || levelStr === "") {
            return defaultvalue;
        } else {
            const parsed = parseInt(levelStr);
            // Additional check for NaN case
            if (isNaN(parsed)) {
                return defaultvalue;
            }
            return parsed;
        }
    } 
    static setInt(param: string, arg1: number) { 
        sys.localStorage.setItem(param, arg1.toString());
    }
    // 初始化
    static Init()
    {
        sys.localStorage.clear();
    }
    
}