import { App, Block, KnownBlock } from "@slack/bolt";
import { stringify } from "querystring";
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

        return res;
    }

    public async updateMessage(timeStamp: string, text: string){
        const result = await this.app.client.chat.update({
            token: this.config.botToken,
            channel: this.config.targetChannel,
            ts: timeStamp,
            text: text,
        })

        if (!result.ok) console.error(result)

        return result;
    }

    public async updateBlockText(timeStamp: string, text: string, blocks: (KnownBlock | Block)[]){
        const result = await this.app.client.chat.update({
            token: this.config.botToken,
            channel: this.config.targetChannel,
            ts: timeStamp,
            text: text,
            blocks: blocks,
        })

        if (!result.ok) console.error(result)

        return result;
    }

    public async postBlockText(text: string, blocks: (KnownBlock | Block)[]){
        const result = await this.app.client.chat.postMessage({
            token: this.config.botToken,
            channel: this.config.targetChannel,
            text: text,
            blocks: blocks
        })

        if (!result.ok) console.error(result)

        return result
    }

    public async addPinsItem(timeStamp: string){
        const result = await this.app.client.pins.add({
            token: this.config.botToken,
            channel: this.config.targetChannel,
            timestamp: timeStamp
        })

        if (!result.ok) console.error(result)

        return result
    }

    public async removePinsItem(timeStamp: string){
        const result = await this.app.client.pins.remove({
            token: this.config.botToken,
            channel: this.config.targetChannel,
            timestamp: timeStamp
        })

        if (!result.ok) console.error(result)

        return result
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


