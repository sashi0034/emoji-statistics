import EmojiProperty from "./emojiProperty";
import SlackActionWrapper from "./slackActionWrapper"
import log4js from 'log4js'


export default
class EmojiAnalyzer{
    emojiMap: {[name: string]: EmojiProperty} = {}

    constructor(
        private readonly slackAction: SlackActionWrapper,
    ){}

    public async initEmojiMap(){
        const list = await this.slackAction.fetchEmojiList()

        for (const emoji of list){
            this.emojiMap[emoji] = new EmojiProperty()
        }
    }

    public analyse(text: string){
        if (this.countEmojiMap() == 0) return;

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

    private countEmojiMap() {
        return Object.keys(this.emojiMap).length;
    }

    public static test(){
        const testStr = "あいう:blender:えお:cat:かきくけこ:null-cat:"
        //new EmojiAnalyzer(testStr)
    }
}

