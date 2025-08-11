import { PlayerPrefb } from "./PlayerPrefb";

export class tools { 
    static get num_Remind()
    {
        return PlayerPrefb.getInt("num_Remind", 3); //获取剩余次数
    }
    static set num_Remind(value)
    {
        PlayerPrefb.setInt("num_Remind", value); //设置剩余次数
    }
    static get num_brush()
    {
        return PlayerPrefb.getInt("num_brush", 3);
    }
    static set num_brush(value)
    {
        PlayerPrefb.setInt("num_brush", value); 
    }
    static get num_time()
    {
        return PlayerPrefb.getInt("num_time", 3);
    }
    static set num_time(value)
    {
        PlayerPrefb.setInt("num_time", value);
    }
}