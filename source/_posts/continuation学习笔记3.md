---
title: continuation学习笔记：call/cc
date: 2025-07-21 14:35:41
tags:
- continuation
- callcc
---

call/cc 的全程是 call-with-current-continuation，意思是调用时候，带着当前的执行环境（也就是 k 函数）。

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

