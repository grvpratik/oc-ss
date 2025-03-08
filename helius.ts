import { Helius } from "helius-sdk";
import 'dotenv/config'
(async()=>{
console.log(process.env.HELIUS_KEY);
    const helius = new Helius(process.env.HELIUS_KEY!);
    const response = await helius.rpc.getAssetsByOwner({
        ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
        page: 1,
    });
    
    console.log(response.items);
})()
