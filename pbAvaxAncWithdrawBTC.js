const ethers = require("ethers")
const axios = require("axios")
require("dotenv").config()

const vaultAddr = "0x1968dd1ab79c7c73FAc8578FED92DE959d71A65f"
const vaultABI = require("./vaultABI.json")

const delay = ms => new Promise(res => setTimeout(res, ms));

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc")
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const vault = new ethers.Contract(vaultAddr, vaultABI, signer)

    const filter = {
        address: vaultAddr,
        // address: [
        //     "0x1968dd1ab79c7c73FAc8578FED92DE959d71A65f", // BTC
        //     "0x7065FdCcE753f4fCEeEcFe25F2B7c51d52cf056e", // ETH
        //     "0x1c3b1069E60F9e3CE8212410b734a7C6775D865C" // sAVAX
        // ],
        topics: [vault.interface.getEventTopic("Withdraw")]
    }
    provider.on(filter, async (log) => {
        const parsedLog = vault.interface.parseLog(log)
        const account = parsedLog.args[2]

        // Wait for 2 minutes
        await delay(120000)

        // Transfer received UST to user
        const tx = await vault.repayWithdraw(account)
        await tx.wait()
        console.log("Successfully repay withdraw for", account)
    })
}
main().catch(err => console.error(err))