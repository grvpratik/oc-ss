import {
	Address,
	assertIsInstructionWithData,
	assertIsInstructionWithAccounts,
	createSolanaRpc,
	Lamports,
	lamports,
	UnixTimestamp,
	Signature,
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

import bs58 from "bs58";
import { json } from "stream/consumers";
import {
	analyzeSolanaTransaction,
	extractTransactionDetails,
	formatTransactionAnalysis,
	parseAndPrintTx,
	parseSolanaTransaction,
} from "./chainfun";

interface DecodedPumpFunData {
	instructionType: string;
	tokenName?: string;
	tokenAmount?: number;
	tokenMint?: string;
	sender?: string;
	recipient?: string;
}

/**
 * Decode PumpFun transaction data
 */
// function decodePumpFunInstruction(instruction: {
// 	accounts: string[];
// 	data: string;
// 	programId: string;
// }): DecodedPumpFunData {
// 	try {
// 		// Decode base58 instruction data
// 		const decodedData = bs58.decode(instruction.data);
// 		console.log(decodedData);
// 		// First bytes typically represent instruction type
// 		const firstByte = decodedData[0];

// 		// Map accounts to meaningful names
// 		const userWallet = instruction.accounts[0]; // Often the first account is user wallet
// 		const tokenMint = instruction.accounts[1]; // Often second account is token mint
// 		const pumpfunEscrow = instruction.accounts[2]; // Often PumpFun protocol account

// 		// Attempt to determine instruction type based on first byte and accounts pattern
// 		let instructionType = "Unknown PumpFun Operation";

// 		if (firstByte === 0 || firstByte === 1) {
// 			instructionType = "Buy Token";
// 		} else if (firstByte === 2 || firstByte === 3) {
// 			instructionType = "Sell Token";
// 		} else if (firstByte === 4) {
// 			instructionType = "Create Token";
// 		} else if (firstByte === 5) {
// 			instructionType = "Claim Rewards";
// 		}

// 		// Extract any token name if available (typically in later bytes)
// 		let tokenName = "";
// 		if (decodedData.length > 8) {
// 			// Skip instruction discriminator (typically 8 bytes)
// 			// This is a simplification - actual format depends on PumpFun's specific protocol
// 			const possibleTextBytes = decodedData.slice(8);
// 			try {
// 				// Attempt to decode any text data
// 				tokenName = new TextDecoder()
// 					.decode(
// 						possibleTextBytes.filter((b: any) => b >= 32 && b < 127) // Filter for printable ASCII
// 					)
// 					.trim();
// 			} catch (e) {
// 				// Text decoding failed
// 			}
// 		}
// 		console.log(instructionType, tokenName, tokenMint, userWallet);

// 		return {
// 			instructionType,
// 			tokenName: tokenName || undefined,
// 			tokenMint: tokenMint,
// 			sender: userWallet,
// 			// Add more details as needed
// 		};
// 	} catch (error) {
// 		console.error("Error decoding PumpFun instruction:", error);
// 		return {
// 			instructionType: "Failed to decode",
// 		};
// 	}
// }

/**
 * Function to get human-readable account roles
 */
function getAccountRoles(
	accounts: string[],
	programId: string
): Record<string, string> {
	// Known PumpFun accounts
	const KNOWN_ACCOUNTS: Record<string, string> = {
		"3TDrQAJgnUmWP2SyGJiJ1tiQkri28gvHkjDVSUQcpump": "PumpFun Protocol Account",
		"11111111111111111111111111111111": "System Program",
		TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: "Token Program",
		SysvarRent111111111111111111111111111111111: "Rent Sysvar",
	};

	const accountRoles: Record<string, string> = {};

	accounts.forEach((account, index) => {
		if (KNOWN_ACCOUNTS[account]) {
			accountRoles[account] = KNOWN_ACCOUNTS[account];
		} else if (account === programId) {
			accountRoles[account] = "PumpFun Program";
		} else if (index === 0) {
			accountRoles[account] = "User Wallet (likely)";
		} else if (index === 1) {
			accountRoles[account] = "Token Mint (likely)";
		} else if (index <= 3) {
			accountRoles[account] = "Protocol Account / Token Account";
		} else {
			accountRoles[account] = `Account ${index}`;
		}
	});

	return accountRoles;
}
const DEX_PROGRAM_IDS = {
	JUPITER: "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
	RAYDIUM: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
	ORCA: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
	PUMPFUN: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
};
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
		// console.log(signaturesResponse, "sigres");
		const blockTime = signaturesResponse.map((sig) => sig.blockTime);
		const slot = signaturesResponse.map((sig) => sig.slot);
		// Process each transaction
		// console.log(signaturesResponse);
		let transactions = [];
		const transactionsx: any = await Promise.all(
			signaturesResponse.map(async (sig) => {
				try {
					// Fetch transaction details using JSON parsed format
					const txResponse = await rpc
						.getTransaction(
							sig.signature ,
							
							{
								maxSupportedTransactionVersion: 0,
								encoding: "jsonParsed",
							}
						)
						.send();
					// console.log(sig, "sig");
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
					//console.log(tx.transaction.message.instructions);
					const parsedInfos: any[] = [];
					function calculateNativeBalanceChanges(transactionDetails: any) {
						const meta = tx && tx.meta;

						if (!meta) {
							console.log("No meta information available");
							return;
						}

						const preBalances = meta.preBalances;
						const postBalances = meta.postBalances;

						if (!preBalances || !postBalances) {
							console.log("No balance information available");
							return;
						}

						const balanceChanges = [];

						// Calculate SOL balance changes for each account
						for (let i = 0; i < preBalances.length; i++) {
							const preBalance = Number(preBalances[i]);
							const postBalance = Number(postBalances[i]);
							const solDifference = (postBalance! - preBalance!) / 1e9; // Convert lamports to SOL

							if (solDifference !== 0) {
								balanceChanges.push({
									accountIndex: i,
									preBalance: preBalance! / 1e9, // Convert to SOL
									postBalance: postBalance! / 1e9, // Convert to SOL
									change: solDifference,
								});
							}
						}

						// Log the results
						if (balanceChanges.length > 0) {
							const firstChange = balanceChanges[0];
							// console.log(`Account Index ${firstChange.accountIndex} native balance change:`);
							// console.log(`Pre Balance: ${firstChange.preBalance} SOL`);
							// console.log(`Post Balance: ${firstChange.postBalance} SOL`);
							// console.log(`Change: ${firstChange.change} SOL`);
							// console.log('-----------------------------------');
							const type = firstChange!.change > 0 ? "sell" : "buy";
							return {
								type,
								balanceChange: firstChange!.change,
							};
						} else {
							console.log("No balance changes found");
							return {
								type: "",
								balanceChange: "",
							};
						}
					}
					//console.log(calculateNativeBalanceChanges([tx]));
					const nativeBalance = calculateNativeBalanceChanges([tx]);
					const preBalances = tx?.meta?.preBalances;
					const postBalances = tx?.meta?.postBalances;

					// Transaction Metadata
					tx?.meta?.innerInstructions?.forEach((i: any) => {
						// raydium
						i.instructions.forEach((r: any) => {
							if (
								r.parsed?.type === "transfer" &&
								r.parsed.info.amount !== undefined
							) {
								transactions.push(r.parsed);
							}
						});
					});

					// pumpfun
					tx?.transaction.message.instructions.map((instruction: any) => {
						if (
							transactions.length <= 1 &&
							instruction &&
							instruction.parsed !== undefined
						) {
							parsedInfos.push(instruction.parsed);
						}
					});

					// console.log('transaction', transactions)

					// console.log('native balance', nativeBalance)

					if (!preBalances || !postBalances) {
						console.log("No balance information available");
						return;
					}

					// we have to do this for pumpfun transactions since swap info is not available in its instructions
					let totalSolSwapped = 0;

					for (let i = 0; i < preBalances.length; i++) {
						const preBalance = Number(preBalances[i]);
						const postBalance = Number(postBalances[i]);

						const solDifference = (postBalance! - preBalance!) / 1e9; // Convert lamports to SOL

						if (
							solDifference < 0 &&
							i === 1 &&
							nativeBalance?.type === "sell"
						) {
							totalSolSwapped += Math.abs(solDifference);
						} else if (
							solDifference < 0 &&
							i === 2 &&
							nativeBalance?.type === "sell"
						) {
							totalSolSwapped += Math.abs(solDifference);
						} else if (
							solDifference < 0 &&
							i === 5 &&
							nativeBalance?.type === "sell"
						) {
							totalSolSwapped += Math.abs(solDifference);
						} else if (
							solDifference !== 0 &&
							i === 3 &&
							nativeBalance?.type === "buy"
						) {
							totalSolSwapped += Math.abs(solDifference);
							// In case index 3 doesnt hold the amount
						} else if (
							solDifference === 0 &&
							i === 3 &&
							nativeBalance?.type === "buy"
						) {
							totalSolSwapped = Math.abs(
								(Number(postBalances[2]!) - Number(preBalances[2]!)) / 1e9
							);
						}
					}
					console.log(parsedInfos);
					// let instructions = tx.transaction.message.instructions;
					// const res = instructions.map((ix) => decodePumpFunInstruction(ix.));
					// decodePumpFunInstruction({
					// 	accounts: [],
					// 	data: "5jRcjdixRUDaS99xhEqFmDNRQVpipGhWf",
					// 	programId: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
					// });
					// console.log(tx.transaction.message.instructions);
					//  tx.transaction.message.instructions.forEach((instruction, n) => {
					// 		console.log(
					// 			`---Instructions ${n + 1}: ${instruction.programId.toString()}`
					// 		);
					// 	});
					// const analysis = analyzeSolanaTransaction(tx);
					// console.log(formatTransactionAnalysis(analysis));
					// console.log(parseAndPrintTx(tx), "TX");
					// console.log(tx, "TX");
					const innerTx = tx.meta && tx.meta.innerInstructions;
					const postTokenBalances = tx.meta && tx.meta.postTokenBalances;
					const preTokenBalances = tx.meta && tx.meta.preTokenBalances;
					const txInstruction = tx.transaction.message.instructions.forEach(
						(instruction: any) => {}
					);
					const signature = tx.transaction.signatures.map(
						(instruction: any) => {}
					);
					const parsed = analyzeSolanaTransaction(tx);

					//console.log(formatTransactionAnalysis(parsed),"PARSEFD")
					// console.log(
					// 		"TX",
					// 		JSON.stringify(
					// 			tx,
					// 			(key, value) => {
					// 				if (typeof value === "bigint") {
					// 					return value.toString();
					// 				}
					// 				return value;
					// 			},
					// 			2
					// 		)
					// 	);
					// console.log(tx.meta?.postTokenBalances)
					// console.log(tx.meta?.preTokenBalances)
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
								//console.log(instruction,"PF");
								// const instructionx = tx.transaction.message.instructions[0];
								// if ('accounts' in instructionx) {
								// 	console.log(
								// 		getAccountRoles(
								// 			Array.from(instruction.accounts).map(String),
								// 			"6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
								// 		),
								// 		"roles"
								// 	);
								// }
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

		return transactionsx;
	} catch (error) {
		console.error("Error fetching wallet transactions:", error);
		throw error;
	}
}

(async () => {
	const transactions = await getWalletTransactions(
		"6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
		1
	);
	// console.log(transactions.map((tx) => tx.instructions));
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
//it will show transactions
//transaction can be classified into different types swap(ie pumpfun raydium) and transfer like sol or spl
//for swap we can use the program id to identify the swap program
//for transfer we can use the program id to identify the transfer program
//for pumpfun we can use the program id to identify the pumpfun program

//transaction can contain
//innerinstructiona ->instruction->parsed ->info and type
//inner inst->inst->program and program id
//inner instruction ->accounts which contain program id
