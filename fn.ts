import { PathLike } from "fs";
import fs from "fs/promises";
import path from "path";

export async function importJsonFiles(folderPath: PathLike) {
	try {
		// Read all files in the directory
		const files = await fs.readdir(folderPath);

		// Filter for .json files and read them
		const jsonFiles = await Promise.all(
			files
				.filter((file) => path.extname(file).toLowerCase() === ".json")
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

// Type for configuration options
interface FetchAndSaveOptions {
  pretty?: boolean;  // Whether to prettify the JSON output
  encoding?: BufferEncoding;  // File encoding
  appendMode?: boolean;  // Whether to append to existing file
}

/**
 * Fetches data from a URL and saves it to a JSON file
 * @param url The URL to fetch data from
 * @param filename The name of the file to save the data to
 * @param options Configuration options for saving
 */
export async function fetchAndSaveJson(
  url: string,
  filename: string,
  options: FetchAndSaveOptions = {}
): Promise<void> {
  const {
    pretty = true,
    encoding = 'utf-8',
    appendMode = false
  } = options;

  try {
    // Fetch the data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON
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

      // Append new data
      existingData.push(data);
      await fs.writeFile(
        filename,
        JSON.stringify(existingData, null, pretty ? 2 : 0),
        { encoding }
      );
    } else {
      // Write new file
      await fs.writeFile(
        filename,
        JSON.stringify(data, null, pretty ? 2 : 0),
        { encoding }
      );
    }

    console.log(`Data successfully saved to ${filename}`);

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch and save JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Saves data directly to a JSON file
 * @param data The data to save
 * @param filename The name of the file to save the data to
 * @param options Configuration options for saving
 */
export async function saveToJson(
  data: unknown,
  filename: string,
  options: Omit<FetchAndSaveOptions, 'appendMode'> = {}
): Promise<void> {
  const {
    pretty = true,
    encoding = 'utf-8'
  } = options;

  try {
    // Ensure the directory exists
    const dir = path.dirname(filename);
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(
      filename,
      JSON.stringify(data, null, pretty ? 2 : 0),
      { encoding }
    );

    console.log(`Data successfully saved to ${filename}`);

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save JSON: ${error.message}`);
    }
    throw error;
  }
}