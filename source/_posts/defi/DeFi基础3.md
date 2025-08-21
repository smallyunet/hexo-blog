---
title: "DeFi 基础: 借贷与清算"
date: 2025-08-21 11:44:18
tags: DeFi
---

> 这是一个 DeFi 系列教程，在动手实践的过程中，学习和理解 DeFi 相关的概念与原理：
> 1. [DeFi 基础: 理解 AMM 定价机制](/2025/08/20/DeFi基础1/)
> 2. [DeFi 基础: 预言机与报价](/2025/08/21/DeFi基础2/)
> 3. [DeFi 基础: 借贷与清算](/2025/08/21/DeFi基础3/)
> 4. [DeFi 进阶: 闪电贷与套利](/2025/08/21/DeFi进阶1/)

我们已经有了两个 ERC-20 代币 USDC 与 WETH，有了 AMM 合约，有了 Oracle 合约。接下来利用之前的合约，尝试和理解一下借贷相关的合约逻辑。

借贷合约要注意的地方是，在计算用户能借出多少资产的逻辑中，需要用到代币的价格。这里的代币价格，来自 Oracle 的报价，而不是 AMM 合约的价格。Oracle 的报价一般基于 AMM 的价格波动，如果 Oracle 遭受攻击，借贷合约也会相应受到影响。

### 环境准备

合约代码源文件在仓库：[smallyunet/defi-invariant-lab@v0.0.3](https://github.com/smallyunet/defi-invariant-lab/tree/v0.0.3)

Oracle 使用的合约是 [SimpleLending.sol](https://github.com/smallyunet/defi-invariant-lab/blob/v0.0.3/contracts/lending/SimpleLending.sol)，先克隆仓库：

```bash
git clone https://github.com/smallyunet/defi-invariant-lab/
git switch v0.0.3
cd defi-invariant-lab
```

部署合约：

```bash
forge create \
  --rpc-url $RPC_URL \
  --private-key $PK_HEX \
  --broadcast \
  contracts/lending/SimpleLending.sol:SimpleLending \
  --constructor-args $WETH_ADDR $USDC_ADDR $ORACLE_ADDR
```

部署地址：[`0xd4bbFbCe71038b7f306319996aBbe3ed751E9A1C`](https://sepolia.etherscan.io/address/0xd4bbFbCe71038b7f306319996aBbe3ed751E9A1C)

验证合约：

```bash
forge verify-contract \
  --chain-id 11155111 \
  0xd4bbFbCe71038b7f306319996aBbe3ed751E9A1C \
  contracts/lending/SimpleLending.sol:SimpleLending \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $WETH_ADDR $USDC_ADDR $ORACLE_ADDR) \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 用 WETH 抵押借出 USDC

给借贷合约挖 10 万个 USDC，作为初始可以借贷的资产：

```bash
export LEND_ADDR=0xd4bbFbCe71038b7f306319996aBbe3ed751E9A1C

cast send $USDC_ADDR "mint(address,uint256)" $LEND_ADDR 100000000000 \
  --rpc-url $RPC_URL --private-key $PK_HEX
```

存入 1 个 WETH 作为抵押物：

```bash
cast send $WETH_ADDR "approve(address,uint256)" $LEND_ADDR \
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff \
  --rpc-url $RPC_URL --private-key $PK_HEX

cast send $LEND_ADDR "deposit(uint256)" 1000000000000000000 \
  --rpc-url $RPC_URL --private-key $PK_HEX
```

调用 `borrow` 函数借出 USDC，借出额度的计算是：

```solidity
function borrow(uint256 amt) external {
    _accrue();
    require(_value(coll[msg.sender]) * LTV_BPS / 10_000 >= borrows[msg.sender] + amt, "exceeds LTV");
    borrows[msg.sender] += amt;
    totalBorrows += amt;
    debt.transfer(msg.sender, amt);
}
```

我们抵押了 1 个 WETH，按照 2000 USDC/WETH 的价格，合约设定 LTV 最高 70%，也就是可以借出 `2000*0.7=1400` 个USDC。

来用实际交易试一下，这次借出 1400 个 USDC：

```bash
cast send $LEND_ADDR "borrow(uint256)" 1400000000 \
  --rpc-url $RPC_URL --private-key $PK_HEX
```

查看借出 USDC 后的余额、负债、健康度：

```bash
cast call $USDC_ADDR "balanceOf(address)(uint256)" $MY_ADDR --rpc-url $RPC_URL
# 799400000000 [7.99e11]

cast call $LEND_ADDR "borrows(address)(uint256)" $MY_ADDR --rpc-url $RPC_URL
# 1400000000 [1e9]

cast call $LEND_ADDR "health(address)(uint256)"  $MY_ADDR --rpc-url $RPC_URL
# 1904761904285714285 [1.904e18]
```

这里的健康度，指是否有可能触发清算。当查询结果大于 1，则比较安全。当健康度小于 1，则可以被清算机器人、套利者清算掉。

### 降低价格到清算线

如果想还债的话，调用 [`repay`](https://github.com/smallyunet/defi-invariant-lab/blob/v0.0.3/contracts/lending/SimpleLending.sol#L54) 函数就可以了。

现在要体验一次清算逻辑，我们之前抵押了 1 WETH，价值 2000 USDC，借出了 1400 USDC，此时 LTV=1400/2000=70%，正好是 70%，处于安全状态。

当价格下跌到 1000 USDC/WETH，此时的 LTV=1400/1000=140%，已经超过 70% 的安全值，也超过了 75% 的清算阈值。

我们修改下在预言机里的价格，让借贷合约感知到 WETH 价格下跌了（这也就是预言机的主要作用，决定了链上的报价）：

```bash
cast send $ORACLE "post(uint256[])" \
  "[99900000000,100000000000,100000000000,100000000000,100100000000]" \
  --rpc-url $RPC_URL --private-key $PK_HEX
```

再查一下健康度：

```bash
cast call $LEND_ADDR "health(address)(uint256)"  $MY_ADDR --rpc-url $RPC_URL

# 952380952142857142 [9.523e17]
```

这里的健康度实际上是 0.9 1e18，已经小于 1 了，处于可以被清算的状态。

### 执行清算

任何人都可以执行清算，执行清算成功后，可以获得 10% 的清算奖励，这就是很多人需要抢跑交易、优先执行清算的原因。10% 的清算奖励是指，假如你替抵押者还债 200 USDC，让他的仓位健康度大于 1，那么这个时候，按理你可以清算（部分清算）得到 0.2 WETH，由于 10% 的清算奖励，你实际上得到了 0.22 WETH。

我们现在执行交易还债 200 USDC：

```bash
cast send $USDC_ADDR "approve(address,uint256)" $LEND_ADDR \
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff \
  --rpc-url $RPC_URL --private-key $PK_HEX

cast send $LEND_ADDR "liquidate(address,uint256)" $MY_ADDR 300000000 \
  --rpc-url $RPC_URL --private-key $PK_HEX
```

查看执行清算后，一些数据的变化：

```bash
cast call $LEND_ADDR "borrows(address)(uint256)" $MY_ADDR --rpc-url $RPC_URL
# 1200000000 [1.2e9]

cast call $LEND_ADDR "coll(address)(uint256)"    $MY_ADDR --rpc-url $RPC_URL
# 999999999780000000 [9.999e17]

cast call $WETH_ADDR "balanceOf(address)(uint256)" $MY_ADDR --rpc-url $RPC_URL
# 899987136079723472734 [8.999e20]
```

### 小结

可以看到，Defi 的借贷就是在玩这些金钱的数字游戏。

DeFi 开发的难点在于，需要理解一大堆金融相关的公式，看懂合约代码背后表达的业务含义，计算利息、负债率什么的。这个方向对金融行业从业者更友好一点。

Solidity 语言只是表达金融公式的工具，Solidity 的语法本身很简单，普通的开发人员很快就可以掌握。但是掌握 Solidity 语法，不代表能够理解金融体系，不代表能看懂金融公式。
