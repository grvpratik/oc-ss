import "dotenv/config";



// (async () => {

// })();

import { createSolanaRpc, type Address, address } from "@solana/web3.js";

async function getTransactionList(walletAddress: string, limit: number = 10) {
	// Create RPC client
  
	const rpc = createSolanaRpc(
		`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
	);

	try {
		console.log((await rpc.getSignaturesForAddress(address(walletAddress)).send()).length);		// Get signatures for address
		const signatures = await rpc
			.getSignaturesForAddress(address(walletAddress), {
              

				limit,

			})
			.send();

		// Fetch full transaction details for each signature
		const transactions = await Promise.all(
			signatures.map(async (sig) => {
				const tx = await rpc
					.getTransaction(sig.signature, {
						maxSupportedTransactionVersion: 0,
					})
					.send();


				return {
					signature: sig.signature,
					timestamp: sig.blockTime,
					slot: sig.slot,
					error: sig.err,
					memo: sig.memo,
					details: tx,
				};
			})
		);

		return transactions;
	} catch (error) {
		console.error("Error fetching transactions:", error);
		throw error;
	}
}

// Example usage
async function main() {
	try {
		// Example wallet address
		const address = "8qMN8iwTx5rk6M3NtkTbmzwcVnAyocyHo29hQbwtVgWt";

		const txList = await getTransactionList(address, 2);

		// Process transaction list
		txList.forEach((tx) => {
			console.log("Signature:", tx.signature);
			console.log(
				"Timestamp:",
				tx.timestamp ? new Date(Number(tx.timestamp) * 1000).toISOString() : "Unknown"
			);
			console.log("Status:", tx.error ? "Failed" : "Success");
			console.log("-----------------");
		});
	} catch (error) {
		console.error("Failed to fetch transactions:", error);
	}
}
main();
