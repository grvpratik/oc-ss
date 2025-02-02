import { PathLike } from "fs";
import fs from "fs/promises";
import path from "path";

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
interface FileData {
	fileName: string;
	filePath: string;
	data: any;
}
export async function importNestedJsonFiles(folderPath: string) {
	// Store the full file structure
	const result: { files: FileData[]; structure: any } = {
		files: [],
		structure: {},
	};

	async function traverseDirectory(
		currentPath: PathLike,
		structure: { [x: string]: any }
	) {
		const items = await fs.readdir(currentPath, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(currentPath.toString(), item.name);

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
export async function importJsonFilesByPattern(
	folderPath: PathLike,
	pattern: string
) {
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
					const filePath = path.join(folderPath.toString(), file);
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
