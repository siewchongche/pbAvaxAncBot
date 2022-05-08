const ethers = require("ethers")
const cron = require("node-cron")
const IERC20ABI = require("./IERC20ABI.json")
const vaultABI = require("./vaultABI.json")
require("dotenv").config()

const vaultAddr = "0x1c3b1069E60F9e3CE8212410b734a7C6775D865C"
const threshold = "100" // i.e. 50 = 50 UST

const aUSTAddr = "0xaB9A04808167C170A9EC4f8a87a0cD781ebcd55e"
const priceOracleAddr = "0x9D5024F957AfD987FdDb0a7111C8c5352A3F274c"
const delay = ms => new Promise(res => setTimeout(res, ms));
const oneEther = ethers.utils.parseEther("1")

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc")
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const vault = new ethers.Contract(vaultAddr, vaultABI, signer)
    const aUST = new ethers.Contract(aUSTAddr, IERC20ABI, provider)

    cron.schedule("0 0 */6 * * *", async () => {
        // Get rate from Chainlink for aUST
        const priceOracle = new ethers.Contract(priceOracleAddr, [
            "function latestRoundData() external view returns (uint, uint)"
        ], provider)
        const rate = (await priceOracle.latestRoundData())[1] // 18 decimals

        // Calculate extra reward
        const aUSTAmt = (await aUST.balanceOf(vaultAddr))
        const USTAmt = aUSTAmt.mul(rate).div(oneEther)
        const baseUSTAmt = await vault.getAllPool()
        const earnInUST = USTAmt.sub(baseUSTAmt)

        if (earnInUST.gt(ethers.utils.parseUnits(threshold, 6))) {
            // Initialize harvest
            let tx
            tx = await vault.initializeHarvest()
            await tx.wait()
            console.log("Harvest initialize successfully at:", (new Date()).toString())

            // Wait for 2 minutes
            await delay(120000)

            // Actual harvest
            tx = await vault.harvest()
            await tx.wait()
            console.log("Harvest execute successfully at:", (new Date()).toString())
        }
    })
}
main().catch(err => console.error(err))