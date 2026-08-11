import { ethers, network, run } from "hardhat";

/**
 * Deploy ChainLabToken to the configured network (Sepolia) and, if an Etherscan
 * API key is set, automatically verify the source.
 *
 * Steps:
 *   1. Compile happens automatically before run.
 *   2. We deploy with constructor args (owner, initialSupply, maxSupply).
 *   3. Wait for the deployment tx to be mined → contract gets its permanent
 *      address forever.
 *   4. Verify on Etherscan so the code is public and readable.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`,
  );

  // Constructor args: owner = deployer, 1,000,000 initial supply, 10,000,000 cap.
  const initialOwner = deployer.address;
  const initialSupply = 1_000_000n;
  const maxSupply = 10_000_000n;

  console.log("\nDeploying ChainLabToken…");
  const Token = await ethers.getContractFactory("ChainLabToken");
  const token = await Token.deploy(initialOwner, initialSupply, maxSupply);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`✅ Deployed to: ${address}`);

  // Skip verification on local networks or when no API key is present.
  const isLocal = network.name === "hardhat" || network.name === "localhost";
  if (isLocal || !process.env.ETHERSCAN_API_KEY) {
    console.log("\nSkipping Etherscan verification (local network or no API key).");
    return;
  }

  // Etherscan needs a few block confirmations before it can see the contract.
  console.log("\nWaiting for confirmations before verifying…");
  await token.deploymentTransaction()?.wait(5);

  console.log("Verifying on Etherscan…");
  try {
    await run("verify:verify", {
      address,
      constructorArguments: [initialOwner, initialSupply, maxSupply],
    });
    console.log("✅ Verified on Etherscan.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("already verified")) {
      console.log("Contract already verified.");
    } else {
      console.error("Verification failed:", msg);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
