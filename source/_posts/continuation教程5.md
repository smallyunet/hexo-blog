---
title: continuation 教程：体验 Racket 语言
date: 2025-08-05 12:12:12
tags:
- continuation
- racket
---

> 这是一个 continuation 系列教程：
> 1. [continuation 教程：理解 CPS](/2025/08/01/continuation教程1/)
> 2. [continuation 教程：用 yield 实现协程调度](/2025/08/02/continuation教程2/)
> 3. [continuation 教程：用 call/cc 实现协程调度](/2025/08/03/continuation教程3/)
> 4. [continuation 教程：用 shift/reset 实现协程调度](/2025/08/04/continuation教程4/)
> 5. [continuation 教程：体验 Racket 语言](/2025/08/05/continuation教程5/)
> 6. [continuation 教程：实现抢占式协程](/2025/08/06/continuation教程6/)

我们在之前的教程中，使用 JavaScript 语言实现了 CPS、yield、call/cc、shift/reset 等语义，但是由于语言的限制，实现效果比较简陋。我们接下来使用 Racket 语言，来体验一下这些关键字的能力。

### 安装

访问 Racket 官方的安装包下载页面：<https://download.racket-lang.org/>

下载安装即可，安装完成后会看到多出一个编辑器 DrRacket，这是 Racket 语言的 IDE 工具，打开使用就行。输入这两行代码，然后点击右上角的 `Run` 按钮，可以看到编辑器下方会输出 `1` 的字样，说明一切正常：

```rkt
#lang racket

(displayln 1)
```

注意第一行开头的 `#lang racket` 很重要，用来标识当前代码文件的语言类型，并且会自动导入一些系统关键系，比如这里用到的 `displayln` 就来自第一行的导入语句。把鼠标光标放到 `displayln`，编辑器也会提示你这个关键字来自哪里。

下面的代码会默认省去 `#lang racket` 这一行。

### CPS

这是普通格式的 `add` 函数定义：

```rkt
(define (add a b)
  (+ a b))

(displayln (add 1 2))
```

这是 CPS 形式的 `add` 函数定义：

```rkt
(define (add-cps a b k)
  (k (+ a b)))

(add-cps 1 2 (lambda (x) (displayln x)))
```

### call/cc

体验一下 call/cc 关键字怎么用：

```rkt
(displayln
 (call/cc
  (lambda (k)
    (displayln 1)
    (k 2)
    (displayln 3)
    )))

; 1
; 2
```

这段代码会在遇到 `k` 调用的时候退出，也就只打印 1 和 2，不打印 3。

### shift/reset

体验一下 shift/reset 关键字怎么用：

```rkt
(require racket/control)

(displayln
 (reset
  (displayln 1)
  (shift k
         (displayln 2)
         (k 3)
         (displayln 4)
         )
  (displayln 5)
  ))

; 1
; 2
; 5
; 4
; #<void>
```

`shift` 的函数体内，遇到 `k` 的调用时，会放弃当前流程的控制权，让外层的 5 先打印出来，然后再回到 `k` 的位置，继续打印后面的 4。

### 练习

如果有兴趣，可以试着在 Racket 里，用 CPS 风格的函数实现 yield 关键字的语义，再写个 yield 版本的两个任务交替打印，再然后，分别用 call/cc 和 shift/reset 实现一次两个任务交替打印的程序。

虽然语言不同，但是实现原理，尤其是关键字的语义是相同的。用 Racket 来体验关键字的用法，也主要是为了确保语言级别的关键字，和我们自己用 JavaScript 实现的关键字，含义是一样的。

我们在过去几篇教程中，真正学到的并不是编程语言的写法，而是通过自己实现的方式，理解了各种 continuation 语义。

