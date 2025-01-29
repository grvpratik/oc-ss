import { Scraper } from "agent-twitter-client";

const scraper = new Scraper();
(async () => {
   const isLoggedIn = await scraper.isLoggedIn();
    console.log(isLoggedIn)
    // const tweetGenerator = scraper.getTweets("elonmusk", 1);
    // const tweets: any = [];
    // for await (const tweet of tweetGenerator) {
    //     tweets.push(tweet);
    // }
    // console.log(tweets);
})();
