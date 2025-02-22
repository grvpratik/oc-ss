import {
	Address,
	createSolanaRpc,
	Lamports,
	lamports,
	UnixTimestamp,
} from "@solana/web3.js";
import {
	parseAddMemoInstruction,
	MEMO_PROGRAM_ADDRESS,
} from "@solana-program/memo";
import "dotenv/config";

interface TransactionDetails {
	signature: string;
	timestamp: number | UnixTimestamp;
	fee: number | Lamports;
	status: "success" | "failed";
	type: "transfer" | "swap" | "memo" | "pumpfun" | "nft" | "unknown";
	instructions: InstructionDetail[];
	blockTime?: UnixTimestamp;
}

interface InstructionDetail {
	type: string;
	program: string;
	data: any;
}

interface WalletStats {
	address: string;
	successCount: number;
	failCount: number;
	successRate: string;
	swapCount: number;
	transferCount: number;
	nftCount: number;
	pumpfunCount: number;
	lastActivity: number | UnixTimestamp | null;
	isLikelyBot: boolean;
	botConfidence: number;
}

// Known program IDs
const DEX_PROGRAM_IDS = {
	JUPITER: "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
	RAYDIUM: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
	ORCA: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
	PUMPFUN: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
};

const NFT_PROGRAM_IDS = {
	METAPLEX: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
	CANDYMACHINE: "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ",
	AUCTION: "auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8",
};

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/**
 * Count successful transactions efficiently without fetching full transaction details
 */
export async function countSuccessfulTransactions(
	walletAddress: string
): Promise<number> {
	const rpc = createSolanaRpc(
		`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
	);

	let totalSuccess = 0;
	let beforeSignature = undefined;
	let hasMore = true;
	const batchSize = 1000; // Max limit for efficiency

	while (hasMore) {
		try {
			const signaturesResponse: any = await rpc
				.getSignaturesForAddress(walletAddress as Address, {
					before: beforeSignature,
					limit: batchSize,
				})
				.send();

			if (!signaturesResponse || signaturesResponse.length === 0) {
				hasMore = false;
				break;
			}

			// Count successful transactions
			totalSuccess += signaturesResponse.filter((sig: any) => !sig.err).length;

			// Check if we need to continue pagination
			if (signaturesResponse.length < batchSize) {
				hasMore = false;
			} else {
				beforeSignature =
					signaturesResponse[signaturesResponse.length - 1].signature;
			}
		} catch (error) {
			console.error("Error fetching signatures:", error);
			hasMore = false;
		}
	}

	return totalSuccess;
}

/**
 * Categorize transaction by type based on instructions
 */
function categorizeTransaction(
	instructions: InstructionDetail[]
): "transfer" | "swap" | "memo" | "pumpfun" | "nft" | "unknown" {
	// Check for DEX/Swap transactions
    
	const isSwap = instructions.some(
		(ix) =>
			Object.values(DEX_PROGRAM_IDS).includes(ix.program) ||
			ix.type === "Swap" ||
			ix.type.includes("swap")
	);
	if (isSwap) return "swap";

	// Check for NFT transactions
	const isNft = instructions.some(
		(ix) =>
			Object.values(NFT_PROGRAM_IDS).includes(ix.program) ||
			ix.type.includes("NFT")
	);
	if (isNft) return "nft";

	// Check for PumpFun
	const isPumpFun = instructions.some(
		(ix) => ix.program === DEX_PROGRAM_IDS.PUMPFUN || ix.type === "pumpfun"
	);
	if (isPumpFun) return "pumpfun";

	// Check for Memo
	const isMemo = instructions.some(
		(ix) => ix.program === MEMO_PROGRAM_ADDRESS || ix.type === "Memo"
	);
	if (isMemo && instructions.length === 1) return "memo";

	// Check for Transfer (simple token or SOL transfer)
	const isTransfer = instructions.some(
		(ix) =>
			ix.type === "transfer" ||
			ix.type === "transferChecked" ||
			ix.type === "Transfer"
	);
	if (isTransfer) return "transfer";

	return "unknown";
}

/**
 * Get detailed wallet statistics with efficient batch processing
 */
export async function getWalletStats(
	walletAddress: string
): Promise<WalletStats> {
	const rpc = createSolanaRpc(
		`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
	);

	try {
		// First, get a sample of transactions to analyze patterns
		const signaturesResponse = await rpc
			.getSignaturesForAddress(walletAddress as Address, {
				limit: 100, // Sample size
			})
			.send();

		if (!signaturesResponse || signaturesResponse.length === 0) {
			return {
				address: walletAddress,
				successCount: 0,
				failCount: 0,
				successRate: "0%",
				swapCount: 0,
				transferCount: 0,
				nftCount: 0,
				pumpfunCount: 0,
				lastActivity: null,
				isLikelyBot: false,
				botConfidence: 0,
			};
		}

		// Process basic counts from signatures
		const successSignatures = signaturesResponse.filter((sig) => !sig.err);
		const failCount = signaturesResponse.length - successSignatures.length;

		// Get transaction type distribution (sample)
		const transactions: TransactionDetails[] = await Promise.all(
			successSignatures.slice(0, 20).map(async (sig) => {
				// Only process first 20 for efficiency
				try {
					const txResponse = await rpc
						.getTransaction(sig.signature, {
							maxSupportedTransactionVersion: 0,
							encoding: "jsonParsed",
						})
						.send();

					if (!txResponse) {
						return {
							signature: sig.signature,
							timestamp: Number(sig.blockTime || 0),
							fee: 0,
							status: "failed",
							type: "unknown",
							instructions: [],
							blockTime: sig.blockTime ?? undefined,
						};
					}

					const parsedInstructions: InstructionDetail[] = [];
					if (txResponse.transaction.message?.instructions) {
						txResponse.transaction.message.instructions.forEach(
							(instruction: any) => {
								let type = "Unknown";
								let data: any = {};

								if (instruction.program === "system") {
									type = instruction.parsed?.type || "Unknown System";
									data = instruction.parsed?.info || {};
								} else if (instruction.program === "spl-token") {
									type = instruction.parsed?.type || "Unknown Token";
									data = instruction.parsed?.info || {};
								} else if (instruction.programId === MEMO_PROGRAM_ADDRESS) {
									type = "Memo";
									if (instruction.data) {
										try {
											const decodedData = Buffer.from(
												instruction.data,
												"base64"
											).toString("utf8");
											data = { message: decodedData };
										} catch (e) {
											data = { raw: instruction.data };
										}
									}
								} else if (instruction.programId === DEX_PROGRAM_IDS.PUMPFUN) {
									type = "pumpfun";
								}

								parsedInstructions.push({
									type,
									program:
										instruction.programId || instruction.program || "unknown",
									data,
								});
							}
						);
					}

					const txType = categorizeTransaction(parsedInstructions);

					return {
						signature: sig.signature,
						timestamp: Number(txResponse.blockTime || sig.blockTime || 0),
						fee: txResponse.meta?.fee
							? lamports(BigInt(txResponse.meta.fee))
							: 0,
						status: txResponse.meta?.err ? "failed" : "success",
						type: txType,
						instructions: parsedInstructions,
						blockTime: txResponse.blockTime ?? undefined,
					};
				} catch (err) {
					console.warn(`Error processing transaction ${sig.signature}:`, err);
					return {
						signature: sig.signature,
						timestamp: sig.blockTime || 0,
						fee: 0,
						status: "failed",
						type: "unknown",
						instructions: [],
						blockTime: sig.blockTime ?? undefined,
					};
				}
			})
		);

		// Count by transaction type
		const swapCount = transactions.filter((tx) => tx.type === "swap").length;
		const transferCount = transactions.filter(
			(tx) => tx.type === "transfer"
		).length;
		const nftCount = transactions.filter((tx) => tx.type === "nft").length;
		const pumpfunCount = transactions.filter(
			(tx) => tx.type === "pumpfun"
		).length;

		// Get total success count from the first signature batch
		const sampleSuccessCount = successSignatures.length;

		// Bot detection logic
		const timeIntervals: number[] = [];
		let prevTime: number | null = null;

		successSignatures.forEach((sig) => {
			if (prevTime !== null && sig.blockTime) {
				timeIntervals.push(Math.abs(prevTime - Number(sig.blockTime)));
			}
			if (sig.blockTime) prevTime = Number(sig.blockTime);
		});

		// Bot indicators:
		// 1. Regular time intervals (low standard deviation)
		const avgInterval =
			timeIntervals.length > 0
				? timeIntervals.reduce((a, b) => a + b, 0) / timeIntervals.length
				: 0;

		const stdDev =
			timeIntervals.length > 0
				? Math.sqrt(
						timeIntervals.reduce(
							(sq, n) => sq + Math.pow(n - avgInterval, 2),
							0
						) / timeIntervals.length
				  )
				: 0;

		// 2. High transaction frequency
		const firstTime =
			signaturesResponse[signaturesResponse.length - 1].blockTime || 0;
		const lastTime = signaturesResponse[0].blockTime || 0;
		const timeSpan = Number(lastTime) - Number(firstTime);
		const txPerHour =
			timeSpan > 0 ? (signaturesResponse.length / timeSpan) * 3600 : 0;

		// Calculate bot likelihood
		const regularPatterns = stdDev < avgInterval / 3;
		const highFrequency = txPerHour > 50;
		const botConfidence =
			((regularPatterns ? 0.6 : 0) +
				(highFrequency ? 0.4 : 0) +
				(swapCount > transferCount * 5 ? 0.2 : 0)) *
			100;

		// Count total successful transactions
		const totalSuccessCount = await countSuccessfulTransactions(walletAddress);

		return {
			address: walletAddress,
			successCount: totalSuccessCount,
			failCount: failCount,
			successRate: `${(
				(sampleSuccessCount / signaturesResponse.length) *
				100
			).toFixed(1)}%`,
			swapCount,
			transferCount,
			nftCount,
			pumpfunCount,
			lastActivity: signaturesResponse[0].blockTime || null,
			isLikelyBot: botConfidence > 50,
			botConfidence: Math.min(Math.round(botConfidence), 100),
		};
	} catch (error) {
		console.error("Error analyzing wallet:", error);
		throw error;
	}
}

// Example usage
(async () => {
	try {
		const stats = await getWalletStats(
			"2bxSMcmZTstu4Hp3WektjfZ4Lg9trgGMpjCvLwMqYtre"
		);
		console.log(
			JSON.stringify(
				stats,
				(key, value) => {
					if (typeof value === "bigint") {
						return value.toString();
					}
					return value;
				},
				2
			)
		);
	} catch (error) {
		console.error("Error:", error);
	}
})();
