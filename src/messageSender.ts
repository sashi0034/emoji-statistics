import { App } from "@slack/bolt";
import Config from "./config.json";

export = MessageSender

class MessageSender{

    public constructor( 
        private readonly app: App,
        private readonly config: typeof Config
    )
    {}

    public async post(text: string){
        const res = await this.app.client.chat.postMessage({
            token: this.config.botToken,
            channel: this.config.targetChannel,
            text: text,
        })

        if (!res.ok) console.error(res)
    }
}


