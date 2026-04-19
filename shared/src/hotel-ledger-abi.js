export const hotelLedgerAbi = [
  'function owner() view returns (address)',
  'function getActionCount() view returns (uint256)',
  'function getAction(uint256 actionId) view returns (tuple(uint256 id, uint8 actionType, string entityId, string referenceId, uint256 quantity, uint256 primaryAmount, uint256 secondaryAmount, string metadataHash, uint256 createdAt, address recordedBy))',
  'function getIngredient(string ingredientName) view returns (tuple(string name, uint256 quantityInStock, uint256 unitCost, uint256 threshold, bool exists))',
  'function getDish(string dishId) view returns (tuple(string dishId, string name, uint256 costPrice, uint256 sellingPrice, uint256 quantityInStock, uint256 totalSold, uint256 totalRevenue, bool exists))',
  'function recordIngredientRestock(string ingredientName, uint256 quantity, uint256 unitCost, uint256 threshold, string referenceId, string metadataHash)',
  'function recordDishRegistration(string dishId, string dishName, uint256 costPrice, uint256 sellingPrice, uint256 initialStock, string referenceId, string metadataHash)',
  'function recordDishSale(string dishId, uint256 quantity, uint256 totalRevenue, uint256 totalCost, string referenceId, string metadataHash)',
  'event ActionRecorded(uint256 indexed actionId, uint8 indexed actionType, string entityId, string referenceId, uint256 quantity, uint256 primaryAmount, uint256 secondaryAmount, string metadataHash, address indexed recordedBy)',
];
