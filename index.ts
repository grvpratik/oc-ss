import fs from "node:fs/promises";
import path from "node:path";

// async function importJsonFiles(folderPath) {
// 	try {
// 		// Read all files in the directory
// 		const files = await fs.readdir(folderPath);

// 		// Filter for .json files and read them
// 		const jsonFiles = await Promise.all(
// 			files
// 				.filter((file) => path.extname(file).toLowerCase() === ".json")
// 				.map(async (file) => {
// 					const filePath = path.join(folderPath, file);
// 					const content = await fs.readFile(filePath, "utf8");
// 					return {
// 						fileName: file,
// 						data: JSON.parse(content),
// 					};
// 				})
// 		);

// 		return jsonFiles;
// 	} catch (error) {
// 		console.error("Error importing JSON files:", error);
// 		throw error;
// 	}
// }
// function importJsonFilesSync(folderPath) {
// 	try {
// 		const files = fs.readdirSync(folderPath);

// 		return files
// 			.filter((file) => path.extname(file).toLowerCase() === ".json")
// 			.map((file) => ({
// 				fileName: file,
//                 data: JSON.parse(fs.readFileSync(path.join(folderPath, file), 'utf8')),
// 			}));
// 	} catch (error) {
// 		console.error("Error importing JSON files:", error);
// 		throw error;
// 	}
// }
async function importNestedJsonFiles(folderPath) {
	// Store the full file structure
	const result: any = {
		files: [],
		structure: {},
	};

	async function traverseDirectory(currentPath, structure) {
		const items = await fs.readdir(currentPath, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(currentPath, item.name);

			if (item.isDirectory()) {
				// Create new object for subdirectory
				structure[item.name] = {};
				// Recursively traverse subdirectory
				await traverseDirectory(fullPath, structure[item.name]);
			} else if (
				item.isFile() &&
				path.extname(item.name).toLowerCase() === ".json"
			) {
				try {
					// Read and parse JSON file
					const content = await fs.readFile(fullPath, "utf8");
					const data = JSON.parse(content);

					// Get relative path from base directory
					const relativePath = path.relative(folderPath, fullPath);

					// Add to flat files array
					result.files.push({
						fileName: item.name,
						filePath: relativePath,
						data: data,
					});

					// Add to nested structure
					structure[item.name] = data;
				} catch (error) {
					console.error(`Error reading ${fullPath}:`, error);
				}
			}
		}
	}

	await traverseDirectory(folderPath, result.structure);
	return result;
}
async function importJsonFilesByPattern(folderPath, pattern) {
	try {
		const files = await fs.readdir(folderPath);

		const jsonFiles = await Promise.all(
			files
				.filter(
					(file) =>
						path.extname(file).toLowerCase() === ".json" &&
						file.includes(pattern)
				)
				.map(async (file) => {
					const filePath = path.join(folderPath, file);
					const content = await fs.readFile(filePath, "utf8");
					return {
						fileName: file,
						data: JSON.parse(content),
					};
				})
		);

		return jsonFiles;
	} catch (error) {
		console.error("Error importing JSON files:", error);
		throw error;
	}
}
async function main() {
	try {
		const folderPath = path.join("./data");
		const pattern = "pump-fun-data";
		const jsonFiles = await importJsonFilesByPattern(folderPath, pattern);
		//console.log(jsonFiles.map((file) => file.fileName).join("\n"));

		const result = await importNestedJsonFiles("./token");

		// Get all files as a flat array
		//console.log(Object.keys(result.structure).length);

		// Get nested structure
		//console.log(result);

		// Find files in specific subdirectory
		// const userFiles = result.files.filter((file) =>
		// 	file.filePath.startsWith("users/")
		// );
		// console.log(path.dirname(new URL(import.meta.url).pathname))
	} catch (error) {
		console.error("Error in main:", error);
	}
}
main();
