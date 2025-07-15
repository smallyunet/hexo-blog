---
title: 如何开发一个比特币符文（Runes）协议（草稿）
tags:
  - BTC
  - 教程
date: 2025-07-15 12:12:12
draft_date: 2025-07-11 22:18:37
---


比特币符文（Runes）在技术原理上很简单，比较容易理解，实现 Runes 只需要用到比特币脚本中的 `OP_RETURN` 操作符。因为简单所以在技术特性上， Runes 相对干净一点，没有铭文和 RGB 那么复杂的链下状态。Runes 厉害的地方在于把这样一个生态给玩起来了，虽然现在也凉了，但是我们不那么关心市场表现，从技术原理的角度，非常切实的看一下 Runes 是如何实现的，并且我们自己会一步一步开发一个简化的 Runes 协议出来。当我们真正理解了 Runes 协议，就可以直接看懂更复杂的项目，比如 Alkanes，一个在比特币上支持 WASM 智能合约的协议。

这篇文章的操作基于《[比特币脚本开发教程](/2025/07/10/比特币脚本开发教程/)》中的知识，如果缺少对比特币脚本的基本了解，可以先看一下基础教程。

### 定义数据结构

首先把 Runes 相关的操作定义为 json 格式的数据结构。用什么语言都可以，这里用的是 Rust。为了简化教程，可以省去一些实际中常用的元素，比如 `transfer` 的操作定义中，应该允许一次性转账给多个目标地址，但这里只有一个目标地址，没有用数组：

```rust
struct IssueRune
{
    op: u8,          // 固定为 0，代表发行
    symbol: String,  // Rune name
    supply: String,  // 发行总量
}

struct TransferRune
{
    op: u8,          // 固定为 1，代表转账
    id: u64,         // rune_id
    vout: u32,       // 转账目标
    amount: String,  // 转账金额
}
```

唯一可能有点迷惑的是 `vout` 字段，一般我们要转账给一个目标地址的时候，会使用目标地址的字符串作为值，但是 Runes 协议中，为了节省链上空间，使用 `vout` 也就是当前这笔交易、第几个输出的地址作为 Runes 转账的目标地址。因为每一笔交易的第 0 个输出会包含 `OP_RETURN` 的值，转账操作的字符全部会放到 `OP_RETURN` 的内容中，所以在一笔交易里，`vout` 只用数字就足以表明转账的目标地址是哪个。交易数据的结构大概是这样：

```json
tx {
  vin:   [...]
  vout:  [
    { vout: 0, scriptPubKey: OP_RETURN <json数据> },
    { vout: 1, scriptPubKey: OP_0 <转账地址1> },
    { vout: 2, scriptPubKey: OP_0 <转账地址2> }
  ]
}
```

接着给数据结构定义一下序列化函数，让结构体可以转变为 json 字符串：

```rust
impl IssueRune
{
    fn toJson(&self) -> String
    {
        format!(
            "{{\"op\":{},\"symbol\":\"{}\",\"supply\":\"{}\"}}",
            self.op, self.symbol, self.supply
        )
    }
}

impl TransferRune
{
    fn toJson(&self) -> String
    {
        format!(
            "{{\"op\":{},\"id\":{},\"vout\":{},\"amount\":\"{}\"}}",
            self.op, self.id, self.vout, self.amount
        )
    }
}
```

### 发行 Runes 代币

记得启动本地的 regtest 节点，如果还没有启动的话，同时验证下有没有加载钱包、钱包里有没有余额。

然后准备一下要发行的 Runes 的 json 数据，比如这样，发行的 Rune 叫 `Doge`，总发行量 `1000` 个：

```rust
fn issue_rune()
{
    let issue = IssueRune 
    {
        op: 0,
        symbol: "Doge".to_string(),
        supply: "1000".to_string(),
    };
    println!("Issue Doge JSON: {}", issue.toJson());
}
```

运行这个函数，就会得到这样的输出，后面的 json 数据很重要，我们稍后会把这个数据发送到链上：

```json
Issue Doge JSON: {"op":0,"symbol":"Doge","supply":"1000"}
```

运行这个命令行，把 json 数据转变为 16进制字符串：

```bash
echo -n "{"op":0,"symbol":"Doge","supply":"1000"}" | xxd -p -c 999
```

我得到了这样的输出：

```bash
7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307d
```

这就是会放到 `OP_RETURN` 后面、用来上链的数据。注意 `OP_RETURN` 最多支持 80 个字节，所以这个数据不能太长。

接着查看并挑一笔未花费的输出，因为 Runes 所有的操作都必须绑定到 UTXO 上，用这个命令查看你的钱包有哪些 UTXO 可用，然后挑一个你喜欢的：

```bash
bitcoin-cli -datadir=./ -regtest listunspent
```

比如我要用的 UTXO 是这样：

```json
{
  "txid": "8bfd524e9fc150dab11289d7e6d07860b2b5d6acb54b278a5dc1d1d7631bc8fa",
  "vout": 0,
  "address": "bcrt1q6c8d9vw62rdee72xcqx3d97w8qh8mfg8ky8zjw",
  "amount": 50.00000000,
  // ...
}
```

然后生成一个找零地址，用来接收比特币余额，这里用了 legecy 格式的地址，这个不是强制的，用 SegWit 的地址也行：

```bash
bitcoin-cli -datadir=./ getrawchangeaddress legacy
```

我生成的地址是 `n4Ybvvzm9vRQepuMpXBnTWWbYuTgsPSZCV`，接下来可以用这个地址构建交易了：

```bash
bitcoin-cli -datadir=./ createrawtransaction \
  '[{"txid":"8bfd524e9fc150dab11289d7e6d07860b2b5d6acb54b278a5dc1d1d7631bc8fa","vout":0}]' \
  '[{"data":"7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307d"},{"n4Ybvvzm9vRQepuMpXBnTWWbYuTgsPSZCV":49.99}]'
```

注意这个命令给找零地址的金额为 49.99，这种操作是不可以直接在主网使用的，需要精确计算余额和手续费的差值，然后给找零地址，不然会有很大的资金损失。这里只是懒得给一个精确值。

执行命令生成交易数据后，对交易进行签名：

```bash
bitcoin-cli -datadir=./ signrawtransactionwithwallet 0200000001fac81b63d7d1c15d8a274bb5acd6b5b26078d0e6d78912b1da50c19f4e52fd8b0000000000fdffffff020000000000000000206a1e7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307dc0aff629010000001976a914fc9ab9cd801c625c9fe323fe669e6a3e362eed8088ac00000000
```

发送签名后的交易到链上：

```bash
bitcoin-cli -datadir=./ sendrawtransaction 02000000000101fac81b63d7d1c15d8a274bb5acd6b5b26078d0e6d78912b1da50c19f4e52fd8b0000000000fdffffff020000000000000000206a1e7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307dc0aff629010000001976a914fc9ab9cd801c625c9fe323fe669e6a3e362eed8088ac02473044022004a2553cc5348dd4521c093149b0ba5e5603fe4134d06a455e12abeac097ea19022076e72632b2488e1316e54559ed733b37de9ce7fd04119e78a59546a3d2c1faea0121020b396a9dfa1655feef066fe03b403d3e4bdee41ef9b26551497c0921acbf6bc100000000
```

挖一个区块来确认交易：

```bash
bitcoin-cli -datadir=./ generatetoaddress 1 bcrt1q6c8d9vw62rdee72xcqx3d97w8qh8mfg8ky8zjw
```

如果一切顺利，交易数据就应该已经上链了。那么链下的解析器在拿到这笔交易后，会看到发行 Rune 的操作，并且解析出来。如果想确认下 OP_RETURN 的数据是不是写对了，可以解码一下刚才广播的交易详情：

```bash
bitcoin-cli -datadir=./ decoderawtransaction 02000000000101fac81b63d7d1c15d8a274bb5acd6b5b26078d0e6d78912b1da50c19f4e52fd8b0000000000fdffffff020000000000000000206a1e7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307dc0aff629010000001976a914fc9ab9cd801c625c9fe323fe669e6a3e362eed8088ac02473044022004a2553cc5348dd4521c093149b0ba5e5603fe4134d06a455e12abeac097ea19022076e72632b2488e1316e54559ed733b37de9ce7fd04119e78a59546a3d2c1faea0121020b396a9dfa1655feef066fe03b403d3e4bdee41ef9b26551497c0921acbf6bc100000000
```

输出的结果是这样：

```json
"vout": [
    {
      "value": 0.00000000,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_RETURN 7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307d",
        // ...
      }
    },
    {
      "value": 49.99000000,
      "n": 1,
      "scriptPubKey": { //... }
    }
  ]
```

很明显看到了在第 0 个输出中，有 `OP_RETURN 十六进制数据` 的内容，如果还是不放心，可以 decode 一下 16进制字符串：

```bash
echo -n "7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307d" | xxd -r -p
```

应该得到：

```bash
{op:0,symbol:Doge,supply:1000}
```

### 转账 Runes 代币



