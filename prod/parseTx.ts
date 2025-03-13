//using new version of solana web3
import { Signature } from "@solana/web3.js";
import "dotenv/config";
import {
	createSolanaRpc,
	type Address,
	mainnet,
	address,
} from "@solana/web3.js";
import {
	analyzeSolanaTransaction,
	extractTransactionDetails,
	formatTransactionAnalysis,
	parseAndPrintTx,
	parseSolanaTransaction,
} from "../chainfun";
import { analyzeSolanaTransactionEnhanced, demonstrateTransactionAnalysis } from "./extractTx";

interface TokenBalance {
	tokenMint: string;
	tokenAmount: number;
}

interface WalletBalances {
	solBalance: number;
	tokenBalances: TokenBalance[];
}

async function getWalletBalances(
	walletAddress: string
): Promise<WalletBalances> {
	const rpc = createSolanaRpc(mainnet("https://api.mainnet-beta.solana.com"));
	const publicKey = address(walletAddress);

	// Fetch SOL balance
	const solBalanceLamports = (await rpc.getBalance(publicKey).send()).value;
	const solBalance = Number(solBalanceLamports) / 1e9;

	// Fetch token accounts with parsing flag
	const tokenAccounts = await rpc
		.getTokenAccountsByOwner(
			publicKey,
			{
				programId: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
			},
			{ encoding: "jsonParsed" }
		)
		.send();

	// Extract token balances with proper parsing
	const tokenBalances: TokenBalance[] = tokenAccounts.value
		.map((account) => {
			try {
				const parsedData = account.account.data.parsed.info;
				const tokenAmount =
					Number(parsedData.tokenAmount.amount) /
					Math.pow(10, parsedData.tokenAmount.decimals);

				return {
					tokenMint: parsedData.mint,
					tokenAmount: tokenAmount,
				};
			} catch (error) {
				console.warn(`Failed to parse token account:`, error);
				return {
					tokenMint: "invalid",
					tokenAmount: 0,
				};
			}
		})
		.filter((balance) => balance.tokenAmount > 0);

	return {
		solBalance,
		tokenBalances,
	};
}

const DEFAULT_LIMIT = 10;
async function getWalletTransactions(
	wallet: Address,
	limit: number = DEFAULT_LIMIT
) {
	const url = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
	const rpc = createSolanaRpc(url);
	const signaturesResponse = await rpc
		.getSignaturesForAddress(wallet as Address, {
			limit,
		})
		.send();

	if (!signaturesResponse || signaturesResponse.length === 0) {
		return [];
	}
	return signaturesResponse;
}

async function parseTx(sig: Signature) {
	const url = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
	const rpc = createSolanaRpc(url);
	const fetchTx = await rpc
		.getTransaction(sig, {
			maxSupportedTransactionVersion: 0,
			encoding: "jsonParsed",
		})
		.send();
	if (!fetchTx) {
		console.warn(`Transaction ${sig} not found \n`);
		return null;
	}
	return fetchTx;
}
(async () => {
	const res = await getWalletTransactions(
		"ZG98FUCjb8mJ824Gbs6RsgVmr1FhXb2oNiJHa2dwmPd" as Address,
		1
	);

	res.forEach(async (sig) => {
		let data = await parseTx(sig.signature);
		const res=await analyzeSolanaTransactionEnhanced(data)
		console.log(res)
		//console.log(data)
	});
})();
