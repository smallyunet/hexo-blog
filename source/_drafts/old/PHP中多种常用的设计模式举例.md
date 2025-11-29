---
title: PHP 中多种常用的设计模式举例
date: 2017-01-25 00:00:00
tags:
  - PHP
  - 设计模式
---


**适配器模式**  

> 1.适配器模式，可以将截然不同的函数接口封装成统一的API
> 
> 2.实际应用举例，PHP的数据库操作有mysql,musqli,pdo三种，可以用适配器模式统一成一致。类似的场景还有cache适配器，将memcache，redis，file，apc等不同的缓存函数，统一成一致

> Database.php

```php
<?php
interdace IDatabase{
  function connect($host, $user, $passwd, $dbname);
  function query($sql);
  function close();
}
```

在Database.php中定义了数据库操作的接口，接下来将MySQL、MySQLi、PDO三种数据库操作适配为接口中定义的方法。

> MySQL.php

```php
<?php
namespace Database;
class MySQL implements IDatabase{
  protected $conn;
  function connect($host, $user, $passwd, $dbname){
    $conn = mysql_connect($host, $user, $passwd);
    mysql_select_db($dbname, $conn);
    $this->conn = $conn;
  }
  function query($sql){
    $res = mysql_query($sql, $this->conn);
    return $res;
  }
  function close(){
    mysql_close($this->conn);
  }
}
```

> MySQLi.php

```php
<?php
namespace Database;
class MySQLi implements IDatabase{
  protected $conn;
  function connect($host, $user, $passwd, $dbname){
    $conn = mysqli_connect($host, $user, $passwd, $dbname);
    $this->conn = $conn;
  }
  function query($sql){
    $res = mysqli_query($this->conn, $sql);
    return $res;
  }
  function close(){
    mysqli_close($this->conn);
  }
}
```

> PDO.php

```php
<?php
namespace Database;
class PDO implements IDatabase{
  protected $conn;
  function connect($host, $user, $passwd, $dbname){
    $conn = new \PDO("mysql:host=$host;dbname=$dbname", $user, $passwd);
    $this->conn = $conn;
  }
  function query($sql){
    return $this->conn->query($sql);
  }
  function close(){
    unset($this->conn);
  }
}
```

然后在应用中可以这样使用：

> index.php  

```php
<?php
$db = new Database\MySQL();
$db->connect('localhost', 'root', 'root', 'test');
$db->query('show database');
$db->close();
```

或者实例化其他类型的数据库，只需要使用同一种标准。

**策略模式**

> 1.策略模式，将一组特定行为和算法封装成类，以适应某些特定的上下文环境，这种模式就是策略模式
> 
> 2.实际应用举例，假如一个电商网站系统，针对男性女性用户要各自跳转到不同的商品类目，并且所有广告位展示不同的广告
> 
> 3.使用策略模式可以实现Ioc，依赖倒置、控制反转

> UserStrategy.php

```php
<?php
interface UserStrategy {
  function showAd();
  function showCategory();
}
```

UserStrategy.php文件定义了用户策略的接口，面对不同的用户将分别实现相应的内容。

> FemaleUserStrategy.php

```php
<?php
class FemaleUserStrategy implements UserStrategy {
  function showAd() {
    echo "2017新款女装";
  }
  function showCategory() {
    echo "女装";
  }
}
```

> MaleUserStrategy.php

```php
<?php
class MaleUserStrategy implements UserStrategy {
  function showAd() {
    echo "IPhone7";
  }
  function showCategory() {
    echo "电子产品";
  }
}
```

在index.php中这样做就可以实现从硬编码到实现解耦，即不需要修改Page类的内容，只需要传递不同的参数。

> index.php

```php
<?php
class Page {
  private $strategy;
  function index() {
    echo "AD:";
    $this->strategy->showAd();
    echo "Category:";
    $this->strategy->showCategory();
  }
  function setStrategy(UserStrategy $strategy) {
    $this->strategy = $strategy;
  }
}
$page = new Page();
if (isset($_GET['female'])) {
  $strategy = new FemaleUserStrategy();
} else {
  $strategy = new MaleUserStrategy();
}
$page->setStrategy($strategy);
$page->index();
```

**数据对象映射模式**  

数据对象映射模式，是将对象和数据存储映射起来，对一个对象的操作会映射为对数据存储的操作。

在下面的代码中实现数据对象映射模式，我们将实现一个ORM类，将复杂的SQL语句映射成对象属性的操作。

> User.php


```php
<?php
class User {
  public $id;
  public $mobile;
  public $regtime;
  public $name;

  protected $db;

  function __construct($id) {
    $this->id = $id;
    $this->db = new MySQLi();
    $this->db->connect('localhost', 'root', 'root', 'test1');
    $res = $this->db->query("select * from user where id={$this->id} limit 1");
    $data = $res->fetch_assoc();
    $this->name = $data['name'];
    $this->mobile = $data['mobile'];
    $this->regtime = $data['regtime'];
  }

  function __destruct() {
    $this->db->query("update user set name='{$this->name}', mobile='{$this->mobile}', regtime='{$this->regtime}' where id={$this->id} limit 1");
  }
}
```
> index.php

```php
<?php
$user = new User(1);
$user->mobile = '18812345678';
$user->name = 'test';
$user->regtime = date('Y-m-d H:i:s');
```

下面结合使用数据对象映射模式，工厂模式，注册器模式：

> index.php

```php
<?php
class Page {
  function index() {
    $user = Factory::getUser(1); // 工厂模式的实现
    $user->name = 'rango';
    $this->test();
  }
  function test() {
    $user = Factory::getUser(1); // 工厂模式的实现
    $user->mobile = '18844448888';
  }
}
$page = new Page();
```

> Factory.php

```php
<?php
class Factory {
  static function getUser($id) {
    $key = 'user_'.$id;
    $user = Register::get($key);
    if (!$user) {
      $user = new User($id);
      Register::set($key, $user);
    }
    return $user;
  }
}
```

**观察者模式**

> 1.观察者模式（Observer），当一个对象状态发生改变时，依赖它的对象全部会收到通知，并自动更新
> 
> 2.场景：一个事件发生后，要执行一连串更新操作，传统的编程方式，就是在事件的代码之后直接加入处理逻辑。当更新的逻辑增多之后，代码会变得难以维护。这种方式是耦合的，侵入式的，增加新的逻辑需要修改事件主体的代码
> 
> 3.观察者模式实现了低耦合，非侵入式的通知与更新机制

> index.php

```php
<?php
class Event extends EventGenerator {
  function trigger() {
    echo "Event<br />";
    $this->notify();
  }
}
class Observer1 implements Observer {
  function update($event_info = null) {
    echo "逻辑1<br />";
  }
}
class Observer2 implements Observer {
  function update($event_info = null) {
    echo "逻辑2<br />";
  }
}
$event = new Event;
$event->addObserver(new Observer1); // 观察者模式的实现
$event->addObserver(new Observer2); // 观察者模式的实现
$event->trigger();
```

> EventGenerator.php

```php
<?php
abstract class EventGenerator {
  private $observers = array();
  function addObserver(Observer $observer) {
    $this->observers[] = $observer;
  }
  function notify() {
    foreach($this->observers as $observer) {
      $observer->update();
    }
  }
}
```

> Observer.php

```php
<?php
interface Observer {
  function update($event_info = null);
}
```

**原型模式**

> 1.与工厂模式作用类似，都是用来创建对象
> 
> 2.与工厂模式的实现不同，原型模式是先创建好一个原型对象，然后通过clone原型对象来创建新的对象。这样就免去了类创建时重复的初始化操作
> 
> 3.原型模式适用于大对象的创建。创建一个大对象需要很大的开销，如果每次new就会消耗很大，原型模式内存拷贝即可

> Canvas.php

```php
<?php
class Canvas {
  // ... 原型对象的复杂初始化
  function init() {
    // 初始化逻辑
  }
  function rect($x1,$y1,$x2,$y2){
    // 绘制矩形
  }
  function draw(){
    // 输出
  }
}
```

index.php将实例化Canvas类以实现图像绘制，并使用关键字clone实现原型模式：  

> index.php

```php
<?php
$prototype = new Canvas();
$prototype->init();
// 原型模式
$canvas1 = clone $prototype;
$canvas2 = clone $prototype;
$canvas1->rect(1,2,3,4);
$canvas1->draw();
$canvas2->rect(5,6,7,8);
$canvas2->draw();
```

**装饰器模式**

> 1.装饰器模式（Decorator），可以动态地添加修改类的功能
> 
> 2.一个类提供了一项功能，如果要在修改并添加额外的功能，传统的编程模式，需要写一个子类继承它，并重新实现类的方法
> 
> 3.使用装饰器模式，仅需要在运行时添加一个装饰器对象即可实现，可以实现最大的灵活性

> DrawDecorator.php

```php
<?php
interface DrawDecorator {
  function beforeDraw();
  function afterDraw();
}
```

DrawDecorator.php定义了装饰器的接口，将会在装饰器类中用到。

> Canvas.php

```php
<?php
class Canvas {
  protected $decorators = array();
  function draw() {
    $this->beforeDraw();
    // ... 绘制主体
    $this->afterDraw();
  }
  function addDecorator(DrawDecorator $decorator) {
    $this->decorators[] = $decorator;
  }
  function beforeDraw() {
    foreach($this->decorators as $decorator) {
      $decorator->beforeDraw();
    }
  }
  function afterDraw() {
    $decorators = array_reverse($this->decorators); // 后进先出
    foreach($decorators as $decorator) {
      $decorator->afterDraw();
    }
  }
}
```

> ColorDrawDecorator.php

```php
<?php
// 颜色装饰器
class ColorDrawDecorator implements DrawDecorator {
  function beforeDraw() {
    // 设置颜色
  }
  function afterDraw() {
    // 恢复状态
  }
}
```

**迭代器模式**

> 1.迭代器模式，在不需要了解内部实现的前提下，遍历一个聚合对象的内部元素
> 
> 2.相比于传统的编程模式，迭代器模式可以隐藏遍历元素所需的操作

> index.php

```php
<?php
$users = new AllUser();
foreach($users as $user) {
  var_dump($user);
}
```

迭代器的实现：

> AllUser.php

```php
<?php
// 示例装饰器使用
$canvas1 = new Canvas();
$canvas1->init();
$canvas1->addDecorator(new ColorDrawDecorator());
$canvas1->draw();
```

这样来使用：

> index.php

```php
<?php
class AllUser implements \Iterator {
  protected $ids;
  protected $index = 0;
  function __construct() {
    $db = Factory::getDatabase();
    $result = $db->query('select id from user');
    $this->ids = $result->fetch_all(MYSQLI_ASSOC);
  }
  function current() {
    $id = $this->ids[$this->index]['id'];
    return Factory::getUser($id);
  }
  function next() { $this->index++; }
  function valid() { return $this->index < count($this->ids); }
  function rewind() { $this->index = 0; }
  function key() { return $this->index; }
}
```

**代理模式**

> 1.在客户端与实体之间建立一个代理对象（proxy），客户端对实体进行操作全部委派给代理对象，隐藏实体的具体实现细节
> 
> 2.Proxy还可以与业务代码分离，部署到另外的服务器，业务代码中通过RPC来委派任务

> index.php

```php
$proxy = new Proxy();
$proxy->getUserName($id);
$proxy->setUserName($id, $proxy);
```

> Proxy.php

```php
<?php
class Proxy implements IUserProxy {
  function getUserName($id) {
    $db = Factory::getDatabase('slave');
    $db->query("select name from user where id={$id} limit 1");
  }
  function setUserName($id, $name) {
    $db = Factory::getDatabase('master');
    $db->query("update user set name='{$name}' where id={$id} limit 1");
  }
}
```

> IUserProxy.php

```php
<?php
interface IUserProxy {
  function getUserName($id);
  function setUserName($id, $name);
}
```
