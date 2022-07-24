import { App, GenericMessageEvent } from "@slack/bolt";
import Config from "./config.json";
import EmojiStasticsPoster from "./emojiStasticsPoster";
import SlackActionWrapper from "./slackActionWrapper";
import log4js from "log4js";
import StatisticsUpdater from "./statisticsUpdater";
import { getUserMentionText as getUserMentionLiteral } from "./util";
import CommandNaming from "./commandRegister";

export async function processBotRoutine(){
    const app: App = new App({
        token: Config.botToken,
        appToken: Config.appToken,
        
        socketMode: true
    });

    const slackAction = new SlackActionWrapper(app, Config)
    await slackAction.postMessage("Initializing...")

    const analyzer = new EmojiStasticsPoster(slackAction);
    const updater = new StatisticsUpdater(analyzer, slackAction)

    app.event("message", async ({event, say}) =>{
        const messageEvent: GenericMessageEvent = event as GenericMessageEvent
        analyzer.appendEmojisByAnalyzingFromText(messageEvent.text as string, ()=>{updater.updateProgressMessage();})
    });

    app.event("reaction_added", async ({event, say}) =>{
        analyzer.appendEmoji(event.reaction, ()=>{updater.updateProgressMessage();});
    });

    const commandNaming = new CommandNaming(Config.botName);
    app.command(commandNaming.getName("duration"), async ({ command, ack, say }) => {
        log4js.getLogger().info(commandNaming.getName("duration"))
        updater.changeUpdatingDuration(command.text, say, getUserMentionLiteral(command.user_id))
        await ack();
    });

    updater.startTimer();
    
    await app.start();
    
    log4js.getLogger().info("Bolt app is running up.");
}


