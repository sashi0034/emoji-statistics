import { App, GenericMessageEvent } from "@slack/bolt";
import Config from "./config";
import EmojiAnalyzer from "./emojiAnalyzer";
import SlackActionWrapper from "./slackActionWrapper";

export = socketProcess
function socketProcess(){
    const app: App = new App({
        token: Config.botToken,
        appToken: Config.appToken,
        socketMode: true
    });
    const config = Config

    const sender = new SlackActionWrapper(app, config)

    app.event("message", async ({event, say}) =>{
        const messageEvent: GenericMessageEvent = event as GenericMessageEvent
        const analyzer = new EmojiAnalyzer(messageEvent.text as string);
    });

    (async () => {
        await app.start();
      
        console.log("Bolt app is running up.");

        sender.postMessage("This bot was initialized.")
    })();
}