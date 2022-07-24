import EmojiProperty from "./emojiProperty";
import SlackActionWrapper from "./slackActionWrapper"
import { makeZeroPadding, sleep } from "./util";
import log4js from 'log4js'
import DefaultEmojiList from "./defaultEmojiList";
import IntCounter from "./intCounter";

type BlockTextList = ({
    type: string; text: {
        type: string;
        text: string;
        emoji?: boolean;
    };
} | { type: string; })[]

export default
class EmojiStasticsPoster{
    private emojiMap: {[name: string]: EmojiProperty} = {}
    private startingDate: Date = new Date();
    private readonly defaultEmojiList: DefaultEmojiList = new DefaultEmojiList();
    private catchedEmojiCounter: IntCounter = new IntCounter();

    public get numCatchedEmoji(){
        return this.catchedEmojiCounter.count;
    }

    constructor(
        private readonly slackAction: SlackActionWrapper
    ){}

    public async restartTakeStatistics(){
        await this.initEmojiMap()
        this.catchedEmojiCounter.reset();
        this.startingDate = new Date()
        log4js.getLogger().info("restarted statistics.")
    }

    private async initEmojiMap(){
        const list = await this.slackAction.fetchEmojiList()

        for (const emoji of this.defaultEmojiList.emojis){
            this.emojiMap[emoji] = new EmojiProperty(emoji);
        }
        for (const emoji of list){
            this.emojiMap[emoji] = new EmojiProperty(emoji);
        }
    }

    public appendEmojisByAnalyzingFromText(text: string, onCompleted: ()=>void){
        if (this.countEmojiMap() == 0) return;
        if (text==undefined) return;

        //const emojis = text.match(/:[^:]+:/g)?.map(name => name.replace(/:/g, ""))
        // 正規表現ですると、"[12:00]:blender:"のような表現を抽出できないためこちらで実行。
        const emojis = text
            .split(":")
            .filter(str => str !==undefined && str!=="")
            .filter(str => str[0]!==" ")
        
        if (emojis==null) return

        let isFounded = false;
        for (let i=0; i<emojis.length; ++i){
            const emoji = emojis[i]

            const onFound = () => {
                isFounded = true;

                // ":blender:blender:blender:"のような表現を除くため、iを余分に進める
                i++;
            }

            this.appendEmoji(emoji, onFound);
        }
        if (isFounded) onCompleted();
    }

    public appendEmoji(emoji: string, onFound: ()=>void){
        const foundEmoji = this.emojiMap[emoji]

        if (foundEmoji==undefined) return;

        foundEmoji.addCount();
        this.catchedEmojiCounter.addCount();
        log4js.getLogger().info("count up emoji: " + emoji + ", " + foundEmoji.totalCount)
        onFound();
    }

    // 統計情報を送信
    public async postStatistics(){
        const startingDate = this.startingDate
        const endDate = new Date()

        const baseBlocks = this.getBaseBlocksToPost(startingDate, endDate)

        const rankingSortedList = 
            Object.values(this.emojiMap)
            .filter((prop)=>prop.totalCount>0)
            .sort((first, second)=>(first.totalCount < second.totalCount) ? 1 : -1);

        log4js.getLogger().info("sorted ranking list;")
        console.log(rankingSortedList)

        await this.pushRankingBlocksToListWithPosting(rankingSortedList, baseBlocks);
    }

    private async pushRankingBlocksToListWithPosting(rankingSortedList: EmojiProperty[], baseBlocks: BlockTextList) {
        let rankingIndex = 1;
        let beforeCountInRanking: number = rankingSortedList[0]!=undefined ? rankingSortedList[0].totalCount : 0;

        for (let i = 0; i < rankingSortedList.length; ++i) {
            if (beforeCountInRanking != rankingSortedList[i].totalCount) {
                rankingIndex++;;
                beforeCountInRanking = rankingSortedList[i].totalCount;
                baseBlocks.push(EmojiStasticsPoster.getDividerBlockText());
            }

            const rankingBlock = EmojiStasticsPoster.getEmojiRankingTextBlock(rankingIndex, rankingSortedList[i]);
            baseBlocks.push(rankingBlock);

            const maxListLength = 40;
            if (baseBlocks.length > maxListLength){
                await this.slackAction.postBlockText("emoji ranking", baseBlocks)

                const postableInterval = 1000 * 2;
                await sleep(postableInterval);

                // Remove all in list.
                baseBlocks.splice(0);
            }
        }

        await this.slackAction.postBlockText("emoji ranking", baseBlocks)
    }

    private getBaseBlocksToPost(startingDate: Date, endDate: Date): BlockTextList {
        return [
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
        ];
    }

    private static getEmojiRankingTextBlock(rank: number, emoji: EmojiProperty){
        console.assert(emoji!=undefined && emoji!=null, "emoji has no value.")

        const emojiLiteral = ":" + emoji.name + ":"
        
        const result = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*" + rank + EmojiStasticsPoster.getRankingSuffixText(rank) + "*    " + emojiLiteral + "    *" + emoji.totalCount + "* uses: " +  emoji.name                    ,
            }
        };
        
        return result;
    }

    private static getDividerBlockText(){
        const divider = {
            "type": "divider"
        };
        return divider;
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
            makeZeroPadding(date.getMonth()+1, 2) + "/" + makeZeroPadding(date.getDate(), 2) + " " +
            makeZeroPadding(date.getHours(), 2) + ":" + makeZeroPadding(date.getMinutes(), 2)
        return dateText;
    }

    private countEmojiMap() {
        return Object.keys(this.emojiMap).length;
    }

}

