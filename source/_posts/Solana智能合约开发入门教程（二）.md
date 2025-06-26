---
title: Solana 智能合约开发入门教程（二）
date: 2025-06-26 13:56:54
tags:
  - 智能合约
  - 教程
---

我们已经学会了如何创建智能合约项目、部署合约以及调用连上合约，接下来深入了解一下智能合约编程语言的写法，关注如何写出自己想要的逻辑。我们将会以写一个简单的 USDT 代币合约为例，分析相关的代码，并且理解 Solana 智能合约的写法。

### 1. 创建项目

用我们已经学会的命令，来创建一个新的项目：

```bash
anchor init usdt_clone
```

### 2. 配置文件

可以注意到项目路径 `programs/usdt_clone/Cargo.toml` 下的这个文件，Cargo 是 Rust 语言常用的包管理器，这个 `Cargo.toml` 则是包管理器的配置文件，指定了要引入哪些依赖库，以及依赖库的版本。我们自动生成的配置文件里有这么两行：

```Rsut
[dependencies]
anchor-lang = "0.31.1"
```

Anchor 提供的宏是 Solana 智能合约的关键，宏的形式如 `#[program]`、`#[account]` 等，这些宏会告诉 Solana 的 SVM 虚拟机，程序从哪里开始、数据结构在哪里定义等。如果没有 Anchor 这个依赖，合约项目就是普通的 Rust 语言项目了，Solana 的智能合约系统无法识别和解析。这也就解释了，Solana 的智能合约，是如何利用 Rust 语言来实现的。

### 3. 合约地址

我们近距离看一下合约的代码文件 `usdt_clone/programs/usdt_clone/src/lib.rs`。文件的第一行内容是这样，`use` 把 Anchor 常用的类型一下子全部导入进来了，这没什么问题，不需要修改，方便我们后续编写程序。：

```Rsut
use anchor_lang::prelude::*;
```

第二行内容是一个对 `declare_id` 函数的调用，`declare_id` 声明了当前这个智能合约项目的 Program ID，也就是合约地址是什么，之前我们提到过，Solana 的智能合约地址，是可以离线生成的。

```Rsut
declare_id!("CFmGdHuqDymqJYBX44fyNjrFoJx6wRkZPkYgZqfkAQvT");
```

这个合约地址是一个随机值，但不是随意格式的值，它是一个 Ed25529 的公钥。假如你手动把最后一个字符 `T` 改为 `t`，这整个字符串就不是一个合法的公钥了，所以这个值可以随机生成，但是不能随便改。那么既然是公钥，它的私钥在哪里呢？在初始化项目的时候，会自动生成一个私钥，文件位置在 `target/deploy/usdt_clone-keypair.json`，可以打开看到是一些字节数组，`declare_id` 使用的公钥，就是根据这个私钥生成的。

### 4. 储存数据结构

接下来我们需要新增一些自己的逻辑，在 `declare_id` 语句的下方，写入这个代码：

```Rsut
#[account]
pub struct Mint {
    pub decimals: u8,
    pub mint_authority: Pubkey,
}
```

可以理解为 `#[account]` 宏是用来定义数据结构的，Anchor 黑魔法会在背后进行一系列操作，让我们可以针对这个数据结构在链上进行读写操作。这里的代码很简单，我们定义了一个叫 `Mint` 的结构体，这个结构体包含两个属性，`decimals` 指定 USDT 代币的精度是多少，`mint_authority` 指定谁可以来挖新的币。

我们继续定义另一个结构体，用来储存每一个用户的代币数量。`owner` 就是用户地址，`balance` 则是用户的余额：

```Rsut
#[account]
pub struct TokenAccount {
    pub owner: Pubkey,
    pub balance: u64,
}
```

### 5. 账户约束结构

你可能注意到当前的代码文件最底部，还有两行自动生成的 `#[derive(Accounts)]` 开头的代码。这个宏是用来给账户写一些约束规则的。我们可以在 `#[derive(Accounts)]` 内部定义一些函数，然后再用 `#[account]` 来定义结构体，那么这个结构体就自动拥有了所有函数。类似于给结构体定义成员函数的意思。

把原本的 `Initialize` 代码删掉：

```Rsut
#[derive(Accounts)]
pub struct Initialize {}    // 删除
```

然后写入我们自己的逻辑：

```Rust
#[derive(Accounts)]
pub struct InitMint<'info> {
    #[account(
        init, 
        payer = authority,
        space = 8 + 1 + 32
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

这段代码有点复杂。我们先看 `#[account(...)]` 这一段，这里给 `account()` 函数传递了 3 个参数进去，`account()` 函数的参数类型是 Anchor 框架定义的，第一个参数 `init` 是一个固定的关键字，不需要值，表示如果账户不存在，则创建一个新的账户。第二个参数 `payer` 是需要值的，表示谁来支付创建账户的手续费。第三个参数 `space` 的值则是我们自己计算的，系统必须预留 8 + `Mint` 结构体的第一个字段类型 `u8` 需要空间 1 + `Mint` 结构体的第二个字段类型 `Pubkey` 需要空间 32。

这个 `#[account(...)]` 的宏用来修饰 `mint` 成员变量。我们接着看 `mint` 这个成员变量，`Account` 是 Anchor 框架提供的内置的账户类型，可以对储存数据结构进行读写，例如我们之前定义的 `Mint` 或者 `TokenAccount` 结构，这个 `mint` 成员变量实际操作这些类型的数据。而 `Account` 接受两个泛型参数，第二个参数 `Mint` 指明了这个账户是在处理 `Mint` 类型的结构，而不是 `TokenAccount` 或者其他。

接着看 `#[account(mut)]` 这个宏，mut 的意思是账户金额可以变化。`authority` 也是一个成员变量，它的类型同样是一个 Anchor 内置的账户类型 `Signer`，与 `Account` 不同的是，`Signer` 意味着需要传入账户持有者本人签名，才符合类型定义。后面的 `‘info` 则是一个泛型参数，其中 `info` 是结构体的泛型传递进来的。至于 `info` 前面的单引号 `'`，是 Rust 语言里的一个特性，可以简单理解为对参数的引用传递。整体来看，这两行代码的宏和语句，共同定义了一个可以对其扣费的账户地址作为成员变量。

最后的 `system_program` 成员变量，可以把这一行理解为固定写法，只要合约需要转账 SOL，就得写上这一行。总的来说，这几行代码定义了一个新的结构体 `InitMint`，这个结构体是基于 `Mint` 进行包装的，包装后的 `InitMint` 拥有了一些账户相关的属性。

### 6. 代币合约初始化

接下来开始关注 `#[program]` 宏定义的函数。这个宏用来标注智能合约的程序入口，也就是真正执行合约逻辑的部分。我们当前文件里有几行默认的代码：

```Rust
#[program]
pub mod usdt_clone {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {   // 删除
        msg!("Greetings from: {:?}", ctx.program_id);             // 删除
        Ok(())                                                    // 删除
    }                                                             // 删除
}
```

删掉这个项目自动生成的 `initialize` 函数，我们自己写一个函数：

```Rust
pub fn init_mint(ctx: Context<InitMint>, decimals: u8) -> Result<()> {
    let mint = &mut ctx.accounts.mint;
    mint.decimals = decimals;
    mint.mint_authority = ctx.accounts.authority.key();
    Ok(())
}
```

把这个 `init_mint` 函数放在原先 `initialize` 函数的位置。如果抛开 Anchor 的宏，这个函数则是一个普通的 Rust 语法定义的函数。`Context` 类型是 Anchor 提供的包装类型 所以你也许好奇我们明明没有定义 `Context`，但是这里却直接使用了。`InitMint` 类型是则我们上一个步骤定义好的。

这个函数接受两个参数，第一个参数的类型是 `InitMint`，表示哪个账户拥有铸币权限。第二个参数类型是 `u8`，表示 USDT 的精度是多少位。这个函数返回一个空的元组 `()`，说明如果成功什么都不返回，如果失败则会报错。

函数内部的逻辑相对好理解，函数把参数接收进来的数据，赋值给了一个叫 `mint` 的变量，要注意这不是普通的新定义的变量，而是从 `ctx.accounts` 反序列化过来的、`mut` 声明的可变类型的变量，相当于直接修改一个引用类型的结构体内的属性值，所以只要给 `mint` 赋值，结构体内的数据都会保存下来，也就是保存到链上。

### 7. 单元测试

可以先到目录下，运行一下编译，看程序是否写对了，如果编译报错，可能是哪里复制漏了。由于 Rust 语言的编译器非常严格，所以即使没有错误，也会有很多 warning，暂时不用管那些警告信息：

```bash
anchor build  
```

接下来到 `usdt_clone/tests/usdt_clone.ts` 文件，复制这些代码进去：

```Rust
import anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";

const { AnchorProvider, BN } = anchor;

describe("usdt_clone / init_mint", () => {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.UsdtClone as Program;

  const mintKey = Keypair.generate();

  it("creates a Mint with correct metadata", async () => {
    const txSig = await program.methods
      .initMint(new BN(6))
      .accounts({
        mint: mintKey.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([mintKey])
      .rpc();

    console.log("tx:", txSig);

    const mintAccount = await program.account.mint.fetch(mintKey.publicKey);

    assert.equal(mintAccount.decimals, 6);
    assert.equal(
      mintAccount.mintAuthority.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
  });
});
```

这段代码使用本地的单元测试框架，构造了一些参数去调用我们在合约里写的 `initMint` 方法，比如指定精度为 6 位，传递了 `InitMint` 结构体需要的 3 个参数等。模拟交易的执行结果赋值给了 `txSig` 变量，可以在输出日志中看到交易哈希。并且在交易结束后，用语句 `program.account.mint.fetch` 查询了合约的 `mint` 属性的值，它的精度应该等于我们的参数，authority 也应该是我们本地发起模拟交易的账户地址。

运行这个命令来查看单元测试的效果：

```bash
anchor test
```

如果一切顺利，会看到 `1 passing (460ms)` 的字样。

### 8. 开户和转账

基于上面我们已经看懂的语法规则，可以继续在合约代码中新增这样两个账户结构的定义，分别用来开户和转账。这里的 `#[error_code]` 是新出现的宏，比较容易理解，它是一个枚举类型，用于程序报错的时候调用：

```
#[derive(Accounts)]
pub struct InitTokenAccount<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 8)]
    pub token: Account<'info, TokenAccount>,
    #[account(mut, signer)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut, has_one = owner)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    #[account(signer)]
    pub owner: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    InsufficientFunds,
    ArithmeticOverflow,
}
```

然后新增两个方法，分别执行开户的逻辑以及转账的逻辑。注意这里开户的时候，`token.balance = 1000` 意味着每一个开户的地址，默认都会有 1000 的余额。这里主要是为了简化流程和代码、方便单元测试，这个数字可以随意改动：

```Rust
pub fn init_token_account(ctx: Context<InitTokenAccount>) -> Result<()> {
  let token = &mut ctx.accounts.token;
  token.owner = ctx.accounts.owner.key();
  token.balance = 1000;
  Ok(())
}

pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
  let from = &mut ctx.accounts.from;
  let to   = &mut ctx.accounts.to;

  require!(from.balance >= amount, ErrorCode::InsufficientFunds);

  from.balance -= amount;
  to.balance = to
      .balance
      .checked_add(amount)
      .ok_or(ErrorCode::ArithmeticOverflow)?;

  Ok(())
}
```

这是针对开户和转账功能的单元测试代码：

```Rust
const tokenA = Keypair.generate();
const tokenB = Keypair.generate();

it("initializes tokenA & tokenB, each with balance 1000", async () => {
  for (const tok of [tokenA, tokenB]) {
    await program.methods
      .initTokenAccount()
      .accounts({
        token: tok.publicKey,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([tok])
      .rpc();

    const acc = await program.account.tokenAccount.fetch(tok.publicKey);
    assert.equal(
      acc.owner.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
    assert.equal(acc.balance.toNumber(), 1000);
  }
});

it("transfers 250 from A to B (balances 750 / 1250)", async () => {
  await program.methods
    .transfer(new BN(250))
    .accounts({
      from:  tokenA.publicKey,
      to:    tokenB.publicKey,
      owner: provider.wallet.publicKey,
    })
    .rpc();

  const a = await program.account.tokenAccount.fetch(tokenA.publicKey);
  const b = await program.account.tokenAccount.fetch(tokenB.publicKey);

  assert.equal(a.balance.toNumber(), 750);
  assert.equal(b.balance.toNumber(), 1250);
});
```

如果有兴趣，可以试着把这个合约也部署到 devnet 上，然后通过 SDK 来发起对链上合约的调用。

