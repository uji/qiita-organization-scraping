const { App, ExpressReceiver } = require("@slack/bolt");
const puppeteer = require("puppeteer");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver
});

const fs = require("fs");
const path = "latest.text";
const channel = process.env.SLACK_CHANNEL

let data;
fs.readFile(path, "utf8", function (_, file) {
  data = file;
});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://qiita.com/organizations/" + process.argv[2]);
  const selector = ".of-ItemLink_header-title";
  let elems = await page.$$eval(selector, es => es.map(e => [e.textContent, e.href]));
  await browser.close();

  let posts = [];
  elems.some(elem => {
    if (elem[0] === data) {
      return true;
    }
    posts.push(elem);
  });
  console.log(posts);

  if (posts.length == 0) return;

  await app.client.chat.postMessage({
    channel: channel,
    blocks:
      [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Qiitaに新しい記事が投稿されました*"
          }
        }
      ],
    token: process.env.SLACK_BOT_TOKEN
  });

  await posts.forEach(post => {
    app.client.chat.postMessage({
      channel: channel,
      text: post[1],
      token: process.env.SLACK_BOT_TOKEN
    });
  });

  fs.writeFile(path, elems[0][0], function (err) {
    if (err) {
        throw err;
    }
  });
})();
