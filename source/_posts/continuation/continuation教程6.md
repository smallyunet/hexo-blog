---
title: "continuation教程: 实现抢占式协程调度"
date: 2025-07-23 12:17:12
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

你也许注意到了，我们前面用 yield 关键在来实现两个任务的交替打印，似乎和我们平时使用协程的感受不一样，比如 Go 语言的协程往往用来后台启动一个 Server 服务之类；跟我们平时使用 node.js 的感觉也不太一样。

我们用 yield 关键字，以及用 call/cc 或者 shift/reset 关键字代替 yield 实现控制流，这种显式管理流的模式属于协作式协程（cooperative）。

Go 语言一键启动后台协程、交给 runtime 管理控制流的模式，属于抢占式协程（preemptive）。

node.js 语言常见的异步调用、Promise 关键字之类，属于异步协程。

他们都属于协程，但是给用户的感受不一样，尤其是抢占式协程，在用户层面感知不到协程调度器的工作，但是抢占式协程的内部实现仍然要依赖于 continuation 概念。

### 构建 CPS

我们基于之前 shift/reset 版本的代码来进行实验和改进。首先这是用 shift/reset 模拟 yield 效果的完整代码，程序会交替执行两个任务：

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
          console.log("task A0");
          k1( () => console.log("task A1"));
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
          console.log("task B0");
          k1( () => console.log("task B1"));
        }
      );
    }
  );
}

spawn(taskA);
spawn(taskB);
run();

// task A0
// task B0
// task A1
// task B1
```

你肯定注意到 shift 内部是嵌套 CPS 的写法，现在只是打印了 A0 和 A1。那么假如我想新增加 100 个步骤进去，难道要手动写 100 个嵌套的 CPS 函数吗？

所以我们写一个工具函数来生成 CPS 函数。我们先看一下，假如在 `taskA` 里增加一个步骤 A2，应该怎么写：

```js
function taskA()
{
  reset(
    k =>
    {
      shift(
        k1 =>
        {
          console.log("task A0");
          k1( 
            () => 
            {
              console.log("task A1");
              k1( () => console.log("task A2"));
            }
          );
        }
      );
    }
  );
}
```

可以看到，关键在于 shift 函数中对 `k1` 的重复调用，那么我们写这样一个函数，这个函数返回嵌套指定多次 `k1` 调用的函数：

```js
function makeCPSTask(n)
{
  return function task()
  {
    reset(
      k =>
      {
        shift(
          k1 =>
          {
            console.log(`task 0/${n}`);
            function step(i)
            {
              if (i < n)
              {
                k1( 
                  () => 
                  {
                    console.log(`task ${i + 1}/${n}`);
                    step(i + 1);
                  }
                );
              }
            }
            step(0);
          }
        );
      }
    );
  }
}
```

这样能看看 `makeCPSTask` 函数返回的 CPS 函数是什么样子：

```js
console.log( makeCPSTask(3).toString() );
```

试一下用 `makeCPSTask` 函数来生成和执行任务，参数是一个数字，指任务包含多少个步骤：

```js
spawn(makeCPSTask(3));
run();

// task 0/3
// task 1/3
// task 2/3
// task 3/3
```

### 协作式协程

有了 `makeCPSTask` 函数后，我们定义一个长任务 `longTask`，意思是需要执行很多步骤，或者很长时间的任务，再定义一个短任务 `shortTask`，意思是只需要执行很少的步骤，或者很短的时间：

```js
let longTask = makeCPSTask(20);
let shortTask = makeCPSTask(2);
```

现在，把 `longTask` 和 `shortTask` 同时用协程启动，看看会发生什么：

```js
spawn(longTask);
spawn(shortTask);
run();

// task 0/20
// task 0/2
// task 1/20
// task 1/2
// task 2/20
// task 2/2
// task 3/20
// task 4/20
// ...
```

其实运行结果非常好，`longTask` 没有阻塞 `shortTask`，虽然长任务有 20 个步骤，但是短任务却在一开始就很好的执行并且结束了。这是为什么呢，因为我们的 `makeCPSTask` 在生成任务的时候，显式调用了 `k1`，也就是主动放弃了当前协程的控制权，于是长任务每个步骤都在很礼貌的让出。这恰恰体现出了协作式协程的特点，需要手动管理控制流。

### 协作式协程的问题

我们来定义一个不那么礼貌的 `makeLongTask` 函数，这个函数内不会调用 `k1` 主动放弃控制权：

```js
function makeLongTask(n)
{
  return function task()
  {
    reset(
      k =>
      {
        shift(k1 => {
          console.log("block task start");
          for (let i = 0; i < n; i++) 
          {
            console.log("busy", i);
          }
          console.log("block task end");
        });
      }
    );
  }
}
```

这样的话，用 `makeLongTask` 定义 `longTask` 并且运行：

```js
let longTask = makeLongTask(10);

spawn(longTask);
spawn(shortTask);
run();
```

会看到这样的输出：

```js
// ...
// busy 8
// busy 9
// block task end
// task 0/2
// task 1/2
// task 2/2
```

长任务迟迟不放弃执行权，等 10 个步骤执行结束，才轮到短任务，给短任务带来了阻塞，也就是 “饿死” 其他任务的情况。这就是协作式协程的问题。

### 抢占式协程

只需要修改一下 `run` 函数的写法，就能把协程的调度方式，从协作式改为按照时间片的抢占式：

```js
function run2(timeSlice) 
{
  function tick() 
  {
    const sliceStart = performance.now();

    while (ready.length > 0 && performance.now() - sliceStart < timeSlice) 
    {
      const k = ready.shift();
      k();
    }

    if (ready.length > 0) setTimeout(tick, 0);
  }

  setTimeout(tick, 0);
}
```

这个函数的意思是，每执行 timeSlice 毫秒，就判断任务队列里有没有任务，如果有则切换到其他任务去执行。

相应的，我们的 `makeLongTask` 函数需要简单改下，因为 JavaScript 语言的限制，如果不做任何修改，是无法模拟时间片轮转的，所以我们把生成 `longTask` 的函数，修改为每计算 chunk 个数字就调用 `k1` 让出控制权一次：

```js
function makeLongTask(n, chunk)
{
  return function task()
  {
    reset(
      k =>
      {
        shift(
          k1 => 
          {
            console.log("block task start");
            let i = 0;
            function chunkLoop() 
            {
              const end = Math.min(i + chunk, n);
              for (; i < end; i++) ;          // 纯计算
              if (i < n) k1(chunkLoop);       // 让出控制权
              else console.log('block task end');
            }
            chunkLoop();
          }
        );
      }
    );
  }
}
```

把这几行代码放在 run 函数之前，便于后续观察任务的运行情况，尤其注意多定义了一个 setTimeout 的调用：

```js
let longTask = makeLongTask(5e8, 5e7);
let shortTask = makeCPSTask(2);

spawn(longTask);
spawn(shortTask);

setTimeout(() => console.log('>>> TIMER fired'), 0);
```

当 `run()` 函数运行，`run2(1)` 函数注释掉时，打印结果是这样：

```js
run();
// run2(1);

// block task start
// task 0/2
// task 1/2
// task 2/2
// block task end
// >>> TIMER fired
```

当 `run()` 函数注释掉，`run2(1)` 函数运行时，打印结果是这样：

```js
// run();
run2(1);

// >>> TIMER fired
// block task start
// task 0/2
// task 1/2
// task 2/2
// block task end
```

可以看到最大的差别就是 TIMER 打印的位置不同。这里存在一点投机取巧的地方，因为我们真的无法在 JavaScript 语言里打断同步执行的流程，所以在 run 函数之前加了一个 timer 来体现 run 函数的轮转。

对于 while 版本的 `run` 函数，它会在执行完全部任务队列后，才退出执行，所以 TIMER 在最后打印出来。而 `run2` 函数每 1 毫秒都在让出自己的控制权，把自己在执行的协程任务，放在了外部宏任务的执行过程中，所以 TIMER 会在一开始（或者协程的执行步骤中）打印。

为了体现 `run2` 函数让出协程的控制权，交由宏任务执行的特点，可以这样简单尝试一下，输出结果中的 TIMER 就变为了协程的执行过程中：

```js
setTimeout(() => console.log('>>> TIMER fired'), 100);

// run();
run2(1);

// block task start
// task 0/2
// >>> TIMER fired
// task 1/2
// task 2/2
// block task end
```

### 遗留问题

其实上面有一个不太成功的尝试，我们把生成 `longTask`（阻塞任务）的函数 `makeLongTask` 改为按照 chunk 计算并让出的模式，是为了测试，当每一个 chunk 的时间片长度远大于 `run2` 函数中的 sliceTime 时，`longTask` 的任务会被 `run2` 函数的时间片轮转切断，因此去体现出 `run` 和 `run2` 函数两种模式的不同。但实际上失败了，这是因为语言方面的限制。

不过 TIMER 的语句弥补了这个问题，TIMER 的打印位置，仍然体现出了两个 run 函数的差异，也就是协作式协程和抢占式协程的区别。并且如果 `makeLongTask` 函数没有按照 chunk 让出，TIMER 的效果也是无法体现的。

那么有没有不用 TIMER 的办法，仅仅依靠 `longTask` 的定义，就体现两个 run 函数的差异呢？我也不知道。



