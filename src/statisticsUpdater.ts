import EmojiStasticsPoster from "./stasticsContributor";
import log4js from "log4js";
import Config from "./config.json"
import { SayFn } from "@slack/bolt";
import SlackActionWrapper from "./slackActionWrapper";
import { makeZeroPadding } from "./util";

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
    
    private finishingDurationMinute;
    private passedLastUpdatedMinute = 0

    private postingProgressMessage: PostedMessageInfo = new PostedMessageInfo(undefined);
    private isNeedToPostingProgressMessage = false

    private readonly canRestart = false;

    private isAliveSelf = true;
    public get isAlive(){
        return this.isAliveSelf;
    }

    public constructor(
        private readonly statisticsPoster: EmojiStasticsPoster,
        private readonly slackAction: SlackActionWrapper,
        finishingDurationMinute: number
    ){
        this.finishingDurationMinute = finishingDurationMinute;
        this.restartStatistics();
    }

    private async restartStatistics(){
        this.statisticsPoster.restartTakeStatistics();
        const postedResult = await this.postCatedEmojiCountBlock(0);
        this.postingProgressMessage = new PostedMessageInfo(postedResult.ts);
        await this.slackAction.addPinsItem(this.postingProgressMessage.timeStamp as string);
    }

    private postCatedEmojiCountBlock(count: number) {
        return this.slackAction.postBlockText(this.getTextInCatcedEmojiCountBlock(), this.getCatcedEmojiCountBlock(count));
    }

    private getTextInCatcedEmojiCountBlock(){
        return "catcehd emoji count";
    }

    private calcLeftMinutesUntilFinish(){
        return this.finishingDurationMinute - this.passedLastUpdatedMinute;
    }

    private getCatcedEmojiCountBlock(count: number){
        return [
            {
                "type": "divider"
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Catching emoji count:    *" + count+"*",
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "plain_text",
                        "text": "Fisnishing Time:    " + this.calcLeftMinutesUntilFinish() + " minutes left",
                        "emoji": true
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "plain_text",
                        "text": "Last updated:    " + this.getDateText(new Date()),
                        "emoji": true
                    }
                ]
            }
            // {
            //     "type": "divider"
            // }
        ]
    }

    private getDateText(date: Date){
        const dateText = 
            makeZeroPadding(date.getMonth()+1, 2) + "/" + makeZeroPadding(date.getDate(), 2) + " " +
            makeZeroPadding(date.getHours(), 2) + ":" + makeZeroPadding(date.getMinutes(), 2) + ":" + makeZeroPadding(date.getSeconds(), 2)
        return dateText;
    }

    private static getMilliSecPerMinute(): number{
        if (Config.debug){
            return 1 * 1000
        }else{
            return 60 * 1000
        }
    }


    public async notifyUpdateProgressMessage(){
        this.isNeedToPostingProgressMessage = true;
    }

    private async updateProgressMessage(){
        if (this.postingProgressMessage.isValid()===false) return;

        const updatingContent = this.getCatcedEmojiCountBlock(this.statisticsPoster.numCatchedEmoji)
        await this.slackAction.updateBlockText(this.postingProgressMessage.timeStamp as string, this.getTextInCatcedEmojiCountBlock(), updatingContent)
    }

    // 統計を公表し、更新
    public startTimer(){

        this.initUpdatingTimer();

        this.initUpdateProgressMessageTimer();
    }

    private initUpdatingTimer() {
        this.updatingTimer = setInterval(async () => {
            if (!this.isAlive) return;

            this.passedLastUpdatedMinute++;

            log4js.getLogger().info("Start updating timer: " + this.passedLastUpdatedMinute + " min");

            if (this.passedLastUpdatedMinute < this.finishingDurationMinute)
                return;

            await this.updateFinal();
        }, this.milliSecPerMinute);
    }

    private async updateFinal() {
        this.isAliveSelf = false;

        this.passedLastUpdatedMinute = 0;

        await this.statisticsPoster.postStatistics();

        await this.slackAction.removePinsItem(this.postingProgressMessage.timeStamp as string);

         // if (this.canRestart) this.restartProcess();
    }

    // Maybe unused.
    // 必要になるかもしれないので残す
    private restartProcess() {
        this.restartStatistics();

        log4js.getLogger().info("Restarted taking statistics.");

        this.isAliveSelf = true;
    }

    private initUpdateProgressMessageTimer() {
        const updatingProgressDuration = 3 * 1000;
        
        const updatingProgressTimer = setInterval(async () => {
            if (this.isNeedToPostingProgressMessage === false)
                return;
            this.isNeedToPostingProgressMessage = false;
            this.updateProgressMessage();
        }, updatingProgressDuration);
    }

    // public changeUpdatingDuration(minuteStr: string, say: SayFn, userLiteral: string){
    //     let numMinute = parseInt(minuteStr, 10);
    //     const maxMinute = 24 * 60;
    //     if (0 < numMinute && numMinute <= maxMinute){
    //         this.updatingDurationMinute = numMinute;
    //         say("Update duration changed to " + numMinute + " minutes by "+ userLiteral + ".");
    //     }else{
    //         say(userLiteral + " failed to change duration.");   
    //     }
    // }


}