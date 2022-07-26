import { App, GenericMessageEvent } from "@slack/bolt";
import Config from "./config.json";
import StasticsContributor from "./stasticsContributor";
import SlackActionWrapper from "./slackActionWrapper";
import log4js from "log4js";
import StatisticsUpdater from "./statisticsUpdater";
import { getUserMentionLiteral as getUserMentionLiteral } from "./util";
import CommandNaming from "./commandRegister";
import { connect } from "http2";
import EmojiStasticsController from "./emojiStatisticsController";

export async function processBotRoutine(){
    const app: App = new App({
        token: Config.botToken,
        appToken: Config.appToken,
        
        socketMode: true
    });

    const slackAction = new SlackActionWrapper(app, Config)
    await slackAction.postMessage("Initializing...")

    const commandNaming = new CommandNaming(Config.botName);

    const statisticsController = new EmojiStasticsController(slackAction, commandNaming);

    app.event("message", async ({event, say}) =>{
        const messageEvent: GenericMessageEvent = event as GenericMessageEvent
        statisticsController.onReceivedMessage(messageEvent)
    });

    app.event("reaction_added", async ({event, say}) =>{
        statisticsController.onReactionAdded(event);
    });

    app.event("emoji_changed", async ({event, say}) =>{
        statisticsController.onEmojiChanged(event);
    });

    // app.command(commandNaming.getName("duration"), async ({ command, ack, say }) => {
    //     log4js.getLogger().info(commandNaming.getName("duration"))
    //     updater.changeUpdatingDuration(command.text, say, getUserMentionLiteral(command.user_id))
    //     await ack();
    // });

    app.command(commandNaming.getName("new"), async ({ command, ack, say }) => {
        await ack();
        await statisticsController.onCommandNew(command, say);
    });
    
    app.command(commandNaming.getName("publish"), async ({ command, ack, say }) => {
        await ack();
        await statisticsController.onCommandPublish();
    });

    await app.start();

    log4js.getLogger().info("Bolt app is running up.");

    await slackAction.postMessage("App is running up.");
}


