import { Main } from "./main";
import { PlayerPrefb } from "./PlayerPrefb";

export class tools { 
    /**
     * 提醒道具数量
     */
    static get num_Remind()
    {
        return PlayerPrefb.getInt("num_Remind", 3); //获取剩余次数
    }
    static set num_Remind(value)
    {
        if(value<0){
            value = 0;
        }
        PlayerPrefb.setInt("num_Remind", value); //设置剩余次数
        Main.DispEvent("event_itemchanged", value);
    }
    
    /**
     * 刷新道具数量
     */
    static get num_brush()
    {
        return PlayerPrefb.getInt("num_brush", 3);
    }
    static set num_brush(value)
    {
        if(value<0){
            value = 0;
        }
        PlayerPrefb.setInt("num_brush", value); 
        Main.DispEvent("event_itemchanged", value);
    }
    
    /**
     * 时间道具数量
     */
    static get num_time()
    {
        return PlayerPrefb.getInt("num_time", 3);
    }
    static set num_time(value)
    {
        if (value < 0)
            value = 0;
        PlayerPrefb.setInt("num_time", value);
        Main.DispEvent("event_itemchanged", value);
    }
}