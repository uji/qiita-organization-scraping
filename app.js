
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "ap-northeast-1" });
const chromium = require("chrome-aws-lambda");
const { App, ExpressReceiver } = require("@slack/bolt");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver
});

let s3Params = {
  Bucket: process.env.BUCKET_NAME,
  Key: process.env.FILE_NAME,
};
const channel = process.env.SLACK_CHANNEL;
function postSection (post) {
  return {
    "type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*<" + post[1] + "|" + post[0] +">* \n"
			},
      // "accessory": {
			// 	"type": "image",
			// 	"image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c7ed05m9lC2EmA3Aruue7A/o.jpg",
			// 	"alt_text": "alt text for image"
			// }
  };
}


exports.handler = async (event, context) => {
  let browser = null;
  let latest = "";
  let posts = [];
  let blocks = "";

  try {
    await s3.getObject(s3Params, (err, data) => {
      if (err) return context.fail(err);
      else latest = data.Body.toString();
    });

    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    let page = await browser.newPage();

    await page.goto("http://qiita.com/organizations/" + process.env.ORGANIZATION_NAME);
    const selector = ".of-ItemLink_header-title";
    let elems = await page.$$eval(selector, es => es.map(e => [e.textContent, e.href]));

    await elems.some(elem => {
      if (elem[0] === latest) {
        return true;
      }
      posts.push(elem);
    });
    if (posts.length == 0) return context.done();

    blocks = [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Qiitaに新しい記事が投稿されました*"
      }
    }];

    await posts.forEach(post => {
      blocks.push(postSection(post));
    });
    console.log(blocks);

    await app.client.chat.postMessage({
      channel: channel,
      blocks: blocks,
      token: process.env.SLACK_BOT_TOKEN
    });

    await posts.forEach(post => {
      app.client.chat.postMessage({
        channel: channel,
        text: post[1],
        token: process.env.SLACK_BOT_TOKEN
      });
    });

    s3Params.Body = posts[0][0];

    await s3.putObject(s3Params, (err) => {
      if (err) return context.fail(err);
    });
  } catch (error) {
    return context.fail(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return context.succeed(blocks);
};
;
