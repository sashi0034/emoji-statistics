import { App } from "@slack/bolt";
import Config from "./config.json";

export default

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

    public async fetchEmojiList(): Promise<Array<string>>{
        let result: Array<string> = [];

        const fetchedList = await this.app.client.emoji.list({
            token: this.config.botToken
        });

        if (fetchedList.emoji==null) return result;

        for (let emoji in fetchedList.emoji){
            result.push(emoji);
        }

        return result;
    }
}


