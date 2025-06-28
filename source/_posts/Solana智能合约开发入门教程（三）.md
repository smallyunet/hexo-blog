---
title: Solana智能合约开发入门教程（三）
date: 2025-06-28 00:01:01
tags:
  - 智能合约
  - 教程
---

> 这个一个零基础的系列教程，可以从最基本的操作开始学会 Solana 智能合约的开发。
> 
> - 《[第一篇](/2025/06/24/Solana智能合约开发入门教程（一）/)》：基础环境安装、HelloWorld 合约部署、链上合约调用
> - 《[第二篇](/2025/06/26/Solana智能合约开发入门教程（二）/)》：实现 USDT 合约的最小模型，自定义数据结构与方法
> - 《[第三篇](/2025/06/28/Solana智能合约开发入门教程（三）/)》：使用官方 SPL 库复用合约功能，完成标准化代币的发行

你也许注意到，在编写智能合约的过程中，对于程序逻辑的描述反而是轻量的，比较复杂的部分是不同类型的 `#[account]` 宏，以及去了解宏接受的参数，比如是否允许自动创建账户、如果创建应该租用多少个字节的空间等，因为 Solana 的全部账户数据需要加载到节点服务器的内存中，价格比较昂贵，所以要求开发者对于空间的占用计算比较精细。而 Solana 的账户体系又有点复杂，需要稍微理解一下。

### 1. 命令行工具发行代币

对于发行 USDT 这种经典场景，Solana 已经封装好了智能合约的库函数，可以直接调用，甚至封装好了命令行工具，只需要简单的操作，不需要写合约，就可以发行代币。Solana 把这些代币统称为 SPL Token。创建一个 6 位精度的 SPL Token 的命令是这样，注意不需要写代币名字：

```bash
spl-token create-token --decimals 6
```

命令行运行结束后，会输出一个 `Address`，这个就是 SPL Token 的代币地址，比如我得到的地址是 `E75GMXAfJ91XuRboSpjwkDmta45Etgt3F3Gf5WLZvLbV`，可以在 [区块链浏览器](https://explorer.solana.com/address/E75GMXAfJ91XuRboSpjwkDmta45Etgt3F3Gf5WLZvLbV?cluster=devnet) 上查到。

接下来需要一个操作，来给你本地的账户，在这个 USDT 代币上创建一个关联账户（Associated Token Account，ATA）。这个创建关联账户的动作，相当于在合约上实例化一个数据结构，这个数据结构里保存了你的 USDT 余额等信息，如果没有这个数据，USDT 代币的合约上就找不到你。

用 “账户” 这个词可能有点迷惑，我本地已经有账户了，还能用 `solana address` 命令看到账户地址，为什么还需要专门调用 USDT 的合约，创建什么 ATA 账户？可以理解为，合约里本来有个空的 map{}，创建 ATA 账户就是向 map 里插入了一条数据，key 是你本地的账户地址，value 是 USDT 的余额信息。如果 map 里没有你的信息，你甚至不能接受 USDT 的转账。

那么为什么 Solana 要这么设计，必须先在 map 里开辟空间，才能接受转账呢？因为一开始有提到过，对于 Solana 来说，链上空间是比较珍贵的，map 里开辟一个键值对的空间，也就是创建 ATA 账户，需要占用 165 个字节的内存，这 165 字节不是免费使用的，可以使用命令 `solana rent 165` 来计算字节数对应的费用，比如这里就会输出 `0.00203928 SOL`，也就是你创建 ATA 账户的交易，在手续费之外，会多支付这么些租金。所以必须要有创建 ATA 账户这个操作，主要是为了收费。

回到我们的操作，创建 ATA 账户的命令是：

```bash
spl-token create-account E75GMXAfJ91XuRboSpjwkDmta45Etgt3F3Gf5WLZvLbV
```

这个命令会显示 `Creating account`，后面是你的 ATA 地址，比如我的是 `E5XmcEJhhGUri8itThLGk8QfPzY1acFid8JmVyo5DWUo`,同样的，可以在 [区块链浏览器](https://explorer.solana.com/address/E5XmcEJhhGUri8itThLGk8QfPzY1acFid8JmVyo5DWUo?cluster=devnet) 中看得到。

对要注意，ATA 账户是有单独的地址的，比如你本地的账户地址是 `a`，在 USDT 代币上创建的 ADA 账户地址将是 `b`，是不一样的。而后续接受 USDT、发送 USDT，将全部通过 ATA 账户来进行，而不是你本地的那个账户。SPL Token 提供了命令来查看本地钱包账户和 ATA 账户的关系：

```bash
spl-token address --verbose --token E75GMXAfJ91XuRboSpjwkDmta45Etgt3F3Gf5WLZvLbV

// 输出是这个样子
Wallet address: 75sFifxBt7zw1YrDfCdPjDCGDyKEqLWrBarPCLg6PHwb
Associated token address: E5XmcEJhhGUri8itThLGk8QfPzY1acFid8JmVyo5DWUo
```

那么现在，可以用这个命令，来查询 USDT 的余额，`balance` 后面的参数是指代币地址，而不是 ATA 地址：

```bash
spl-token balance E75GMXAfJ91XuRboSpjwkDmta45Etgt3F3Gf5WLZvLbV 
```

当然默认是 0，现在给这个地址挖一些 USDT 上去。这个命令有点长，有 3 个参数，第一个参数是代币地址，第二个参数是代币数量，第三个参数是 ATA 地址，意味着要挖哪个代币、挖多少、挖给谁：

```bash
spl-token mint E75GMXAfJ91XuRboSpjwkDmta45Etgt3F3Gf5WLZvLbV 5 E5XmcEJhhGUri8itThLGk8QfPzY1acFid8JmVyo5DWUo
```

命令执行成功后，就可以查询到余额，也能直接在浏览器上看到余额了，类似的，转账 USDT 的命令是：

```bash
spl-token transfer <MINT> 1 <ATA>
```

Solana 为了避免用户不记得自己的 ATA 账户地址，也提供了人性化的命令，最后一个参数可以直接用本地的钱包地址，而不需要 ATA 地址，这也就是为什么我们平时使用 Solana 的钱包，并没有感觉到 ATA 账户这种东西存在的原因：

```bash
spl-token transfer <MINT> 1 <RECIPIENT_WALLET>
```

### 2. 用 spl 标准库写智能合约

我们尝试一下在智能合约里调用 spl 库函数，这种官方提供的、系统级别的库函数是经过严格安全审计的，比我们自己写要安全，所以有了这些库函数，我们可以更加关注自己定制化的业务逻辑，不需要关心太底层的东西，比如 USDT 余额计算是否精度有损失之类的问题。先创建一个新项目：

```bash
anchor init usdt_spl
```

导入 `anchor-spl` 依赖，这个命令可以把最新版本的库函数导入进来，命令运行后，可以在 `programs/usdt_spl/Cargo.toml` 文件的 `[dependencies]` 部分，新增了这样一行 `anchor-spl = "0.31.1"`，说明是成功的：

```bash
cargo add anchor-spl
```

开始写合约代码程序。先在最开始两行导入 spl 的依赖。我们之前有使用过 Anchor 框架自带的账户类型如 `Account` 和 `Signer`，那么这里 spl 也是提供了多种数据类型，比如 `TokenAccount` 就表示 ATA 账户的数据结构：

```rust
use anchor_spl::token::{self, MintTo, Token, TokenAccount, Mint};
```

接着定义 mint 行为相关的账户规则：

```rust
#[derive(Accounts)]
pub struct MintToCtx<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>, 

    #[account(mut)]
    pub to:   Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
```

这几行代码中，`mut` 关键词我们之前用到过，表明账户数据要允许被写入。`Account` 类型是 anchor 框架自带的，我们也使用过。`Mint` 类型则是新出现的，是从 spl 框架里导入的，我们之前不是自己定义过一个用 `#[Account]` 宏标注的 `Mint` 结构体，然后在 `#[derive(Accounts)]` 里使用吗。现在有了 spl 库，我们不需要自己定义 `Mint` 结构体的类型、参数个数，直接使用就好。

同样的，`TokenAccount` 和 `Token` 也都是 spl 框架提供的类型。这么看似乎使用 spl 框架比自己写简单了不少？不能高兴的太早，还有一段代码没有写上：

```rust
impl<'info> From<&MintToCtx<'info>> for CpiContext<'_, '_, '_, 'info, MintTo<'info>>
{
    fn from(accts: &MintToCtx<'info>) -> Self {
        let cpi_accounts = MintTo {
            mint:      accts.mint.to_account_info(),
            to:        accts.to.to_account_info(),
            authority: accts.authority.to_account_info(),
        };
        CpiContext::new(accts.token_program.to_account_info(), cpi_accounts)
    }
}
```

这段代码乍一看眼花缭乱，可能要晕了，为什么那么多尖括号，为什么那么多单引号和下划线。这就是 Rust，为了迎合独特的内存管理设计，不得不让语言在语法形式上变得复杂。

`impl ... From<...> for ...` 是 Rust 的语法规则，大意是让一种类型变为另一种类型，我们这里就是让 `From<&MintToCtx<'info>>` 类型变为 `CpiContext<'_, '_, '_, 'info, MintTo<'info>>`。其中 `MintToCtx` 是我们上面自己用 `#[derive(Accounts)]` 宏定义的类型，然后作为泛型参数传递给了 `From`，而这个 `From`，是 Rust 标准库提供的一个包装类型，用来接受我们传入的参数。

至于后面的 `CpiContext` 部分，Cpi 的全称是跨程序调用 Cross-Program Invocation，用于把要调用的外部程序，以及账户类型，都打包到一个统一的数据结构中。前三个参数不用管，最后的 `MintTo` 是我们真正传入的类型，这个类型是 spl 库提供的。

那么也许这里有疑问，为什么还涉及到调用外部程序？CpiContext 又是如何知道要调用哪个外部程序的？这个和 Solana 智能合约的设计有关，SPL Token 不止是一些类型定义，而且是实际已经部署在 Solana 网络上的程序。我们在使用 spl 依赖库的过程，实际上就是去调用那些已经预先在 Solana 网络上部署的 spl 合约。智能合约在运行的时候，发现你要调用 spl，就去找 spl 的合约地址，执行一些操作，然后返回结果。相当于整个网络上的智能合约都在复用同一套 spl 合约。

所以要留意 Solana 智能合约依赖库的实现方式，和其他网络是有不同的。Solana 在设计上让程序和数据分离，以致于可以实现程序共享的模式。为什么我们不自己部署一套 spl 合约，或者每个人都各自部署一套 spl 合约，然后自己使用呢？一方面是需要付出额外的手续费成本，另一方面是 Solana 的智能合约本来就允许程序共享，你要是自己部署一套，用户都不知道你有没有偷偷修改标准库的代码，反而不安全了。

还有最后一部分 `#[program]` 里的程序逻辑要补齐：

```rust
pub fn mint_to(ctx: Context<MintToCtx>, amount: u64) -> Result<()> {
    token::mint_to((&*ctx.accounts).into(), amount)
}
```

### 3. 编译合约

现在代码没问题，但是如果现在编译合约项目，会遇到报错。需要修改下 `programs/usdt_spl/Cargo.toml` 文件，把这两行的特性打开：

```rust
[features]
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

[dependencies]
anchor-spl  = { version = "0.31.1", features = ["token", "idl-build"] }
```

因为静态编译的时候，命令行默认没有把 spl 标准库给带上，在配置文件里指明就可以了。现在项目可以编译成功：

```bash
anchor build
```

### 4. 写单元测试

安装 spl 相关的 nodejs 依赖，注意单元测试用的是 ts 语言，不是 Rust 语言：

```bash
npm i @coral-xyz/anchor@^0.31 @solana/spl-token chai
```

把单元测试代码复制到 `tests/usdt_spl.ts` 文件中：

```ts
import anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  createAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

const { AnchorProvider, BN } = anchor;

describe("usdt_spl / mint_to", () => {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.UsdtSpl as Program;

  let mintPubkey: anchor.web3.PublicKey;
  let ata: anchor.web3.PublicKey;

  it("creates mint, mints 1 USDT into ATA", async () => {
    mintPubkey = await createMint(
      provider.connection,
      provider.wallet.payer,          // fee-payer
      provider.wallet.publicKey,      // mint authority
      null,                           // freeze authority
      6                               // decimals
    );

    ata = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,          // fee-payer
      mintPubkey,
      provider.wallet.publicKey       // owner
    );

    await program.methods
      .mintTo(new BN(1_000_000))      // 1 USDT
      .accounts({
        mint: mintPubkey,
        to: ata,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const accInfo = await getAccount(provider.connection, ata);
    assert.equal(accInfo.amount.toString(), "1000000");
  });
});
```

运行单元测试，会看到成功的输出：

```bash
anchor test
```

### 5. 部署合约到 devnet

确保账户里余额足够，然后用 anchor 来部署合约：

```bash
anchor deploy --provider.cluster devnet 
```

这个命令偶尔会因为网络问题执行失败，抛出 `Operation timed out` 错误。可以直接把 provider 的参数改为自己的 rpc 地址，如果网址比较长，可以用双引号括一下：

```bash
anchor deploy --provider.cluster "<your-rpc-url>"
```

因为网络问题带来的麻烦有可能还不止如此，比如本地存在写入了一部分但是为完成的 buffer、链上存在 buffer 但是本地不存在导致状态不一致等问题，为了直接跳过那些问题，可以直接这种这样的命令：

```bash
solana program deploy \
  target/deploy/usdt_spl.so \
  --program-id target/deploy/usdt_spl-keypair.json \
  --url "<your-rpc-url>"
```

这个命令更加好用。如果没有带 `--program-id` 参数，这个命令会自动新生成 keypair，也就意味着会把合约部署的新的地址，这个根据自己的需求来选择。部署成功后，就可以去 [区块链浏览器](https://explorer.solana.com/address/CFXzAhGKEz7tSFdNcVeCX8HosFGYczD7rZyD4vwoWozY?cluster=devnet) 上查看了。

### 6. 使用 SDK 调用链上合约

我们之前使用过 SDK，现在再来使用和复习一下，编辑 `app/app.js` 文件，把代码复制进去：

```ts
// scripts/mint_to.js   (CommonJS)
const anchor = require("@coral-xyz/anchor");
const {
  createMint,
  createAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const fs   = require("fs");
const os   = require("os");
const path = require("path");
const { Keypair, Connection, PublicKey } = anchor.web3;

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, { commitment: "confirmed" });

const secret = Uint8Array.from(
  JSON.parse(fs.readFileSync(path.join(os.homedir(), ".config/solana/id.json")))
);
const wallet = new anchor.Wallet(Keypair.fromSecretKey(secret));
const provider = new anchor.AnchorProvider(connection, wallet, {
  preflightCommitment: 'confirmed',
});
anchor.setProvider(provider);

const idl  = JSON.parse(fs.readFileSync(path.resolve("target/idl/usdt_spl.json")));
const prog = new anchor.Program(idl, provider);

(async () => {
  const mint = await createMint(connection, wallet.payer, wallet.publicKey, null, 6);
  const ata  = await createAssociatedTokenAccount(connection, wallet.payer, mint, wallet.publicKey);

  const sig = await prog.methods
    .mintTo(new anchor.BN(1_000_000))
    .accounts({ mint, to: ata, authority: wallet.publicKey, tokenProgram: TOKEN_PROGRAM_ID })
    .rpc();

  console.log("tx:", sig);
  console.log(`explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`);

  const bal = await getAccount(connection, ata);
  console.log("balance:", bal.amount.toString());
})();
```

如果一切顺利，可以看到这样的运行结果：

```
~/work/github/sol_contract/usdt_spl main ❯ node app/app.js
tx: 3MgHxsfnJp68mrrABvCh9iwNm6MSXp1SEvk7vDYHoW7KhTEHfVNyMWsbfbEAXTC9gLzcmWu5xbkzia8hgZrcZ18i
explorer: https://explorer.solana.com/tx/3MgHxsfnJp68mrrABvCh9iwNm6MSXp1SEvk7vDYHoW7KhTEHfVNyMWsbfbEAXTC9gLzcmWu5xbkzia8hgZrcZ18i?cluster=devnet
balance: 1000000
```



