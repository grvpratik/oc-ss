const web3 = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

async function trackNewTokens() {
	// Connect to Solana mainnet
	const connection = new web3.Connection(web3.clusterApiUrl("mainnet-beta"));

	// Subscribe to program notifications
	const subscriptionId = connection.onProgramAccountChange(
		TOKEN_PROGRAM_ID,
		(accountInfo, context) => {
			// Check if this is a new token mint account
			if (accountInfo.accountInfo.data.length === 82) {
				// Mint account data size
				const mint = new web3.PublicKey(accountInfo.accountId);
				console.log("New token detected!");
				console.log("Mint address:", mint.toString());

				// Get additional token information
				getTokenDetails(connection, mint).catch(console.error);
			}
		},
		"confirmed"
	);

	return subscriptionId;
}

async function getTokenDetails(connection, mintAddress) {
	try {
		// Get mint account info
		const mintInfo = await connection.getParsedAccountInfo(mintAddress);

		if (mintInfo.value) {
			const data = mintInfo.value.data;
			console.log("Token Supply:", data.parsed.info.supply);
			console.log("Decimals:", data.parsed.info.decimals);
			console.log("Freeze Authority:", data.parsed.info.freezeAuthority);
			console.log("Mint Authority:", data.parsed.info.mintAuthority);
		}
	} catch (error) {
		console.error("Error fetching token details:", error);
	}
}

// Start tracking
trackNewTokens()
	.then((subscriptionId) => {
		console.log("Started tracking with subscription ID:", subscriptionId);
	})
	.catch(console.error);
