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
		//data-13 json files
		//each json file contains 50 coins

		//token -it contains 4 sub folders
		//each sub folder contains 50 coins json files
		//each json file contains all trades happened for that coin

		const result = await importNestedJsonFiles("./token");
		console.log(Object.keys(result.structure.trades1));
		console.log(result.files.length);
	} catch (error) {
		console.error("Error in main:", error);
	}
}
async function app() {

	
	
	
	
	
	
	


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
	