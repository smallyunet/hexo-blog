---
title: 如何开发一个比特币符文（Runes）协议
tags:
  - BTC
  - 教程
date: 2025-07-15 22:00:00
draft_date: 2025-07-11 22:18:37
---


比特币符文（Runes）在技术原理上比较简单，很容易理解，实现 Runes 只需要用到比特币脚本中的 `OP_RETURN` 操作符。也是正因为简单，所以在技术特性上， Runes 相对干净一点，没有铭文和 RGB 那么复杂的链下状态。而 Runes 厉害的地方在于，能把这样一个生态给玩起来，虽然现在也凉了，但是我们不那么关心市场表现，从技术的角度，非常切实的看一下 Runes 是如何实现的，并且我们自己会一步一步开发一个简化的 Runes 协议出来。当我们真正理解了 Runes 协议，就可以直接看懂更复杂的项目，比如 Alkanes，一个在比特币上支持 WASM 智能合约的协议。

这篇文章的操作基于《[比特币脚本开发教程](/2025/07/10/比特币脚本开发教程/)》中的知识，如果缺少对比特币脚本的基本了解，可以先看一下基础教程。

### 1. 定义数据结构

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

这个结构定义中，唯一可能有点迷惑的是 `vout` 字段，一般我们要转账给一个目标地址的时候，会使用目标地址的字符串作为值，但是 Runes 协议中，为了节省链上空间，使用 `vout` 也就是当前这笔交易、第几个输出的索引作为 Runes 转账的目标。因为每一笔交易的第 0 个输出会包含 `OP_RETURN` 的值，转账操作的字符全部会放到 `OP_RETURN` 的内容中，所以在一笔交易里，`vout` 只用数字就足以表明转账的目标地址是哪个。交易数据的结构大概是这样：

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

### 2. 发行 Runes 代币

接下来的操作都基于本地启动的 regtest 节点，所以记得先启动起来，同时验证下有没有加载钱包、钱包里有没有余额。然后准备一下要发行 Rune 的 json 数据，比如这样，发行的 Rune 叫 `Doge`，总发行量 `1000` 个：

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

```bash
Issue Doge JSON: {"op":0,"symbol":"Doge","supply":"1000"}
```

然后运行这个命令行，把 json 数据转变为 16进制字符串：

```bash
echo -n "{"op":0,"symbol":"Doge","supply":"1000"}" | xxd -p -c 999
```

我得到了这样的输出：

```bash
7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307d
```

这就是会放到 `OP_RETURN` 后面、用来上链的数据。注意 `OP_RETURN` 最多支持 80 个字节，所以这个数据不能太长。

接着查看并挑一笔未花费的输出，因为 Runes 所有的操作都必须绑定到 UTXO 上。用这个命令查看你的钱包有哪些 UTXO 可用，然后挑一个你喜欢的：

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

然后生成一个找零地址，用来接收比特币余额，这里用了 legecy 格式的地址，这个不是强制的，用 SegWit 的地址也不影响：

```bash
bitcoin-cli -datadir=./ getrawchangeaddress legacy
```

我生成的地址是 `n4Ybvvzm9vRQepuMpXBnTWWbYuTgsPSZCV`，接下来可以用这个地址构建交易了：

```bash
bitcoin-cli -datadir=./ createrawtransaction \
  '[{"txid":"8bfd524e9fc150dab11289d7e6d07860b2b5d6acb54b278a5dc1d1d7631bc8fa","vout":0}]' \
  '[{"data":"7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307d"},{"n4Ybvvzm9vRQepuMpXBnTWWbYuTgsPSZCV":49.99}]'
```

注意这个命令给找零地址的金额为 49.99，这种操作是不可以直接在主网使用的，需要精确计算余额和手续费的差值，然后给找零地址，不然会有很大的资金损失。这里只是懒得计算精确值。

生成交易数据后，对交易进行签名：

```bash
bitcoin-cli -datadir=./ signrawtransactionwithwallet 0200000001fac81b63d7d1c15d8a274bb5acd6b5b26078d0e6d78912b1da50c19f4e52fd8b0000000000fdffffff020000000000000000206a1e7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307dc0aff629010000001976a914fc9ab9cd801c625c9fe323fe669e6a3e362eed8088ac00000000
```

发送签名后的交易到链上：

```bash
bitcoin-cli -datadir=./ sendrawtransaction 02000000000101fac81b63d7d1c15d8a274bb5acd6b5b26078d0e6d78912b1da50c19f4e52fd8b0000000000fdffffff020000000000000000206a1e7b6f703a302c73796d626f6c3a446f67652c737570706c793a313030307dc0aff629010000001976a914fc9ab9cd801c625c9fe323fe669e6a3e362eed8088ac02473044022004a2553cc5348dd4521c093149b0ba5e5603fe4134d06a455e12abeac097ea19022076e72632b2488e1316e54559ed733b37de9ce7fd04119e78a59546a3d2c1faea0121020b396a9dfa1655feef066fe03b403d3e4bdee41ef9b26551497c0921acbf6bc100000000
```
要留意这个命令会输出一个 txid，这个 txid 比较重要，我们后续会从这个 txid 来转出 Doge 代币，所以要记得留下这个 txid 的记录，我的交易哈希是：`e2061d0b8b2f98ee47ba6564c1e7409872432354c7617d278fe0e8c4485ff04a`。挖一个区块来确认交易：

```bash
bitcoin-cli -datadir=./ generatetoaddress 1 bcrt1q6c8d9vw62rdee72xcqx3d97w8qh8mfg8ky8zjw
```

如果一切顺利，交易数据就应该已经上链了。那么链下的解析器在拿到这笔交易后，会看到发行 Rune 的操作，并且解析出来。如果想确认下 `OP_RETURN` 的数据是不是写对了，可以解码一下刚才广播的交易详情：

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

### 3. 转账 Runes 代币

刚才创建了 `Doge` 代币，发行量是 `1000`，我们接下来通过一笔转账交易，来转出这 1000 个 Doge。

首先得计算一下 rune_id，也就是我们刚才发行的 `Doge` 的唯一 ID 是什么，因为 Symbol 字符串是有可能重复的，而且占用字符空间也多，一般会做一些工程上的折中，比如对 txid 按照字节反序，然后取前 8 字节，得到一个 u64 长度的数字，像这样：

```rust
fn calc_run_idby_txid()
{
    let txid = "e2061d0b8b2f98ee47ba6564c1e7409872432354c7617d278fe0e8c4485ff04a".to_string();
    // 按字节反序，然后取前 8 字节
    let mut bytes = hex::decode(txid).unwrap();
    bytes.reverse();
    let run_id = u64::from_le_bytes(bytes[0..8].try_into().unwrap());
    println!("Run ID: {}", run_id);
}
```

这个函数运行后会得到 `10367542271932362826`，我们把这个数字作为 rune_id，去构建转账 rune 需要的 json 数据：

```rust
fn transfer_rune()
{
    let transfer = TransferRune
    {
        op: 1,
        id: 10367542271932362826,
        vout: 1,
        amount: "1000".to_string(),
    };
    println!("Transfer Rune JSON: {}", transfer.toJson());
}
```

这个参数里要留意 `vout` 的值，它是接下来构建交易的时候，要转出到某个地址的 vout 的索引，和创建代币时候的交易没有任何关系。代码运行后得到这样的结果：

```bash
Transfer Doge JSON: {"op":1,"id":10367542271932362826,"vout":1,"amount":"1000"}
```

接下来就可以重复之前的步骤，把 json 转为 16进制字符串：

```bash
echo -n "{"op":1,"id":10367542271932362826,"vout":1,"amount":"1000"}" | xxd -p -c 999
```

我得到 `7b6f703a312c69643a31303336373534323237313933323336323832362c766f75743a312c616d6f756e743a313030307d`。

创建一个新地址用于接收 Doge：

```bash
bitcoin-cli -datadir=./ getnewaddress
```

我的新地址是：`bcrt1qc250507tws9z9wkurfcv3jue2nls6npzaqt7ka`。

利用刚才得到的参数，组装一笔转账 Doge 的交易：

```bash
bitcoin-cli -datadir=./ createrawtransaction \
'[{"txid":"e2061d0b8b2f98ee47ba6564c1e7409872432354c7617d278fe0e8c4485ff04a","vout":1}]' \
'[{"data":"7b226f70223a312c226964223a31303336373534323237313933323336323832362c22766f7574223a312c22616d6f756e74223a2231303030227d"},{"bcrt1q0n2x7030x59j5ql9pp6mw0tps74ag0znrdp45r":0.01},{"n4Ybvvzm9vRQepuMpXBnTWWbYuTgsPSZCV":49.9798}]'
```

这里和之前的交易略有不同，包含两个输出，第一个是接收 Doge 的地址，金额随意，因为重点在于 Doge 余额，而不是 BTC 余额。第二个参数则是找零地址，我们前面的交易里用到过。

剩下的操作轻车熟路，对这笔交易签名、把交易广播出去、挖一个新区块让交易确认：

```bash
# 对交易签名
bitcoin-cli -datadir=./ signrawtransactionwithwallet 02000000014af05f48c4e8e08f277d61c7542343729840e7c16465ba47ee982f8b0b1d06e20100000000fdffffff0300000000000000003d6a3b7b226f70223a312c226964223a31303336373534323237313933323336323832362c22766f7574223a312c22616d6f756e74223a2231303030227d40420f00000000001600147cd46f3e2f350b2a03e50875b73d6187abd43c53601fe729010000001976a914fc9ab9cd801c625c9fe323fe669e6a3e362eed8088ac00000000

# 广播交易
bitcoin-cli -datadir=./ sendrawtransaction 02000000014af05f48c4e8e08f277d61c7542343729840e7c16465ba47ee982f8b0b1d06e2010000006a47304402201437a9e83ae0c6842ebd9d355af9c7be1f6f2eaa070b5d7a6e02e13ca8f2d13102206d05753c428f526b8c6636022991591517cc7d7982badfc633519cb44715957a0121026f441e8156148d0bb4963edaff187873f9800a37bb5f0731256e38d632031283fdffffff0300000000000000003d6a3b7b226f70223a312c226964223a31303336373534323237313933323336323832362c22766f7574223a312c22616d6f756e74223a2231303030227d40420f00000000001600147cd46f3e2f350b2a03e50875b73d6187abd43c53601fe729010000001976a914fc9ab9cd801c625c9fe323fe669e6a3e362eed8088ac00000000
# 得到交易哈希：80709a25e5355d51ee6d7fb625c40e9c4c49b049afa3aca18aeaa03bc685c1f0

# 确认交易
bitcoin-cli -datadir=./ generatetoaddress 1 bcrt1q6c8d9vw62rdee72xcqx3d97w8qh8mfg8ky8zjw
```

到这一步，转账 Doge 的交易就完成并且上链了。

### 4. 解析 Runes 交易

你也许有点纳闷，这不就是发了两笔普通的比特币交易吗，只是放了两个 json 数据到交易上。Runes 就是这样，所有的操作，就在 `OP_RETURN` 允许的那 80 个字节的空间里完成。链上只记录 Runes 的操作，而不维护 Runes 的最终状态。包括有哪些代币、代币余额等信息，全部需要链下程序根据协议进行解析，状态也全部在链下程序维护。

我们首先可以通过已知的交易哈希，获取到这两笔交易的全部详情数据。如果交易哈希不是已知，可以监听扫描全部区块的全部交易，然后按照协议约定解析就行了。这里简化一点。

在 `Cargo.toml` 文件中导入依赖包：

```rust
[dependencies]
hex              = "0.4"
bitcoin          = "0.31"          # Script & consensus decode
bitcoincore-rpc  = "0.18"          # RPC client
serde            = { version = "1.0", features = ["derive"] }
anyhow           = "1.0"
```

通过 RPC 查询节点上的交易数据：

```rust
// 导入必要依赖
use bitcoin::{Transaction, Txid};
use bitcoincore_rpc::{Auth, Client, RpcApi};
use serde::Deserialize;
use std::path::PathBuf;
use std::str::FromStr;

fn parse_tx()
{
    // 去启动比特币节点的数据目录下，找用来 rpc 鉴权的 cookie 文件
    let mut cookie = PathBuf::from("/Users/smallyu/work/github/bitcoin-regtest");
    cookie.push("regtest/.cookie");

    let rpc = Client::new(
        "http://127.0.0.1:18443",
        Auth::CookieFile(cookie),
    ).unwrap();

    // 我们已知的交易哈希
    let issue_txid    = Txid::from_str("e2061d0b8b2f98ee47ba6564c1e7409872432354c7617d278fe0e8c4485ff04a").unwrap();
    let transfer_txid = Txid::from_str("80709a25e5355d51ee6d7fb625c40e9c4c49b049afa3aca18aeaa03bc685c1f0").unwrap();

    // 这里会得到完整的交易数据
    let issue_hex    = rpc.get_raw_transaction_hex(&issue_txid, None).unwrap();
    let transfer_hex = rpc.get_raw_transaction_hex(&transfer_txid, None).unwrap();

    println!("Issue Hex: {}", issue_hex);
    println!("Transfer Hex: {}", transfer_hex);

    // 调用函数来解析交易
    parse_op_return(issue_hex);
    parse_op_return(transfer_hex);
}
```

这个函数在运行的时候，会从链上节点，查询出真实的已经上链的交易数据。接下来可以对这两笔交易的 Runes 操作做解析：

```rust
fn parse_op_return(tx_str: String)
{
    let tx: Transaction = bitcoin::consensus::deserialize(&hex::decode(tx_str).unwrap()).unwrap();
    let script = tx.output[0].script_pubkey.clone();
    // OP_RETURN, DATA
    let mut iter = script.instructions();
    let mut op_return = iter.next();
    let mut data = iter.next();
    // 解析数据
    match op_return
    {
        Some(Ok(op_return)) =>
            {
                match data
                {
                    Some(Ok(data)) =>
                        {
                            match (data)
                            {
                                bitcoin::blockdata::script::Instruction::PushBytes(bytes) =>
                                    {
                                        let json_str = std::str::from_utf8(bytes.as_ref()).unwrap();
                                        println!("{}", json_str);
                                    }
                                _ => panic!("Expected OP_RETURN with data"),
                            }
                        }
                    _ => panic!("No data found in OP_RETURN"),
                }
            }
        _ => panic!("No OP_RETURN found in script"),
    }
}
```

解析数据的代码部分，写法上嵌套有点多，只是因为我不喜欢用语法糖。想看起来更舒服的话，也可以在代码写法上做调整，变得更精简，不过无论写法如何，代码干的事情都一样。这个函数会从交易数据里，经过层层解析，打印出这样的结果：

```bash
{op:0,symbol:Doge,supply:1000}
{"op":1,"id":10367542271932362826,"vout":1,"amount":"1000"}
```

这样，我们就看到了期望的两个 Runes 动作，第一个是发行 Doge，第二个是对 Doge 进行转账。

以上过程就是 Runes 协议比较核心的内容，剩下的只需要把链下程序扩充一下，记录 Runes 状态、根据 rune_id 关联 Rune 操作、储存和显示余额变更等信息就可以了。




