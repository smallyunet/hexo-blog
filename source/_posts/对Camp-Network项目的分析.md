---
title: 对 Camp Network 项目的分析（知识产权保护）
date: 2025-08-04 12:15:42
tags:
- 项目分析
---

[Camp Network](https://www.campnetwork.xyz/) 的愿景是在 AI Agent 场景中保护作者的知识产权，并且有可能获得来自 AI 分享的创作者收益。Camp Network 今年 4 月底宣布，一共获得了 3 千万美元的 [A轮融资](https://mirror.xyz/0xa01A821E654b923Be011acE131A22Ba58cFee3ad/wvdmjQaM2hw8uxLaLEamNPQMVT4H_bLWgzrsNWoOZpU)，来自不同的投资机构。

只看官网首页的简介的话，也许会有点疑惑，这个项目的立意肯定没错，保护知识产权嘛，但是具体怎么做呢，[官方宣发文章](https://mirror.xyz/0xa01A821E654b923Be011acE131A22Ba58cFee3ad/wvdmjQaM2hw8uxLaLEamNPQMVT4H_bLWgzrsNWoOZpU) 里提到的 Proof of Ownership and Pirority，岂不是几年前的概念吗？而这些 Proof of... 又是什么意思？

Camp Network 没有公开出 Github 代码仓库，导致没办法从代码层面解读。我一开始还奇怪，为什么不公开 Github 账户？后来我明白了。

Camp Network 的 [文档](https://docs.campnetwork.xyz/introduction/l1-architecture/abc-stack) 里说明，Camp Network 是一条使用了 Celestia 区块链做 DA 层的链，基于 [ABC Stack](https://www.abundance.xyz/) 搭建。ABC Stack 又是什么呢，是 Celestia 生态中的一个项目，在架构上明确区别于以太坊的 "L2 Rollups"，而是自己发明了一种架构叫 "Rollup L1s"。

ABC Stack 框架是 Abundance 团队开发的，号称每秒 GB 级别数据的 EVM 完备的 Rollups。也就是说，Camp Network 直接使用了 ABC Stack 的底层技术，搭了一条链出来，在链上做一些应用，所谓知识产权保护、DID、AI 什么的。

那么 ABC Stack 的框架怎么用呢，代码仓库在哪里，怎么操作，需要开发哪些代码？完全不需要，有一家 Celestia 生态的公司 Gelato，提供了 BaaS 平台的服务，比如一键部署 Op Stack 的链、一键部署 Arbitrum 的链，等等，其中就包括 ABC Stack 的选项。而这个 BaaS 平台是收费的，部署到主网需要一个月 3000 美元，部署到测试网只需要一个月 100 美元。Camp Network 目前是测试网阶段。

这就是 Camp Network 连代码仓库都不需要的原因，直接用 BaaS 服务就好了，而且也没有其他选择，ABC Stack 本身就没提供代码。

Camp Network 的 [架构文档](https://docs.campnetwork.xyz/introduction/l1-architecture) 里还提到一个东西，BaseCAMP 是刚才提到的用 ABC Stack 搭出来的链，SideCAMP 则是应用专属的链，从文档描述来看，Camp Network 是计划给每一个应用场景，比如 AI、音乐、艺术等 Dapp，都单独部署一条链，同样也是用 ABC Stack 的技术。

有那么多条链的话，BaseCAMP 和 SideCAMP 之间怎么通讯和交互呢？ABC Stack 对 Hyperlane 的跨链技术做了 [封装](https://docs.abundance.xyz/modular-bridging/gelato-hyperlane-cluster)，依此来实现 ABC Stack 链之间的跨链通信。

至于 Camp Network 到底是怎么实现保护知识产权的？Camp Network 提供了一个 [SDK](https://docs.campnetwork.xyz/origin-v1/origin-framework)，大意是作者需要通过链上交易来声明自己的身份，比如绑定自己的链上地址和 X 的用户名信息，Camp Network 的这个 Origin 框架，就会到 X 上查询我发布的内容，自动生成 IP NFT，然后其他玩家可以来购买这个 IP NFT，相当于购买了版权。

话说，其实是挺老套的玩法。可能以后凡是看到提 DID 这种老套概念的项目，都得多加小心，因为没什么技术，只玩生态，而且玩的是不存在的生态。

Camp Network 整体的技术情况就是这样，连代码仓库都没有，直接用了 ABC Stack 提供的服务，搭建了几条链，然后在链上面做应用。Camp Network 的 [测试网](https://testnet.campnetwork.xyz/) 上现在已经有不少 Dapp 了，可以操作和交互。Camp Network 虽然没有硬核的底层技术，但是生态实力很强大，测试网上参与活动的项目非常多。


