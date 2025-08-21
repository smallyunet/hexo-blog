---
title: "DeFi 基础: 预言机报价"
date: 2025-08-21 11:24:02
tags: DeFi
---

> 这是一个 DeFi 系列教程，在动手实践的过程中，学习和理解 DeFi 相关的概念与原理：
> 1. [DeFi 基础: 理解 AMM 定价机制](/2025/08/20/DeFi基础1/)
> 2. [DeFi 基础: 预言机报价](/2025/08/21/DeFi基础2/)
> 3. [DeFi 基础: 借贷与清算](/2025/08/21/DeFi基础3/)

预言机（Oracle）的逻辑相对简单，基本功能是，会有链下服务定时向链上提交一些数据，比如 WETH 的价格，合约保存下数据后，就可以被其他智能合约调用，直接获取到价格信息。

以下所有操作都在 Sepolia 测试网进行。这些操作步骤，其实都是一些普通的合约交互步骤。主要是在操作过程中，进一步体会和理解合约的代码功能。

### 环境准备

合约代码源文件在仓库：[smallyunet/defi-invariant-lab@v0.0.2](https://github.com/smallyunet/defi-invariant-lab/tree/v0.0.2)

Oracle 使用的合约是 [MedianOracle.sol](https://github.com/smallyunet/defi-invariant-lab/blob/v0.0.2/contracts/oracle/MedianOracle.sol)，先克隆仓库：

```bash
git clone https://github.com/smallyunet/defi-invariant-lab/
git switch v0.0.2
cd defi-invariant-lab
```

部署合约：

```bash
forge create \
  --rpc-url $RPC_URL \
  --private-key $PK_HEX \
  --broadcast \
  contracts/oracle/MedianOracle.sol:MedianOracle
```

部署的合约地址是 [`0xdE342a228A2A83b47cA4eB3D3852578837E60750`](https://sepolia.etherscan.io/address/0xdE342a228A2A83b47cA4eB3D3852578837E60750)。

验证合约：

```bash
forge verify-contract \
  --chain-id 11155111 \
  0xdE342a228A2A83b47cA4eB3D3852578837E60750 \
  contracts/oracle/MedianOracle.sol:MedianOracle \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 设置喂价人

调用合约的 [`setFeeder`](https://github.com/smallyunet/defi-invariant-lab/blob/v0.0.2/contracts/oracle/MedianOracle.sol#L14) 函数，设定谁可以向 Oracle 提交数据：

```bash
export ORACLE_ADDR=0xdE342a228A2A83b47cA4eB3D3852578837E60750

cast send $ORACLE_ADDR "setFeeder(address,bool)" \
  0x44D7A0F44e6340E666ddaE70dF6eEa9b5b17a657 true \
  --rpc-url $RPC_URL --private-key $PK_HEX
```

然后能查询到设置结果：

```bash
cast call $ORACLE_ADDR "feeders(address)((bool))" $MY_ADDR --rpc-url $RPC_URL

# (true)
```

### 首次喂价

发起交易：

```bash
cast send $ORACLE_ADDR "post(uint256[])" \
  "[199900000000,200000000000,200000000000,200000000000,200100000000]" \
  --rpc-url $RPC_URL --private-key $PK_HEX
```

### 读取最新价格

读取价格：

```bash
cast call $ORACLE_ADDR "latest()(uint256,uint256)" --rpc-url $RPC_URL
```


