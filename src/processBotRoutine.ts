import { App, GenericMessageEvent } from "@slack/bolt";
import Config from "./config.json";
import EmojiAnalyzer from "./emojiAnalyzer";
import SlackActionWrapper from "./slackActionWrapper";
import log4js from "log4js";
import StatisticsUpdater from "./statisticsUpdater";
import { getUserMentionText as getUserMentionLiteral } from "./util";

export function processBotRoutine(){
    const app: App = new App({
        token: Config.botToken,
        appToken: Config.appToken,
        socketMode: true
    });

    const slackAction = new SlackActionWrapper(app, Config)
    const analyzer = new EmojiAnalyzer(slackAction);
    const updater = new StatisticsUpdater(analyzer)

    app.event("message", async ({event, say}) =>{
        const messageEvent: GenericMessageEvent = event as GenericMessageEvent
        analyzer.analyse(messageEvent.text as string)
    });

    app.command("/duration", async ({ command, ack, say }) => {
        log4js.getLogger().info("slash command: duration")
        updater.changeUpdatingDuration(command.text, say, getUserMentionLiteral(command.user_id))
        await ack();
    });

    updater.startTimer();
    
    (async () => {
        await app.start();
      
        log4js.getLogger().info("Bolt app is running up.");

        slackAction.postMessage("Initialized.")
    })();
}


