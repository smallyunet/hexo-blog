---
title: "continuation 教程: 用 yield 实现协程调度"
date: 2025-07-23 12:13:12
draft_date: 2025-07-19 20:53:41
tags:
- continuation
- 教程
series: continuation 系列教程
---

> 这是一个 continuation 系列教程：
> 1. [continuation 教程：理解 CPS](/2025/07/23/continuation教程1/)
> 2. [continuation 教程：用 yield 实现协程调度](/2025/07/23/continuation教程2/)
> 3. [continuation 教程：用 call/cc 实现协程调度](/2025/07/23/continuation教程3/)
> 4. [continuation 教程：用 shift/reset 实现协程调度](/2025/07/23/continuation教程4/)
> 5. [continuation 教程：体验 Racket 语言](/2025/07/23/continuation教程5/)
> 6. [continuation 教程：实现抢占式协程调度](/2025/07/23/continuation教程6/)

### 任务队列

先来定义一个任务队列：

```js
let ready = [];
```

然后定义一个执行函数：

```js
function run()
{
  while (ready.length > 0)
  {
    const k = ready.shift()
    k();
  }
}
```

从定义可以看出，任务队列中的元素都是函数，然后在运行函数 `run` 中，会依次执行队列中的函数。可以这样来使用我们的任务队列：

```js
ready.push( () => console.log(1) );
ready.push( () => console.log(2) );
ready.push( () => console.log(3) );
run();

// 1
// 2
// 3
```

### 顺序执行

现在我们有这样两个 `task` 函数，把他们添加到任务队列后，会按照顺序执行并打印出结果，这很好理解，符合我们的直觉：

```js
function taskA()
{
  console.log("task A0");
  console.log("task A1");
}

function taskB()
{
  console.log("task B0");
  console.log("task B1");
}

ready.push(taskA);
ready.push(taskB);
run();

// task A0
// task A1
// task B0
// task B1
```

现在的打印顺序是 `A0 -> A1 -> B0 -> B1`，有没有什么办法，可以改变打印顺序，变为 `A0 -> B0 -> A1 -> B1` 呢？这里的每一个打印语句都是一个 task，而我们关心的是 task 的执行顺序。

### yield

`yield` 关键字的含义是，保存当前的执行环境，把当前任务放到队列最后面，然后去运行其他的任务。就像是在排队，yield 是一个非常讲礼貌的人，当轮到自己的时候，会自己跑去队伍最后面，继续排队。

很多语言都提供了 `yield` 关键字，我们现在要做的，是在不使用 `yield` 关键字的情况下，实现 `yield` 的语义。可以这样定义 `yieldCPS` 函数，这个函数干的事情，就相当于 `yield` 关键字：

```js
function yieldCPS(k)
{
  ready.push(k);              // 把当前步骤的执行环境存起来
  const next = ready.shift(); // 去执行队列头部的其他任务
  next();
}

yieldCPS( () => console.log("yield cps") );
run();  // yield cps
```

`yieldCPS` 接受一个函数作为参数，如果我们想在 `taskA` 里使用 `yield` 语义来影响 `A0` 和 `A1` 的执行顺序，可以这样写：

```js
function taskAYield(yieldFn)
{
  console.log("task yield A0");
  yieldFn( () => console.log("task yield A1") );
}

ready.push( () => taskAYield(yieldCPS) );
run();

// task yield A0
// task yield A1
```

但是你发现了，打印出来的顺序没有变，因为确实不应该变，`A1` 之后没有其他任务了，排队的时候，`yield` 定义的任务已经没有谦让的余地。

在 `taskB` 里也用上 `yield` 试试：

```js
function taskBYield(yieldFn)
{
  console.log("task yield B0");
  yieldFn( () => console.log("task yield B1") );
}
```

这个时候再把 `taskA` 和 `taskB` 放进任务队列，打印结果的顺序就有变化了：

```js
ready.push( () => taskAYield(yieldCPS) );
ready.push( () => taskBYield(yieldCPS) );
run();

// task yield A0
// task yield B0
// task yield A1
// task yield B1
```

可以看到 `yield` 关键字指定的任务，都跑到了任务队列后面才依次执行。也就是说，`yield` 关键字中断了 `taskA` 的执行过程，`taskA` 执行到一半的时候打印出了 `A0`，然后 `A1` 的任务被保存起来、放到队列最后面了。

但是这样的解释似乎不够，为什么下面的代码，`yield` 关键字指定了 `C1`，`C1` 的打印顺序缺没有被放到最后呢？

```js
function taskCYield(yieldFn)
{
  console.log("task yield C0");
  yieldFn( () => console.log("task yield C1") );
  console.log("task yield C2");
}

ready.push( () => taskCYield(yieldCPS) );
run(); 

// task yield C0
// task yield C1
// task yield C2
```

因为更具体来说，`yield` 的含义是，当一个协程运行的时候，立刻交出控制权，让调度器来决定下一个要执行的任务，可能是自己，也可能是别人，关键在于，“交出控制权”。我们定义的两个任务 `taskA` 和 `taskB`，就相当于两个协程，`run` 函数就是任务的调度器。

### spawn

`spawn` 关键字的含义，是把 `yieldCPS` 函数也就是 `yield` 关键字的等价实现，作为参数，传递给一个函数，并且把这个函数添加到任务队列。实际上 `spawn` 就是一个简单的函数封装，一看就明白了：

```js
function spawn(thunk)
{
  ready.push( () => thunk(yieldCPS) );
}
```

这个函数这样来调用：

```js
spawn(taskAYield);
spawn(taskBYield);
run();

// task yield A0
// task yield B0
// task yield A1
// task yield B1
```

### sleep

`sleep` 关键字的含义是，在协程执行的过程中，等待几秒钟，然后继续执行后续的任务。可以这样实现：

```js
function sleep(ms, yieldFn, k)
{
  setTimeout(
    () => 
      {
        ready.push(k);
        run();
      }, 
    ms);
  return yieldFn(() => {});
}

function taskDYield(yieldFn)
{
  console.log("task yield D0");
  return sleep(5000, yieldFn, () => console.log("task yield D1") );
}

spawn(taskDYield);
run();

// task yield D0
// task yield D1
```

`spawn` 关键字让协程进场，`yield` 关键字允许协程主动让出，`sleep` 关键字允许协程挂起一段时间后继续。有了这 3 关键字，协作式调度的骨架就已经搭起来了。

### CPS

你有没有疑问，这里的 `yieldCPS` 名字中有 CPS，但是跟 CPS 有什么关系？`yieldCPS` 这个函数只不过是做了一些对数组的操作。我以为 CPS 是得用在递归里面，还得用上 `r => k(r)` 之类的写法，才算 CPS。

事实上 CPS 只是一种风格，关键在于用参数 `k` 来表示函数执行之后的下一步操作，这个 `k` 必然是一个函数。只要是这种把函数作为参数传递，而且执行动作中只使用对 `k` 的调用，就是 CPS。比如这是一个最简的 CPS 的示例：

```js
function add(a, b, k)
{
  k(a+b);
}

add(1, 2, x => console.log(x) )
// 3
```

这个叫局部 CPS，全局 CPS 则是需要全部函数调用的参数都用 `k` 来传递像这样：

```js
function add(a, b, k)
{
  k(a+b);
}

function main(k)
{
  add(1, 2, k);
}

main(x => console.log(x) )
// 3
```

体验过 `yieldCPS` 等关键字后，对 CPS 的理解会更进一步。

### 用 yield 实现协程调度

这是用 `yield` 关键字实现协程调度的完整代码：

```js
let ready = [];

function run()
{
  while (ready.length > 0)
  {
    const k = ready.shift()
    k();
  }
}

function yieldCPS(k)
{
  ready.push(k);
  const next = ready.shift();
  next();
}

function taskA(yieldFn)
{
  console.log("task yield A0");
  yieldFn( () => console.log("task yield A1") );
}

function taskB(yieldFn)
{
  console.log("task yield B0");
  yieldFn( () => console.log("task yield B1") );
}

function spawn(thunk)
{
  ready.push( () => thunk(yieldCPS) );
}

spawn(taskA);
spawn(taskB);
run();

// task yield A0
// task yield B0
// task yield A1
// task yield B1
```
