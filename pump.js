const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function captureBoardImages() {
	// Create images directory if not exists
	const dir = "./board_images";
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const browser = await puppeteer.launch({
		headless: "new",
		executablePath: "/usr/bin/chromium-browser",
	});
	const page = await browser.newPage();


	try {
		await page.setViewport({ width: 1920, height: 1080 });

		// Block unnecessary resources
		await page.setRequestInterception(true);
		page.on("request", (req) => {
			if (["stylesheet", "font", "media"].includes(req.resourceType())) {
				req.abort();
			} else {
				req.continue();
			}
		});

		console.log("Navigating to pump.fun/board...");
		await page.goto("https://pump.fun/board", {
			waitUntil: "networkidle2",
			timeout: 60000,
		});

		// Wait for images to load
		await page.waitForNetworkIdle({ idleTime: 500 });

		// Get all images on the page
		const imageUrls = await page.evaluate(() => {
			const images = Array.from(document.querySelectorAll("img"));
			return images.map((img) => img.src);
		});

		console.log(`Found ${imageUrls.length} images`);

		// Save image URLs to a file
		fs.writeFileSync(path.join(dir, "image_urls.txt"), imageUrls.join("\n"));

		// Capture screenshots of all images
		const imageElements = await page.$$("img");
		for (let i = 0; i < imageElements.length; i++) {
			try {
				const filename = path.join(dir, `image_${i + 1}.png`);
				await imageElements[i].screenshot({ path: filename });
				console.log(`Saved ${filename}`);
			} catch (err) {
				console.error(`Error capturing image ${i + 1}:`, err.message);
			}
		}

		// Capture full page screenshot
		await page.screenshot({
			path: path.join(dir, "full_page.png"),
			fullPage: true,
		});
		console.log("Saved full page screenshot");
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await browser.close();
	}
}

captureBoardImages();
