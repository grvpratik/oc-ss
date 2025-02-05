import "dotenv/config";
const url = `https://api.helius.xyz/v0/addresses/BZsS3Vz7vgh5EKUDu5KjKjQPd7PH7Tb6GDoZUZg6ZtE2/transactions?api-key=${process.env.HELIUS_KEY}`;

const parseTransaction = async () => {
	const response = await fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});

	const data = await response.json();
	console.log("parsed transaction: ", data);
};

parseTransaction();
