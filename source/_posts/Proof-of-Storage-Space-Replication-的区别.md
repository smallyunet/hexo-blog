---
title: Proof of Storage/Space/Replication 的区别
date: 2022-12-19 17:58:48
tags: 文件证明
---

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

### Proof of Replication

PoRep（Proof of Replication）源自 2017 年的论文《Proof of Replication》，第一作者是 Juan Bene。

PoRep 是 Protocol Labs 的研究成果，是 Protocol Labs 开发了 IPFS 和 Filecoin。PoRep 也是 Filecoin 在使用的共识机制。

在分类上，PoRep 属于 Proofs of Storage 的一种。

PoRep 基于 Proofs of Space 和 Proofs of Retrievability，再其基础上增加了一种能力，就是可以区分出服务器端的副本数量。

做法也相对简单，就是在生成 Tags 的阶段，给每个副本都带一个唯一标识，让每一份副本都变得独一无二。

因为是去中心化的网络，Filecoin 需要保证整个网络中存在多个副本，如果节点联合起来作恶，之前的证明方式是无法应对的，所以 Filecoin 使用了 PoRep 的共识机制。

### Proof of Capacity

PoC（Proof of Capacity）不是一个太正经的词，即没有论文保底作为一个学术词汇，共识机制的层面也没有 PoRep 的名气大。

PoC 是 2017 年 Burstcoin 区块链使用的一种共识机制，虽然名字好听，但是 Burstcoin 的知名度比 Filecoin 差太多，所以基本上可以认为 PoC 没啥用，就是占了个简称好看。
