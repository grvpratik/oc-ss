import { TwitterApi } from "twitter-api-v2";
import * as dotenv from "dotenv";
dotenv.config();

const twitterClient = new TwitterApi({
	appKey: process.env.TWITTER_API_KEY! as string,
	appSecret: process.env.TWITTER_API_SECRET_KEY! as string,
	accessToken: process.env.TWITTER_ACCESS_TOKEN! as string,
	accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET! as string,
});

const readOnlyClient = twitterClient.readOnly;

(async () => {
	const user = await readOnlyClient.v2.userByUsername('plhery');
	const list= await readOnlyClient.v2.search('lol')
	console.log(list)
	//await twitterClient.v2.tweet("Hello, this is a test. 2");

	console.log("tweet");
})();
