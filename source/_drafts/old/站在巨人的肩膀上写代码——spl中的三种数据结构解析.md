---
title: 站在巨人的肩膀上写代码——Spl中的三种数据结构解析
date: 2017-03-05 00:00:00
tags:
  - PHP
  - SPL
---


今天身体莫名get trouble，心情莫名bad。想说什么又没有什么要说的。I want to get a new object?（她不喜欢我怎么办？）嗯？%e9%9d%b3%e8%8d%a3

<br>
  

来简单说说Spl中三种数据结构的基本操作，这三种数据结构分别为双向链表（SplDoubleLinkedList）、堆栈（SplStack）和队列（SplQueue）。

**双向链表（SplDoubleLinkedList）**

首先实例化对象为$obj

```php
$obj = new SplDoublyLinkedList();
```

然后我们添加三条数据到双向链表中  

```php
$obj->push(1);
$obj->push(2);
$obj->push(3);
```

再来添加一条这样的数据

```php
$obj->unshift(10);
```

这个时候打印一下$obj

```php
print_r($obj);
```

输出的结果会是这样

```text
SplDoublyLinkedList Object
(
  [flags:SplDoublyLinkedList:private] => 0
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => 10
      [1] => 1
      [2] => 2
      [3] => 3
    )
)
```

对我们看到，1、2和3分别按照次序被添加进了链表对象的数组中，而底部（Bottom）位置的数据则是10，即使用unshift方法添加的数据，这里得知unshift的作用就是添加数据到链表底部。

再调用这个方法

```php
$obj->rewind(); // 10
```

输出一下当前指针指向的节点

```php
echo 'current: ' . $obj->current();
```

输出的是这个节点  

```text
current: 10
```

说明双向链表的rewind会将指针移动到底部。  

我们再试试next方法

```php
$obj->next();   // 1
```

输出当前指针指向的节点

```php
echo 'next node: ' . $obj->current();
```

结果是

```text
next node: 1
```

结果明了，会将current向顶部移动一个位置。  

再来几个测试

```php
$obj->next();   // 2
$obj->next();   // 3
$obj->prev();   // 2
echo 'next node: ' . $obj->current();    // 2
$obj->next();   // 3
$obj->next();   // 
echo 'next node: ' . $obj->current();    //
```

代码中反复使用了next方法和prev方法，每次指针指向的节点在代码中都有注释，并输出了两次来验证正确性，输出结果是正确的

```text
next node: 2
next node:
```

并且我们知道指针超出链表的范围后会返回空值，因此接下来我们可以判断一下当前节点是否有效

```php
if($obj->current()){
    echo "Current node valid <br />";
}else{
    echo "Current node invalid <br />";
}
```

返回值为

```text
Current node invalid
```

或者可以用这样的方式来验证当前节点是否可用

```php
if($obj->valid()){
    echo "valid list <br />";
}else{
    echo "invalid list <br />";
}
```

返回内容为  

```text
valid list
```

接下来是删除节点的操作，pop方法用于删除当前指针指向的节点，并返回该节点的内容  

```php
$obj->rewind();

echo "<hr /> Pop value: " . $obj->pop();

print_r($obj);

echo 'current: ' . $obj->current();
```

输出的内容为  

```text
Pop value: 3

SplDoublyLinkedList Object
(
  [flags:SplDoublyLinkedList:private] => 0
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => 10
      [1] => 1
      [2] => 2
    )
)

current: 10
```

删除节点之前使用rewind重置了指针的位置到Bottom，同时pop删除了Top位置的节点。那么如果current正好指向Top位置会怎样？  

```php
$obj->next();   // 1
$obj->next();   // 2

// 把Top位置的节点从链表中删除，并返回
echo "<hr /> Pop value: " . $obj->pop() . "<br />";
echo 'current: ' . $obj->current() . '<br />';  // 10

print_r($obj);
```

输出

```text
Pop value: 2
current:

SplDoublyLinkedList Object
(
  [flags:SplDoublyLinkedList:private] => 0
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => 10
      [1] => 1
    )
)
```

如果current正好指向Top位置，那么调用pop之后current会失效。

最后一个要试的方法是shift，用于把Bottom位置的节点从链表中删除，并返回，执行

```php
$obj->shift();
print_r($obj);
```

会只输出

```text
SplDoublyLinkedList Object
(
  [flags:SplDoublyLinkedList:private] => 0
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => 1
    )
)
```

另外两种数据结构的操作类似，啊，好懒，直接贴一下，要不然得很长时间。  

**堆栈（SplStack）**

测试代码为

```php
<?php

$stack = new SplStack();

$stack->push('a');  // push操作箱堆栈里面放入一个节点到tio位置
$stack->push('b');
$stack->push('c');

echo '<pre>';
print_r($stack);
echo '</pre>';

echo "Bottom: " . $stack->bottom() . "<br />";
echo "Top: " . $stack->top() . "<br />";

$stack->offsetSet(0,'C');   // 堆栈的offset=0是Top所在的位置，offset=1是top位置节点靠近bottom位置的相邻节点，以此类推

echo '<pre>';
print_r($stack);
echo '</pre>';

$stack->rewind();   // 双向链表的rewind和堆栈的rewind相反，堆栈的rewind是的当前指针指向Top所在的位置，而双向链表调用之后指向bottom所在位置
echo 'current: ' . $stack->current() . '<br />';

$stack->next(); // 堆栈的next操作使指针靠近Bottom位置的下一个节点，而双向链表是靠近top的下一个节点
echo 'current: ' . $stack->current() . '<br />';

echo '<hr />';

// 遍历堆栈
$stack->rewind();
while($stack->valid()){
    echo $stack->key()."=>".$stack->current() . "<br />";
    $stack->next(); // next操作不从链表中删除元素
}

// 删除堆栈数据
$popObj = $stack->pop();    // pop操作从堆栈里面提取出最后一个元素（top位置），同时在堆栈里面删除该节点
echo "Poped object: " . $popObj . "<br />";

echo '<pre>';
print_r($stack);
echo '</pre>';
```

打印内容为

```text
SplStack Object
(
  [flags:SplDoublyLinkedList:private] => 6
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => a
      [1] => b
      [2] => c
    )
)

Bottom: a
Top: c

SplStack Object
(
  [flags:SplDoublyLinkedList:private] => 6
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => a
      [1] => b
      [2] => C
    )
)

current: C
current: b

2=>C
1=>b
0=>a
Poped object: C

SplStack Object
(
  [flags:SplDoublyLinkedList:private] => 6
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => a
      [1] => b
    )
)
```

**队列（SplQueue）**

测试代码为

```php
<?php

$obj = new SplQueue();

$obj->enqueue('a'); // 插入一个节点到队列里面的Top位置
$obj->enqueue('b');
$obj->enqueue('c');

echo '<pre>';
print_r($obj);
echo '</pre>';

echo "Bottom: " . $obj->bottom() . "<br />";
echo "Top: " . $obj->top() . "<br />";

$obj->offsetSet(0,'A'); // 队列里面offset=0Bottom所在位置，offset=1是Top所在位置，以此类推

echo '<pre>';
print_r($obj);
echo '</pre>';

$obj->rewind(); // 队列里面rewind操作是的指针指向Bottom所在位置的节点
echo 'current: ' . $obj->current() . '<br />';

$obj->rewind();
while($obj->valid()){
    echo $obj->key()."=>".$obj->current() . "<br />";
    $obj->next(); // next操作是的当前指针指向top方向的下一个节点
}

echo "dequeue obj: ".$obj->dequeue()."\\n";  // dequeue操作从队列中提取bottom位置的节点，并返回，同时从队列里面删除该元素

echo '<pre>';
print_r($obj);
echo '</pre>';
```

打印内容为

```text
SplQueue Object
(
  [flags:SplDoublyLinkedList:private] => 4
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => a
      [1] => b
      [2] => c
    )
)

Bottom: a
Top: c

SplQueue Object
(
  [flags:SplDoublyLinkedList:private] => 4
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => A
      [1] => b
      [2] => c
    )
)

current: A
0=>A
1=>b
2=>c
dequeue obj: A

SplQueue Object
(
  [flags:SplDoublyLinkedList:private] => 4
  [dllist:SplDoublyLinkedList:private] => Array
    (
      [0] => b
      [1] => c
    )
)
```

The End.
