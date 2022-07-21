
import Config from "./config.json";

import { App } from "@slack/bolt";
import MessageSender from "./messageSender";


function main(){
    const app: App = new App({
        token: Config.botToken,
        appToken: Config.appToken,
        socketMode: true
    });
    const config = Config

    console.log("hello world.");
    
    const sender = new MessageSender(app, config)

    sender.post("aho janaiyo")
}


main();
