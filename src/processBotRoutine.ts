import { App, GenericMessageEvent } from "@slack/bolt";
import Config from "./config.json";
import EmojiAnalyzer from "./emojiAnalyzer";
import MessageSender from "./messageSender";

export = socketProcess
function socketProcess(){
    const app: App = new App({
        token: Config.botToken,
        appToken: Config.appToken,
        socketMode: true
    });
    const config = Config

    const sender = new MessageSender(app, config)

    app.event("message", async ({event, say}) =>{
        const messageEvent: GenericMessageEvent = event as GenericMessageEvent
        const analyzer = new EmojiAnalyzer(messageEvent.text as string);
    });

    (async () => {
        await app.start();
      
        console.log("Bolt app is running up.");

        sender.post("This bot was initialized.")
    })();
}