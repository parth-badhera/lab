const { expect } = require("chai");

describe("UniversityCredentials", function () {
  let contract, owner, student;

  beforeEach(async function () {
    [owner, student] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("UniversityCredentials");
    contract = await Contract.deploy();
    await contract.waitForDeployment();
  });

  it("Admin can add credential", async function () {
    await contract.addCredential(student.address, "Parth", "Blockchain", "hash123");
    const creds = await contract.getCredentials(student.address);
    expect(creds.length).to.equal(1);
  });

  it("Non-admin cannot add credential", async function () {
    await expect(
      contract.connect(student).addCredential(student.address, "Test", "AI", "hash")
    ).to.be.reverted;
  });

  it("Admin can update credential", async function () {
    await contract.addCredential(student.address, "Parth", "CS", "hash1");
    await contract.updateCredential(student.address, 0, "hash2");
    const creds = await contract.getCredentials(student.address);
    expect(creds[0].hash).to.equal("hash2");
  });
});