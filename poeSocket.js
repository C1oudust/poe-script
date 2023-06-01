import WebSocket from 'ws';
import { config } from "./config.js";
export class PoeSocket {
    setting;
    ws;
    messageHandler;

    constructor(
        setting,
        messageHandler,
    ) {
        this.setting = JSON.parse(JSON.stringify(setting));
        this.messageHandler = messageHandler;
        this.connect();
    }

    getUrl(setting) {
        const url = new URL(`wss://tch${Math.floor(1e6 * Math.random()) + 1}.tch.${setting.tchannelData.baseHost}`);
        url.pathname = `/up/${setting.tchannelData.boxName}/updates`;
        url.searchParams.set('min_seq', setting.tchannelData.minSeq);
        url.searchParams.set('channel', setting.tchannelData.channel);
        url.searchParams.set('hash', setting.tchannelData.channelHash);
        return url.toString();
    }
    connect() {
        let url = this.getUrl(this.setting)
        this.ws = new WebSocket(url, { agent: config.proxyAgent })
        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('message', this.onMessage.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('error', this.onError.bind(this));
    }

    close() {
        this.ws.close();
    }

    onOpen() {}
    onMessage(data) {
        if (data.min_seq) {
            this.setting.tchannelData.minSeq = data.min_seq
        }
        if (data.messages) {
            for (const ms of data.messages) {
                const ms_obj = JSON.parse(ms)
                if (this.messageHandler && ms_obj.payload.data.messageAdded) {
                    this.messageHandler(ms_obj.payload.data.messageAdded)
                }
            }
        }
    }
    onClose() {}
    onError(e) {
        console.log('websocket error, please try again');
        process.exit();
    }
}