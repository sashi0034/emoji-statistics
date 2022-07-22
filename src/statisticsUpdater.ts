import EmojiAnalyzer from "./emojiAnalyzer";
import log4js from "log4js";
import Config from "./config.json"

export default
class StatisticsUpdater{
    private readonly minuteMilliSec = 60 * 1000;
    private updatingTimer: NodeJS.Timer | null = null
    private updatingDurationMinute = Config.updateDuration;

    private passedLastUpdatedMinute = 0

    public constructor(
        private readonly analyzer: EmojiAnalyzer
    ){
        analyzer.restartTakeStatistics();
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

        } , this.minuteMilliSec);
    }


}