const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://qiita.com/organizations/" + process.argv[2]);
  const selector = ".of-ItemLink_header-title";
  let elems = await page.$$eval(selector, es => es.map(e => [e.textContent, e.href]));
  console.log(elems);
  await browser.close();
})();
