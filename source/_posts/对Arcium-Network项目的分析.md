---
title: 对 Arcium Network 项目的分析
date: 2025-08-05 17:29:59
tags: 项目分析
---

### 项目背景

[Arcium Network](https://www.arcium.com/) 是 Solana 生态首个专注于隐私计算的项目，今年 5 月份获得了 GreenFeild 领投的 5 千万美元的[融资](https://x.com/ArciumHQ/status/1788557786537689447)。

Arcium 的 [Purplepaper](https://www.arcium.com/articles/arcium-purplepaper) 中提到，Arcium是一种去中心化的隐私计算协议，主要包含了 MPC 和经济模型两个关键的组成部分：

<img src="1.png" width="80%">

Arcium 整体的项目结构不算难理解，尤其是和区块链结合的部分，就是直接用了 Solana 的智能合约：

<img src="2.png" width="80%">

但是 Arcium 在有很多硬核的技术基础。比如在这篇 [博客文章](https://www.arcium.com/articles/eli5-mpc) 中，Arcium 用简化的例子说明了 MPC 的技术原理。

MPC（Secure Multi-Party Computation，安全多方计算）这种技术不是新概念，存在很多年了，我们最为熟知的就是 MPC 钱包，币安钱包和 OKX 钱包都默认使用这种模式。从学习的角度，可以辨析一下 MPC、多签、MPC 钱包、TSS 聚合签名、BLS 聚合签名这几个有点关联但容易混淆的概念。

回到 Arcium 的文章，简化后的 MPC 大概是这个意思：假如有 3 个参与方 a,b,c 进行计算，计算的内容分别对应 +1,+2,+3，并且参与方会对自己的计算结果加盐分别是 +10,+20,+30，那么经过全部参与方计算后，最终得到的结果是 66，减去参与方的盐值总和 60，得到最终结果 6。

去盐的过程按理也是轮流来的，比如初始值是 66，从 a 到 c 依次渐去各自的盐值，得到最终结果，而不是一下子就减去了 60。对于每一个计算参与方来说，它只知道初始值，以及自己计算的结果值，并不知道执行的顺利，是先 a 执行，还是先 c 执行？协议约定这个信息不是公开的。

真实的 MPC 是一个复杂的交互协议，需要很复杂的工程化实现。总之 Arcium 就是在对 MPC 技术大做文章，试图把这种密码学技术，引入到更多实际的应用场景中，这是一个不错的方向。

Arcium 在研究的技术方向和尝试 [很多](https://www.arcium.com/articles)，比如这篇 [文章](https://www.arcium.com/articles/confidential-spl-token) 中提到的 Confidential SPL Token，是结合了 Solana 的 SPL 标准代币、[Token-2022](https://github.com/solana-program/token-2022) 标准、和 Arcium 的 MPC 聚合架构，提出的一种带隐私能力的代币标准。此外还搞了链上 Dark Pools 的 Dapp，挺有加密风范的技术感。

### 项目架构

Arcium 的 [项目架构](https://docs.arcium.com/getting-started/architecture-overview) 看似很复杂，乍一看 MXEs、arxOS、Arcis 什么的，各种名词。这种是典型的发明概念，就是给自己项目里用的某个组件，起了个高大上的名字，根本不是某种技术名词。几乎每个项目都会有一套自己的术语定义，让外人觉得很厉害。

从这个 Developer 版本的 [文档](https://docs.arcium.com/developers/computation-lifecycle) 能更好的理解 Arcium 的架构。作为使用 Arcium 的开发者，实际上是在开发 Solana 智能合约，我们自己开发一个合约（MXE program）来描述计算任务，比如加法运算，a+b，期望得到 c，把这个逻辑写在合约上，然后调用官方部署的合约（Arcium Program）的合约，把计算任务提交到 Arcium 的任务池里：

<img src="3.png" width="80%">

这样，Arcium Program 就知道了有这么一个任务，而真正执行隐私计算任务的 MPC Cluster（arxOS），根据链上的交易记录，得到事件也就是任务信息，开始进行计算，并且将计算结果提交到链上的 Arcium Program（合约）。回到我们的 MXE program 这边，自然是有一个 callback 函数来接收隐私计算的结果，然后触发一个事件通知我们的客户端：

<img src="4.png" width="80%">

在合约代码层面，能够实现哪些计算，如加法、减法、除法之类，要依赖于 Arcium 提供的框架，支持哪些计算方式。

那么抛开凌乱的技术名词，Arcium 整体上，是通过链上合约提交计算任务，链下节点计算任务结果后，再提交回链上的模式，这是和区块链交互的部分。此外就是链下计算的过程，Arcium 把 MPC 折腾的很明白，提供了便于使用的客户端（合约）框架出来。

### 经济模型

具体执行多方计算的节点，Arcium 把它们叫做 [StakHodlers](https://docs.arcium.com/getting-started/network-stakeholders)，有点复杂，总之就是要么提供硬件设备、经过一系列配置之后参与到计算节点中，得到收益，要么把自己的 ARX 代币委托给某些计算节点，赚一点利息。

在经济模型方面，Purplepaper 里有提到 ARX 的代币总供应量，会随着网络算力的使用量自动调整，达到自动平衡的效果：

<img src="5.png" width="80%">

这种自动平衡期望的效果是，ARX 的质押率平衡在 50%，如果低于 50%，会自动增发，如果高于 50%，会自动销毁。这个经济模型的设计是利好计算节点的，是希望持有 ARX 的用户能积极参与到质押和计算生态中。但是这种经济模型不是很利于非质押者，因为增发与他们无关，销毁与他们有关，相当于放大了以太坊 PoS 模式的弊端。

不过 Arcium 的销毁模式和以太坊的销毁模式还不太一样，Arcium 会把协议费收上来的 SOL，通过荷兰拍卖换成 ARX，再销毁。这种模式给整体供给带来的影响更复杂一点，得进一步关注和分析了。

综合来看，无论是技术架构上，还是经济模型上，Arcium 都有非常深厚的积累，已经能形成闭环，有很大的进一步观察的空间。Arcium Network 目前是测试网阶段，路线图里还在规划主网的上线时间。


