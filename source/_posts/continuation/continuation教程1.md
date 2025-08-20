---
title: "continuation 教程: 理解 CPS"
date: 2025-07-23 12:12:12
draft_date: 2025-07-19 01:10:18
tags: 
- continuation
- 教程
---

> 这是一个 continuation 系列教程：
> 1. [continuation 教程：理解 CPS](/2025/07/23/continuation教程1/)
> 2. [continuation 教程：用 yield 实现协程调度](/2025/07/23/continuation教程2/)
> 3. [continuation 教程：用 call/cc 实现协程调度](/2025/07/23/continuation教程3/)
> 4. [continuation 教程：用 shift/reset 实现协程调度](/2025/07/23/continuation教程4/)
> 5. [continuation 教程：体验 Racket 语言](/2025/07/23/continuation教程5/)
> 6. [continuation 教程：实现抢占式协程调度](/2025/07/23/continuation教程6/)

我们来由浅入深地系统学习下 continuation 的原理以及应用场景。这个系列教程的内容和王垠的 continuation 专项班无关，是我自己学习和研究的成果，所以不会有版权问题。不过当然正是因为我学习了基础班，打下了坚实的基础，才知道该如何去自学和理解 continuation 这个概念。这篇文章会少量透露出基础班学到的技能，毕竟 continuation 属于基础班的进阶内容，无法跳过基础技能去理解。

### 递归

首先用递归的形式写一个阶乘函数 `fact`，我们已经很熟悉它的写法，不需要过多解释：

```js
function fact(n)
{
  if (n === 0) 
  {
    return 1;
  }
  else
  {
    return n * fact(n - 1);
  }
}

console.log("fact1=", fact(1)); // 1
console.log("fact3=", fact(3)); // 6
console.log("fact5=", fact(5)); // 120
```

### 尾递归

接着把 `fact` 函数改为尾递归的形式。尾递归会比递归多一个参数，新参数用来保存每个调用计算后的值：

```js
function factTail(n, prod)
{
  if (n == 0)
  {
    return prod;
  }
  else
  {
    return factTail(n-1, prod*n);
  }
}

console.log("factTail1=", factTail(1, 1)); // 1
console.log("factTail3=", factTail(3, 1)); // 6
console.log("factTail5=", factTail(5, 1)); // 120
```

### CPS 形式

我们基于 `fact` 函数的尾递归形式，再新增一个参数 `k`，这个 `k` 是一个函数，`fact` 不直接返回计算后的值，而是结果值对 `k` 函数的调用，像这样：

```js
function factTailCPS(n, prod, k)
{
  if (n == 0)
  {
    return k(prod);
  }
  else
  {
    return factTailCPS(n-1, prod*n, k);
  }
}

factTailCPS( 1, 1, x => console.log("factTailCPS1=", x) ); // 1
factTailCPS( 3, 1, x => console.log("factTailCPS1=", x) ); // 6
factTailCPS( 5, 1, x => console.log("factTailCPS1=", x) ); // 120
```

这个 k 就是 continuation，意味着告诉 `fact` 函数，你执行完了计算出结果之后，应该如何进行下一步延续。不用怀疑，这个函数完全符合 CPS（Continuation-Passing-Style）的形式。


### 典型 CPS

但是用尾递归结合 continuation 参数的形式，显然不够简洁，并不算典型的 CPS 形式。典型的 CPS 形式比较难理解，所以不需要自己思考出来，直接看这个现成的例子，我们对递归形式的 `fact` 函数改进一下：

```js
function factCPS(n, k)
{
  if (n == 0)
  {
    return k(1);
  }
  else
  {
    return factCPS(n-1, r => k(n * r));
  }
}
```

可能看着有点懵，不要慌，我们拆解一下其中的内容。首先 `k` 仍然代表 continuation，并且 `k` 是一个函数。然后我们这样来调用：

```js
let factCPS1 = factCPS(0, x => x);
console.log("factCPS1=", factCPS1); // 1

let factCPS3 = factCPS(3, x => x);
console.log("factCPS3=", factCPS3); // 6

let factCPS5 = factCPS(5, x => x);
console.log("factCPS5=", factCPS5); // 120
```

关键在于调用的时候，传入函数的第二个参数是 `x => x`，如果结合函数内部的 `r => k(n * r)`，也许一下子就糊涂了。

这确实是最难理解的部分。我们以计算 2 的阶乘为例，写一个拆解 `factCPS` 函数调用步骤的过程。这里用到的技巧是在基础班第一课就学过的 `单步替换`，对于理解递归非常有帮助。如果在基础班经过训练并且打好基础，确实会有助于理解更复杂的东西，比如这里的 CPS 调用：

```js
let factCPS2 = factCPS(2, x => x);
console.log("factCPS2=", factCPS2); // 2

// n=2, k=x=>x, return factCPS(1, r => k(2 * r));
  // n=1, k=r=>(x=>x)(2*r), return factCPS(0, r => k(1 * r));
    // n=0, k=r=>(r=>(x=>x)(2*r)(1*r)), return k(1);
      // k(1) = r=>(x=>x)(2*r)(1*1)
      //      = (x=>x)(2)
      //      = 2
```

虽然我已经按照正确的思路拆解出了正确的步骤，但是从阅读者的角度，这仍然会非常难理解，可以自己拆解一下试试，逐步理解典型 CPS 的调用过程。理解这些步骤也许需要几个小时的时间，这是正常的。

总结来说，CPS 的每一次调用，都是在用闭包来储存当前步骤计算的值。尾递归是直接用参数传递值，而 CPS 是在用闭包传递给下个步骤值，就是这样的关系。当然理解这一点的前提是，知道闭包是什么，这个也是基础班学习的重点内容，尤其是会在实现解释器环节，自己实现闭包的语句，对于闭包的理解会很透彻。

### fib 函数的 CPS

计算阶乘的函数 `fact` 特点是只在函数体内进行一次递归调用，我们再来看计算斐波那契数列的 `fib` 函数，它会在函数体内进行两次递归调用，CPS 该怎么处理这个情况。

`fib` 函数的递归形式的定义是这样：

```js
function fib(n)
{
  if (n == 0)
  {
    return 0;
  }
  else if (n == 1)
  {
    return 1;
  }
  else 
  {
    return fib(n-1) + fib(n-2);
  }
}

console.log("fib(2)=", fib(2)); // 1
console.log("fib(5)=", fib(5)); // 5
```

这里直接给出 `fib` 函数的 CPS，然后理解一下 `fib` 函数的运作过程：

```js
function fibCPS(n, k)
{
  if (n == 0)
  {
    return k(0);
  }
  else if (n == 1)
  {
    return k(1);
  }
  else
  {
    return fibCPS(n-1, r1 => fibCPS(n-2, r2=>k(r1+r2)) );
  }
}
```

可以看到，对于需要两次递归调用的情况，CPS 是把另一次递归调用，写在了原本的 `r => k(r)` 函数里，让第二次内部调用成为了递归调用 `fib` 时候的子调用。这句话有点绕，可以结合代码理解一下。

CPS 形式的 `fib` 函数这样来调用：

```js
let fibCPS1 = fibCPS(1, x=>x);
console.log("fibCPS1=", fibCPS1); // 1

let fibCPS2 = fibCPS(2, x=>x);
console.log("fibCPS2=", fibCPS2); // 1

let fibCPS4 = fibCPS(4, x=>x);
console.log("fibCPS4=", fibCPS4); // 3

let fibCPS5 = fibCPS(5, x=>x);
console.log("fibCPS5=", fibCPS5); // 5
```

我们以计算 3 的斐波那契数为例，拆解一下具体的执行步骤。要注意的是，这个过程非常复杂，比 `fact` 函数还要复杂很多，只有自己亲自写一下才能搞清楚：

```js
let fibCPS3 = fibCPS(3, x=>x);
console.log("fibCPS3=", fibCPS3); // 1+1=2

// n=3, k=x=>x, 
       // return fibCPS(2, r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) );
// n=2, k= r1 => fibCPS(1, r2=>(x=>x)(r1+r2)), 
       // return fibCPS(1, r1 => fibCPS(0, r2 => ( r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) )(r1+r2)) );
// n=1, k= r1 => fibCPS(0, r2 => ( r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) )(r1+r2)), 
       // return k(1)
       // return ( r1 => fibCPS(0, r2 => ( r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) )(r1+r2)) )(1)
       // return fibCPS(0, r2 => ( r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) )(1+r2))
          // n=0, k= r2 => ( r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) )(1+r2)
              // return k(0)
              // return ( r2 => ( r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) )(1+r2) )(0)
              // return ( r1 => fibCPS(1, r2=>(x=>x)(r1+r2)) ) (1+0)
              // return fibCPS(1, r2=>(x=>x)(1+r2))
                  // n=1, k = r2=>(x=>x)(1+r2)
                  // return k(1)
                  // return (x=>x)(1+1)
                  // return 2
```

那么经过了 `fact` 和 `fib` 函数的训练，我们就已经知道 CPS 的形式是什么，以及具体的执行步骤是怎样了。理解 CPS 只是开始，接下来还会利用 continuation 实现更多有趣的程序。

### 练习题

已知一个递归形式的 `sumFrom` 函数，接收两个参数 `a` 和 `b`，函数的功能是计算 `a+(a+1)+...+(b-1)+b` 的值，例如参数是 `1` 和 `4`，则计算 `1+2+3+4` 的结果：

```js
function sumFrom(a, b)
{
  if (a == b) 
  {
    return a;
  }
  else
  {
    return b + sumFrom(a, b-1);
  }
}

console.log(sumFrom(1, 3));   // 6
console.log(sumFrom(2, 5));   // 14
```

练习的内容是，将 `sumFrom` 函数修改为 CPS 形式，补充 `sumFromCPS` 函数空白处的代码，让程序可以满足测试用例中的输出结果：

```js
function sumFromCPS(a, b, k)
{
  // ____
}

sumFromCPS(1, 3, x => console.log(x));   // 6
sumFromCPS(2, 5, x => console.log(x));   // 14
```

### 延伸阅读

我们已经体验了手动将递归程序转变为 CPS 形式的过程，实际上存在能将代码自动转变为 CPS 形式的方法，也就是传说中 “王垠 40 行代码” 在干的事情。可以参考这两个链接查看更多内容：

- [王垠的「40 行代码」真如他说的那么厉害吗？](https://www.zhihu.com/question/20822815)
- [GTF - Great Teacher Friedman](https://www.yinwang.org/blog-cn/2012/07/04/dan-friedman)

因为 “自动 CPS 变换” 的难度比较大，我自己不打算学习和实现这个。

