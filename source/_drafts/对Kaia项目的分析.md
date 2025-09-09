---
title: 对 Kaia 项目的分析
draft_date: 2025-09-02 16:40:24
tags:
- 项目分析
---

[Kaia](https://www.kaia.io/) 是一个和 Line 有合作的区块链项目，首页上的标语竟然是为亚洲的链上生态赋能，难道区块链网络还分地区的吗？

<img src="1.png" width="50%">

问个小问题，已知 Kaia 是一条 Layer1 的区块链网络，EVM 完备，并且具有以下 3 个特性，猜猜 Kaia 的技术栈是什么？

<img src="2.png" width="50%">

我自己的猜测是，Kaia 是用 Cosmos SDK + Evmos 方案搭建的一条链。第 1 条很眼熟，明显是 Cosmos 链的指标。第 2 条则直接确定了是 PBFT 共识。第 3 条中规中矩。

结果怎么样呢，结果打脸了，Kaia 的技术实力比预期硬核，自己设计了叫 IBFT 的共识，整个链的 [节点代码](https://github.com/kaiachain/kaia?tab=readme-ov-file) 都是自己开发的，从 6 年前开始就有提交记录了！（不过话说开源了 6 年只有 46 个 star 是怎么回事？）

