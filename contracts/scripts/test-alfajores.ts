import { ethers } from "hardhat";

const CUSD_TESTNET = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const CONTRACT_ADDRESS = process.env.TESTNET_CONTRACT_ADDRESS ?? "";

const CUSD_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

async function main() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Set TESTNET_CONTRACT_ADDRESS in .env.local before running this script");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Testing with wallet:", deployer.address);

  const cusd = new ethers.Contract(CUSD_TESTNET, CUSD_ABI, deployer);
  const contract = await ethers.getContractAt("MicroTaskPayment", CONTRACT_ADDRESS, deployer);

  // ── Balances before ───────────────────────────────────────────────────────
  const walletBalanceBefore = await cusd.balanceOf(deployer.address);
  const contractBalanceBefore = await cusd.balanceOf(CONTRACT_ADDRESS);
  console.log("\n── Before ──");
  console.log("Wallet cUSD:  ", ethers.formatEther(walletBalanceBefore));
  console.log("Contract cUSD:", ethers.formatEther(contractBalanceBefore));

  // ── Task price ────────────────────────────────────────────────────────────
  const captionPrice = await contract.getPrice(1);
  console.log("\nCaption price:", ethers.formatEther(captionPrice), "cUSD");

  // ── Step 1: approve ───────────────────────────────────────────────────────
  console.log("\n[1] Approving cUSD spend...");
  const approveTx = await cusd.approve(CONTRACT_ADDRESS, captionPrice);
  await approveTx.wait();
  console.log("    approve() tx:", approveTx.hash);

  const allowance = await cusd.allowance(deployer.address, CONTRACT_ADDRESS);
  console.log("    Allowance set:", ethers.formatEther(allowance), "cUSD");

  // ── Step 2: requestTask ───────────────────────────────────────────────────
  console.log("\n[2] Calling requestTask(1) — Caption...");
  const taskTx = await contract.requestTask(1);
  const receipt = await taskTx.wait();
  console.log("    requestTask() tx:", taskTx.hash);
  console.log("    Block:", receipt.blockNumber);

  // ── Step 3: verify event ──────────────────────────────────────────────────
  console.log("\n[3] Checking TaskRequested event...");
  const iface = contract.interface;
  let eventFound = false;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "TaskRequested") {
        eventFound = true;
        console.log("    Event emitted:");
        console.log("      user:      ", parsed.args.user);
        console.log("      taskType:  ", parsed.args.taskType.toString());
        console.log("      amount:    ", ethers.formatEther(parsed.args.amount), "cUSD");
        console.log("      requestId: ", parsed.args.requestId);
        console.log("      timestamp: ", new Date(Number(parsed.args.timestamp) * 1000).toISOString());
      }
    } catch {
      // not this contract's log
    }
  }
  if (!eventFound) throw new Error("TaskRequested event NOT found in receipt — FAIL");

  // ── Step 4: contract balance increased ────────────────────────────────────
  const contractBalanceAfter = await cusd.balanceOf(CONTRACT_ADDRESS);
  console.log("\n[4] Contract cUSD after:", ethers.formatEther(contractBalanceAfter));
  if (contractBalanceAfter <= contractBalanceBefore) {
    throw new Error("Contract balance did not increase — FAIL");
  }
  console.log("    Balance increased by:", ethers.formatEther(contractBalanceAfter - contractBalanceBefore), "cUSD ✓");

  // ── Step 5: withdraw ──────────────────────────────────────────────────────
  console.log("\n[5] Testing withdraw()...");
  const ownerBalanceBefore = await cusd.balanceOf(deployer.address);
  const withdrawTx = await contract.withdraw();
  await withdrawTx.wait();
  console.log("    withdraw() tx:", withdrawTx.hash);

  const ownerBalanceAfter = await cusd.balanceOf(deployer.address);
  const contractBalanceFinal = await cusd.balanceOf(CONTRACT_ADDRESS);
  console.log("    Contract balance after withdraw:", ethers.formatEther(contractBalanceFinal));
  console.log("    Owner balance change:           ", ethers.formatEther(ownerBalanceAfter - ownerBalanceBefore), "cUSD ✓");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n── All checks passed ✓ ──");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Alfajores explorer: https://alfajores.celoscan.io/address/" + CONTRACT_ADDRESS);
}

main().catch((err) => {
  console.error("\nTest failed:", err.message);
  process.exitCode = 1;
});
