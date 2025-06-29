---
title: Rust 语言容易让新手困惑的一个“过度优化”
tags:
  - Rust
  - 编程语言
date: 2025-06-30 02:05:25
draft_date: 2025-06-30 01:02:10
---


假如我们现在要写一些代码，随便用 `cargo new` 一个项目就行，然后写一个函数 `append`，函数的功能很好理解，就是把两个传入的字符串给拼接起来，第一个参数是字符串（的引用类型），第二个参数也是字符串，假如我们的参数是 `Hello` 和 `, world`，函数调用后会返回 `Hello, world` 给我们。函数具体这样写：

```rust
fn append(s1: &String, s2: &String) -> String {
    return s1.clone() + s2.clone().as_str();
}
```

不需要关心 `return` 后面的语句写法，这不是我们关注的重点。在入口函数 `main` 里调用这个 `append`，运行一下，输出的内容会和我们预期一样，打印出拼接后的字符串 `Hello, world`：

```rust
fn main() {
    let s1: String = String::from("Hello");
    let s2: String = String::from(", world");
    println!("{}", append(&s1, &s2));
}
```

那么现在，保持 `append` 函数完全不变，在 `main` 函数里修改两个字符串的定义，整个 `main` 函数变成这样，猜一下输出结果会是什么？注意 Rust 是静态类型的语言，编译器对于变量类型往往具有严格的定义和判断：

```rust
fn main() {
    let s1: Box<String> = Box::new(String::from("Hello"));
    let s2: Box<String> = Box::new(String::from(", world"));
    println!("{}", append(&s1, &s2));
}
```

我们首先的直觉是应该编译报错，因为 `s1` 的类型是 `Box<String>`，调用 `append` 函数的时候，传入的参数为 `&s1`，对应的类型为 `&Box<String>`，而显然 `append` 函数的定义是没有修改的，接收的参数类型仍然是 `&String`。那么这种情况下，为什么编译器没有报错，而且代码还能正常运行，输出了 `Hello, world` 的结果？(先别管这里的 `Box` 是什么，反正是一种类型)

我们接着再修改一下 `main` 函数的内容，把字符串的定义改为这样：

```rust
fn main() {
    use std::rc::Rc;

    let s1: Rc<String> = Rc::new(String::from("Hello"));
    let s2: Rc<String> = Rc::new(String::from(", world"));
    println!("{}", append(&s1, &s2));
}
```

代码能通过编译吗？能正常运行吗？`append` 函数的定义仍然没有变，这里 `main` 函数中 `s1` 的类型变成了 `Rc<String>`，相应的传入 `append` 函数做参数的时候，类型变为了 `&Rc<String>`。但是为什么，编译器没有报错，而且还能正常运行出结果，输出 `Hello, world`？（同样别管 `Rc` 是什么，也是一种类型）

根据刚才的代码片段，我们观察到一个现象：当函数的参数类型是 `&String` 的时候，既可以接受 `&String` 类型的参数，也可以接收 `&Box<String>` 类型的参数，还可以接收 `&Rc<String>` 类型的参数。

再疯狂一点，如果把 `main` 函数改成这样呢？

```rust
fn main() {
    let s1: Box<Box<Box<Box<String>>>> = Box::new(Box::new(Box::new(Box::new(String::from("Hello")))));
    let s2: Box<Box<Box<Box<String>>>> = Box::new(Box::new(Box::new(Box::new(String::from(", world")))));
    println!("{}", append(&s1, &s2));
}
```

如果把 `main` 函数改成这样呢？

```rust
fn main() {
    use std::rc::Rc;
    
    let s1: Rc<Rc<Rc<Rc<String>>>> = Rc::new(Rc::new(Rc::new(Rc::new(String::from("hello")))));
    let s2: Rc<Rc<Rc<Rc<String>>>> = Rc::new(Rc::new(Rc::new(Rc::new(String::from(", world")))));
    println!("{}", append(&s1, &s2));
}
```

结果是 `main` 函数都可以正常运行，输出 `Hello, world` 的结果。

为了进一步观察关于类型的问题，现在新写两个 append 函数，`append2` 函数接收的类型是 `&Box<String>`，而 `append3` 函数接收的类型是 `&Rc<String>`：

```rust
fn append2(s1: &Box<String>, s2: &Box<String>) -> Box<String> {
    let mut result = (**s1).clone();
    result.push_str(s2);
    Box::new(result)
}

use std::rc::Rc;
fn append3(s1: &Rc<String>, s2: &Rc<String>) -> Rc<String> {
    let mut result = (**s1).clone();
    result.push_str(s2);
    Rc::new(result)
}
```

接下来分析一下，对于下面的 `main` 函数代码，编译器会在哪一行报错？

```rust
fn main() {
    let s1: Box<Box<Rc<Rc<String>>>> = Box::new(Box::new(Rc::new(Rc::new(String::from("hello")))));
    let s2: Box<Box<Rc<Rc<String>>>> = Box::new(Box::new(Rc::new(Rc::new(String::from(", world")))));
    println!("{}", append(&s1, &s2));
    println!("{}", append2(&s1, &s2));
    println!("{}", append3(&s1, &s2));
}
```

这样呢，字符串的类型再扩展一下，编译器还会报错吗，在哪一行？

```rust
fn main() {
    let s1: Box<Box<Rc<Rc<Box<Box<String>>>>>> = Box::new(Box::new(Rc::new(Rc::new(Box::new(Box::new(String::from("hello")))))));
    let s2: Box<Box<Rc<Rc<Box<Box<String>>>>>> = Box::new(Box::new(Rc::new(Rc::new(Box::new(Box::new(String::from(", world")))))));
    println!("{}", append(&s1, &s2));
    println!("{}", append2(&s1, &s2));
    println!("{}", append3(&s1, &s2));
}
```

Rust 把这种语言特性叫做人体工学设计，为了减轻开发人员的负担。但是 Rust 在设计动不动会把变量给 move 掉、不得不使用 `'` 单引号写法的时候，却放弃了人体工学，把内存安全放在了更重要的地位……倒是也没什么错，毕竟 Rust 只有内存安全是绝不能放松的。

