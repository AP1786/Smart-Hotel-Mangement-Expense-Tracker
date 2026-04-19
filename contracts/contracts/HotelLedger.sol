// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HotelLedger is Ownable {
    // The backend mirrors decimal off-chain values as scaled integers (x100).
    enum ActionType {
        IngredientRestock,
        DishRegistered,
        DishSold
    }

    struct Ingredient {
        string name;
        uint256 quantityInStock;
        uint256 unitCost;
        uint256 threshold;
        bool exists;
    }

    struct Dish {
        string dishId;
        string name;
        uint256 costPrice;
        uint256 sellingPrice;
        uint256 quantityInStock;
        uint256 totalSold;
        uint256 totalRevenue;
        bool exists;
    }

    struct LedgerAction {
        uint256 id;
        ActionType actionType;
        string entityId;
        string referenceId;
        uint256 quantity;
        uint256 primaryAmount;
        uint256 secondaryAmount;
        string metadataHash;
        uint256 createdAt;
        address recordedBy;
    }

    mapping(bytes32 => Ingredient) private ingredients;
    mapping(bytes32 => Dish) private dishes;
    LedgerAction[] private actions;

    event ActionRecorded(
        uint256 indexed actionId,
        uint8 indexed actionType,
        string entityId,
        string referenceId,
        uint256 quantity,
        uint256 primaryAmount,
        uint256 secondaryAmount,
        string metadataHash,
        address indexed recordedBy
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    function recordIngredientRestock(
        string calldata ingredientName,
        uint256 quantity,
        uint256 unitCost,
        uint256 threshold,
        string calldata referenceId,
        string calldata metadataHash
    ) external onlyOwner {
        require(bytes(ingredientName).length > 0, "Ingredient name is required");
        require(quantity > 0, "Quantity must be greater than zero");

        bytes32 ingredientKey = _key(ingredientName);
        Ingredient storage ingredient = ingredients[ingredientKey];

        if (!ingredient.exists) {
            ingredient.name = ingredientName;
            ingredient.unitCost = unitCost;
            ingredient.quantityInStock = quantity;
            ingredient.threshold = threshold;
            ingredient.exists = true;
        } else {
            uint256 existingCost = ingredient.unitCost * ingredient.quantityInStock;
            uint256 incomingCost = unitCost * quantity;
            uint256 updatedQuantity = ingredient.quantityInStock + quantity;

            ingredient.quantityInStock = updatedQuantity;
            ingredient.unitCost = updatedQuantity == 0 ? unitCost : (existingCost + incomingCost) / updatedQuantity;
            ingredient.threshold = threshold;
        }

        _pushAction(
            ActionType.IngredientRestock,
            ingredientName,
            referenceId,
            quantity,
            unitCost,
            threshold,
            metadataHash
        );
    }

    function recordDishRegistration(
        string calldata dishId,
        string calldata dishName,
        uint256 costPrice,
        uint256 sellingPrice,
        uint256 initialStock,
        string calldata referenceId,
        string calldata metadataHash
    ) external onlyOwner {
        require(bytes(dishId).length > 0, "Dish id is required");
        require(bytes(dishName).length > 0, "Dish name is required");
        require(sellingPrice >= costPrice, "Selling price must cover cost");

        bytes32 dishKey = _key(dishId);
        Dish storage dish = dishes[dishKey];
        require(!dish.exists, "Dish is already registered");

        dish.dishId = dishId;
        dish.exists = true;

        dish.name = dishName;
        dish.costPrice = costPrice;
        dish.sellingPrice = sellingPrice;
        dish.quantityInStock += initialStock;

        _pushAction(
            ActionType.DishRegistered,
            dishId,
            referenceId,
            initialStock,
            costPrice,
            sellingPrice,
            metadataHash
        );
    }

    function recordDishSale(
        string calldata dishId,
        uint256 quantity,
        uint256 totalRevenue,
        uint256 totalCost,
        string calldata referenceId,
        string calldata metadataHash
    ) external onlyOwner {
        require(bytes(dishId).length > 0, "Dish id is required");
        require(quantity > 0, "Quantity must be greater than zero");

        bytes32 dishKey = _key(dishId);
        Dish storage dish = dishes[dishKey];

        require(dish.exists, "Dish is not registered");
        require(dish.quantityInStock >= quantity, "Insufficient dish inventory");

        dish.quantityInStock -= quantity;
        dish.totalSold += quantity;
        dish.totalRevenue += totalRevenue;

        _pushAction(
            ActionType.DishSold,
            dishId,
            referenceId,
            quantity,
            totalRevenue,
            totalCost,
            metadataHash
        );
    }

    function getActionCount() external view returns (uint256) {
        return actions.length;
    }

    function getAction(uint256 actionId) external view returns (LedgerAction memory) {
        require(actionId < actions.length, "Action does not exist");
        return actions[actionId];
    }

    function getIngredient(string calldata ingredientName) external view returns (Ingredient memory) {
        return ingredients[_key(ingredientName)];
    }

    function getDish(string calldata dishId) external view returns (Dish memory) {
        return dishes[_key(dishId)];
    }

    function _pushAction(
        ActionType actionType,
        string memory entityId,
        string memory referenceId,
        uint256 quantity,
        uint256 primaryAmount,
        uint256 secondaryAmount,
        string memory metadataHash
    ) private {
        uint256 actionId = actions.length;
        actions.push(
            LedgerAction({
                id: actionId,
                actionType: actionType,
                entityId: entityId,
                referenceId: referenceId,
                quantity: quantity,
                primaryAmount: primaryAmount,
                secondaryAmount: secondaryAmount,
                metadataHash: metadataHash,
                createdAt: block.timestamp,
                recordedBy: msg.sender
            })
        );

        emit ActionRecorded(
            actionId,
            uint8(actionType),
            entityId,
            referenceId,
            quantity,
            primaryAmount,
            secondaryAmount,
            metadataHash,
            msg.sender
        );
    }

    function _key(string memory input) private pure returns (bytes32) {
        return keccak256(bytes(input));
    }
}
