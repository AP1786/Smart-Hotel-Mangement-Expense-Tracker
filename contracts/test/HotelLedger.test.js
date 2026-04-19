const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HotelLedger', function () {
  async function deployFixture() {
    const [owner, operator] = await ethers.getSigners();
    const HotelLedger = await ethers.getContractFactory('HotelLedger');
    const contract = await HotelLedger.deploy(owner.address);

    await contract.waitForDeployment();

    return { contract, owner, operator };
  }

  it('records weighted ingredient restocks', async function () {
    const { contract } = await deployFixture();

    await contract.recordIngredientRestock('Rice', 10, 4, 3, 'restock-001', '0xmeta');
    await contract.recordIngredientRestock('Rice', 10, 6, 3, 'restock-002', '0xmeta2');

    const ingredient = await contract.getIngredient('Rice');

    expect(ingredient.quantityInStock).to.equal(20n);
    expect(ingredient.unitCost).to.equal(5n);
    expect(await contract.getActionCount()).to.equal(2n);
  });

  it('tracks dish inventory and sales', async function () {
    const { contract } = await deployFixture();

    await contract.recordDishRegistration(
      'dish-001',
      'Herb Rice Bowl',
      12,
      16,
      5,
      'dish-001',
      '0xhash',
    );
    await contract.recordDishSale('dish-001', 2, 32, 24, 'sale-001', '0xsale');

    const dish = await contract.getDish('dish-001');

    expect(dish.quantityInStock).to.equal(3n);
    expect(dish.totalSold).to.equal(2n);
    expect(dish.totalRevenue).to.equal(32n);
  });

  it('rejects duplicate dish registrations', async function () {
    const { contract } = await deployFixture();

    await contract.recordDishRegistration(
      'dish-001',
      'Herb Rice Bowl',
      12,
      16,
      5,
      'dish-001',
      '0xhash',
    );

    await expect(
      contract.recordDishRegistration('dish-001', 'Updated Bowl', 13, 17, 2, 'dish-002', '0xhash2'),
    ).to.be.revertedWith('Dish is already registered');
  });

  it('restricts writes to the contract owner', async function () {
    const { contract, operator } = await deployFixture();

    await expect(
      contract.connect(operator).recordIngredientRestock('Milk', 5, 2, 1, 'restock-003', '0xmeta'),
    ).to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount');
  });
});
