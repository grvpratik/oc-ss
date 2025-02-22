import type {
	TokenBalance,
	Lamports,
	TransactionError,
} from "@solana/rpc-types";

interface TokenBalanceChange {
	mint: string;
	owner: string;
	preAmount: string;
	postAmount: string;
	uiChange: number;
	decimals: number;
}

interface WalletBalanceChange {
	address: string;
	preSol: number;
	postSol: number;
	change: number;
	tokenChanges: TokenBalanceChange[];
}

interface InstructionInfo {
	programId: string;
	type: string;
	parsed?: {
		type: string;
		info: any;
	};
}

interface TransactionAnalysis {
	timestamp: number | null;
	slot: number;
	status: "success" | "error";
	error: TransactionError | null;
	fee: number;
	computeUnits?: number;
	signers: string[];
	programsInvolved: string[];
	instructions: InstructionInfo[];
	walletChanges: WalletBalanceChange[];
}

function analyzeSolanaTransaction(txData: any): TransactionAnalysis {
	// Initialize result structure
	const analysis: TransactionAnalysis = {
		timestamp: txData.blockTime,
		slot: txData.slot,
		status: txData.meta.err ? "error" : "success",
		error: txData.meta.err,
		fee: txData.meta.fee,
		computeUnits: txData.meta.computeUnitsConsumed
			? Number(txData.meta.computeUnitsConsumed)
			: undefined,
		signers: [],
		programsInvolved: [],
		instructions: [],
		walletChanges: [],
	};

	// Extract signers
	const accountKeys = txData.transaction.message.accountKeys;
	analysis.signers = accountKeys
		.filter((acc:any) => acc.signer)
		.map((acc:any) => acc.pubkey);

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
				type: ix.program || "unknown",
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

	// Analyze balance changes
	const walletChanges = new Map<string, WalletBalanceChange>();

	// Initialize wallet changes for all accounts
	accountKeys.forEach((account:any, index:any) => {
		const preSol = Number(txData.meta.preBalances[index]) / 1e9;
		const postSol = Number(txData.meta.postBalances[index]) / 1e9;

		walletChanges.set(account.pubkey, {
			address: account.pubkey,
			preSol,
			postSol,
			change: postSol - preSol,
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
			const pre:any = preBalances.get(index);
			const post:any = postBalances.get(index);

			if (pre || post) {
				const accountKey = accountKeys[index as any].pubkey;
				const wallet = walletChanges.get(accountKey);

				if (wallet ) {
					const tokenChange: TokenBalanceChange = {
						mint: pre?.mint || post?.mint || "",
						owner: pre?.owner || post?.owner || "",
						preAmount: pre?.uiTokenAmount.amount || "0",
						postAmount: post?.uiTokenAmount.amount || "0",
						uiChange:
							Number(post?.uiTokenAmount.uiAmountString || 0) -
							Number(pre?.uiTokenAmount.uiAmountString || 0),
						decimals:
							pre?.uiTokenAmount.decimals || post?.uiTokenAmount.decimals || 0,
					};

					wallet.tokenChanges.push(tokenChange);
				}
			}
		});
	}

	analysis.walletChanges = Array.from(walletChanges.values());

	return analysis;
}

// Helper function to format analysis results into human readable format
function formatTransactionAnalysis(analysis: TransactionAnalysis): string {
	let output = `
Transaction Summary:
-------------------
Status: ${analysis.status}
Slot: ${analysis.slot}
Timestamp: ${
		analysis.timestamp
			? new Date(Number(analysis.timestamp) * 1000).toISOString()
			: "N/A"
	}
Fee: ${Number(analysis.fee) / 1e9} SOL
Compute Units: ${analysis.computeUnits || "N/A"}

Signers:
${analysis.signers.map((s) => `- ${s}`).join("\n")}

Programs Involved:
${analysis.programsInvolved.map((p) => `- ${p}`).join("\n")}

Wallet Changes:
`;

	analysis.walletChanges
		.filter((w) => w.change !== 0 || w.tokenChanges.length > 0)
		.forEach((wallet) => {
			output += `\n${wallet.address}:
  SOL: ${wallet.preSol.toFixed(9)} → ${wallet.postSol.toFixed(9)} (${
				wallet.change > 0 ? "+" : ""
			}${wallet.change.toFixed(9)})
`;

			if (wallet.tokenChanges.length > 0) {
				output += "  Token Changes:\n";
				wallet.tokenChanges.forEach((token) => {
					output += `    Mint ${token.mint}:
    ${token.preAmount} → ${token.postAmount} (${token.uiChange > 0 ? "+" : ""}${
						token.uiChange
					})\n`;
				});
			}
		});

	return output;
}

export { analyzeSolanaTransaction, formatTransactionAnalysis };

export function extractTransactionDetails(transaction: any) {
	if (!transaction) return null;

	const { meta, transaction: txData, slot, blockTime } = transaction;
	if (!meta || !txData) return null;

	const accountKeys = txData.message.accountKeys.map((acc: { pubkey: any }) =>
		typeof acc === "string" ? acc : acc.pubkey
	);
	const interactedPrograms = new Set<string>();
	const interactedWallets = new Set<string>();
	const bundled = txData.message.accountKeys.length > 10; // Arbitrary threshold for bundle detection

	txData.message.instructions.forEach((instr: any) => {
		if ("programId" in instr) {
			interactedPrograms.add(instr.programId);
		}
		if ("accounts" in instr) {
			instr.accounts.forEach((acc: any) => interactedWallets.add(acc));
		}
	});

	return {
		slot,
		blockTime,
		fee: meta.fee,
		err: meta.err,
		computeUnitsConsumed: meta.computeUnitsConsumed,
		preBalances: meta.preBalances.map((b: any) => Number(b) / 1_000_000_000),
		postBalances: meta.postBalances.map((b: any) => Number(b) / 1_000_000_000),
		interactedPrograms: Array.from(interactedPrograms),
		interactedWallets: Array.from(interactedWallets),
		bundled,
	};
}
