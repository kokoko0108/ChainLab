import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * Tests run against Hardhat's in-memory network — instant and free. They prove
 * the contract's core behavior before we ever deploy to a real chain.
 */
describe("ChainLabToken", () => {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("ChainLabToken");
    // owner, initialSupply = 1,000,000, maxSupply = 10,000,000
    const token = await Token.deploy(owner.address, 1_000_000n, 10_000_000n);
    await token.waitForDeployment();
    return { token, owner, alice, bob };
  }

  it("sets name, symbol, and 18 decimals", async () => {
    const { token } = await deploy();
    expect(await token.name()).to.equal("ChainLab Token");
    expect(await token.symbol()).to.equal("CLAB");
    expect(await token.decimals()).to.equal(18);
  });

  it("mints the initial supply to the owner", async () => {
    const { token, owner } = await deploy();
    const expected = ethers.parseEther("1000000");
    expect(await token.totalSupply()).to.equal(expected);
    expect(await token.balanceOf(owner.address)).to.equal(expected);
  });

  it("transfers tokens between accounts", async () => {
    const { token, owner, alice } = await deploy();
    const amount = ethers.parseEther("100");
    await token.transfer(alice.address, amount);
    expect(await token.balanceOf(alice.address)).to.equal(amount);
  });

  it("supports approve + transferFrom (allowance)", async () => {
    const { token, owner, alice, bob } = await deploy();
    const amount = ethers.parseEther("50");
    await token.approve(alice.address, amount);
    expect(await token.allowance(owner.address, alice.address)).to.equal(amount);
    await token.connect(alice).transferFrom(owner.address, bob.address, amount);
    expect(await token.balanceOf(bob.address)).to.equal(amount);
  });

  it("lets the owner mint within the cap", async () => {
    const { token, owner, alice } = await deploy();
    await token.mint(alice.address, 500n);
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("500"));
  });

  it("reverts when a non-owner tries to mint", async () => {
    const { token, alice } = await deploy();
    await expect(token.connect(alice).mint(alice.address, 1n)).to.be.reverted;
  });

  it("reverts when minting beyond the cap", async () => {
    const { token, owner } = await deploy();
    // Cap is 10,000,000; 1,000,000 already minted, so 9,000,001 exceeds it.
    await expect(token.mint(owner.address, 9_000_001n)).to.be.revertedWithCustomError(
      token,
      "CapExceeded",
    );
  });

  it("allows holders to burn their tokens", async () => {
    const { token, owner } = await deploy();
    const burn = ethers.parseEther("1000");
    const before = await token.totalSupply();
    await token.burn(burn);
    expect(await token.totalSupply()).to.equal(before - burn);
  });
});
