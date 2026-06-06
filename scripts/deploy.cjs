const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Parse .env.local manually — no dotenv dependency needed
const envPath = path.join(__dirname, "../.env.local");
fs.readFileSync(envPath, "utf8")
  .split("\n")
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!rpcUrl || rpcUrl.includes("your_alchemy")) {
    console.error("❌ SEPOLIA_RPC_URL not set in .env.local");
    process.exit(1);
  }
  if (!privateKey || privateKey.includes("your_metamask")) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not set in .env.local");
    process.exit(1);
  }

  const contractJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../contracts/ProductRegistry.json"), "utf8")
  );

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying from wallet:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Wallet has no Sepolia ETH. Get some from the faucet first.");
    process.exit(1);
  }

  console.log("Deploying ProductRegistry to Sepolia...");

  const factory = new ethers.ContractFactory(
    contractJson.abi,
    contractJson.bytecode,
    wallet
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ ProductRegistry deployed to:", address);
  console.log("\nAdd this to your .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err.message);
  process.exit(1);
});
