---
title: 想开发一个最小 EVM 虚拟机
date: 2025-05-11 01:15:07
tags:
- 计划
- EVM
---

我给这个项目命名为 echoevm.com，主要目标是从最简单的堆栈操作开始，逐步实现一个完整的以太坊字节码执行环境。

为什么选择这个方向？解析下以太坊客户端的技术模块：
1. RPC：GRPC 套壳？重点在于协议设计而不是技术实现
2. P2P：有现成的 libp2p 可用，无非是节点发现、路由表之类，比如深入下 Kademlia DHT？
3. 账户体系：ECDSA？密码学？
4. 交易池：交易分析、密封交易、MEV保护方向
5. 共识机制：共识机制的设计属于研究级别，至少得是个博士发论文、实验室里做研究、出各种测试数据，然后证明在哪方面做出了业界前沿的优化、最后融资雇人做工程化的实现
6. 储存：搞数据库底层的专家应该干什么都一样，哪里都有用武之地，跟区块链没关系
7. 数据结构：去研究 Merkle Patricia Tree 的实现吗？
8. 状态同步：轻节点方向，比如用 Celestia 的核心技术把执行和储存分开，或者 Archive 节点数据的 offload？

综合来看，我倾向于做一件侧重工程而不是学术、同时又有技术含量的事情，无论是从个人技术能力的提升，还是后续有可能带来的成果上，都要有意义。假如这个最小EVM开发出来了，是可以带来一系列成果的，后续也可以基于此延伸出很多更有价值的产品。

从 Solidity 语言到 bytecode 的转换过程，那是编译器专家干的事情，我要做的，是针对 bytecode 做执行，先从最简单的加法运算和 jump 开始，然后是 Gas 的计算、上下文环境的切换，直到能够执行全部以太坊历史交易。

<br>

### v0.0.1（2025.05.27）

实现了一个非常简单的版本，现在可以用 solc 编译一个 [Add.sol](https://github.com/smallyunet/echoevm/blob/v0.0.1/test/contracts/Add.sol) 合约，然后让 echoevm 读取生成的 `Add.bin` 部署代码，就会输出合约部署之后的运行时代码。

在实现这个版本的过程中，学习到的东西是部署代码和运行时代码的区别。我们一般会先部署一个合约到链上，然后再对这个合约产生调用，这实际上是两个不同的操作，但又都在使用相同的 EVM 执行，EVM 并不关心输入的 bytecode 是部署还是调用，只是对不同的操作码处理方式不同。一般部署代码会同时包含 `CODECOPY` 和 `RETURN` 两个操作码，可以利用这一点来区分输入的类型。

<br>

### v0.0.2（2025.06.09）

这个版本增加了运行 runtime bytecode 的能力，也就是先部署合约，然后再针对部署之后的合约内容，进行调用，调用的时候可以带上一些参数，比如：

```bash
go run ./cmd/echoevm -bin ./build/Add.bin -function 'add(uint256,uint256)' -args "3,5"
```

这个命令的含义是，会执行 `./build/Add.bin` 文件内的 bytecode，并且调用 [add 函数](https://github.com/smallyunet/echoevm/blob/v0.0.2/test/contracts/Add.sol#L7)，传入参数 3 和 5，最终程序运行结束后，会返回出计算结果 8。

<br>

### v0.0.3（2025.06.24）

好消息，现在 echoevm 已经可以执行以太坊主网前 10000 个区块的合约交易！因为前 10000 个区块根本没有合约交易 :P

这个版本新增了执行以太坊区块的模式，可以执行单个区块执行，也可以执行区块范围执行。当然，还需要一个获取区块数据的 url，注意对于以太坊早期的区块数据，得找 archive 模式的节点。整个命令行看起来是这样：

```bash
echoevm -start-block 0 -end-block 10000 -rpc <url>
```

现在 echoevm 支持的字节码有限，如果执行最新的一些区块交易，会发现报错说不支持某些字节码，这个是正常现象。

<br>

### v0.0.4（2025.07.05）

这个版本新增加了从 artifact 文件读取 bytecode 数据的能力，就是 hardhat 项目在编译的时候会生成的那个 artifact 文件。之前的版本只能用读取 solc 编译生成的二进制文件，编译合约的命令是这样：

```bash
# 编译合约生成字节码
npx --yes solc --bin Add.sol -o ./build
# 运行 echoevm 来执行字节码
go run ./cmd/echoevm run -bin ./test/bins/build/Add_sol_Add.bin -function "add(uint256,uint256)" -args "1,2"
```

现在的版本更简单一点，对于标准的 [hardhat 项目](https://github.com/smallyunet/echoevm/tree/v0.0.4/test/contract)，每次执行这个编译命令都会生成 artifact 文件，echoevm 可以直接读取 json 文件并执行：

```bash
# 编译 hardhat 项目的合约
npx hardhat compile
# 如果愿意，可以运行 hardhat 项目的测试
npx hardhat test
# 运行 echoevm 来执行字节码
go run ./cmd/echoevm run -artifact ./test/contract/artifacts/contracts/Add.sol/Add.json -function "add(uint256,uint256)" -args "1,2"
```

这个版本同样新增了一些字节码的支持，但还是不足以执行完整的以太坊区块。接下来会手动按照 Solidity 的语法特性，来逐步增加测试用例和观察字节码的欠缺情况，这也就是为什么这个版本重点优化执行方式的原因。

<br>

### v0.0.5（2025.07.27）

这是一个小版本，主要是增加了比较完善的 [Solidity合约](https://github.com/smallyunet/echoevm/tree/v0.0.5/test/contract/contracts) 作为测试用例，涵盖基本数据类型、函数、控制流、modifier、事件、接口、library、内联汇编等 Solidity 的语法特性。

而且提供了便捷的命令，只需要在项目根目录下运行这个命令，就可以看到全部测试的结果：

```bash
make test-advanced
```

当然全部测试是通过的。但是目前仍然无法执行以太坊主网的第 10000000 个区块，意味着缺少的 opcode 不属于 solidity 的基本语法特性，可能是别的什么。
