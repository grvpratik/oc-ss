import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
// import data from "./data/pump-fun-data-4.json" with { type: "json" };

interface FetchAndSaveOptions {
	pretty?: boolean;
	encoding?: BufferEncoding;
	appendMode?: boolean;
}

async function fetchPumpFunData(
	filename: string,
	options: FetchAndSaveOptions = {}
): Promise<void> {
	const { pretty = true, encoding = "utf-8", appendMode = false } = options;

	try {
		const response = await fetch(
			"https://frontend-api-v3.pump.fun/coins?offset=0&limit=10&sort=market_cap&includeNsfw=false&order=DESC",
			{
				headers: {
					accept: "*/*",
					"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
					"if-none-match": 'W/"fb81-DvNdaYnPK9gfBHjCZ2rwManffBs"',
					priority: "u=1, i",
					"sec-ch-ua":
						'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": '"Windows"',
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "same-site",
					Referer: "https://pump.fun/",
					"Referrer-Policy": "strict-origin-when-cross-origin",
				},
				method: "GET",
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		// Ensure the directory exists
		const dir = path.dirname(filename);
		await fs.mkdir(dir, { recursive: true });

		if (appendMode) {
			let existingData: any[] = [];
			try {
				const fileContent = await fs.readFile(filename, { encoding });
				existingData = JSON.parse(fileContent.toString());
				if (!Array.isArray(existingData)) {
					existingData = [existingData];
				}
			} catch (error) {
				// File doesn't exist or is invalid, start with empty array
			}

			existingData.push(data);
			await fs.writeFile(
				filename,
				JSON.stringify(existingData, null, pretty ? 2 : 0),
				{ encoding }
			);
		} else {
			await fs.writeFile(filename, JSON.stringify(data, null, pretty ? 2 : 0), {
				encoding,
			});
		}

		console.log(`Data successfully saved to ${filename}`);
		console.log("Fetched data:", data); // Log the data to console as well
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to fetch and save JSON: ${error.message}`);
		}
		throw error;
	}
}
const coinTrades = async (coins: any[]) => {
	coins.forEach(async (coin) => {
		const contractAddress = coin.mint;
		const response = await fetch(
			`https://frontend-api-v3.pump.fun/trades/all/${contractAddress}?limit=5000&offset=0&minimumSize=50000000`,
			{
				headers: {
					accept: "*/*",
					"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
					"if-none-match": 'W/"1247e-BaWp+77xrgFPmUh1L+fkgxR6EBU"',
					priority: "u=1, i",
					"sec-ch-ua":
						'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": '"Windows"',
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "same-site",
				},
				referrer: "https://pump.fun/",
				referrerPolicy: "strict-origin-when-cross-origin",
				body: null,
				method: "GET",
				mode: "cors",
				credentials: "omit",
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
	});
};

// (async () => {
// 	try {
// 		await fetchPumpFunData("./data/pump-fun-data-TEST.json", { pretty: true });
// 	} catch (error) {
// 		console.error("Error:", error);
// 	}
// })();

// export { fetchPumpFunData, FetchAndSaveOptions };
// async function getData() {
// 	await fetchPumpFunData("./data/output.json", {
// 		pretty: true,
// 		appendMode: false,
// 	});
// }

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// const TRADE_LIMIT = 200;
// const MIN_SOL_SIZE = 50000000;

// const MAX_RETRIES = 3;
// const RETRY_DELAY = 1000; // 1 second

// const fetchWithRetry = async (url, options, retries = MAX_RETRIES) => {
// 	for (let attempt = 1; attempt <= retries; attempt++) {
// 		try {
// 			const result = await axios.get(url, options);
// 			return result;
// 		} catch (error) {
// 			if (attempt === retries) {
// 				throw error;
// 			}
// 			console.log(`Attempt ${attempt} failed. Retrying in ${RETRY_DELAY}ms...`);
// 			await sleep(RETRY_DELAY);
// 		}
// 	}
// };

// Modified function with delay
// const fetchData = async (data:any) => {
// 	for (const coin of data) {
// 		try {
// 			const ca = coin.mint;

// 			const count = await fetchWithRetry(
// 				`https://frontend-api-v3.pump.fun/trades/count/${ca}?minimumSize=${MIN_SOL_SIZE}`,
// 				{
// 					headers: {
// 						accept: "*/*",
// 						"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
// 						priority: "u=1, i",
// 						"sec-ch-ua":
// 							'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
// 						"sec-ch-ua-mobile": "?0",
// 						"sec-ch-ua-platform": '"Windows"',
// 						"sec-fetch-dest": "empty",
// 						"sec-fetch-mode": "cors",
// 						"sec-fetch-site": "same-site",
// 						"cache-control": "no-cache",
// 						pragma: "no-cache",
// 					},
// 				}
// 			);

// 			if (!count) {
// 				throw new Error("Failed to fetch count data.");
// 			}
// 			const countVal = Number(count.data);
// 			console.log(countVal);
// 			console.log(coin.name);
// 			console.log(ca);
// 			await sleep(1000);
// 			try {
// 				let jsonArray: any[] = [];
// 				for (let i = 0; i < countVal; i += TRADE_LIMIT) {
// 					const result = await fetchWithRetry(
// 						`https://frontend-api-v3.pump.fun/trades/all/${ca}?limit=${TRADE_LIMIT}&offset=${i}&minimumSize=${MIN_SOL_SIZE}`,
// 						{
// 							headers: {
// 								accept: "*/*",
// 								"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
// 								"if-none-match": 'W/"a9e7-LTg9Kuu8eULWvitXMjGwx+PGCL8"',
// 								priority: "u=1, i",
// 								"sec-ch-ua":
// 									'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
// 								"sec-ch-ua-mobile": "?0",
// 								"sec-ch-ua-platform": '"Windows"',
// 								"sec-fetch-dest": "empty",
// 								"sec-fetch-mode": "cors",
// 								"sec-fetch-site": "same-site",
// 								"cache-control": "no-cache", // Add this line to bypass cache
// 								pragma: "no-cache", // Add this line to bypass cache
// 							},
// 						}
// 					);
// 					sleep(1000);
// 					if (result && result.status === 304) {
// 						console.log("No new data available (status code 304).");
// 						return;
// 					}

// 					if (!result) {
// 						console.log(ca)
// 						throw new Error("Failed to fetch trade data.");
// 					}
// 					const data = result.data;
// 					if (!data) {
// 						console.log("No data available(ERROR IN FETCHING TOKEN TRADES)");
// 					}
// 					console.log(data.length);
// 					jsonArray=jsonArray.concat(data);
// 				}
// 				const filename = `./token/trades4/${coin.mint}.json`;

// 				// Ensure the directory exists
// 				const dir = path.dirname(filename);
// 				await fs.mkdir(dir, { recursive: true });
// 				await fs.writeFile(filename, JSON.stringify(jsonArray, null, 2), {
// 					encoding: "utf-8",
// 				});
// 				console.log(`Data successfully saved to ${filename} \n`);
// 			} catch (error) {
// 				if (axios.isAxiosError(error) && error.response?.status === 304) {
// 					console.log("No new data available (status code 304).");
// 				} else {
// 					console.error("Error:", error);
// 				}
// 			}
// 		} catch (error) {
// 			console.error(`Error processing ${coin.name}:`, error);
// 		}
// 	}
// };

// fetchData(data);
(async () => {
	
		const res =await fetch("https://frontend-api-v3.pump.fun/trades/all/KrMSEbQeuiFaCafSXD8CdvwozQEkkGTVtUVXGc1pump?limit=200&offset=0&minimumSize=50000000", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.8",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Brave\";v=\"133\", \"Chromium\";v=\"133\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sec-gpc": "1",
    "Referer": "https://pump.fun/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
})
	let data = await res.json()
	console.log(data[0
		
	])
})();
