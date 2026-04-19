const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const HotelLedger = await hre.ethers.getContractFactory('HotelLedger');
  const contract = await HotelLedger.deploy(deployer.address);

  await contract.waitForDeployment();

  console.log('HotelLedger deployed');
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Contract: ${await contract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
