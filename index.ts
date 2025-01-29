(async()=>{
    console.log(await(await fetch("https://api-v2.solscan.io/v2/account/activity/dextrading/total?address=562iUrg5zqANwiibDJUyGKpFQaCczTgRE1ps7qPocq3r", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "if-none-match": "W/\"2a-e/rA442Nfdy8cgpGWMvBPH7FbVE\"",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sol-aut": "EQLZ2KZHD90f=bxSU6CSwWLqhjkB0dB9dls0fKQ-"
  },
  "referrer": "https://solscan.io/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
})).json())
})()