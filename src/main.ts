
import {processBotRoutine} from "./processBotRoutine";
import log4js from 'log4js'

function main(){
    log4js.getLogger().level = "all"
    processBotRoutine()
}


main();
