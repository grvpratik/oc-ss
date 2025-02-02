import path from "path";

import { importJsonFilesByPattern, importNestedJsonFiles } from "./fn";
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
if (require.main === module) {
	main();
}
	// const userFiles = result.files.filter((file) =>
		// 	file.filePath.startsWith("users/")
		// );
		// console.log(path.dirname(new URL(import.meta.url).pathname))

			//console.log(parseInt('pump-fun-data-1.json'.split('-')[3].split('.')[0]))