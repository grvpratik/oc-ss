// import { Scraper } from "agent-twitter-client";

// const scraper = new Scraper();
// (async () => {
//    const isLoggedIn = await scraper.isLoggedIn();
//     console.log(isLoggedIn)
//     // const tweetGenerator = scraper.getTweets("elonmusk", 1);
//     // const tweets: any = [];
//     // for await (const tweet of tweetGenerator) {
//     //     tweets.push(tweet);
//     // }
//     // console.log(tweets);
// })();
import puppeteer from "puppeteer";

interface SearchResult {
	title: string;
	link: string;
}

async function scrapeSearchEngine(
	query: string,
	useGoogle = false
): Promise<SearchResult[]> {
	const browser = await puppeteer.launch({
		executablePath: "/usr/bin/chromium-browser",
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
		],
	});
	const page = await browser.newPage();

	try {
		let searchUrl;
		if (useGoogle) {
			searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
				query
			)}`;
		} else {
			searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
		}

		await page.goto(searchUrl, { waitUntil: "networkidle0" });

		let results: SearchResult[];
		if (useGoogle) {
			await page.waitForSelector(".g");
			results = await page.evaluate(() => {
				return Array.from(document.querySelectorAll(".g"))
					.map((el) => ({
						title: el.querySelector("h3")?.textContent || "",
						link: el.querySelector("a")?.href || "",
					}))
					.slice(0, 10);
			});
		} else {
			
			await page.waitForSelector("article");
			results = await page.evaluate(() => {
				return Array.from(document.querySelectorAll("article"))
					.map((el) => ({
						title: el.querySelector("h2")?.textContent || "",
						link: el.querySelector("a")?.href || "",
					}))
					.filter((result) => result.title && result.link)
					.slice(0, 10);
			});
		}

		return results;
	} catch (error) {
		console.error("Scraping error:", error);
		return [];
	} finally {
		await browser.close();
	}
}

(async () => {
	const query = "Puppeteer web scraping";
	let results = await scrapeSearchEngine(query);

	// if (!results.length) {
	// 	console.log("No results found on DuckDuckGo, trying Google...");
	// 	results = await scrapeSearchEngine(query, true);
	// }

	console.log(results);
})();
