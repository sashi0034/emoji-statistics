import { App, GenericMessageEvent } from "@slack/bolt";
import Config from "./config.json";
import EmojiAnalyzer from "./emojiAnalyzer";
import SlackActionWrapper from "./slackActionWrapper";
import log4js from "log4js";

export default
function socketProcess(){
    const app: App = new App({
        token: Config.botToken,
        appToken: Config.appToken,
        socketMode: true
    });
    const config = Config

    const slackAction = new SlackActionWrapper(app, config)
    const analyzer = new EmojiAnalyzer(slackAction);
    analyzer.initEmojiMap()

    app.event("message", async ({event, say}) =>{
        const messageEvent: GenericMessageEvent = event as GenericMessageEvent
        analyzer.analyse(messageEvent.text as string)
    });

    (async () => {
        await app.start();
      
        log4js.getLogger().info("Bolt app is running up.");

        slackAction.postMessage("This bot was initialized.")
    })();
}