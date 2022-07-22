

export = EmojiAnalyzer
class EmojiAnalyzer{
    emojiList: Array<String> = []

    constructor(
        private readonly text: string
    ){
        const emojis = text.match(/:[^:]+:/g)
        console.log(emojis)
    }

    public static test(){
        const testStr = "あいう:blender:えお:cat:かきくけこ:null-cat:"
        new EmojiAnalyzer(testStr)
    }
}

