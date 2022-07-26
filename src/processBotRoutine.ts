import { App, GenericMessageEvent } from "@slack/bolt";
import Config from "./config.json";
import EmojiStasticsPoster from "./stasticsPoster";
import SlackActionWrapper from "./slackActionWrapper";
import log4js from "log4js";
import StatisticsUpdater from "./statisticsUpdater";
import { getUserMentionText as getUserMentionLiteral } from "./util";
import CommandNaming from "./commandRegister";
import { connect } from "http2";

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
        analyzer.countUpEmojisByAnalyzingFromText(messageEvent.text as string, ()=>{updater.notifyUpdateProgressMessage();})
    });

    app.event("reaction_added", async ({event, say}) =>{
        analyzer.coutUpEmoji(event.reaction, ()=>{updater.notifyUpdateProgressMessage();});
    });

    app.event("emoji_changed", async ({event, say}) =>{
        log4js.getLogger().info("received emoji_changed:", event)
        const newEmojiName = event.name;

        if (event.subtype!=="add") return;
        if (newEmojiName===undefined) return;

        analyzer.registerNewEmoji(newEmojiName);
        log4js.getLogger().info("append new emoji: " + newEmojiName);
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


