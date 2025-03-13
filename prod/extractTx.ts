import type { TokenBalance, TransactionError } from "@solana/rpc-types";

// Comprehensive token balance change interface
interface TokenBalanceChange {
	mint: string;
	owner: string;
	account: string;
	preAmount: string;
	postAmount: string;
	uiPreAmount: number;
	uiPostAmount: number;
	uiChange: number;
	decimals: number;
}

// Wallet balance change interface
interface WalletBalanceChange {
	address: string;
	preSol: number;
	postSol: number;
	change: number;
	isSigner: boolean;
	isWritable: boolean;
	tokenChanges: TokenBalanceChange[];
}

// Enhanced instruction info
interface InstructionInfo {
	programId: string;
	program: string;
	type: string;
	accounts: string[];
	parsed?: {
		type: string;
		info: any;
	};
}

// Token transfer details
interface TokenTransfer {
	mint: string;
	amount: number;
	from: string;
	to: string;
	authority: string;
}

// SOL transfer details
interface SolTransfer {
	amount: number;
	from: string;
	to: string;
}

// Account creation details
interface AccountCreation {
	newAccount: string;
	owner: string;
	lamports: number;
	space: number;
}

// Comprehensive transaction analysis
interface EnhancedTransactionAnalysis {
	// Basic transaction metadata
	signature?: string;
	timestamp: number | null;
	slot: number;
	status: "success" | "error" | "failed";
	error: TransactionError | null;
	fee: number;
	computeUnits?: number;

	// Account involvement
	signers: string[];
	writableAccounts: string[];
	readonlyAccounts: string[];

	// Program data
	programsInvolved: string[];

	// Instructions
	instructions: InstructionInfo[];

	// Specific transaction types
	tokenTransfers: TokenTransfer[];
	solTransfers: SolTransfer[];
	accountCreations: AccountCreation[];

	// Balance changes
	walletChanges: WalletBalanceChange[];
	tokenBalanceChanges: TokenBalanceChange[];

	// Program invocations grouped by program
	programInvocations: Record<string, Array<{ type: string; info: any }>>;

	// Additional metadata
	bundled: boolean;
}

/**
 * Comprehensive Solana transaction analyzer that combines functionality
 * from all previous implementations
 */
export function analyzeSolanaTransactionEnhanced(
	txData: any
): EnhancedTransactionAnalysis {
	// Initialize result structure
	const analysis: EnhancedTransactionAnalysis = {
		signature: txData.transaction?.signatures?.[0] || undefined,
		timestamp: txData.blockTime,
		slot: txData.slot,
		status: txData.meta.err
			? "error"
			: txData.meta.status?.Ok === null
			? "success"
			: "failed",
		error: txData.meta.err,
		fee: txData.meta.fee,
		computeUnits: txData.meta.computeUnitsConsumed
			? Number(txData.meta.computeUnitsConsumed)
			: undefined,
		signers: [],
		writableAccounts: [],
		readonlyAccounts: [],
		programsInvolved: [],
		instructions: [],
		tokenTransfers: [],
		solTransfers: [],
		accountCreations: [],
		walletChanges: [],
		tokenBalanceChanges: [],
		programInvocations: {},
		bundled: false,
	};

	// Extract account information
	const accountKeys = txData.transaction.message.accountKeys;

	// Process signers and account roles
	accountKeys.forEach((acc: any) => {
		const pubkey = typeof acc === "string" ? acc : acc.pubkey;

		if (acc.signer) {
			analysis.signers.push(pubkey);
		}

		if (acc.writable) {
			analysis.writableAccounts.push(pubkey);
		} else {
			analysis.readonlyAccounts.push(pubkey);
		}
	});

	// Determine if transaction is bundled (many accounts involved)
	analysis.bundled = accountKeys.length > 10;

	// Track programs involved
	const uniquePrograms = new Set<string>();
	txData.transaction.message.instructions.forEach((ix: any) => {
		if (ix.programId) {
			uniquePrograms.add(ix.programId);
		}
	});
	analysis.programsInvolved = Array.from(uniquePrograms);

	// Extract instructions info
	analysis.instructions = txData.transaction.message.instructions.map(
		(ix: any) => {
			const instructionInfo: InstructionInfo = {
				programId: ix.programId,
				program: ix.program || "unknown",
				type: ix.parsed?.type || "unknown",
				accounts: ix.accounts || [],
			};

			if (ix.parsed) {
				instructionInfo.parsed = {
					type: ix.parsed.type,
					info: ix.parsed.info,
				};
			}

			return instructionInfo;
		}
	);

	// Analyze wallet balance changes
	const walletChanges = new Map<string, WalletBalanceChange>();

	// Initialize wallet changes for all accounts
	accountKeys.forEach((account: any, index: number) => {
		const pubkey = typeof account === "string" ? account : account.pubkey;
		const preSol = Number(txData.meta.preBalances[index]) / 1e9;
		const postSol = Number(txData.meta.postBalances[index]) / 1e9;

		walletChanges.set(pubkey, {
			address: pubkey,
			preSol,
			postSol,
			change: postSol - preSol,
			isSigner: !!account.signer,
			isWritable: !!account.writable,
			tokenChanges: [],
		});
	});

	// Process token balance changes
	if (txData.meta.preTokenBalances && txData.meta.postTokenBalances) {
		const preBalances = new Map(
			txData.meta.preTokenBalances.map((b: TokenBalance) => [b.accountIndex, b])
		);
		const postBalances = new Map(
			txData.meta.postTokenBalances.map((b: TokenBalance) => [
				b.accountIndex,
				b,
			])
		);

		// Combine all token account indexes
		const allIndexes = new Set([...preBalances.keys(), ...postBalances.keys()]);

		allIndexes.forEach((index) => {
			const pre: any = preBalances.get(index);
			const post: any = postBalances.get(index);

			if (pre || post) {
				const accountKey =
					typeof accountKeys[index as any] === "string"
						? accountKeys[index as any]
						: accountKeys[index as any].pubkey;

				const wallet = walletChanges.get(accountKey);

				const tokenChange: TokenBalanceChange = {
					mint: pre?.mint || post?.mint || "",
					owner: pre?.owner || post?.owner || "",
					account: accountKey,
					preAmount: pre?.uiTokenAmount.amount || "0",
					postAmount: post?.uiTokenAmount.amount || "0",
					uiPreAmount: Number(pre?.uiTokenAmount.uiAmountString || 0),
					uiPostAmount: Number(post?.uiTokenAmount.uiAmountString || 0),
					uiChange:
						Number(post?.uiTokenAmount.uiAmountString || 0) -
						Number(pre?.uiTokenAmount.uiAmountString || 0),
					decimals:
						pre?.uiTokenAmount.decimals || post?.uiTokenAmount.decimals || 0,
				};

				// Add to both collections
				analysis.tokenBalanceChanges.push(tokenChange);

				if (wallet) {
					wallet.tokenChanges.push(tokenChange);
				}
			}
		});
	}

	// Process inner instructions for specific transaction types
	if (txData.meta.innerInstructions) {
		txData.meta.innerInstructions.forEach((inner: any) => {
			inner.instructions.forEach((ix: any) => {
				// Process token transfers
				if (ix.program === "spl-token" && ix.parsed?.type === "transfer") {
					analysis.tokenTransfers.push({
						mint: ix.parsed.info.mint || "",
						amount: parseFloat(ix.parsed.info.amount),
						from: ix.parsed.info.source,
						to: ix.parsed.info.destination,
						authority: ix.parsed.info.authority,
					});
				}

				// Process SOL transfers
				if (ix.program === "system" && ix.parsed?.type === "transfer") {
					analysis.solTransfers.push({
						amount: parseFloat(ix.parsed.info.lamports) / 1e9, // Convert to SOL
						from: ix.parsed.info.source,
						to: ix.parsed.info.destination,
					});
				}

				// Process account creations
				if (ix.program === "system" && ix.parsed?.type === "createAccount") {
					analysis.accountCreations.push({
						newAccount: ix.parsed.info.newAccount,
						owner: ix.parsed.info.source,
						lamports: parseFloat(ix.parsed.info.lamports) / 1e9,
						space: parseInt(ix.parsed.info.space),
					});
				}

				// Group by program
				if (!analysis.programInvocations[ix.program || "unknown"]) {
					analysis.programInvocations[ix.program || "unknown"] = [];
				}

				analysis.programInvocations[ix.program || "unknown"].push({
					type: ix.parsed?.type || "unknown",
					info: ix.parsed?.info || {},
				});
			});
		});
	}

	analysis.walletChanges = Array.from(walletChanges.values());

	return analysis;
}

/**
 * Format transaction analysis into a beautiful ASCII table output
 */
export function formatTransactionAnalysisTable(
	analysis: EnhancedTransactionAnalysis
): string {
	// Helper for creating tables
	const createTable = (headers: string[], rows: string[][]): string => {
		// Calculate column widths
		const colWidths = headers.map((h, i) => {
			const maxDataLength = Math.max(
				...rows.map((row) => (row[i] || "").toString().length)
			);
			return Math.max(h.length, maxDataLength) + 2; // +2 for padding
		});

		// Create header row
		let table = "┌" + colWidths.map((w) => "─".repeat(w)).join("┬") + "┐\n";
		table +=
			"│" +
			headers.map((h, i) => ` ${h.padEnd(colWidths[i] - 2)} `).join("│") +
			"│\n";
		table += "├" + colWidths.map((w) => "─".repeat(w)).join("┼") + "┤\n";

		// Create data rows
		rows.forEach((row) => {
			const formattedRow = row.map((cell, i) => {
				const cellStr = (cell || "").toString();
				return ` ${cellStr.padEnd(colWidths[i] - 2)} `;
			});
			table += "│" + formattedRow.join("│") + "│\n";
		});

		// Create footer
		table += "└" + colWidths.map((w) => "─".repeat(w)).join("┴") + "┘\n";

		return table;
	};

	// Basic Transaction Info Table
	let output =
		"╔═══════════════════════════════════════════════════════════════════════╗\n";
	output +=
		"║                      SOLANA TRANSACTION ANALYSIS                      ║\n";
	output +=
		"╚═══════════════════════════════════════════════════════════════════════╝\n\n";

	const txInfoRows = [
		["Signature", analysis.signature || "N/A"],
		["Status", analysis.status.toUpperCase()],
		["Slot", analysis.slot.toString()],
		[
			"Timestamp",
			analysis.timestamp
				? new Date(Number(analysis.timestamp) * 1000).toISOString()
				: "N/A",
		],
		["Fee", `${Number(analysis.fee) / 1e9} SOL (${analysis.fee} lamports)`],
		["Compute Units", analysis.computeUnits?.toString() || "N/A"],
		["Bundled Tx", analysis.bundled ? "Yes" : "No"],
	];

	output +=
		"╔═══════════════════════════════════════════════════════════════════════╗\n";
	output +=
		"║                      TRANSACTION OVERVIEW                             ║\n";
	output +=
		"╚═══════════════════════════════════════════════════════════════════════╝\n";

	txInfoRows.forEach((row) => {
		output += `${row[0]}: ${row[1]}\n`;
	});

	// Signers Table
	if (analysis.signers.length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                             SIGNERS                                  ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		const signerRows = analysis.signers.map((signer) => [signer]);
		output += createTable(["Address"], signerRows);
	}

	// Programs Table
	if (analysis.programsInvolved.length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                      PROGRAMS INVOLVED                               ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		const programRows = analysis.programsInvolved.map((program) => [program]);
		output += createTable(["Program ID"], programRows);
	}

	// SOL Transfers Table
	if (analysis.solTransfers.length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                          SOL TRANSFERS                               ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		const solTransferRows = analysis.solTransfers.map((transfer) => [
			transfer.from,
			transfer.to,
			transfer.amount.toFixed(9),
		]);

		output += createTable(["From", "To", "Amount (SOL)"], solTransferRows);
	}

	// Token Transfers Table
	if (analysis.tokenTransfers.length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                         TOKEN TRANSFERS                              ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		const tokenTransferRows = analysis.tokenTransfers.map((transfer) => [
			transfer.from,
			transfer.to,
			transfer.amount.toString(),
			transfer.mint,
			transfer.authority,
		]);

		output += createTable(
			["From", "To", "Amount", "Mint", "Authority"],
			tokenTransferRows
		);
	}

	// Account Creations Table
	if (analysis.accountCreations.length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                        ACCOUNT CREATIONS                             ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		const accountCreationRows = analysis.accountCreations.map((creation) => [
			creation.newAccount,
			creation.owner,
			creation.lamports.toFixed(9),
			creation.space.toString(),
		]);

		output += createTable(
			["New Account", "Owner", "Lamports", "Space"],
			accountCreationRows
		);
	}

	// Wallet Changes Table
	const significantWalletChanges = analysis.walletChanges.filter(
		(w) => w.change !== 0 || w.tokenChanges.length > 0
	);

	if (significantWalletChanges.length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                         WALLET CHANGES                               ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		const walletChangeRows = significantWalletChanges.map((wallet) => [
			wallet.address,
			wallet.preSol.toFixed(9),
			wallet.postSol.toFixed(9),
			(wallet.change > 0 ? "+" : "") + wallet.change.toFixed(9),
			wallet.isSigner ? "Yes" : "No",
			wallet.tokenChanges.length.toString(),
		]);

		output += createTable(
			["Address", "Pre SOL", "Post SOL", "Change", "Signer", "Token Changes"],
			walletChangeRows
		);
	}

	// Token Balance Changes Table
	const significantTokenChanges = analysis.tokenBalanceChanges.filter(
		(t) => t.uiChange !== 0
	);

	if (significantTokenChanges.length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                      TOKEN BALANCE CHANGES                           ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		const tokenChangeRows = significantTokenChanges.map((token) => [
			token.account,
			token.owner,
			token.mint,
			token.uiPreAmount.toString(),
			token.uiPostAmount.toString(),
			(token.uiChange > 0 ? "+" : "") + token.uiChange.toString(),
			token.decimals.toString(),
		]);

		output += createTable(
			[
				"Account",
				"Owner",
				"Mint",
				"Pre Amount",
				"Post Amount",
				"Change",
				"Decimals",
			],
			tokenChangeRows
		);
	}

	// Program Invocations Summary
	if (Object.keys(analysis.programInvocations).length > 0) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                      PROGRAM INVOCATIONS                             ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		Object.entries(analysis.programInvocations).forEach(
			([program, invocations]) => {
				output += `\nProgram: ${program}\n`;

				// Group by instruction type and count
				const typeCounts = new Map<string, number>();
				invocations.forEach((ix) => {
					const count = typeCounts.get(ix.type) || 0;
					typeCounts.set(ix.type, count + 1);
				});

				const typeRows = Array.from(typeCounts.entries()).map(
					([type, count]) => [type, count.toString()]
				);

				output += createTable(["Instruction Type", "Count"], typeRows);
			}
		);
	}

	// Instructions Detail (if needed - can be verbose)
	if (analysis.instructions.length > 0 && analysis.instructions.length <= 10) {
		output +=
			"\n╔═══════════════════════════════════════════════════════════════════════╗\n";
		output +=
			"║                      INSTRUCTIONS DETAIL                             ║\n";
		output +=
			"╚═══════════════════════════════════════════════════════════════════════╝\n";

		analysis.instructions.forEach((instruction, index) => {
			output += `\nInstruction ${index + 1}:\n`;
			output += `  Program: ${instruction.program} (${instruction.programId})\n`;
			output += `  Type: ${instruction.type}\n`;

			if (instruction.accounts && instruction.accounts.length > 0) {
				output += "  Accounts:\n";
				instruction.accounts.forEach((account) => {
					output += `    - ${account}\n`;
				});
			}

			if (instruction.parsed) {
				output += "  Parsed Info:\n";
				output += `    Type: ${instruction.parsed.type}\n`;

				if (instruction.parsed.info) {
					const infoEntries = Object.entries(instruction.parsed.info);
					if (infoEntries.length > 0) {
						output += "    Details:\n";
						infoEntries.forEach(([key, value]) => {
							output += `      ${key}: ${value}\n`;
						});
					}
				}
			}
		});
	} else if (analysis.instructions.length > 10) {
		output += "\n• Instructions detail omitted (too many instructions)\n";
	}

	return output;
}

export function analyzeSolanaTransactionFormatted(txData: any): string {
	const analysis = analyzeSolanaTransactionEnhanced(txData);
	return formatTransactionAnalysisTable(analysis);
}

// Example usage
export function demonstrateTransactionAnalysis(txData: any): void {
	console.log(analyzeSolanaTransactionFormatted(txData));
}
