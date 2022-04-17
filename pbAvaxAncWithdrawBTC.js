const ethers = require("ethers")
const axios = require("axios")
require("dotenv").config()

const vaultAddr = "0x8D71f644434Fd516BE37a12ea3E4Bc42f5303514"
const vaultABI = require("./vaultABI.json")

const vaultHelperAddr = "0x397F20576efFBf2f1885083f9DCe4D0c01cbB05e"
const vaultHelperABI = require("./vaultHelperABI.json")

const delay = ms => new Promise(res => setTimeout(res, ms));

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc")
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const vault = new ethers.Contract(vaultAddr, vaultABI, signer)
    const vaultHelper = new ethers.Contract(vaultHelperAddr, vaultHelperABI, signer)

    const filter = {
        address: vaultAddr,
        topics: [vault.interface.getEventTopic("Withdraw")]
    }
    provider.on(filter, async (log) => {
        const parsedLog = vault.interface.parseLog(log)
        const account = parsedLog.args[2]

        // Get rate
        const res = await axios.get("https://api.anchorprotocol.com/api/v1/market/ust")
        const rate = ethers.utils.parseEther((res.data.exchange_rate).toString())

        // Get aUST from vault and redeem for UST from Anchor bridge 
        let tx
        tx = await vaultHelper.executeWithdraw(account, rate)
        await tx.wait()
        console.log("Successfully execute withdraw for", account)

        // Wait for 2 minutes
        await delay(120000)

        // Transfer received UST to user
        tx = await vaultHelper.repayWithdraw(account)
        await tx.wait()
        console.log("Successfully repay withdraw for", account)
    })
}
main().catch(err => console.error(err))