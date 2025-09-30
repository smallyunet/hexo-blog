---
title: "continuation 教程: 用 call/cc 实现协程调度"
date: 2025-07-23 12:14:12
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

call/cc 的全称是 call-with-current-continuation，意思是执行对当前步骤的函数调用的时候，带着当前的执行环境（也就是 k 函数）进去。

### 基本形式

同样的，`callcc` 的实现仍然要使用 k 参数，并且把 k 参数放到最后一个参数的位置上。我们看一下基本的写法：

```js
function callcc(f, k)
{
  return f(k, k);
}
```

`callcc` 有两个参数，第一个参数一般称为 `escapeK`，也就是用于立刻退出当前执行流程的一个函数，第二个参数是 `nextK`，用于指明在执行流程没结束的情况下，下一个调用步骤是什么。`callcc` 函数像这样来调用：

```js
function test1(k)
{
  callcc(
    (escapeK, nextK) =>
    {
      escapeK(42);
      nextK(1);
    }, 
    k
  );
}

test1( x => console.log("test1=", x) );
// test1= 42
// test1= 1
```

`callcc` 函数里面的 `f(k, k)` 其实有点奇怪，可以结合这个例子 `test1` 理解下。因为 `test1` 里面的 `escapeK` 和 `nextK` 实际上都是参数 `k`，所以这里会依次打印出 `42` 和 `1`。

再来看一个例子，按照函数的语义，当发生了 `escapeK` 函数调用的时候，执行流程应该立即中断才对，像这样：

```js
function test2(k)
{
  callcc(
    (escapeK, nextK) =>
    {
      let sum = 0
      let arr = [1, 3, 5, 7];
      for (const n of arr)
      {
        if (n > 3)
        {
          return escapeK(sum);  // 1+3=4
        }
        else
        {
          sum += n;
        }
      }
      return nextK(sum);       // 1+3+5+7=16
    },
    k
  );
}

test2( x => console.log("test2=", x) ); 
// 4
```

`test2` 的内部是一个循环，当遇到值大于 3 的元素，会立即中断执行，返回此前元素的总和。这个示例代码的结果为 4，是符合我们预期的，也就是一旦遇到大于 3 的元素，就停止执行。否则，假如没有停止，最终程序会返回 16 才对。

那么到这里你也许看出点问题，程序的中断执行跟 `escapeK` 有什么关系？中断执行明明是 `return` 干的。就 `test2` 这个例子，把 `escapeK` 和 `nextK` 对调位置都不会有区别，因为从一开始 `callcc` 函数的定义上，这俩函数就是一样的，都是 `k`。既然是一样的函数，又怎么能体现出 `escapeK` 能够中断程序的特点呢？

### 中断执行

所以我们需要另外一个进阶版的 `callcc` 函数的定义，利用 `throw`，让 `escapeK` 函数真的达到中断执行的效果：

```js
function callcc(f, k)
{
  try
  {
    f(v => { throw v }, k);
  }
  catch (e)
  {
    k(e);
  }
}
```

这样来使用，就能看出效果：

```js
function test1(k)
{
  callcc(
    (escapeK, nextK) =>
    {
      escapeK(42);
      nextK(1);
    }, 
    k
  );
}

test1( x => console.log("test1=", x) );
// test1= 42
```

`callcc` 的函数体内，因为调用了 `escapeK`，所以不会再继续打印出后面的 1。`callcc` 里用了 `throw` 而不是 `return` 的原因在于，`throw` 可以再任意程序深度上，中断程序的执行。

再看一下 `test2` 函数的例子，也是同样的道理：

```js
function test2(k)
{
  callcc(
    (escapeK, nextK) =>
    {
      let sum = 0
      let arr = [1, 3, 5, 7];
      for (const n of arr)
      {
        if (n > 3)
        {
          escapeK(sum); // 1+3=4
        }
        else
        {
          sum += n;
        }
      }
      nextK(sum); // 1+3+5+7=16
    },
    k
  );
}

test2( x => console.log("test2=", x) ); // 4
```

因为 `escapeK` 的存在，程序会中断执行，这一次，如果把 `escapeK` 和 `nextK` 函数对调位置，就能看出明显差异了。

### 可重入

`callcc` 还有一个重要的特性是可重入，来逐步体验一下可重入是什么意思。定义一个 `entry` 函数：

```js
let savedK = null;

function entry(k)
{
  callcc(
    (escapeK, nextK) =>
    {
      savedK = escapeK;
      nextK(0);
    },
    k
  );
}

entry( x => console.log("entry=", x) ); 
// entry= 0
```

这里的重点在于，在函数外部，用了一个变量 `savedK` 来保存 `escapeK` 的值，在函数运行过程中，`escapeK` 的值实际上是在 `callcc` 函数里定义的，可以打印看一下：

```js
console.log(savedK.toString());
// v => v => { throw v }
```

来看这样一个例子，如何使用保存下来的 `savedK`：

```js
function run(f, k)
{
  try
  {
    f();
  }
  catch (e)
  {
    console.log(e);
  }
}

run( () => savedK("1") );  // 1
run( () => savedK("2") );  // 2
```

这里为什么要用 try...catch 捕获呢，因为 `savedK` 本身一定会发生 `throw`，所以要调用 `f`，就得捕获一下异常才能看到正常的返回值。

那么到这里，看到 `run` 函数的例子，其实也很奇怪，你会发现，不就是给 `savedK` 赋了个值，赋值的内容是一个函数吗，完全可以像下面这样写，还要 `callcc` 那么费劲干什么？

```js
let savedK_test = v => { throw v };
run( () => savedK_test("1") );  // 1
run( () => savedK_test("2") );  // 2
```

`callcc` 的含义是用闭包来保留执行现场，可以后续再对闭包进行调用，它其实就是个闭包。所以如果直接赋值为函数，就丢失了闭包的现场。我们上面的例子是把 `escapeK` 赋值给了外部的变量，所以不太容易看清楚效果。再看这个例子，可以体现出 `callcc` 可重入的特点：

```js
let savedK_foo = null;

function foo()
{
  let counter = 0;
  callcc(
    (e, k) =>
    {
      savedK_foo = k;
      return k();
    },
    () =>
    {
      counter++;
      console.log("counter=", counter);
    }
  )
}

foo();         // counter= 1
savedK_foo();  // counter= 2
savedK_foo();  // counter= 3
```

`savedK_foo` 是一个定义在 `foo` 函数外部的变量，当对 `foo()` 的调用结束，你会发现不但 `savedK_foo` 变量是有值的，而且每次这样 `savedK_foo()` 进行函数调用 ，`counter` 的值都会累加，`counter` 的值似乎不是临时的，从未丢失。这就是 `callcc` 可重入的含义，程序执行过程中的现场，是可以保留下来供下次使用的。

什么场景下会需要这种特性呢，比如协程调度的过程中，调度器得频繁切换要执行的任务，那么悬挂起来的任务，就非常需要保留执行现场，下次任务切换回来之后，接着上次的步骤运行。`callcc` 的中断和可重入这两个特性，就适合用来满足协程调度的场景。

### 用 callcc 实现协程调度

我们之前用 `yield` 实现协程调度的时候，需要显式地把 `yieldCPS` 这个函数作为参数，从 `spawn` 开始一路传递下去，也就是 `task` 函数必需接收 CPS 函数。有了 `callcc` 之后，可以省去对于 `task` 函数的参数。这是完整代码：

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

function callcc(f, k)
{
  try
  {
    return f(v => { throw v }, k);
  }
  catch (e)
  {
    return k(e);
  }
}

function yieldCC(k)
{
  callcc(
    (escapeK, nextK) => 
    {
      ready.push(nextK);
      let next = ready.shift();
      next();
    },
    k
  );
}

function spawn(thunk)
{
  ready.push(thunk);
}

function taskA()
{
  console.log("task call cc A0");
  yieldCC(() => console.log("task call cc A1") );
}

function taskB()
{
  console.log("task call cc B0");
  yieldCC(() => console.log("task call cc B1"));
}

spawn(taskA);
spawn(taskB);
run();

// task call cc A0
// task call cc B0
// task call cc A1
// task call cc B1
```

### 思考题

假如是这样的两个任务，还能按照预期的交替执行的顺序打印出 `A0 -> B0 -> A1 -> B1 -> A2 -> B2` 吗？应该如何实现？

```js
function taskA()
{
  console.log("task yield cc A0");
  yieldCC(() => console.log("task yield cc A1") );
  console.log("task yield cc A2");
}

function taskB()
{
  console.log("task yield cc B0");
  yieldCC(() => console.log("task yield cc B1"));
  console.log("task yield cc B2");
}
```



