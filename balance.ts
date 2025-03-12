// import { createSolanaRpc, type Address, mainnet, address } from "@solana/web3.js";


// interface TokenBalance {
//     tokenMint: string;
//     tokenAmount: number;
// }

// interface WalletBalances {
//     solBalance: number;
//     tokenBalances: TokenBalance[];
// }

// interface TokenAccountData {
//     mint: string;
//     owner: string;
//     amount: bigint;
//     delegateOption: number;
//     delegate: string | null;
//     state: number;
//     isNative: boolean;
//     delegatedAmount: bigint;
//     closeAuthorityOption: number;
//     closeAuthority: string | null;
// }

// async function getWalletBalances(
//     walletAddress: string
// ): Promise<WalletBalances> {
//     const rpc = createSolanaRpc(mainnet("https://api.mainnet-beta.solana.com"));
//     const publicKey = address(walletAddress);

//     // Fetch SOL balance
//     const solBalanceLamports = (await rpc.getBalance(publicKey).send()).value;
//     const solBalance = Number(solBalanceLamports) / 1e9;

//     // Fetch token accounts with parsing flag
//     const tokenAccounts = await rpc
// 			.getTokenAccountsByOwner(
// 				publicKey,
// 				{
// 					programId: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
// 				},
// 				{ encoding: "jsonParsed" }
// 			)
// 			.send();

//     // Extract token balances with proper parsing
//     const tokenBalances: TokenBalance[] = tokenAccounts.value
//         .map((account) => {
//             try {
//                 const parsedData = account.account.data.parsed.info;
//                 const tokenAmount = Number(parsedData.tokenAmount.amount) / Math.pow(10, parsedData.tokenAmount.decimals);

//                 return {
//                     tokenMint: parsedData.mint,
//                     tokenAmount: tokenAmount,
//                 };
//             } catch (error) {
//                 console.warn(`Failed to parse token account:`, error);
//                 return {
//                     tokenMint: "invalid",
//                     tokenAmount: 0,
//                 };
//             }
//         })
//         .filter(balance => balance.tokenAmount > 0);

//     return {
//         solBalance,
//         tokenBalances,
//     };
// }

// (async () => {
// 	const walletAddress = "615wod1Ru2j6HeXY97ufNWoKygBc7awqA4hW74evWPBm";
// 	try {
// 		const balances = await getWalletBalances(walletAddress);
// 		console.log("SOL Balance:", balances.solBalance);
// 		console.log("Token Balances:", balances.tokenBalances);
// 	} catch (error) {
// 		console.error("Error fetching balances:", error);
// 	}
// })();
