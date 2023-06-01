import { v4 as uuid4 } from 'uuid';

class Config {
    headers = {
        'authority': 'poe.com',
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'cookie': '',
        'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.57'
    };
    queryBody = {
        'queryName': 'chatHelpers_sendMessageMutation_Mutation',
        'variables': {
            'chatId': 0,
            'bot': 'capybara',
            'query': '',
            'source': null,
            'withChatBreak': false,
            'clientNonce': '',
            'sdid': uuid4(),
        },
        'query': 'mutation chatHelpers_sendMessageMutation_Mutation(\n  $chatId: BigInt!\n  $bot: String!\n  $query: String!\n  $source: MessageSource\n  $withChatBreak: Boolean!\n  $clientNonce: String\n  $sdid: String\n) {\n  messageEdgeCreate(chatId: $chatId, bot: $bot, query: $query, source: $source, withChatBreak: $withChatBreak, clientNonce: $clientNonce, sdid: $sdid) {\n    chatBreak {\n      cursor\n      node {\n        id\n        messageId\n        text\n        author\n        suggestedReplies\n        creationTime\n        state\n      }\n      id\n    }\n    message {\n      cursor\n      node {\n        id\n        messageId\n        text\n        author\n        suggestedReplies\n        creationTime\n        state\n        clientNonce\n        contentType\n        chat {\n          shouldShowDisclaimer\n          id\n        }\n      }\n      id\n    }\n    status\n  }\n}\n'
    };

    salt = 'WpuLMiXEKKE98j56k';
    graphQLSendUrl = 'https://poe.com/api/gql_POST';
    homePageUrl = 'https://poe.com/Sage';
    settingsUrl = 'https://poe.com/api/settings';

    formkey = '';
    channel = '';
    _bot = 'Sage';
    _botMap = {
        'ChatGPT': 'chinchilla',
        'Sage': 'capybara',
        'Claude-instant': 'a2'
    };
    set bot(name) {
        this._bot = name;
        this.homePageUrl = `https://poe.com/${name}`;
        this.queryBody['variables']['bot'] = this._botMap[name];
    }
    get bot() {
        return this._bot;
    }

    proxyAgent;
}

export const config = new Config();