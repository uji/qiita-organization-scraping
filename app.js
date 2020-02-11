const rp = require("request-promise");
const cheerio = require("cheerio");

const options = {
  transform: body => {
    return cheerio.load(body);
  }
};

const name = process.argv[2];

rp.get("http://qiita.com/organizations/" + name + "/members", options)
  .then($ => {
    $("span", ".od-MemberCardHeaderIdentities_name").each((i, elem) => {
      console.log($(elem).text());
    });
  })
  .catch(error => {
    console.error("Error:", error);
  });
