import EmojiAnalyzer from "./emojiAnalyzer";
import log4js from "log4js";
import Config from "./config.json"
import { SayFn } from "@slack/bolt";

export default
class StatisticsUpdater{
    private readonly milliSecPerMinute = StatisticsUpdater.getMilliSecPerMinute();
    private updatingTimer: NodeJS.Timer | null = null
    private updatingDurationMinute = Config.updateDuration;

    private passedLastUpdatedMinute = 0

    public constructor(
        private readonly analyzer: EmojiAnalyzer
    ){
        analyzer.restartTakeStatistics();
    }

    private static getMilliSecPerMinute(): number{
        if (Config.debug){
            return 1 * 1000
        }else{
            return 60 * 1000
        }
    }

    // 統計を公表し、更新
    public startTimer(){
        this.updatingTimer = setInterval(async ()=>{
            this.passedLastUpdatedMinute++;
            
            log4js.getLogger().info("Start updating timer: " + this.passedLastUpdatedMinute + " min");
            
            if (this.passedLastUpdatedMinute<this.updatingDurationMinute) return;

            this.passedLastUpdatedMinute = 0;
            
            await this.analyzer.postStatistics();

            this.analyzer.restartTakeStatistics();

            log4js.getLogger().info("Restarted taking statistics.");

        } , this.milliSecPerMinute);
    }

    public changeUpdatingDuration(minuteStr: string, say: SayFn, userLiteral: string){
        let numMinute = parseInt(minuteStr, 10);
        const maxMinute = 24 * 60;
        if (0 < numMinute && numMinute <= maxMinute){
            this.updatingDurationMinute = numMinute;
            say("Update duration changed to " + numMinute + " minutes by "+ userLiteral + ".");
        }else{
            say(userLiteral + " failed to change duration.");   
        }
    }


}