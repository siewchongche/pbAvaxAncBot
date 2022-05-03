const ethers = require("ethers")
const axios = require("axios")
require("dotenv").config()

const vaultAddr = "0x7065FdCcE753f4fCEeEcFe25F2B7c51d52cf056e"
const vaultABI = require("./vaultABI.json")

const delay = ms => new Promise(res => setTimeout(res, ms));

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc")
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const vault = new ethers.Contract(vaultAddr, vaultABI, signer)

    const filter = {
        address: vaultAddr,
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