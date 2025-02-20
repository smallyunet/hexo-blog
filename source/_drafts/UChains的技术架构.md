---
title: UChains 的技术架构
draft_date: 2024-11-01 15:46:41
tags: UChains
---

UChains 是一家传统支付公司内部孵化的区块链项目，项目的 Team Leader 在 2019 年离开公司后，作为合伙人创建了长安链（Chain Maker）。长安链一开始发布的时候，技术特性上能看到不少 UChains 的影子。后来长安链搞得比较好，和腾讯合作开发，知名度高一点，。

关于 UChains 的技术架构之前在《[VRF + BFT 共识引起交易失败的问题](/2022/09/03/VRF-BFT-%E5%85%B1%E8%AF%86%E5%BC%95%E8%B5%B7%E4%BA%A4%E6%98%93%E5%A4%B1%E8%B4%A5%E7%9A%84%E9%97%AE%E9%A2%98/)》中有提到过。

UChains 的内核是 Tendermint Core，直接把代码集成到项目中，进行了很多二次开发。主要改进的地方有：

- VRF 选择提案节点
- 分层共识（换共识组）
- 有限的智能合约支持
- 支持不同类型的数据库
- 异构多链









