const ethers = require("ethers")
const axios = require("axios")
const IERC20ABI = require("./IERC20ABI.json")
const vaultABI = require("./vaultABI.json")
require("dotenv").config()

const aUSTAddr = "0xaB9A04808167C170A9EC4f8a87a0cD781ebcd55e"
const vaultBTCAddr = "0x8D71f644434Fd516BE37a12ea3E4Bc42f5303514"
const vaultETHAddr = "0x642c51c5B9e93a0067D5eF42C54d75701801a9d7"
const delay = ms => new Promise(res => setTimeout(res, ms));
const threshold = 0

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc")
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const vaultBTC = new ethers.Contract(vaultBTCAddr, vaultABI, signer)
    const vaultETH = new ethers.Contract(vaultETHAddr, vaultABI, signer)

    // Get rate from Anchor SC Terra
    const res = await axios.get("https://lcd.terra.dev/wasm/contracts/terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s/store?query_msg=%7B%22epoch_state%22:%7B%7D%7D")
    const rate = ethers.utils.parseEther((res.data.result.exchange_rate).toString())
    // Backup: from API, rate outdated a bit
    // const res = await axios.get("https://api.anchorprotocol.com/api/v1/market/ust")
    // const rate = ethers.utils.parseEther((res.data.exchange_rate).toString())
    
    // Calculate extra reward
    const aUST = new ethers.Contract(aUSTAddr, IERC20ABI, provider)
    const aUSTAmt = await aUST.balanceOf(vaultAddr)
    const USTAmt = aUSTAmt.mul(rate).div(ethers.utils.parseEther("1"))
    console.log(ethers.utils.formatUnits(USTAmt, 6))
    // const baseUSTAmt = await vault.getAllPool()
    // const earnInUST = USTAmt.sub(baseUSTAmt)
    // const earnInAUST = earnInUST.mul(ethers.utils.parseEther("1")).div(rate)

    // if (earnInUST.gt(ethers.utils.parseUnits(threshold, 6))) {
    //     // Initialize harvest
    //     let tx
    //     tx = await vault.initializeHarvest(earnInAUST)
    //     await tx.wait()
    //     console.log("Harvest initialize successfully")

    //     // Wait for 2 minutes
    //     await delay(120000)

    //     // Actual harvest
    //     tx = await vault.harvest()
    //     await tx.wait()
    //     console.log("Harvest execute successfully")
    // }
}
main().catch(err => console.error(err))