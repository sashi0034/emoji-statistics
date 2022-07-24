import EmojiStasticsPoster from "./emojiStasticsPoster";
import log4js from "log4js";
import Config from "./config.json"
import { SayFn } from "@slack/bolt";
import SlackActionWrapper from "./slackActionWrapper";

class PostedMessageInfo{
    public constructor(
        public readonly timeStamp: string | undefined
    ){}
    public isValid(){
        return this.timeStamp != undefined;
    }
}

export default
class StatisticsUpdater{
    private readonly milliSecPerMinute = StatisticsUpdater.getMilliSecPerMinute();
    private updatingTimer: NodeJS.Timer | null = null
    private updatingDurationMinute = Config.updateDuration;

    private passedLastUpdatedMinute = 0

    private postingProgressMessage: PostedMessageInfo = new PostedMessageInfo(undefined);

    public constructor(
        private readonly statisticsPoster: EmojiStasticsPoster,
        private readonly slackAction: SlackActionWrapper
    ){
        this.restartStatistics();
    }

    private async restartStatistics(){
        this.statisticsPoster.restartTakeStatistics();
        const postedResult = await this.postCatedEmojiCountBlock(0);
        this.postingProgressMessage = new PostedMessageInfo(postedResult.ts);
    }

    private postCatedEmojiCountBlock(count: number) {
        return this.slackAction.postBlockText(this.getTextInCatcedEmojiCountBlock(), this.getCatcedEmojiCountBlock(count));
    }

    private getTextInCatcedEmojiCountBlock(){
        return "catcehd emoji count";
    }

    private getCatcedEmojiCountBlock(count: number){
        return [
            // {
            //     "type": "divider"
            // },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Catching emoji count:    *" + count+"*",
                }
            },
            {
                "type": "divider"
            }
        ]
    }

    private static getMilliSecPerMinute(): number{
        if (Config.debug){
            return 1 * 1000
        }else{
            return 60 * 1000
        }
    }


    public async updateProgressMessage(){
        if (this.postingProgressMessage.isValid()===false) return;

        const updatingContent = this.getCatcedEmojiCountBlock(this.statisticsPoster.numCatchedEmoji)
        await this.slackAction.updateBlockText(this.postingProgressMessage.timeStamp as string, this.getTextInCatcedEmojiCountBlock(), updatingContent)
    }


    // 統計を公表し、更新
    public startTimer(){
        this.updatingTimer = setInterval(async ()=>{
            this.passedLastUpdatedMinute++;
            
            log4js.getLogger().info("Start updating timer: " + this.passedLastUpdatedMinute + " min");
            
            if (this.passedLastUpdatedMinute<this.updatingDurationMinute) return;

            this.passedLastUpdatedMinute = 0;
            
            await this.statisticsPoster.postStatistics();

            this.restartStatistics();

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