
export default
class IntCounter{
    private totalCount = 0;
    public get count(){
        return this.totalCount;
    }

    public constructor(){}

    public addCount(){
        this.totalCount++;
    }
    
    public reset(){
        this.totalCount = 0;
    }
}