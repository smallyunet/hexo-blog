---
title: 基于 zk + 智能合约的链上身份认证系统设计
tags: 
- zk
- 计划
date: 2025-04-30 22:18:54
draft_date: 2025-04-30 21:59:39
---

我给这个系统取名 zkgate.fun，主要想发挥零知识证明的特性，结合区块链做个小工具。

主要功能是实现，用户证明自己属于某一个群组，但是不需要暴露自己真实的链上身份。

目前的设想是这样，管理员首先有一个名单列表，可以是以太坊地址的数组，然后根据这个地址列表，计算出一个 Merkle Root Hash。

接着把这个 root hash 提交到智能合约上。

处于这个名单中的人，可以使用 Circom 电路的 proving key，来给自己生成一个 zk proof，随后将 zk proof 提交到智能合约上。

在智能合约上，会使用 Circom 电路生成的 verifier.sol，对收到的 zk proof 进行验证，判断用于生成 zk proof 的地址，是否在 Merkle Root Hash 中，最后将判断结果返回。

这样的话，管理员不需要公开自己的群组中有哪些地址，属于群组中的地址也不需要声明自己的身份，只需要提交零知识证明生成的 zk proof，就可以证明自己真的归属于这个群组。

我接下来会具体在技术上实现这个设计。

<br>

### 更新 v0.1.0 版本 (2025.05.09)

首先要纠正之前设计中的一个错误的地方，就是管理员必须要公开自己群组的地址列表，否则无法根据地址列表来生成 Merkle Tree，用户也无法根据树结构，来找到自己地址所在的节点位置、生成路径证明。

其次是很高兴地说，现在跑通了一个非常初级的 Demo（[smallyunet/zkgate-demo](https://github.com/smallyunet/zkgate-demo)），这个 Demo 功能并不完善，甚至没有办法在电路中验证地址的所有权，但至少是一个工具链路层面的跑通。

具体实现是这样：

1. 有一个 [链下程序](https://github.com/smallyunet/zkgate-demo/blob/main/offchain/smt.js) 来根据地址列表，以及自己的地址，生成 zk 电路的 [inputs.json](https://github.com/smallyunet/zkgate-demo/blob/main/offchain/inputs.json)，这个输入文件包含了 Merkle Root Hash 和验证节点位置所需要的路径
2. 根据 [电路代码](https://github.com/smallyunet/zkgate-demo/blob/main/circuits/merkleSmtProof.circom) 来编译出一些 [二进制文件](https://github.com/smallyunet/zkgate-demo/tree/main/circuits/build)，这些编译后的产物是用来生成 witness 文件的
3. 基于公开的 [ptau 文件](https://github.com/smallyunet/zkgate-demo/blob/main/circuits/run.sh#L17-L28) 生成 .zkey 文件
4. 从 .zkey 文件中导出 [proof.json](https://github.com/smallyunet/zkgate-demo/blob/main/circuits/proof.json), [public.json](https://github.com/smallyunet/zkgate-demo/blob/main/circuits/public.json), [verification_key.json](https://github.com/smallyunet/zkgate-demo/blob/main/circuits/verification_key.json)，这 3 个 json 文件可以做链下离线验证，证明 prove 的有效性
5. 从 .zkey 文件中导出 [.sol 文件](https://github.com/smallyunet/zkgate-demo/blob/main/circuits/contracts/Groth16Verifier.sol)，也就是智能合约代码，部署到链上
6. 拿着 prove.json 文件和 public.json 文件的内容，作为 [参数](https://github.com/smallyunet/zkgate-demo/blob/main/hardhat/scripts/prove.js#L41) 调用合约的 [verifyProof](https://github.com/smallyunet/zkgate-demo/blob/main/circuits/contracts/Groth16Verifier.sol)函数，如果 prove 有效则返回 true，否则返回 false

假如一个地址不在群组列表中，有两种情况：

1. 试图用一个不在群组列表中的 [地址](https://github.com/smallyunet/zkgate-demo/blob/main/offchain/smt_non_member.js#L24) 生成 inputs.json，然后拿着 inputs.json 去根据电路生成 prove，会直接被电路拒绝报错
2. 试图用一些假的 [prove 参数](https://github.com/smallyunet/zkgate-demo/blob/main/hardhat/scripts/fakeProofWithCorrectRoot.js#L26) 提交到链上做验证，最终无法通过链上验证

那么目前这个最初级版本的 Demo，问题在于，构建 prove 使用的是明文地址，比如：

```js
const members = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

const proofKey = toField(members[0]);
const { siblings } = await tree.find(proofKey);
```

这个语句的含义是在让 zk 电路判断，`members[0]` 是否属于 `members` 数组构建出来的树结构，这显然是属于的。如果想要用不属于群组的地址构建 prove，只需要替换一下 proofKey 指向的地址：

```js
const nonMemberAddress = "0x1234567890123456789012345678901234567890";
const proofKey = toField(nonMemberAddress);
const { siblings } = await tree.find(proofKey);
```

也就是说，members 列表必须是公开的，而现在的程序只能判断一个地址在不在 `members` 里面，但即使 `members[0]` 不是我的地址，我也能用来构建一个合法的 prove。那还要 zk 干嘛？

所以下一步要解决的问题，是让用户用私钥对某个消息进行签名，然后在 zk 电路中根据签名 recover 出地址，接着判断 recover 出来的地址是否属于 members 数组。

这个过程是不是听起来简单？可实际上用 zk 电路来 recover 出一个 ECDSA 签名算法的地址，别说复杂度非常高，难度就像用乐高搭核电站一样。难怪人们都说，搞 zk 真的很掉头发。





