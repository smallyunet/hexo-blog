---
title: Proof of Storage/Space/Replication 的区别
date: 2022-12-20 17:58:48
tags: 
- 文件证明
- 共识机制
---

### 时间线

<style>
table {
    display: inline;
}
</style>

<center>

|简称|全称|年份|
|-|-|-|
|PDP|Provable Data Possession|2007|
|PORs|Proofs of Retrievability|2007|
|PoS|Proofs of Storage| 2009|
|PoS|Proofs of Space|2013|
|PoST|Proofs of Space-Time|2016|
|PoRep|Proof of Replication|2017|
|PoC|Proof of Capacity|2017|

</center>

### Proofs of Storage

PDP 和 PORs 在 2007 年各自独立地发表，在文件证明的方式上各有优劣，是对同一类问题不同分支的解决方案。

PoS（Proofs of Storage）的概念至少在 2009 年就已经出现，是一种统称，指客户端对服务端上文件进行验证的交互式协议，同时包含了 PDP 和 PORs 的范畴。比如论文《Proofs of Storage from HomomorphicIdentification Protocols》，第一作者是 Giuseppe Ateniese。

由于 2009 年区块链还没什么发展，所以 PoS（Proofs of Storage）和共识机制没有关系，和 PoS（Proof of Stack）也仅仅只是简称撞了，没什么联系。

PDP 和 PORs 属于 PoS 的前身，PoS 把它们用一个名字统一起来了。

### Proofs of Space

PoS（Proofs of Space）开始于 2013 年的论文《Proofs of Space》，第一作者是 Stefan Dziembowski。

也是巧合，PoS（Proofs of Space）和 PoS（Proofs of Storage）的简称一样，有时候可能会引起混淆。这个小节的 PoS 指 Proofs of Space。

PoS 的理念是，对标 PoW（Proof of Work）。所以从 PoS 开始，就是区块链中的概念了，它是一种共识机制。

PoW 是用 CPU 的算力进行挖矿，PoS 的想法是用磁盘的容量进行挖矿，想办法证明服务器上有某个数值的磁盘空间。

最基础的办法，是客户端生成一个文件，比如 1G，然后发送到服务器上，接着只要验证服务器上保存了那个文件，就能证明服务器确实有 1G 的磁盘空间了。不过这个办法太笨了，不但消耗客户端的磁盘空间，还会给网络传输带来非常大的压力。

PoS 提供的办法是，使用一种 hard to pebble graphs 的数据结构，比如 Merkle hash tree。这种数据结构的特点是，生成上层的数据必须要依赖于下一层的数据。

比如在使用了 Merkle hash tree 的系统里，客户端可以要求服务端，返回某一个上层节点的整条链路，然后自行验算路径是否正确。可以交叉验证多条链路，基本上就能保证服务端的可信了。

### Proofs of Space-Time

PoST（Proofs of Space-Time）出现于 2016 年，论文标题《Simple Proofs of Space-Time and Rational Proofs of Storage》，第一作者是 Tal Moran。

PoST 是基于 PoS（Proofs of Space）的方案，因为 PoS 可以证明服务器端拥有一定量的磁盘空间，但是不能证明，服务器端的空间容量一直保持在期望的水平。比如，在进行验证的时候，服务器的磁盘空间是 1G，一旦验证结束，服务器就把空间用到别的地方了。再验证的时候，就再生成一遍 1G 的文件，用于验证。

所以 PoS 提议每 1 分钟都进行一次验证，以保证服务器的诚实。这显然不是很聪明的做法。

PoST 期望解决这个问题。PoST 提供的方法是，加大初始化阶段的难度，也就是 PoS 生成文件的阶段，想办法让服务器，必须要足够多的时间，才能够生成文件。

怎么保证需要足够多的时间呢，PoW（Proof of Work）就能够做到，比如计算 2^30 次哈希值，就意味着花费了那么多的时间。

PoST 就把 PoW 和 PoS 结合了起来，在初始化的阶段，让服务器必须消耗足够多的时间，才能够生成文件，然后在证明的阶段，去验证初始化阶段生成的文件。

### Proof of Replication

PoRep（Proof of Replication）源自 2017 年的论文《Proof of Replication》，第一作者是 Juan Bene。

PoRep 属于 Proofs of Storage 的一种，是 Protocol Labs 的研究成果，Protocol Labs 还开发了 IPFS 和 Filecoin。PoRep 也是 Filecoin 在使用的共识机制。

PoRep 基于 Proofs of Space 和 Proofs of Retrievability，在其基础上增加了一种能力，就是可以区分出服务器端的副本数量。做法也相对简单，就是在生成 Tags 的阶段，给每个副本都带一个唯一标识，让每一份副本都变得独一无二。

因为是去中心化的网络，Filecoin 需要保证整个网络中存在多个副本，如果节点联合起来作恶，之前的证明方式是无法应对的，所以 Filecoin 使用了 PoRep 的共识机制。

2017 版的 PoRep 相对简单，在 2018 版的 PoRep 里，才开始提到使用 Depth Robust Graphs 的数据结构。论文标题是《PoReps:  Proofs of Space on Useful Data》，第一作者是 Ben Fisch。

### Proof of Capacity

PoC（Proof of Capacity）是 2017 年 Burstcoin 区块链使用的一种共识机制，

PoC 提供了一种挖矿的方式，产生新的区块需要一个 nonce 值：

```
1 nonce = 8192 hash value = 4095 scoops
```

其中 hash value 是使用 Shabal 作为哈希函数计算出的哈希值，每两个哈希值为一个 scoops。

在 0 到 4095 个 scoop nubmer 中随机选出一个，然后和相应的 nonce 结合，去计算出一个 `deadline` 值。和其他所有节点相比，谁的 deadline 值最小，谁就可以产生新的区块。

PoC 更倾向于一种纯粹的共识机制。

