// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MicroTaskPayment {
    address public owner;
    IERC20 public cUSD;

    uint8 public constant CAPTION   = 1;
    uint8 public constant EMAIL     = 2;
    uint8 public constant SUMMARY   = 3;
    uint8 public constant EXPLAIN   = 4;
    uint8 public constant IMAGE     = 5;
    uint8 public constant TRANSLATE = 6;

    mapping(uint8 => uint256) public taskPrices;

    event TaskRequested(
        address indexed user,
        uint8   indexed taskType,
        uint256         amount,
        bytes32         requestId,
        uint256         timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _cUSD) {
        owner = msg.sender;
        cUSD  = IERC20(_cUSD);

        taskPrices[CAPTION]   = 0.10 ether;
        taskPrices[EMAIL]     = 0.25 ether;
        taskPrices[SUMMARY]   = 0.25 ether;
        taskPrices[EXPLAIN]   = 0.10 ether;
        taskPrices[IMAGE]     = 0.50 ether;
        taskPrices[TRANSLATE] = 0.10 ether;
    }

    function requestTask(uint8 taskType) external returns (bytes32 requestId) {
        uint256 price = taskPrices[taskType];
        require(price > 0, "Invalid task type");

        require(
            cUSD.transferFrom(msg.sender, address(this), price),
            "cUSD transfer failed - approve contract first"
        );

        requestId = keccak256(
            abi.encodePacked(msg.sender, taskType, block.timestamp, block.number)
        );

        emit TaskRequested(msg.sender, taskType, price, requestId, block.timestamp);
    }

    function withdraw() external onlyOwner {
        uint256 balance = cUSD.balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        cUSD.transfer(owner, balance);
    }

    function updatePrice(uint8 taskType, uint256 newPrice) external onlyOwner {
        taskPrices[taskType] = newPrice;
    }

    function getPrice(uint8 taskType) external view returns (uint256) {
        return taskPrices[taskType];
    }
}
