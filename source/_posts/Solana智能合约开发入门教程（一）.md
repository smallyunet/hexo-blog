---
title: Solana 智能合约开发入门教程（一）
tags:
  - SOL
  - 教程
date: 2025-06-24 21:51:06
draft_date: 2025-06-24 18:36:25
---


这个一个零基础系列教程，可以从最基础的操作开始学会 Solana 智能合约的开发。

### 1. 安装环境

访问 Solana 官方提供的安装教程：<https://solana.com/docs/intro/installation>

文档中提供了一键安装全部依赖的单个命令行，也有分阶段安装的详细教程。要注意其中 Solana Cli 是需要修改环境变量文件的。安装好一切后，`solana` 命令应该是可用的：

```
solana --help
```

### 2. 初始化项目

使用 anchor 命令来初始化一个智能合约的项目，这个命令行工具在上个步骤已经安装好了，可以先不用管生成的目录结构是什么样子：

```
anchor init hello_sol
cd hello_sol
```

### 3. 写入合约代码

`programs/hello_sol/src` 目录下有一个 `lib.rs` 文件，`.rs` 结尾意味着这是一个 Rust 语言的代码文件。把这些代码复制进去，注意 `declare_id` 中的内容是你的项目在初始化的时候，就会自动为你生成，不需要原封不动复制下面的内容：

```rust
use anchor_lang::prelude::*;

declare_id!("3Zbdw1oWu1CiMiQr3moQeT4XzMgeqmCvjH5R5wroDWQH");

#[program]
pub mod hello_sol {
    use super::*;

    pub fn say_hello(ctx: Context<Hello>) -> Result<()> {
        msg!("Hello, world!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Hello {}
```

### 4. 编译智能合约

使用 anchor 命令编译你刚才复制进去的智能合约代码，确保编译是成功的，代码没有写错。编译过程中可能会有一些警告，那些警告不要紧，因为 Rust 语言对于代码非常严格，很小的问题都会抛出大段的警告。如果一切顺利，命令行的输出不会有错误日志：

```
anchor build
```

### 5. 设置本地默认网络

运行这个命令，让你本地的 solana 命令默认使用 devnet，因为 devnet 是给开发者使用的，可以用来测试自己的程序，而不需要真的花钱去买 SOL 代币：

```
solana config set --url https://api.devnet.solana.com
```

### 6. 创建本地账户文件

这个命令用于在你本地的默认路径下，创建一个用来部署智能合约的 Solana 账户。因为部署智能合约需要消耗手续费，这些手续费需要一个账户来支付：

```
solana-keygen new -o ~/.config/solana/id.json  
```

这个命令的运行结果中，有一行 `pubkey: ` 开头的输出，pubkey 后面的就是你本地的账户地址。因为上一个步骤已经设置了 devnet 为默认网络，所以可以直接使用这个命令来查看你本地账户的余额：

```
solana balance
```

也可以打开 devnet 的 [浏览器](https://explorer.solana.com/?cluster=devnet)，搜索你刚才生成的地址。搜索之后的 URL 形如：
https://explorer.solana.com/address/75sFifxBt7zw1YrDfCdPjDCGDyKEqLWrBarPCLg6PHwb?cluster=devnet


当然，你会发现自己的账户余额是 `0 SOL`。

### 7. 领取 devnet 上的空投

运行这个命令，你的账户就可以收到 2 个 SOL。其中参数里的 2 就是请求发放 2 个 SOL 的意思。因为领水的额度限制，你只能一次性最多领 2 个。不用担心太少，足够我们接下来的步骤使用了。

```
solana airdrop 2
```

### 8. 部署合约到 devnet

现在我们已经有了智能合约代码，有了本地账户，并且本地账户里有 SOL 余额。现在可以部署合约到 devnet 上了。运行这个命令：

```
anchor deploy --provider.cluster devnet 
```

如果部署成功，会看到 `Deploy success` 的字样。命令行输出中还有一行需要留意，`Program Id: ` 后面的，就是部署之后的合约地址，你可以直接在 devnet 的浏览器上搜索这个地址，然后看到类似这个 URL 的页面，URL 中的 `3Zbdw1oWu1CiMiQr3moQeT4XzMgeqmCvjH5R5wroDWQH` 就是我部署的合约地址：https://explorer.solana.com/address/3Zbdw1oWu1CiMiQr3moQeT4XzMgeqmCvjH5R5wroDWQH?cluster=devnet


### 9. 调用链上合约

到 `hello_sol/app` 目录下，新建一个叫 `app.js` 的文件，把这些代码复制进去。简单来说，这段代码读取了你本地默认的账户文件，然后用你的 Solana 账户发起一笔对智能合约调用的交易，这个脚本每执行一次，就会在链上创建一笔交易。：

```javascript
const anchor = require('@coral-xyz/anchor');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const { Keypair, Connection } = anchor.web3;

const RPC_URL    = process.env.RPC_URL;
const connection = new Connection(RPC_URL, { commitment: 'confirmed' });

const secretKey = Uint8Array.from(
  JSON.parse(
    fs.readFileSync(
      path.join(os.homedir(), '.config/solana/id.json'),
      'utf8',
    ),
  ),
);

const wallet   = new anchor.Wallet(Keypair.fromSecretKey(secretKey));
const provider = new anchor.AnchorProvider(connection, wallet, {
  preflightCommitment: 'confirmed',
});
anchor.setProvider(provider);

const idlPath = path.resolve(__dirname, '../target/idl/hello_sol.json');
const idl     = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
const program = new anchor.Program(idl, provider);

(async () => {
  try {
    const sig = await program.methods.sayHello().rpc();
    console.log('✅ tx', sig);
    console.log(`🌐 https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  } catch (err) {
    console.error('❌', err);
  }
})();
```

返回 `hello_sol` 项目的顶层目录，执行这些命令来安装 nodejs 的依赖：

```
npm init -y 
npm install @coral-xyz/anchor
```

然后记得现在仍然是在顶层目录，运行这个命令，来执行刚才写的 `app.js` 脚本，脚本会到 devnet 上调用我们部署的智能合约：

```bash
export RPC_URL=https://api.devnet.solana.com
node app/app.js
```

这里有一个环境变量 `RPC_URL` 是脚本请求的 API 地址，因为 nodejs 脚本默认不走系统代理，所以对于网络受阻的同学，需要用一个比公开 RPC 更好用的 API 地址。可以使用例如 [Helius](https://www.helius.dev/) 的服务，注册一个免费的账号就可以了。假如执行脚本的过程中遇到下面的错误，那就说明是网络问题，换一个好用的 RPC 地址就好了：

```javascript
❌ Error: failed to get recent blockhash: TypeError: fetch failed
    at Connection.getLatestBlockhash (/Users/smallyu/work/github/hello_sol/node_modules/@solana/web3.js/lib/index.cjs.js:7236:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async AnchorProvider.sendAndConfirm (/Users/smallyu/work/github/hello_sol/node_modules/@coral-xyz/anchor/dist/cjs/provider.js:89:35)
    at async MethodsBuilder.rpc [as _rpcFn] (/Users/smallyu/work/github/hello_sol/node_modules/@coral-xyz/anchor/dist/cjs/program/namespace/rpc.js:15:24)
    at async /Users/smallyu/work/github/hello_sol/app/app.js:40:17
```

你也许好奇为什么不需要指定调用的合约地址，这个脚本怎么知道你刚才，部署到链上的合约在哪里？注意看脚本中有一个 `idlPath` 的变量，你可以直接打开这个路径的文件 `target/idl/hello_sol.json` 查看，里面是一些合约编译后的元信息，包括合约的地址也在里面，没错合约地址是离线生成的，不需要上链，合约就有属于自己的唯一地址了。

如果执行脚本没有输出错误，就会看到终端打印出了这一次调用合约的交易哈希，以及可以直接复制访问的浏览器 URL，例如这就是一笔调用合约的交易：
https://explorer.solana.com/tx/2fnPgKkv3tGKKq72hhRxmW6WFSXuofMzXfY2UYoFZXTdJi37btdESy9NzS2gjpWzXX4CL5F7QfxugpctBVaMcBFY?cluster=devnet

这笔交易页面的最下方，可以看到我们写的智能合约在被交易调用后，打印出了 `Program logged: "Hello, world!"` 的日志，这正是我们写在合约代码中的 msg。

### 10. Troubleshooting

如果在执行上述命令或者代码的过程中，遇到了错误，可以优先考虑是命令行工具版本的问题。由于区块链行业和技术迭代比较快，很容易出现版本不兼容的情况。我本地的环境和版本是：

```text
rustup: rustup 1.28.2 (e4f3ad6f8 2025-04-28)
rustc: rustc 1.90.0-nightly (706f244db 2025-06-23)
solana: solana-cli 2.2.18 (src:8392f753; feat:3073396398, client:Agave)
archor: anchor-cli 0.31.1
node: v24.2.0
@coral-xyz/anchor(nodejs): ^0.31.1
```


