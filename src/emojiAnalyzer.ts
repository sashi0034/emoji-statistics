import EmojiProperty from "./emojiProperty";
import SlackActionWrapper from "./slackActionWrapper"
import log4js from 'log4js'
import { makeZeroPadding } from "./util";


export default
class EmojiAnalyzer{
    emojiMap: {[name: string]: EmojiProperty} = {}
    startingDate: Date = new Date();

    constructor(
        private readonly slackAction: SlackActionWrapper,
    ){}

    public async restartTakeStatistics(){
        await this.initEmojiMap()
        this.startingDate = new Date()
        log4js.getLogger().info("restarted statistics.")
    }

    private async initEmojiMap(){
        const list = await this.slackAction.fetchEmojiList()

        for (const emoji of list){
            this.emojiMap[emoji] = new EmojiProperty(emoji);
        }
    }

    public analyse(text: string){
        if (this.countEmojiMap() == 0) return;
        if (text==undefined) return;

        //const emojis = text.match(/:[^:]+:/g)?.map(name => name.replace(/:/g, ""))
        // 正規表現ですると、"[12:00]:blender:"のような表現を抽出できないためこちらで実行。
        const emojis = text.split(":")
        
        if (emojis==null) return

        for (let i=0; i<emojis.length; ++i){
            const emoji = emojis[i]
            const foundEmoji = this.emojiMap[emoji]

            if (foundEmoji!=undefined){
                foundEmoji.addCount()
                log4js.getLogger().info("count up emoji: " + emoji + ", " + foundEmoji.totalCount)

                // "":blender:blender:blender:"のような表現を除くため、iを余分に進める
                i++;
            }
        }
    }

    public async postStatistics(){
        const startingDate = this.startingDate
        const endDate = new Date()

        const baseBlocks: ({
            type: string;
            text: {
                type: string;
                text: string;
                emoji?: boolean;
            };
        } | {
            type: string;
        })[] = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": ":crown: Emoji Uses Ranking " + this.getDateText(startingDate) + " ~ " + this.getDateText(endDate) + " :crown:",
                    "emoji": true
                }
            },
            {
                "type": "divider"
            }
        ]

        const rankingSortedList = 
            Object.values(this.emojiMap)
            .filter((prop)=>prop.totalCount>0)
            .sort((first, second)=>(first.totalCount < second.totalCount) ? 1 : -1);
        console.log(rankingSortedList)

        let rankingIndex = 1;
        let beforeCountInRanking = rankingSortedList[0];
        for (let i=0; i < rankingSortedList.length; ++i){
            if (beforeCountInRanking!=rankingSortedList[i]){
                rankingIndex++;;
                beforeCountInRanking=rankingSortedList[i];
            }

            const rankingBlock = EmojiAnalyzer.getEmojiRankingTextBlock(rankingIndex, rankingSortedList[i])
            baseBlocks.push(rankingBlock.text)
            baseBlocks.push(rankingBlock.divider)
        }

        await this.slackAction.postBlockText("emoji ranking", baseBlocks)
    }

    private static getEmojiRankingTextBlock(rank: number, emoji: EmojiProperty){
        console.assert(emoji!=undefined && emoji!=null, "emoji has no value.")

        const emojiLiteral = ":" + emoji.name + ":"
        
        const text = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*" + rank + EmojiAnalyzer.getRankingSuffixText(rank) + "*    " + emojiLiteral + "    *" + emoji.totalCount + "* uses: " +  emoji.name                    ,
            }
        }
        const divider = {
            "type": "divider"
        }
        
        return {
            text: text,
            divider: divider
        }
    }

    private static getRankingSuffixText(orderIndex: number){
        console.assert(orderIndex>0, "Order must be positive.")
        
        switch (orderIndex){
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }

    private getDateText(date: Date){
        const dateText = 
            makeZeroPadding(date.getMonth(), 2) + "/" + makeZeroPadding(date.getDay(), 2) + " " +
            makeZeroPadding(date.getHours(), 2) + ":" + makeZeroPadding(date.getMinutes(), 2)
        return dateText;
    }

    private countEmojiMap() {
        return Object.keys(this.emojiMap).length;
    }

}

