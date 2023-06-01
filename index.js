import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { load } from "cheerio";
import { v4 as uuid4 } from 'uuid';
import fetch from 'node-fetch';
import * as vm from 'vm';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { PoeSocket } from "./poeSocket.js";
import { config } from "./config.js";

function choiceBot() {
    const map = {
        '1': 'ChatGPT',
        '2': 'Sage',
        '3': 'Claude-instant'
    };
    return new Promise((resolve, reject) => {
        process.stdout.write('Choice bot: 1. chat-gpt3.5, 2. Sage, 3. claude (input number): ');
        process.stdin.on('data', (data) => {
            const i = data.toString().trim();
            if (i && ['1', '2', '3'].includes(i)) {
                config.bot = map[i]
                resolve()
            } else {
                reject()
            }
        });
    });
}

async function getHomePage() {
    const url = new URL(config.homePageUrl);
    const headers = {
        ...config.headers,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
    };
    const res = await fetch(url.toString(), { agent: config.proxyAgent, headers });
    return await res.text();
}

let waiting = false;
let text = '';

function messageHandler(message) {
    if (message.author == 'human') return;
    const chars = message['text'].slice(text.length)
    if (chars && !waiting) {
        process.stdout.write(chars)
        text = message['text']
    }
    if (message['state'] == 'complete') {
        if (!waiting) {
            waiting = true;
            text = "";
            process.stdout.write('\n');
            process.stdout.write('You: ');
        }
    }
}

async function getSetting() {
    const url = new URL(config.settingsUrl);
    url.searchParams.append('channel', config.channel);
    const headers = {
        ...config.headers,
        'referer': `https://poe.com/${config.bot}`,
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
    };
    const res = await fetch(url.toString(), { agent: config.proxyAgent, headers });
    return await res.json();
}

let poeSocket;
async function init() {
    try {
        const data = await readFile('config.json', 'utf8');
        const { channel, cookie, proxy } = JSON.parse(data);
        if (!channel || !cookie) throw new Error('config error');
        config.channel = channel;
        config.headers['cookie'] = cookie;
        proxy && (config.proxyAgent = new HttpsProxyAgent(proxy));
    } catch (err) {
        console.error('config.json 读取错误，确保该文件存在且格式正确', err);
        process.exit();
    }

    const html = await getHomePage();
    const parser = load(html);
    // poe-formkey
    const code = parser('head > script:nth-of-type(1)').text();
    const w = {};
    const context = vm.createContext({ window: w });
    vm.runInContext(code, context);
    config.formkey = w[Object.keys(w)[0]]();

    // chatId
    const obj = JSON.parse(parser('#__NEXT_DATA__').text());
    config.queryBody['variables']['chatId'] = obj.props.pageProps.payload.chatOfBotDisplayName.chatId;


    // start socket
    let setting = await getSetting();
    poeSocket = new PoeSocket(setting, messageHandler);
}

function genClientNonce() {
    let nonce = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 16; i++) {
        nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
}

function getSendQueryQL(query, nonce) {
    const ql = JSON.parse(JSON.stringify(config.queryBody))
    ql.variables.query = query
    ql.variables.clientNonce = nonce
    return ql
}

function md5(input) {
    const md5 = createHash('md5');
    md5.update(input);
    return md5.digest('hex');
}

async function sendQuery(query) {
    const nonce = genClientNonce();
    const graphQL = getSendQueryQL(query, nonce);
    const formkey = config.formkey;
    const body = JSON.stringify(graphQL);
    const tarId = md5(body + formkey + config.salt);
    const headers = {
        ...config.headers,
        'referer': `https://poe.com/${config.bot}`,
        'content-type': 'application/json',
        'origin': 'https://poe.com',
        'poe-formkey': config.formkey,
        'poe-tag-id': tarId,
        'poe-tchannel': config.channel,
        'traceparent': ''
    };
    const res = await fetch(
        config.graphQLSendUrl, {
            agent: config.proxyAgent,
            method: 'POST',
            headers,
            body
        }
    );
    if (res.ok) {
        return await res.json();
    } else {
        throw new Error(`send query failed: ${await res.text()}`);
    }
}

function exit() {
    poeSocket && poeSocket.close();
    process.exit();
}

function main() {
    choiceBot().then(async () => {
        await init();

        process.stdout.write('You: ')
        process.stdin.on('data', async (data) => {
            const query = data.toString().trim();
            if (query) {
                await sendQuery(query);
                process.stdout.write(`${config.bot}: `);
                waiting = false;
            }
        })
        process.on('SIGINT', exit);
    }, () => {
        process.stdout.write('input wrong number\n');
        main();
    });
}

main();