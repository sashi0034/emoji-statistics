import { EmojiChangedEvent, GenericMessageEvent, ReactionAddedEvent, SayFn, SlashCommand } from "@slack/bolt";
import SlackActionWrapper from "./slackActionWrapper";
import StasticsContributor from "./stasticsContributor";
import StatisticsUpdater from "./statisticsUpdater";
import log4js from "log4js"
import CommandNaming from "./commandRegister";
import config from "./config.json"
import { getUserMentionLiteral } from "./util";

class ProcessRecord{
    public readonly contributor: StasticsContributor;
    public readonly updator: StatisticsUpdater;

    public constructor(slackAction: SlackActionWrapper, finishingDurationMinutes: number){
        this.contributor = new StasticsContributor(slackAction);
        this.updator = new StatisticsUpdater(this.contributor, slackAction, finishingDurationMinutes)
    }
    public get isAlive(){
        return this.updator.isAlive;
    }
}

class ProcessCollection{
    private readonly processList: ProcessRecord[] = []

    public append(process: ProcessRecord){
        this.processList.push(process);
    }

    public get length(){
        return this.processList.length;
    }
    
    public async forEachAsync(func: (process: ProcessRecord)=>Promise<void>){
        const gabageList: ProcessRecord[] = [];

        for (const process of this.processList){
            if (!process.isAlive){
                gabageList.push(process);
                continue;
            }
            await func(process);
        }

        for (const garbage of gabageList){
            this.removeProccess(garbage);
        }
    }

    private removeProccess(garbage: ProcessRecord) {
        const garbageIndex = this.processList.indexOf(garbage);
        this.processList.splice(garbageIndex, 1);
    }
}


export default
class EmojiStasticsController{
    private readonly processList: ProcessCollection = new ProcessCollection();

    public constructor(
        private readonly slackAction: SlackActionWrapper,
        private readonly commandNaming: CommandNaming
    ){
    }

    public onReceivedMessage(event: GenericMessageEvent){
        const messageEvent: GenericMessageEvent = event as GenericMessageEvent

        this.processList.forEachAsync(async (process) => {
            process.contributor.countUpEmojisByAnalyzingFromText(messageEvent.text as string, ()=>{process.updator.notifyUpdateProgressMessage();})
        });
    }

    public onReactionAdded(event: ReactionAddedEvent){
        this.processList.forEachAsync(async (process) => {
            process.contributor.coutUpEmoji(event.reaction, ()=>{process.updator.notifyUpdateProgressMessage();})
        });
    }

    public onEmojiChanged(event: EmojiChangedEvent){
        log4js.getLogger().info("received emoji_changed:", event)
        const newEmojiName = event.name;

        if (event.subtype!=="add") return;
        if (newEmojiName===undefined) return;


        this.processList.forEachAsync(async process => {
            process.contributor.registerNewEmoji(newEmojiName);
        });

        log4js.getLogger().info("append new emoji: " + newEmojiName);
    }

    public async onCommandNew(command: SlashCommand, say: SayFn){
        log4js.getLogger().info(this.commandNaming.getName("new"))

        const numMinute = parseInt(command.text, 10);
        const maxMinute = 365 * 24 * 60;
        const userLiteral = getUserMentionLiteral(command.user_id);
        const maxProcessLength = 5;

        if (!(0 < numMinute && numMinute <= maxMinute)){
            say(userLiteral + " invalide input minutes.");   
        }else if  (this.processList.length > maxProcessLength){
            say(userLiteral + " failed to create new process because of already running many processes.");
        }else{
            const newProcess = new ProcessRecord(this.slackAction, numMinute);
            this.processList.append(newProcess);
            newProcess.updator.startTimer();

            await say("New " + numMinute + " minutes statistics process was created by "+ userLiteral + ".");
        }
    }

    public async onCommandPublish(){
        this.processList.forEachAsync(async (process)=>{
            await process.contributor.postStatistics();
        })
    }

}

