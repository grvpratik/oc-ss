const { Connection, PublicKey } = require("@solana/web3.js");

// Known DEX Program IDs
const DEX_PROGRAM_IDS = {
	JUPITER: "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
	RAYDIUM: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
	ORCA: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
};

// Token Program ID
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

async function analyzeWalletTransactions(walletAddress) {
	try {
		// Connect to Solana mainnet
		const connection = new Connection("https://api.mainnet-beta.solana.com");
		const pubKey = new PublicKey(walletAddress);

		// Get recent transactions
		const transactions = await connection.getSignaturesForAddress(pubKey, {
			limit: 10, // Adjust limit as needed
		});

		console.log(`Analyzing transactions for wallet: ${walletAddress}\n`);

		for (const tx of transactions) {
			const txDetails = await connection.getParsedTransaction(tx.signature);

			if (!txDetails?.meta || !txDetails.transaction) {
				continue;
			}

			const { message } = txDetails.transaction;

			// Initialize transaction type
			let txType = "Unknown";
			let details = {};

			// Check program IDs involved in transaction
			const programIds = message.instructions.map((ix) =>
				ix.programId.toString()
			);

			// Check if it's a swap
			const isSwap = programIds.some((id) =>
				Object.values(DEX_PROGRAM_IDS).includes(id)
			);

			// Check if it's a transfer
			const isTransfer =
				programIds.includes(TOKEN_PROGRAM) &&
				!isSwap &&
				message.instructions.length <= 2; // Transfers usually have 1-2 instructions

			if (isSwap) {
				txType = "Swap";
				// Get DEX name
				const dexUsed =
					Object.entries(DEX_PROGRAM_IDS).find(([_, id]) =>
						programIds.includes(id)
					)?.[0] || "Unknown DEX";

				details = {
					dex: dexUsed,
					accountsInvolved: message.accountKeys.length,
					timestamp: new Date(txDetails.blockTime * 1000).toLocaleString(),
				};
			} else if (isTransfer) {
				txType = "Transfer";
				// Get sender and receiver
				const accountKeys = message.accountKeys.map((key) =>
					key.pubkey.toString()
				);
				details = {
					sender: accountKeys[0],
					receiver: accountKeys[1],
					timestamp: new Date(txDetails.blockTime * 1000).toLocaleString(),
				};
			}

			// Print transaction details
			console.log(`Transaction: ${tx.signature}`);
			console.log(`Type: ${txType}`);
			console.log("Details:", JSON.stringify(details, null, 2));
			console.log("-".repeat(50), "\n");
		}
	} catch (error) {
		console.error("Error analyzing transactions:", error);
	}
}

// Function to get transaction details by signature
async function getTransactionDetails(signature) {
	try {
		const connection = new Connection("https://api.mainnet-beta.solana.com");
		const txDetails = await connection.getParsedTransaction(signature);

		if (!txDetails) {
			return "Transaction not found";
		}

		// Analyze if it's a swap or transfer using the same logic as above
		const { message } = txDetails.transaction;
		const programIds = message.instructions.map((ix) =>
			ix.programId.toString()
		);

		const isSwap = programIds.some((id) =>
			Object.values(DEX_PROGRAM_IDS).includes(id)
		);
		const isTransfer = programIds.includes(TOKEN_PROGRAM) && !isSwap;

		return {
			type: isSwap ? "Swap" : isTransfer ? "Transfer" : "Unknown",
			timestamp: new Date(txDetails.blockTime * 1000).toLocaleString(),
			programsInvolved: programIds,
			accountsInvolved: message.accountKeys.length,
			success: txDetails.meta?.err === null,
		};
	} catch (error) {
		console.error("Error getting transaction details:", error);
		return null;
	}
}

// Example usage:
async function main() {
	// Example wallet address
	const walletAddress = "615wod1Ru2j6HeXY97ufNWoKygBc7awqA4hW74evWPBm";
	await analyzeWalletTransactions(walletAddress);

	// Example transaction signature
	const txSignature = "TRANSACTION_SIGNATURE";
	const details = await getTransactionDetails(txSignature);
	console.log("Transaction Details:", details);
}

 main();
