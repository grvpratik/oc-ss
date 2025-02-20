import {
	Address,
	assertIsInstructionWithData,
	assertIsInstructionWithAccounts,
	createSolanaRpc,
	Lamports,
	lamports,
	UnixTimestamp,
} from "@solana/web3.js";
import {
	identifySystemInstruction,
	parseTransferSolInstruction,
	SystemInstruction,
} from "@solana-program/system";
import {
	parseAddMemoInstruction,
	MEMO_PROGRAM_ADDRESS,
} from "@solana-program/memo";

interface TransactionDetails {
	signature: string;
	timestamp: number | UnixTimestamp;
	fee: number | Lamports;
	status: "success" | "failed";
	instructions: InstructionDetail[];
	blockTime?: UnixTimestamp;
}

interface InstructionDetail {
	type: string;
	program: string;
	data: any;
}
import "dotenv/config";
export async function getWalletTransactions(
	walletAddress: string,
	limit: number = 10
) {
	console.log(process.env.HELIUS_API_KEY);
	// Create RPC connection
	const rpc = createSolanaRpc(
		`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
	);

	try {
		// Fetch recent transactions for the wallet
		const signaturesResponse = await rpc
			.getSignaturesForAddress(walletAddress as Address, {
				limit,
			})
			.send();
		//console.log(signaturesResponse,"sigres")
		if (!signaturesResponse || signaturesResponse.length === 0) {
			return [];
		}

		// Process each transaction
		const transactions: TransactionDetails[] = await Promise.all(
			signaturesResponse.map(async (sig) => {
				try {
					// Fetch transaction details using JSON parsed format
					const txResponse = await rpc
						.getTransaction(sig.signature, {
							maxSupportedTransactionVersion: 0,
							encoding: "jsonParsed",
						})
						.send();

					if (!txResponse) {
						console.warn(`Transaction ${sig.signature} not found`);
						return {
							signature: sig.signature,
							timestamp: Number(sig.blockTime || 0),
							fee: 0,
							status: "failed",
							instructions: [],
							blockTime: sig.blockTime ?? undefined,
						};
					}

					const tx = txResponse;
                    console.log(tx.meta?.postTokenBalances)
                    console.log(tx.meta?.preTokenBalances)
					// if (tx.meta && tx.meta.postBalances) {
					// 	const solChanges = tx.meta.preBalances
					// 		.map((pre, index) => {
					// 			const post = tx.meta!.postBalances[index];
					// 			const change = post - pre;
					// 			return {
					// 				accountIndex: index,
					// 				changeInLamports: change.toString(),
					// 				changeInSol: Number(change) / 1_000_000_000,
					// 			};
					// 		})
					// 		.filter((item) => item.changeInLamports !== "0");

					// 	console.log(solChanges);
					// }
					//console.log(tx);

					// Parse instructions from jsonParsed data
					const parsedInstructions: InstructionDetail[] = [];

					if (tx.transaction.message?.instructions) {
						tx.transaction.message.instructions.forEach((instruction: any) => {
							let type = "Unknown";
							let data: any = {};

							// Parse System Program instructions
							if (instruction.program === "system") {
								type = instruction.parsed?.type || "Unknown System";
								data = instruction.parsed?.info || {};
							}
							// Parse SPL Token Program
							else if (instruction.program === "spl-token") {
								type = instruction.parsed?.type || "Unknown Token";
								data = instruction.parsed?.info || {};
							}
							// Handle other programs based on programId
							else if (instruction.programId === MEMO_PROGRAM_ADDRESS) {
								type = "Memo";
								// Extract memo data if available
								if (instruction.data) {
									try {
										// Memo data is often base58 encoded
										const decodedData = Buffer.from(
											instruction.data,
											"base64"
										).toString("utf8");
										data = { message: decodedData };
									} catch (e) {
										data = { raw: instruction.data };
									}
								}
							} else if (
								instruction.programId ===
								"6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
							) {
								type = "pumpfun";
							}

							parsedInstructions.push({
								type,
								program:
									instruction.programId || instruction.program || "unknown",
								data,
							});
						});
					}

					return {
						signature: sig.signature,
						timestamp: Number(tx.blockTime || sig.blockTime || 0),
						fee: tx.meta?.fee ? lamports(BigInt(tx.meta.fee)) : 0,
						status: tx.meta?.err ? "failed" : "success",
						instructions: parsedInstructions,
						blockTime: tx.blockTime ?? undefined,
					};
				} catch (err) {
					console.warn(`Error processing transaction ${sig.signature}:`, err);
					// Return partial information for failed transaction processing
					return {
						signature: sig.signature,
						timestamp: sig.blockTime || 0,
						fee: 0,
						status: "failed",
						instructions: [],
						blockTime: sig.blockTime ?? undefined,
					};
				}
			})
		);

		return transactions;
	} catch (error) {
		console.error("Error fetching wallet transactions:", error);
		throw error;
	}
}

(async () => {
	const transactions = await getWalletTransactions(
		"2bxSMcmZTstu4Hp3WektjfZ4Lg9trgGMpjCvLwMqYtre",
		3
	);
	// console.log(transactions)
	// console.log(
	// 	JSON.stringify(
	// 		transactions,
	// 		(key, value) => {

	// 			if (typeof value === "bigint") {
	// 				return value.toString();
	// 			}
	// 			return value;
	// 		},
	// 		2
	// 	)
	// );
})();
