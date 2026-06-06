const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MicroTaskPayment", () => {
  let contract;
  let mockCUSD;
  let owner, user, other;

  const CAPTION_PRICE = ethers.parseEther("0.10");
  const EMAIL_PRICE   = ethers.parseEther("0.25");

  beforeEach(async () => {
    [owner, user, other] = await ethers.getSigners();

    mockCUSD = await ethers.deployContract("MockERC20");
    await mockCUSD.mint(user.address, ethers.parseEther("10"));

    contract = await ethers.deployContract("MicroTaskPayment", [await mockCUSD.getAddress()]);
  });

  // ── Deployment ─────────────────────────────────────────────────────────────

  describe("deployment", () => {
    it("sets owner correctly", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("sets all 6 initial task prices", async () => {
      expect(await contract.getPrice(1)).to.equal(ethers.parseEther("0.10")); // CAPTION
      expect(await contract.getPrice(2)).to.equal(ethers.parseEther("0.25")); // EMAIL
      expect(await contract.getPrice(3)).to.equal(ethers.parseEther("0.25")); // SUMMARY
      expect(await contract.getPrice(4)).to.equal(ethers.parseEther("0.10")); // EXPLAIN
      expect(await contract.getPrice(5)).to.equal(ethers.parseEther("0.50")); // IMAGE
      expect(await contract.getPrice(6)).to.equal(ethers.parseEther("0.10")); // TRANSLATE
    });

    it("returns 0 for unknown task type", async () => {
      expect(await contract.getPrice(99)).to.equal(0n);
    });
  });

  // ── requestTask ────────────────────────────────────────────────────────────

  describe("requestTask", () => {
    beforeEach(async () => {
      await mockCUSD.connect(user).approve(await contract.getAddress(), CAPTION_PRICE);
    });

    it("transfers cUSD from user to contract", async () => {
      const userBefore     = await mockCUSD.balanceOf(user.address);
      const contractBefore = await mockCUSD.balanceOf(await contract.getAddress());

      await contract.connect(user).requestTask(1);

      expect(await mockCUSD.balanceOf(user.address)).to.equal(userBefore - CAPTION_PRICE);
      expect(await mockCUSD.balanceOf(await contract.getAddress())).to.equal(contractBefore + CAPTION_PRICE);
    });

    it("emits TaskRequested with correct user, taskType, amount, requestId, timestamp", async () => {
      const tx      = await contract.connect(user).requestTask(1);
      const receipt = await tx.wait();
      const block   = await ethers.provider.getBlock(receipt.blockNumber);

      const iface = contract.interface;
      let found = false;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "TaskRequested") {
            found = true;
            expect(parsed.args.user).to.equal(user.address);
            expect(parsed.args.taskType).to.equal(1n);
            expect(parsed.args.amount).to.equal(CAPTION_PRICE);
            expect(parsed.args.requestId).to.not.equal(ethers.ZeroHash);
            expect(parsed.args.timestamp).to.equal(BigInt(block.timestamp));
          }
        } catch { /* not this contract's log */ }
      }
      expect(found, "TaskRequested event not found").to.be.true;
    });

    it("reverts for task type 0", async () => {
      await expect(contract.connect(user).requestTask(0))
        .to.be.revertedWith("Invalid task type");
    });

    it("reverts for task type 99", async () => {
      await expect(contract.connect(user).requestTask(99))
        .to.be.revertedWith("Invalid task type");
    });

    it("reverts when allowance is too low", async () => {
      // approved only CAPTION_PRICE; EMAIL needs 0.25
      await expect(contract.connect(user).requestTask(2))
        .to.be.reverted;
    });

    it("reverts when user has no cUSD balance", async () => {
      await mockCUSD.connect(other).approve(await contract.getAddress(), CAPTION_PRICE);
      await expect(contract.connect(other).requestTask(1))
        .to.be.reverted;
    });

    it("produces a unique requestId on each call", async () => {
      await mockCUSD.connect(user).approve(await contract.getAddress(), ethers.parseEther("1"));
      const ids = new Set();
      for (let i = 0; i < 3; i++) {
        await ethers.provider.send("evm_mine", []);
        const tx      = await contract.connect(user).requestTask(1);
        const receipt = await tx.wait();
        for (const log of receipt.logs) {
          try {
            const p = contract.interface.parseLog(log);
            if (p?.name === "TaskRequested") ids.add(p.args.requestId);
          } catch { /* skip */ }
        }
      }
      expect(ids.size).to.equal(3);
    });
  });

  // ── withdraw ───────────────────────────────────────────────────────────────

  describe("withdraw", () => {
    beforeEach(async () => {
      await mockCUSD.connect(user).approve(await contract.getAddress(), EMAIL_PRICE);
      await contract.connect(user).requestTask(2);
    });

    it("owner withdraws full contract balance to own wallet", async () => {
      const ownerBefore = await mockCUSD.balanceOf(owner.address);
      await contract.connect(owner).withdraw();
      expect(await mockCUSD.balanceOf(owner.address)).to.equal(ownerBefore + EMAIL_PRICE);
      expect(await mockCUSD.balanceOf(await contract.getAddress())).to.equal(0n);
    });

    it("reverts for non-owner", async () => {
      await expect(contract.connect(user).withdraw())
        .to.be.revertedWith("Not owner");
    });

    it("reverts when balance is zero", async () => {
      await contract.connect(owner).withdraw();
      await expect(contract.connect(owner).withdraw())
        .to.be.revertedWith("Nothing to withdraw");
    });
  });

  // ── updatePrice ────────────────────────────────────────────────────────────

  describe("updatePrice", () => {
    it("owner updates a task price", async () => {
      const newPrice = ethers.parseEther("0.05");
      await contract.connect(owner).updatePrice(1, newPrice);
      expect(await contract.getPrice(1)).to.equal(newPrice);
    });

    it("reverts for non-owner", async () => {
      await expect(contract.connect(user).updatePrice(1, ethers.parseEther("0.01")))
        .to.be.revertedWith("Not owner");
    });

    it("uses updated price in requestTask", async () => {
      const newPrice = ethers.parseEther("0.05");
      await contract.connect(owner).updatePrice(1, newPrice);
      await mockCUSD.connect(user).approve(await contract.getAddress(), newPrice);
      await expect(contract.connect(user).requestTask(1)).to.not.be.reverted;
      expect(await mockCUSD.balanceOf(await contract.getAddress())).to.equal(newPrice);
    });
  });
});
