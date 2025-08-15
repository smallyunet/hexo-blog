---
title: PoS 类型的区块链如何处理分叉
date: 2024-08-22 17:41:01
tags: 
- 共识机制
---

主流公链从共识机制的角度基本上可以分为 3 类，分别是 PoW、PoS、PBFT。选择了不同的共识，也就很大程度上决定了网络的 TPS、去中心化程度、节点规模。

除了 PoW，另外两种共识 PoS 和 PBFT 都面临一个基本的问题，就是当网络发生了软分叉，该如何恢复？由于 PoS 和 PBFT 产生块不需要算力成本，也就不能用和 PoW 一样的最长链原则。

### 问题背景

#### 共识概览

PoW 系列的链有 BTC、BCH、BSV、LTC、DOGE、ZEC 等。PoW 都使用最长链原则，节点在面对多个发生了分叉的链时，直接选择块高度最高的一条就行了。由于每产生一个块都需要庞大的算力，攻击成本比较高。

PoS 系列的链有 ETH、BNB、TRON、DOT、TON、ADA、AVAX、NEO 等。几乎目前所有智能合约平台类型的链，都属于 PoS 共识。

PBFT 系列的链有 ATOM、SOL、TON、ONT、APT、SUI 等。其中 Cosmos 最为知名，Solana 有超越以太坊的势头，The Open Network 今年也发展的很好。

这里可能会觉得有点奇怪，怎么把 SOL 归类到 PBFT 上了？SOL 不是 PoH 共识吗？SOL 不也有质押的功能，比如在 Solflare 钱包上还可以质押获得收益的吗？TON 也有质押和收益啊？

这里是两个问题。

首先 Solana 的确开发和使用了 BFT 类的共识，叫 [Tower BFT](https://solana.com/news/8-innovations-that-make-solana-the-first-web-scale-blockchain)，PoH 是用来解决 Solana 链上的时钟问题的，而不是一种完整的共识机制。 

其次是 PoS+BFT 类共识，算 PoS 还是 BFT？上面提到的分类，PoS 主要指 PoS、dPoS、PoS Casper 这些，凡是用到 BFT 的都归类为 PBFT 作为区分。最明显的就是 Cosmos 也有质押和收益功能，但很少有人会说 Cosmos 用的是 PoS。

#### 关于分叉

PoS 共识和 PBFT 共识面对分叉问题的时候，有两个方面。

一方面是质押者列表（以太坊叫 `Validators`，Cardano 叫 `Stakeholders`）是否一致，因为 PoS 和 PBFT 大都是使用 VRF 从一组候选列表中选择出一个节点作为出块节点，那么 PoS 和 PBFT 类共识在处理这个问题的时候有哪些异同？

另一方面是当网络分叉后，在选择链的规则（以太坊叫 `Forkchoice`，Cardano 叫 `Chain selection rule`）方面有什么异同？

### 质押者列表不一致

#### 联盟链

从最简单的联盟链开始分析。联盟链的特点是没有 coin，也就完全没有质押方面的内容，只是单纯的 PBFT。

联盟链顾名思义，有非常高的准入门槛，需要经过审核或者某种授权也能够成为联盟成员。具体到技术层面，就是想要加入网络，需要在其他节点都知道的情况下，比如所有节点的配置文件里，都包含一个网络成员的列表，列表里定义了网络的节点公钥以及对应的 index，想要增加节点就需要其他所有节点都改一下配置文件。

节点在出块的时候，就会从这个列表中使用 VRF 随机选择一个作为出块节点。一般 VRF 返回的是一个简单的数字，对应公钥列表的 index，出块节点用这个公钥来对块签名。

这样的做法比较笨拙，但也是联盟链的特点。在这种模式下，节点的质押着列表不太可能不一致，如果不一致就是配置文件写错了。而且配置错误的情况下，它将永远是错误的，排查起来很简单。

#### Cosmos

Cosmos Hub 用的共识叫 [CometBFT](https://docs.cometbft.com/v0.37/introduction/)，基本流程是花费不少于 180 个 ATOM 注册成为 Validaotr，然后就有可能会选为出块节点。

由于 BFT 类共识在出块之前就需要投票，所以假如网络中真的出现了质押者列表不一致的情况，在同一个块高度会有两个节点产生出两个块，此时网络中的其他节点会对这两个块进行投票。

这个时候也分两个场景，就是网络正常和网络异常的情况。

在网络正常的情况下，现在有两个块，一定只能有一个块收到大于 2/3 的投票，不可能两个块都收到大于 2/3 的投票。所以在出块之前，就已经把质押者列表和其他节点不一致的节点排除在外了，不会影响后续流程。

在网络异常的情况下，节点感知不到其他节点的存在，即使当前节点的质押者列表正好是当前子网络中的有限几个节点，其他几个节点也不会把票投过来。除非整个子网络都断网了、质押者列表还发生了一样的错误，那这个自网络就自己在局域网玩吧。网络异常本身就是一种异常情况了，与外界隔绝。

#### Cardano

Cardano 的 PoS 是最纯粹的 PoS，没有投票机制。Cardano 的共识经历了[很多次演进](https://iohk.io/en/blog/posts/2022/06/03/from-classic-to-chronos-the-implementations-of-ouroboros-explained/)（内容很多很复杂，我没看完）。

Cardano 网络的规则是，任何人都可以质押任意金额到 Stake pools 中成为 [Delegator](https://docs.cardano.org/about-cardano/learn/delegation/)，这些 Delegator 按照质押金额的比例共享矿池的收益，但是不会有出块的资格。

在 Cardano 网络中真正有出块权限的是 Stake pools，也就是说有可能被选为出块节点的节点，都在 [矿池列表上](https://preprod.cexplorer.io/pool) 了，数量不多，目前大概 300 个左右，每个 solt 将从中随机选择一个来产生块。

那么 Stake pools 节点注册之后，如果节点之间出现 Stake pools 列表不一致的情况怎么办？Cardano 的文档中有 [描述](https://developers.cardano.org/docs/operate-a-stake-pool/introduction-to-cardano#how-it-works)，当遇到同一 slot 产生了两个块的时候，就开始启用链选择的规则（Chain Selection Rule）了。也就是说，实际上当第二个块被产生出来，链就已经分叉了，然后所有节点都启用链选择的规则，来进行恢复。

#### Ethereum

以太坊要成为 Validator 需要花费 32 个 ETH 把节点信息注册到 [质押合约](https://etherscan.io/address/0x00000000219ab540356cbb839cbe05303d7705fa) 上，然后其他所有的 Validator 都会从质押合约获取质押者列表的信息。

那怎么确定其他 Validators 都已经把质押者信息从合约同步到本地了？你可以在 Beacon Chain 浏览器的任意一个 [块信息](https://beaconcha.in/block/20584195) 上，找到一个叫 [Eth Data](https://github.com/ethereum/consensus-specs/blob/v1.3.0/specs/phase0/validator.md#eth1-data) 的字段，这个字段对于质押者列表非常重要，当一个 validator 被选为出块节点时，它会把当前节点同步到的质押者列表信息，一起打包进块里，包括质押者的总数以及 Deposit root 信息。

以太坊网络大概每 17 个小时进行一次 [质押者列表的更新](https://github.com/ethereum/consensus-specs/blob/v1.3.0/specs/phase0/validator.md#process-deposit)。在这个周期中，只有超过半数区块的 Eth Data 包含了新增的 validator，新的 validator 才会真正加入到网络中。

所以以太坊要加入 validators 的过程是漫长而且严格的，首先要确认其他 proposer 已经同步了相关信息，才会真正更新质押者列表。在这样的规则模式下，质押者列表很难不一致。

### 分叉链选择

#### Ethereum

以太坊中如果出现了多条分叉的链，选择起来时相对容易的，因为以太坊有投票机制，每一个块上都包含了有多少个 validators 对块进行了投票。可以猜想到，在发生分叉时，只要不断选择投票数多的块就可以了。

而实际上以太坊的分叉选择基于 [checkpoint 机制](https://ethos.dev/beacon-chain)，每个块是一个 slot，每 32 个 slot 是一个 epoch，每个 epoch 都是一个检查点。一个检查点收到大于 2/3 的投票，就进入了 justified 的状态，当一个检查点的下下个检查点也进入 justified 状态，当前检查点就认为是 finalized 状态了。所以在以太坊中，一笔交易最终被标记为 finalized 需要 15 分钟。

这里提到的检查点，也就是 [FFG](https://arxiv.org/abs/1710.09437) 进行 forkchoice 的依据，每条链会选择 checkpoint 多的链。所以以太坊的共识不是选择 “有最多块的链” 原则，而是选择 “有最多检查点的链” 原则，检查点最多的链就是主链。

#### Cardano

Cardano 最新在使用 [Chain selection rule](https://developers.cardano.org/docs/operate-a-stake-pool/introduction-to-cardano/#what-if-for-some-reason-there-is-a-fork)，是由 [Ouroboros Genesis](https://dl.acm.org/doi/10.1145/3243734.3243848) 版本提供的。

Ouroboros Genesis 的上一个版本是 [Ouroboros Praos](https://link.springer.com/chapter/10.1007/978-3-319-78375-8_3)，Praos 版本中提出了一套叫 `maxvalid` 的规则，Genesis 版本基于 `maxvalid` 做了一点改进，把 `moving checkpoint` 的特性结合了进来，形成了新版本叫做 `maxvalid-mc` 的规则。

移动检查点简单理解就是，本地链在面对多条分叉链时，如果没有超过 k 个块，就选最长的链，如果超过了 k 个块，就直接不选它。也就是说本地链只会在 k 个块的范围内，选择链最长的一个。而 k 个块的范围就是所谓的移动检查点（moving checkpoint）。加了这样限制的好处就是可以避免最长链攻击。当然 Cardano 制定这样的规则经过了一系列学术上的推演以及实际场景的检验。

#### Cosmos

PBFT 链在网络正常的情况下，只要保证质押者列表一致，就不会分叉。

### 总结

总的来说，每种共识的具体实现，都包含了详细的处理分叉的规则，而且这些老牌公链都经过了实际运行的检验。具体如何实现与链的设计理念有关。





