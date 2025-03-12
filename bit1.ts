// import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// import { getMint } from "@solana/spl-token";
// [1, 2, 5];

// async function getMintAndFreezeAuthority(mintAddress) {
// 	const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
// 	[1, 2];

// 	const mintAccount = await getMint(connection, new PublicKey(mintAddress));
// 	[1, 2, 5];

// 	const mintAuthority = mintAccount.mintAuthority; // Public key of the mint authority [2, 5, 7]

// 	const freezeAuthority = mintAccount.freezeAuthority; // Public key of the freeze authority [2, 6, 13]

// 	return { mintAuthority, freezeAuthority };
// }

// // Usage example:
// (async () => {
// 	const tokenMintAddress = "DWYxAiG5bmwZxo7Axtk1ZHmSx6ZZUDVQFpekLt5hpump";

// 	const result = await getMintAndFreezeAuthority(tokenMintAddress);

// 	console.log("Mint Authority:", result.mintAuthority.toString());

// 	console.log("Freeze Authority:", result.freezeAuthority.toString());
// })();
