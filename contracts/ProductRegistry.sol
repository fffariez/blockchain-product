// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductRegistry {
    struct Product {
        uint256 id;
        string name;
        string description;
        string location;
        uint256 price;
        uint256 timestamp;
        address owner;
    }

    uint256 public nextId;
    mapping(uint256 => Product) public products;

    event ProductRegistered(
        uint256 id,
        string name,
        string description,
        string location,
        uint256 price,
        address owner
    );

    function registerProduct(
        string memory name,
        string memory description,
        string memory location,
        uint256 price
    ) public {
        uint256 id = nextId;
        products[id] = Product(id, name, description, location, price, block.timestamp, msg.sender);
        emit ProductRegistered(id, name, description, location, price, msg.sender);
        nextId++;
    }

    function getProduct(uint256 id) public view returns (Product memory) {
        return products[id];
    }
}
