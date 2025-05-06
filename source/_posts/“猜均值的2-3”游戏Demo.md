---
title: “猜均值的 2/3”游戏 Demo
date: 2025-04-22 00:13:05
tags: dApp
---

一年多前，我写过一个 《[“猜均值的2/3” dApp 游戏设计](/2022/12/27/“猜均值的2-3”dApp-游戏设计/)》的设想。

偶然想起来，现在有了功能强大的 ChatGPT 的帮助，让这个游戏在实现上变得简单，合约和前端页面都可以轻松完成。今天只用了 2 个小时，就完成了这个网页的 Demo。

可以通过这个页面访问游戏：https://guessavg.oiia.network/

有几点需要说明：

1. 目前这个 dApp 小游戏运行在 Oiia Network 上，合约地址 [`0x6eb07...BA8F1`](https://explorer.oiia.network/account/0x6eb079C9D3005Bd596E8a0E5065fA33C80aBA8F1)
2. 参加游戏实际上就是调用合约的函数，同时给合约转账一笔钱，例如交易 [`0x1bfb2...10936`](https://explorer.oiia.network/tx/0x1bfb286c9ed796e16870cc36488bd3c11db6eef43e34c425e58ac76715010936)
2. 合约代码在仓库 [guessavg/contract](https://github.com/guessavg/contract)，理论上可以部署到任意网络，因为 OIIA 不要钱，我就拿来用了。
3. 前端代码仓库在 [guessavg/game](https://github.com/guessavg/game)，和合约代码配合使用。
4. OIIA 可以在 faucet 领到一些 https://faucet.oiia.network/
5. 这个私钥有 10 个 OIIA，也能拿来玩一下。但是从游戏机制上，是不允许相同地址重复参与的，需要先把 OIIA 转到陌生地址才行。 `fdf0aec857f3ac4fe146e0d00fb3a7a729646a081719df3f4e168a541a21893b`
6. 前端网页在添加 Oiia 网络到 Metamask 的时候，会报错，但实际上成功了，我没有深入排查原因。一个月前相同的代码还没报错来着。
7. Oiia Network 随时会消失。
8. 只是玩玩……

### 更新（2025.05.06）

Oiia Network 今天起就完全停止运行了，因为我不想为没有人用的网络付服务器费用了。现在这个猜均值的游戏 Demo 已经转移部署到 Base 网络上。

1. 游戏 Demo 地址：[https://guessavg.github.io/game/   ](https://guessavg.github.io/game/   )
2. Base 上的合约地址：[`0x4BbeE...868D2`](https://basescan.org/address/0x4BbeE9F876ff56832E724DC9a7bD06538C8868D2)
3. 需要 Base 网络上的 ETH 参与游戏。
4. 游戏降低了难度，只需要两三个玩家就会结束一轮游戏。
