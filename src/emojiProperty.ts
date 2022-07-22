import { strict } from "assert"

export default
class EmojiProperty{
    private emojiCount: number = 0
    public get totalCount() {
        return this.emojiCount;
    }
    public get name(){
        return this.emojiName
    }

    constructor(
        private readonly emojiName: string
    ){}

    public addCount(){
        this.emojiCount++;
    }
}
