import { strict } from "assert"

export default
class EmojiProperty{
    private emojiCount: number = 0
    public get totalCount() {
        return this.emojiCount;
    }

    constructor(){}

    public addCount(){
        this.emojiCount++;
    }
}
