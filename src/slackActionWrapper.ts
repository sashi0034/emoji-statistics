import { App } from "@slack/bolt";
import Config from "./config";

export = SlackActionWrapper

class SlackActionWrapper{

    public constructor( 
        private readonly app: App,
        private readonly config: typeof Config
    )
    {}

    public async postMessage(text: string){
        const res = await this.app.client.chat.postMessage({
            token: this.config.botToken,
            channel: this.config.targetChannel,
            text: text,
        })

        if (!res.ok) console.error(res)
    }
}


