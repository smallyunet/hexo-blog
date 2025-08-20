---
title: Go 语言 GMP 调度器的原理是什么
date: 2025-08-18 21:50:50
draft_date: 2025-08-18 19:25:50
tags: 
- Go
- 编程语言
---

声明：我看不起 “Go 语言 GMP 调度器的原理是什么” 这种技术话题。

我平时没兴趣研究这种问题。因为在面试中被问到的频率太高了，现在想花 2 个小时的时间来了解下。一方面研究下这个问题背后到底有多大的技术含量，另一方面把这个问题的答案写下来。但是我不会让这种内容停留在我的头脑里，所以下次面试被问到，我肯定还说不会 😏

### 基本概念

GMP 是一个缩写：

- G（goruntine）：就是协程，代码里每 `go` 一个，G 的数量就多一个
- M（Machine）：就是系统级别的线程，在其他语言里的 thread
- P（Processor）：数量为 `GOMAXPROCS`，通常默认是 CPU 核心数。

GMP 的意思是，启动多少个 M（线程） 来执行 G（协程），最多允许 P（核心数）个 M 并行执行。

### 三个不变量

无聊的（简化后的）定义来了：

1. 只有拿到 P 的 M 才能执行任务
2. 可运行的 G 只会在某个 P 的本地 runq 或者全局队列
3. 当 M 进入阻塞状态（syscall/cgo）时，会及时把 P 让出

这几句话看着很费劲，不需要现在理解，接下来会用一些代码例子来说明他们的含义。

### GMP 的调试日志

这是一个最简单的代码文件，用来演示启动一个协程：

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		fmt.Println("Hello from goroutine")
	}()
	wg.Wait()
}
```

然后带上调试参数运行一下：

```bash
go build demo0.go
GODEBUG='schedtrace=200,scheddetail=1' ./demo0
```

注意不要用 `go run`，因为会引入一些 Go 语言运行时的日志。这个二进制版本的日志比较干净，内容是：

```bash
SCHED 0ms: gomaxprocs=10 idleprocs=7 threads=5 spinningthreads=1 needspinning=0 idlethreads=0 runqueue=0 gcwaiting=false nmidlelocked=1 stopwait=0 sysmonwait=false
  P0: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P1: status=1 schedtick=0 syscalltick=0 m=2 runqsize=0 gfreecnt=0 timerslen=0
  P2: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P3: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P4: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P5: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P6: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P7: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P8: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  P9: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
  M3: p=0 curg=nil mallocing=0 throwing=0 preemptoff= locks=1 dying=0 spinning=true blocked=false lockedg=nil
  M2: p=1 curg=nil mallocing=0 throwing=0 preemptoff= locks=6 dying=0 spinning=false blocked=false lockedg=nil
  M1: p=nil curg=nil mallocing=0 throwing=0 preemptoff= locks=2 dying=0 spinning=false blocked=false lockedg=nil
  M0: p=nil curg=nil mallocing=0 throwing=0 preemptoff= locks=0 dying=0 spinning=false blocked=true lockedg=1
  G1: status=1() m=nil lockedm=0
  G2: status=4(force gc (idle)) m=nil lockedm=nil
Hello from goroutine
```

这些日志显示了这些信息：

- 第一行 `SCHED` 开头的是汇总信息，告诉我们程序启动了 10 个 P（gomaxprocs=10）。
- 只有 `P1` 被 `M2` 拿着运行
- `P0` 被 `M3` 拿着处于 `spinning` 状态，也就是等待任务的状态。

没看到 print 相关的 G，是因为任务运行时间太短了，没被 trace 捕获就结束了，这里主要展示 GMP 的详细信息可以用 debug 命令来看。

### 抢占式调度

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func busy(tag string, d time.Duration) {
	end := time.Now().Add(d)
	x := 0
	for time.Now().Before(end) {
		x++
	}
	fmt.Println(tag, "done", x)
}

func main() {
	runtime.GOMAXPROCS(1)
	go busy("A", 1500*time.Millisecond)
	busy("B", 1500*time.Millisecond)
}
```

这个代码的运行结果是，有时候 `A` 在 `B` 前面，有时候 `B` 在 `A` 前面。

我们已经用 `runtime.GOMAXPROCS(1)` 设定只有一个 P，但是 Go 语言的 GMP 调度器，仍然会 10ms 释放一次时间片，也就意味着，即使 `go busy("A")` 处于阻塞状态，时间片之后也会让出执行权，交给主线程去运行 `B`。

可以用这个 `busy` 的函数定义来让抢占式调度更加肉眼可见：

```go
func busy(tag string, d time.Duration) {
	end := time.Now().Add(d)
	next := time.Now()
	for time.Now().Before(end) {
		if time.Now().After(next) {
			fmt.Print(tag, " ") // 每 ~100ms 打印一次
			next = time.Now().Add(100 * time.Millisecond)
		}
	}
	fmt.Println(tag, "done")
}
```

程序的打印结果会是 `B A B A B A A B A B A B A B A B A B A B A B A B B A B A B A B done`。这意味着不是 tag 为 `A` 的 P 一路执行到底，也不是 tag 为 `B` 的 P 一路执行到底，他们在 GMP 调度器中交替执行。

### P 偷活干（work-stealing）

来看这个代码示例：

```go
package main

import (
	"runtime"
	"sync"
	"time"
)

func spin(d time.Duration) {
	deadline := time.Now().Add(d)
	for time.Now().Before(deadline) {
	} // 纯CPU忙等
}

func main() {
	runtime.GOMAXPROCS(1) // 先让所有 G 挤到同一个 P 的本地队列

	const N = 120
	var wg sync.WaitGroup
	wg.Add(N)
	for i := 0; i < N; i++ {
		go func() { defer wg.Done(); spin(500 * time.Millisecond) }()
	}

	time.Sleep(30 * time.Millisecond) // 给点时间把队列堆满到 P0

	runtime.GOMAXPROCS(4) // 突然放大并行度：P1~P3 会去“偷” P0 的一半
	wg.Wait()
}
```

这个代码干了什么呢，首先设定之后一个 P，然后启动 120 个 G 给这个 P 去执行。30 毫秒后，突然增大 P 的数量。

用 debug 日志能看到，运行后半段有这样的日志：

```bash
P0: status=1 schedtick=46 syscalltick=2 m=0 runqsize=17 gfreecnt=0 timerslen=0
P1: status=1 schedtick=58 syscalltick=0 m=4 runqsize=5 gfreecnt=15 timerslen=0
P2: status=1 schedtick=60 syscalltick=0 m=2 runqsize=5 gfreecnt=18 timerslen=0
P3: status=1 schedtick=42 syscalltick=0 m=3 runqsize=17 gfreecnt=0 timerslen=0
```

也就是说，本应该 G 全在 P0 上运行，等到 P1、P2、P3 出来后，它们发现 P0 很忙，就去 P0 的队列里拿了几个任务过来执行。

### P 的 runq 队列和全局队列

一个 P 想找活干的时候，上面的代码是偷其他 P 的示例。更严谨的流程是，P 先从本地 runq 队列找，再到全局队列找，找不到再去偷其他 P 的。

什么是 runq 队列，什么是全局队列？可以看这个代码：

```go
package main

import (
	"runtime"
	"sync"
	"time"
)

func spin(d time.Duration) {
	end := time.Now().Add(d)
	for time.Now().Before(end) {
	} // 纯CPU忙等：保持 runnable
}

func main() {
	runtime.GOMAXPROCS(1) // 只有 P0：所有新 G 先进入 P0 的本地 runq

	const N = 600 // 让它明显超过本地 runq 容量（当前实现通常是 256）
	var wg sync.WaitGroup
	wg.Add(N)
	for i := 0; i < N; i++ {
		go func() { defer wg.Done(); spin(800 * time.Millisecond) }()
	}

	time.Sleep(500 * time.Millisecond) // 给运行时时间把“溢出的一半”推到全局队列

	runtime.GOMAXPROCS(4) // 其它 P 进场，会先从“全局队列”拿活（不是偷）
	wg.Wait()
}
```

debug 状态运行：

```bash
go build demo4.go   
GODEBUG='schedtrace=200,scheddetail=1' ./demo4 &> demo4.log
```

日志会比较多，日志前面几行像这样：

```bash
SCHED 0ms: gomaxprocs=10 idleprocs=9 threads=2 spinningthreads=0 needspinning=0 idlethreads=0 runqueue=0 gcwaiting=false nmidlelocked=0 stopwait=0 sysmonwait=false
  P0: status=1 schedtick=0 syscalltick=0 m=0 runqsize=0 gfreecnt=0 timerslen=0
  P1: status=0 schedtick=0 syscalltick=0 m=nil runqsize=0 gfreecnt=0 timerslen=0
```

其中首行的 `runqueue=0` 就是全局队列，P0 后面的 `runqsize=0` 是 P0 的本地队列，P1 后面的 `runqsize=0` 是 P1 的本地队列。可以看到此时的 P1 状态是 0，也就是不可运行。

随着程序的运行，P0 会启动非常多个 G，日志状态是这样：

```bash
SCHED 200ms: gomaxprocs=1 idleprocs=0 threads=5 spinningthreads=0 needspinning=1 idlethreads=3 runqueue=395 gcwaiting=false nmidlelocked=0 stopwait=0 sysmonwait=false
  P0: status=1 schedtick=10 syscalltick=2 m=0 runqsize=204 gfreecnt=0 timerslen=1
```

一般 P 的本地队列默认是上限是 256，达到这个峰值后，就会把任务溢出到全局队列。

再然后，P1、P2、P3 启动，开始从全局队列拿任务（全局队列有任务则不需要偷其他 P 的）：

```bash
SCHED 826ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 needspinning=1 idlethreads=0 runqueue=217 gcwaiting=false nmidlelocked=0 stopwait=0 sysmonwait=false
  P0: status=1 schedtick=35 syscalltick=2 m=0 runqsize=179 gfreecnt=0 timerslen=0
  P1: status=1 schedtick=14 syscalltick=0 m=3 runqsize=90 gfreecnt=0 timerslen=0
  P2: status=1 schedtick=14 syscalltick=0 m=4 runqsize=64 gfreecnt=0 timerslen=0
  P3: status=1 schedtick=13 syscalltick=0 m=2 runqsize=46 gfreecnt=0 timerslen=0
```

另外，当 P 依次从本地 runq、全局队列、其他 P 都找不到任务时，会再去问一下 netpoll（问一下 OS）有没有新的 G，要是有就执行，没有就自旋（待命）。这就是 P 执行任务的逻辑。

### 阻塞 syscall 会及时让出

看这个代码例子：

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	runtime.GOMAXPROCS(2)

	go func() {
		time.Sleep(2 * time.Second) // 类比阻塞 syscall/cgo
		fmt.Println("blocking done")
	}()

	go func() {
		for i := 0; i < 6; i++ {
			time.Sleep(300 * time.Millisecond)
			fmt.Println("still running", i)
		}
	}()

	time.Sleep(3 * time.Second)
}
```

运行结果会是：

```bash
still running 0
still running 1
still running 2
still running 3
still running 4
still running 5
blocking done
```

这个代码示例的含义是，第一个 G 明明会阻塞任务队列，一直占着 P 执行，但实际上第二个 G 仍然在运行。

说明 GMP 调度器不会因为某个 G 的阻塞，影响到其他 G 的执行。（其实这是协程调度器很基本的要求）

### 关闭异步抢占

对于这个代码示例：

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func spin() {
	for { /* 紧密循环 */
	}
}

func main() {
	runtime.GOMAXPROCS(1)
	go spin()
	time.Sleep(100 * time.Millisecond)
	fmt.Println("I should still print unless preemption is off")
}
```

可以分别用两个命令来运行，一个是

```bash
go build demo7.go
GODEBUG='schedtrace=1000,scheddetail=1' ./demo7
```

另一种是：

```bash
go build demo7.go
GODEBUG='schedtrace=1000,scheddetail=1,asyncpreemptoff=1' ./demo7
```

用 `asyncpreemptoff=1` 可以关闭异步抢占。也就是说，如果没有关闭，没有带这个参数，程序会正常运行，打印出：

```bash
I should still print unless preemption is off
```

如果关闭了异步抢占，则程序会被死循环卡住。这个例子主要可以体现 GMP 主动让出 CPU 的特点，当关闭了主动让出的能力后，GMP 就会被阻塞住了。

### Go 语言源码

我没有深入看源码，比如 G、M、P 的常量定义在 [`src/runtime/runtime2.go`](https://github.com/golang/go/blob/master/src/runtime/runtime2.go#L18) 文件：

<img src="1.png" width="60%">

再比如 [`src/runtime/proc.go`](https://github.com/golang/go/blob/master/src/runtime/proc.go) 文件中的 `runqputslow` 函数，功能就是判断本地队列有没有满，如果满了就放到全局队列：

<img src="2.png" width="60%">

### 进一步深入

这篇文章肯定有不全面和不到位的地方，我不想进一步深入了，也许有人喜欢折腾这些吧。

Go 语言的 GMP，就是协程调度器的一种具体的工程化的实现，估计很多人在意的，是这种工程化实现背后的细节，比如怎么用栈结构来管理任务队列、怎么实现抢占、让出逻辑等。协程调度器的具体实现方式可以有各种各样的变化，但它们的基本原理都是 continuation。只是 Go 语言把协程作为卖点了。只要其他语言愿意，也是可以开发出自己版本的协程调度器的。

那么问题来了，那些喜欢研究 GMP 原理的人，你们有没有了解过其他语言的协程（coroutine）、虚拟线程、异步函数、Process 是怎么实现的，它们都是比线程更轻量的类似于协程的东西，和 Go 语言的 gorountine 有什么区别？横向对比一下？

如果什么时候，我的工作需要，只有我了解这些内容，才能把工作做好，那么我肯定去把这些东西搞明白。

### 疑问

我之前写过一个观点：

Go 语言 “千辛万苦” 做出了自动的垃圾回收，减轻程序员对于内存管理的头脑负担。而有些面试官 “千辛万苦” 去搞明白 Go 语言 GC 的原理是什么，怎么标记怎么释放之类，不但引以为豪，而且拿来考察候选人。作为 Go 语言的教徒，你知不知道你的行为在否定 Go 语言设计者的努力？如果真的相信用头脑来管理内存的力量，为什么不去搞 Rust？好比我是一个汽车驾驶员，我要去考驾照，难道需要我搞清楚发动机的工作原理、是怎么把汽油燃烧转变为机械动力的、能量转化公式是什么？我又不是在制造汽车，也不是在开发编程语言。

同样的道理：

Go 语言为了让广大程序员能便捷简单地、用上轻量级的协程，“千辛万苦” 搞出来一个 `go` 关键字，然而有些人却费尽 “千辛万苦” 研究这个调度器是怎么实现的，懂原理则说明会 Go 语言，不懂则说明 Go 语言水平不行，这是什么道理？作为 Go 语言的教徒，你在否定 Go 语言设计者的努力，明白吗？如果这个语言需要你搞清楚协程调度的原理，才能写出好的代码，那就说明这个语言实现的不到位，偏离了设计者的初衷，没有达到设计者本来的意图。

如果你是编程语言的开发者，需要在另一种语言中借鉴、实现、优化 Go 语言的调度器，那么你就尽情研究吧，这样的工作确实需要懂 GMP 调度器的原理。如果不是那样的工作呢？


