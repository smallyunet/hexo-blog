---
title: "continuation 教程: 用 shift/reset 实现协程调度"
date: 2025-07-23 12:15:12
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

### call/cc

我们之前的 call/cc 属于 undelimited continuation 语义，没有边界的延续，一旦 escape 则后续的步骤都被炸掉，可以再看一下这个完整的代码示例：

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

function test1(k)
{
  callcc(
    (escapeK, nextK) =>
    {
      console.log("A");
      nextK("B");
      console.log("C");
      escapeK("D");
      console.log("E");
    }, 
    k
  );
}

test1( x => console.log(x) );
// A
// B
// C
// D
```

程序打印到 D，无论 `escapeK` 后面有多少语句，都不会再继续执行。


### shift/reset

shift/reset 是 delimited continuation 语义，意思是有边界的延续，下面直接给出完整的代码示例：

```js

const ready = [];

function run()
{
  while (ready.length > 0)
  {
    const k = ready.shift()
    k();
  }
}

function reset(thunk)
{
  try
  {
    thunk(x => x);
  }
  catch (f)
  {
    f( v => ready.push(v) );
  }
}

function shift(f)
{
  throw f;
}

reset(
  k =>
  {
    console.log("A");
    shift(
      k1 =>
      {
        console.log("B");
        k1( () => console.log("C"));
      }
    );
  }
);
console.log("D");
run();

// A
// B
// D
// C
```

这个程序的运行结果中，把 C 放到了最后面才运行，shift 就是剪切的意思，在 `shift` 函数内，如果遇到了 `k1` 调用，则立即交出控制权，去执行 `reset` 之后的步骤，外面的步骤执行结束后，再回头继续执行 `shift` 未完成的内容。因此示例代码的运行结果，C 在 D 之后打印。

### 用 shift/reset 实现协程调度

我们之前已经试过用 yield 和 call/cc 分别实现了简单的协程调度，这是使用 shift/reset 版本的完整代码：

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

function reset(thunk)
{
  try
  {
    thunk(x => x);
  }
  catch (f)
  {
    f( v => ready.push(v) );
  }
}

function shift(f)
{
  throw f;
}

function spawn(thunk)
{
  ready.push(thunk);
}

function taskA()
{
  reset(
    k =>
    {
      shift(
        k1 =>
        {
          console.log("task shift reset A0");
          k1( () => console.log("task shift reset A1"));
        }
      );
    }
  );
}

function taskB()
{
  reset(
    k =>
    {
      shift(
        k1 =>
        {
          console.log("task shift reset B0");
          k1( () => console.log("task shift reset B1"));
        }
      );
    }
  );
}

spawn(taskA);
spawn(taskB);
run();

// task shift reset A0
// task shift reset B0
// task shift reset A1
// task shift reset B1
```

