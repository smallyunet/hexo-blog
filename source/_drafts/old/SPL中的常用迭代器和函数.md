---
title: SPL中的常用迭代器和函数
date: 2017-06-16 00:00:00
tags:
  - SPL
  - PHP
---


> 有一天，我去世了，恨我的人，翩翩起舞，爱我的人，眼泪如露。
> 
> 第二天，我的尸体头朝西埋在地下深处，恨我的人，看着我的坟墓，一脸笑意，爱我的人，不敢回头看那么一眼。
> 
> 一年后，我的尸骨已经腐烂，我的坟堆雨打风吹，恨我的人，偶尔在茶余饭后提到我时，仍然一脸恼怒，爱我的人，夜深人静时，无声的眼泪向谁哭诉。
> 
> 十年后，我没有了尸体，只剩一些残骨。恨我的人，只隐约记得我的名字，已经忘了我的面目，爱我至深的人啊，想起我时，有短暂的沉默，生活把一切都渐渐模糊。
> 
> 几十年后，我的坟堆雨打风吹去，唯有一片荒芜，恨我的人，把我遗忘，爱我至深的人，也跟着进入了坟墓。对这个世界来说，我彻底变成了虚无。我奋斗一生，带不走一草一木。我一生执着，带不走一分虚荣爱慕。
> 
> 今生，无论贵贱贫富，总有一天都要走到这最后一步。
> 
> 到了后世，霍然回首，我的这一生，形同虚度！我想痛哭，却发不出一点声音，我想忏悔，却已迟暮！用心去生活，别以他人的眼光为尺度。爱恨情仇其实都只是对自身活着的，每一天幸福就好。
> 
> 珍惜内心最想要珍惜的，三千繁华，弹指刹那，百年之后，不过一捧黄沙。

**SPL的常用迭代器**, 通过某种统一的方式遍历链表或者数组中的元素的过程叫做迭代遍历，而这种统一的遍历工具我们叫做迭代器。

> ArrayIterator

```php
<?php
$fruits = [
  "apple" => 'apple value', // position = 0
  "orange" => 'orange value', // position = 1
  "grape" => 'grape value',
  "plum" => 'plum value'
];
// 一般方式
print_r($fruits);
foreach($fruits as $key => $value){
  echo $key.$value;
}

// 使用ArrayIterator遍历数组
$obj = new ArrayObject($fruits);
$it = $obj->getIterator();
// foreach方式
foreach($it as $key => $value){
  echo $key.$value;
}
/* foreach方式和普通的foreach方式没有区别，因为我们在使用foreach的过程中程序默认使用了迭代器，也就是底层实现的方式，先实例化数组为一个对象，然后调用迭代器的方法，进行遍历。 */
// while方式
$it->rewind(); // 调用current之前一定要rewind
while($it->valid()){
  echo $it->key().$it->current();
  $it->next();
}
/* while遍历的时候一定要记得rewin重置指针的位置。和普通foreach实现遍历相比，迭代器方式可以实现跳过某些元素再进行遍历，比如从位置1开始，而不是位置0. */
// 跳过某些元素进行打印
$it->rewind();
if($it->valid()){
  $it->seek(1); // 从position = 1开始
  while($it->valid()){
    echo $it->key().$it->current();
    $it->next();
  }
}
/* ksort方式使得遍历结果按照key的字典序排序，如果想要value按照字典序排序，则使用asort。 */
$it->ksort();
foreach($it as $key => $value){
  echo $key.$value;
}
```

> AppendIterator

```php
<?php
$array_a = new ArrayIterator(['a', 'b', 'c']);
$array_b = new ArrayIterator(['d', 'e', 'f']);
$it->append($array_a);
$it->append($array_b);
// 通过append方法把迭代器对象添加到AppendIterator对象中
foreach($it as $key => $value){
  echo $value;
}
// 只用一个foreach就可以实现多次遍历
```

> MultipleIterator用于把多个Iterator里面的数据组合成为一个整体来访问

```php
<?php
$idIter = new ArrayIterator(['01', '02', '03']);
$nameIter = new ArrayIterator(['张三', '李四', '王五']);
$ageIter = new ArrayIterator(['22', '23', '25']);
$mit = new MultipleIterator(MultipleIterator::MIT_KEYS_ASSOC);
$mit->attachIterator($idIter, "ID");
$mit->attachIterator($nameIter, "NAME");
$mit->attachIterator($ageIter, "AGE");
foreach ($mit as $value) {
  print_r($value);
}
```

> FilesystemIterator能遍历文件系统

```php
<?php
$it = new FileSystemIterator('.');
foreach ($it as $finfo) {
    printf("%s\t%s\t%8s\t%s\n",date("Y-m-d H:i:s", $finfo->getMTime()),
    $finfo->isDir() ? "<DIR>" : "",
    number_format($finfo->getSize()),
    $finfo->getFileName()
  );
}
```

**SPL基础接口**

> SPL的基础接口里面定义了最常用的接口
> 
> - Countable
> 
> --继承了接口的类可以直接调用count()得到元素个数
> 
> - OuterIterator
> 
> --如果想对迭代器进行一定的处理之后再返回，可以用这个接口
> 
> - RecursiveIterator
> 
> 可以对多层结构的迭代器进行迭代，比如遍历一棵树
> 
> - SeekableIteraor
> 
> 可以通过seek方法定位到集合里面的某个特定元素

Countable，在代码里面经常可以直接用count($obj)方法获得对象里面的元素的个数，对于自定义的类可以implements

```php
<?php
$array = [
  [1, 2],
  [3, 4],
  [5, 6]
];
echo count($array);
echo count($array[1]);
```

```php
<?php
class CountMe implements Countable {
  protected $_myCount = 3;
  public function count(){
    return $this->_myCount;
  }
}
$obj = new CountMe();
echo count($obj);
```

> OuterIterator

如果想对迭代器进行一定的处理之后再返回，可以用这个接口 IteratorIterator类是OuterIterator的实现，扩展的时候可以直接继承IteratorIterator

```php
$array = ['1', '2', '3', '4'];
$outerObj = new OuterImpl(new ArrayIterator($array));
foreach ($outerObj as $key => $value) {
  echo $key.$value;
}

class OuterImpl extends Iterator {
  public function current() {
    return parent::current()."_tail";
  }
  public function key() {
    return "Pre_".parent::key();
  }
}
```

> RecursiveIterator

- 可以对多层结构的迭代器进行迭代，比如遍历一棵树

- 所有具有层次结构特点的数据都可以用这个接口遍历，如文件夹

关键方法

- hasChildren方法用于判断当前节点是否存在子节点

- getChildren方法用于得到当前节点子节点的迭代器

SPL实现该接口的类

- RecursiveArrayIterator，RecursiveCachingIterator等以Recursive开头的类都能够进行多层次结构化的遍历

> SeekableIterator

- 可以通过seek方法定位到集合里面的某个元素

- seek方法的参数是元素的位置，以0开始计算

**SPL函数的使用**

```php
spl_autoload_extensions('.class.php', '.php');
// 设置autoload寻找php定义的类文件的扩展名，多个扩展名用逗号分隔，前面的扩展名优先被匹配
set_include_path(get_include_path().PATH_SEPARATOR."libs/");
// 设置autoloader寻找php定义的类文件的目录，多个目录用PATH_SEPARATOR进行分隔
spl_autoload_register(); // 修正函数名 spl_autoload_register
// 提示php使用Autoload机制查找类定义
new ClassName();
```

改进

```php
function __autoload($class_name){ // 定义__autoload函数，可以不调用spl_autoload_register函数的情况下完成类的装载
  require_once("libs/".$class_name.".php"); // 装载类
}
new ClassName();
```

自定义装载

```php
function classLoader($class_name){ // 定义一个替换__autoload函数的类文件装载函数
  require_once("libs/".$class_name.".php"); // 装载类
}
spl_autoload_register('classLoader'); // 传入定义好的装载类的函数的名称替换__autoload函数
new ClassName();
```

  

The End.
