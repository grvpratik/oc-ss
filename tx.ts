import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

interface TransactionData {
    [address: string]: any[];
}

interface FailedFetch {
    address: string;
    error: string;
    timestamp: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseTransaction = async (address: string, retries = 3): Promise<any[]> => {
    for (let i = 0; i < retries; i++) {
        try {
            const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${process.env.HELIUS_KEY}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        }
    }
    return [];
};

(async () => {
    const outputPath = "./token/address/list.json";
    const failedPath = "./token/address/failed.json";
    const addresses = JSON.parse(
        await fs.readFile("./data/wallet/address.json", "utf8")
    );

    const data: TransactionData[] = [];
    const failed: FailedFetch[] = [];

    for (const address of addresses) {
        try {
            const res = await parseTransaction(address);
            data.push({ [address]: res });
            console.log(`Processed ${address}: ${res.length} transactions`);

            // Save progress after each successful fetch
            await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Failed to fetch ${address}:`, error);
            failed.push({
                address,
                error: error?.message,
                timestamp: new Date().toISOString()
            });
            await fs.writeFile(failedPath, JSON.stringify(failed, null, 2));
        }
    }
})().catch(console.error);
