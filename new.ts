(async () => {
	const list = await fetch(
		"https://frontend-api-v3.pump.fun/coins?offset=0&limit=200&sort=market_cap&includeNsfw=false&order=ASC",
		{
			headers: {
				accept: "*/*",
				"accept-language": "en-US,en;q=0.8",
				"content-type": "application/json",
				"if-none-match": 'W/"cb22-weY3jyA4mObSdds9ooijoR/+YMg"',
				priority: "u=1, i",
				"sec-ch-ua":
					'"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-site",
				"sec-gpc": "1",
				cookie:
					"__cf_bm=xaVeicsd7In2_nvMQ0p_Em09WoWJKG.gxiWOavIObHI-1740386381-1.0.1.1-hi7nWrN.B3CXWBepW3PeYF7_FhWnQm8YtxBdfy4JXCqsx5Ie7DN5pmtZHlVUdlrFZg7jPtwvl16QLLITREhQUQ; cf_clearance=4W2p1AU5q5Dh0VZkZfpk.IAZQ_7VmswEGnKlkfoJCEk-1740386383-1.2.1.1-Jfp0TTcSjfpM8IFBDcImLrsi4Hj8391.qfMWqD5_5.pyelXezlOImrjea8WHLDzy2SqUwHTRDjMsFINhsPGYPRpUedjvgjHYoSUA5MU9Y4n4ESC163i3nMnfGQlzsh4oHcaPMTOsnOhwpzBfDF4CiZ2mjxdh2QgQJoqMnI5znCd9QrkjbGyJf_Tr.z3dRNxlAtDmMhOKiCmHu2D8oqlqO54UXUvwsoCHTCg6UVe2RJEuQbWhrfhs9IibDw58K_GG_wL_Xwk1ZhSloRi3bdnn5.c16FTmKhzJDiEMkUm5W.k",
				Referer: "https://pump.fun/",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
			body: null,
			method: "GET",
		}
	);
    const listJson=await list.json()
	console.log(listJson)
	const filtered = listJson.filter((tx:any) => tx.king_of_the_hill_timestamp!==null);
    console.log(filtered)
})();
