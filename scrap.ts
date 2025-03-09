import { Scraper } from "agent-twitter-client";

const scraper = new Scraper();
(async () => {
  // Define your cookies in the correct format - as an array of strings

//  console.log(await scraper.getCookies())

    const cookies = [
			"guest_id_marketing=v1%3A174134372592012097; Expires=Sun, 07 Mar 2027 10:35:25 GMT; Max-Age=63072000; Domain=twitter.com; Path=/; Secure; hostOnly=false; aAge=1ms; cAge=1644ms",
			"guest_id_ads=v1%3A174134372592012097; Expires=Sun, 07 Mar 2027 10:35:25 GMT; Max-Age=63072000; Domain=twitter.com; Path=/; Secure; hostOnly=false; aAge=4ms; cAge=1645ms",
			'personalization_id="v1_uRPlyGkwwjzUN27luta9ng=="; Expires=Sun, 07 Mar 2027 10:35:25 GMT; Max-Age=63072000; Domain=twitter.com; Path=/; Secure; hostOnly=false; aAge=4ms; cAge=1645ms',
			"guest_id=v1%3A174134372592012097; Expires=Sun, 07 Mar 2027 10:35:25 GMT; Max-Age=63072000; Domain=twitter.com; Path=/; Secure; hostOnly=false; aAge=4ms; cAge=1644ms",
			"kdt=2w3M2zy6CaXme0CbKAxBej6foXyKnm5tZEaxkRTK; Expires=Sat, 05 Sep 2026 10:35:27 GMT; Max-Age=47260800; Domain=twitter.com; Path=/; Secure; HttpOnly; hostOnly=false; aAge=4ms; cAge=420ms",
			'twid="u=1378556614089711618"; Expires=Wed, 06 Mar 2030 10:35:27 GMT; Max-Age=157680000; Domain=twitter.com; Path=/; Secure; hostOnly=false; aAge=4ms; cAge=419ms',
			"ct0=c7912359c9d3180c6fe37293f567a4087030dfdc080067334383e329145745ff82f2fda9b6a7439b23c30869200f602a59a3d4e4be74acac4e1ab3729ebcacdf82031be63298b57cbeffe4072798e14a; Expires=Wed, 06 Mar 2030 10:35:28 GMT; Max-Age=157680000; Domain=twitter.com; Path=/; Secure; SameSite=Lax; hostOnly=false; aAge=4ms; cAge=418ms",
			"auth_token=6ea0f3bc671c787cb5ae875f8a7fe03c764d3d4a; Expires=Wed, 06 Mar 2030 10:35:27 GMT; Max-Age=157680000; Domain=twitter.com; Path=/; Secure; HttpOnly; hostOnly=false; aAge=4ms; cAge=418ms",
			"att=1-yHwI6QbLPIw2eUCHY35CUsaGzlxbRbtorr6W8TLX; Expires=Sat, 08 Mar 2025 10:35:28 GMT; Max-Age=86400; Domain=twitter.com; Path=/; Secure; HttpOnly; hostOnly=false; aAge=4ms; cAge=7ms",
		];
  // Use the cookies array (which is actually defined above as 'cookie' but commented out)
 await scraper.setCookies((cookies)as any);
  
  const isLoggedIn = await scraper.fetchSearchTweets('pumfun',10,0)
  console.log(isLoggedIn);
})();


// import puppeteer from "puppeteer";

// interface SearchResult {
// 	title: string;
// 	link: string;
// }

// async function scrapeSearchEngine(
// 	query: string,
// 	useGoogle = false
// ): Promise<SearchResult[]> {
// 	const browser = await puppeteer.launch({
// 		executablePath: "/usr/bin/chromium-browser",
// 		args: [
// 			"--no-sandbox",
// 			"--disable-setuid-sandbox",
// 			"--disable-dev-shm-usage",
// 		],
// 	});
// 	const page = await browser.newPage();

// 	try {
// 		let searchUrl;
// 		if (useGoogle) {
// 			searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
// 				query
// 			)}`;
// 		} else {
// 			searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
// 		}

// 		await page.goto(searchUrl, { waitUntil: "networkidle0" });

// 		let results: SearchResult[];
// 		if (useGoogle) {
// 			await page.waitForSelector(".g");
// 			results = await page.evaluate(() => {
// 				return Array.from(document.querySelectorAll(".g"))
// 					.map((el) => ({
// 						title: el.querySelector("h3")?.textContent || "",
// 						link: el.querySelector("a")?.href || "",
// 					}))
// 					.slice(0, 10);
// 			});
// 		} else {

// 			await page.waitForSelector("article");
// 			results = await page.evaluate(() => {
// 				return Array.from(document.querySelectorAll("article"))
// 					.map((el) => ({
// 						title: el.querySelector("h2")?.textContent || "",
// 						link: el.querySelector("a")?.href || "",
// 					}))
// 					.filter((result) => result.title && result.link)
// 					.slice(0, 10);
// 			});
// 		}

// 		return results;
// 	} catch (error) {
// 		console.error("Scraping error:", error);
// 		return [];
// 	} finally {
// 		await browser.close();
// 	}
// }

// (async () => {
// 	const query = "Puppeteer web scraping";
// 	let results = await scrapeSearchEngine(query);

// 	// if (!results.length) {
// 	// 	console.log("No results found on DuckDuckGo, trying Google...");
// 	// 	results = await scrapeSearchEngine(query, true);
// 	// }

// 	console.log(results);
// })();
