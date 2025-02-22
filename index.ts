import path from "path";
import fs from "fs";
import {
	importJsonFiles,
	importJsonFilesByPattern,
	importNestedJsonFiles,
} from "./fn";
async function main() {
	try {
		const folderPath = path.join("./data");
		const pattern = "pump-fun-data";
		const topTokens = await importJsonFilesByPattern(folderPath, pattern);
		

		const result = await importNestedJsonFiles("./token");
		console.log(Object.keys(result.structure.trades1));
		console.log(result.files.length);
	} catch (error) {
		console.error("Error in main:", error);
	}
}
interface Transaction {
	signature: string;
	mint: string;
	sol_amount: number;
	token_amount: number;
	is_buy: boolean;
	user: string;
	timestamp: number;
	tx_index: number;
	username: string | null;
	profile_image: string | null;
	slot: number;
}
interface FilteredTransaction {
	signature: string;
	mint: string;
	sol_amount: number;
	token_amount: number;
	timestamp: number;
	tx_index: number;
	slot: number;
}
interface UserTransactions {
	buy: FilteredTransaction[];
	sell: FilteredTransaction[];
	avg_buy_time_diff?: number; // Average time difference between buy transactions
	avg_sell_time_diff?: number; // Average time difference between sell transactions
	avg_hold_time?: number; // Average hold time between buy and sell transactions
}

interface FilteredResult {
	user: string;
	buy: FilteredTransaction[];
	sell: FilteredTransaction[];
	avg_buy_time_diff?: number;
	avg_sell_time_diff?: number;
	avg_hold_time?: number;
}
function calculateTimeDifferences(
	transactions: FilteredTransaction[]
): number[] {
	// Sort transactions by timestamp first to ensure chronological order
	const sortedTransactions = [...transactions].sort(
		(a, b) => a.timestamp - b.timestamp
	);

	// Calculate time differences between consecutive transactions in minutes
	const timeDiffsInMinutes: number[] = [];
	for (let i = 1; i < sortedTransactions.length; i++) {
		// Convert timestamp difference to minutes (timestamps are in seconds)
		const diffInSeconds =
			sortedTransactions[i].timestamp - sortedTransactions[i - 1].timestamp;
		const diffInMinutes = diffInSeconds / 60;
		timeDiffsInMinutes.push(diffInMinutes);
	}
	return timeDiffsInMinutes;
}

function filterTransactions(data: Transaction[]): FilteredResult[] {
	// Initialize an object to store transactions by user
	const transactionsByUser: { [key: string]: UserTransactions } = {};

	// Loop through each transaction and categorize as buy or sell
	for (const item of data) {
		const transaction: FilteredTransaction = {
			signature: item.signature,
			mint: item.mint,
			sol_amount: item.sol_amount,
			token_amount: item.token_amount,
			timestamp: item.timestamp,
			tx_index: item.tx_index,
			slot: item.slot,
		};

		if (!transactionsByUser[item.user]) {
			transactionsByUser[item.user] = { buy: [], sell: [] };
		}

		if (item.is_buy) {
			transactionsByUser[item.user].buy.push(transaction);
		} else {
			transactionsByUser[item.user].sell.push(transaction);
		}
	}

	// Prepare the final result with calculated average times
	const result: FilteredResult[] = Object.keys(transactionsByUser).map(
		(user) => {
			const userTransactions = transactionsByUser[user];

			// Sort buy and sell transactions by timestamp
			userTransactions.buy.sort((a, b) => a.timestamp - b.timestamp);
			userTransactions.sell.sort((a, b) => a.timestamp - b.timestamp);

			// Calculate average time differences for buy and sell transactions in minutes
			const buyTimeDiffs = calculateTimeDifferences(userTransactions.buy);
			const sellTimeDiffs = calculateTimeDifferences(userTransactions.sell);

			const avgBuyTimeDiff =
				buyTimeDiffs.length > 0
					? buyTimeDiffs.reduce((a, b) => a + b, 0) / buyTimeDiffs.length
					: undefined;

			const avgSellTimeDiff =
				sellTimeDiffs.length > 0
					? sellTimeDiffs.reduce((a, b) => a + b, 0) / sellTimeDiffs.length
					: undefined;

			// Calculate the average hold time in minutes
			let avgHoldTime: number | undefined = undefined;
			if (userTransactions.buy.length > 0 && userTransactions.sell.length > 0) {
				// Only consider sells that happened after buys
				const validSells = userTransactions.sell.filter(
					(sell) => sell.timestamp > userTransactions.buy[0].timestamp
				);

				if (validSells.length > 0) {
					let totalHoldTimeMinutes = 0;
					let pairCount = 0;

					// For each buy, find the next sell after it
					for (const buy of userTransactions.buy) {
						const nextSell = validSells.find(
							(sell) => sell.timestamp > buy.timestamp
						);
						if (nextSell) {
							// Convert seconds to minutes
							const holdTimeMinutes = (nextSell.timestamp - buy.timestamp) / 60;
							totalHoldTimeMinutes += holdTimeMinutes;
							pairCount++;
						}
					}

					avgHoldTime =
						pairCount > 0 ? totalHoldTimeMinutes / pairCount : undefined;
				}
			}

			return {
				user,
				buy: userTransactions.buy,
				sell: userTransactions.sell,
				avg_buy_time_diff: avgBuyTimeDiff,
				avg_sell_time_diff: avgSellTimeDiff,
				avg_hold_time: avgHoldTime,
			};
		}
	);

	return result;
}


async function app() {
const result = await importJsonFiles("./data/trades");
//console.log(result[0]);
// console.log(result.structure);

	const filtered = filterTransactions(result[2].data);
	
	
	
	
	console.log(filtered)
	


}

if (require.main === module) {
	//main();
	app();
}

















// const userFiles = result.files.filter((file) =>
// 	file.filePath.startsWith("users/")
// );
// console.log(path.dirname(new URL(import.meta.url).pathname))

//console.log(parseInt('pump-fun-data-1.json'.split('-')[3].split('.')[0]))


// const tokens = JSON.parse(
// 	fs.readFileSync("./data/trades/tokens/merged.json", "utf8")
// );

// const tokenTrades = await importJsonFiles("./data/trades/");
// //console.log(tokenTrades.map((x) => x.fileName));

// let result: any = [];
	
//for await (const trades of tokenTrades) {
		//console.log(trades.fileName);
	//	const res = await trades.data.map((tx: any) => {
	//		return tx.user;
	//	});
	//	result = result.concat(res);
	//}
	//const data = Array.from(new Set(result));
	//console.log(data.length);
	//fs.writeFileSync("./data/wallet/address.json", JSON.stringify(data, null, 2));

	// let data: any=[];
	// for (let i = 5; i < 14; i++) {
	// 	const up = JSON.parse(
	// 		fs.readFileSync(`./data/pump-fun-data-${i}.json`, "utf8")
	// 	);
	// 	data=data.concat(up)
	// }

	// // Write the merged data to a new JSON file
	// fs.writeFileSync("./data/remain.json", JSON.stringify(data, null, 2));

	// console.log("Merged JSON saved to merged.json");
	// const res = JSON.parse(fs.readFileSync("./data/remain.json", "utf8"));
	// console.log(res.length)
	// 
	// 
	