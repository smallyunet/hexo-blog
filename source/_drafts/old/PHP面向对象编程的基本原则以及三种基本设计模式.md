---
title: PHP面向对象编程的基本原则，以及三种基本设计模式
date: 2017-01-24 00:00:00
tags:
  - PHP
  - 设计模式
---


**面向对象编程的基本原则**  

> 1. 单一职责：一个类，只需要做好一件事情
> 2. 开放封闭：一个类，应该是可扩展的，而不可修改的
> 3. 依赖倒置：一个类，不应该强依赖另一个类。每个类对于另外一个类都是可替换的
> 4. 配置化：尽可能地使用配置，而不是硬编码
> 5. 面向接口编程：只需要关心接口，不需要关心实现

**PSR-0命名规范**

> 1. 命名空间必须与绝对路径一致
> 2. 类名首字母必须大写  
> 3. 除入口文件外，其他“.php”必须只有一个类

**开发符合PSR-0规范的基础框架**

> 1. 全部使用明明空间  
> 2. 所有PHP文件必须自动载入，不能有include/require  
> 3. 单一入口

**类的自动载入**

> Test1.php

```php
<?php

class Test1{
    static function test(){
        echo __METHOD__;
    }
}
```

> Test2.php

```php
<?php

class Test2{
    static function test(){
        echo __METHOD__;
    }
}
```

> test.php

```php
<?php

spl_autoload_register('autoload1');
spl_autoload_register('autoload2');

function autoload1($class){
    require __DIR__.'/'.$class.'.php';
}

function autoload2($class){
    require __DIR__.'/'.$class.'.php';
}

Test1::test();
Test2::test();
```

运行test.php会得到这样的结果：

```
Test1::testTest2::test
```

__autoload()函数只可以存在一个，如果重复定义会报致命错误，所以目前一般使用spl_autoload_regisiter()来实现类的自动加载。

**PHP链式调用的实现**

> Database.php

```php
<?php

class Database{
    function where($where){
        ...
    }

    function order($order){
        ...
    }

    function limit($limit){
        ...
    }
}
```

如果Database.php是这样，那么在index.php中就需要这样来写以实现sql查询：

> index.php

```php
<?php

$db=new Database();
$db->where("id=2");
$db->where("name=2");
$db->order("id desc");
$db->limit(10);
```

要实现链式调用只需要这样做：

> Database.php

```php
<?php

class Database{
    function where($where){
        return $this;
    }

    function order($order){
        return $this;
    }

    function limit($limit){
        return $this;
    }
}
```

在每个方法的末尾加上'return $this;'，然后就可以：

> Data

```php
<?php

$db->where("id=1")->where("name=2")->order("id desc")->limit(10);
```

三种基础的设计模式包括工厂模式、单例模式和注册器模式。

**工厂模式**

> Factory.php

```php
<?php
class Factory{
    static function createDatabase(){
        $db = new Database();
        return $db;
    }
}
$db = Factory::createDatabase();
```

工厂模式的作用在于不在类外实例化对象。

**单例模式**

> Database.php

```php
<?php
class Database{
    protected $db;
    // 第一步
    private function __construct(){
        // private可以屏蔽外部new这个类
    }
    // 第二步
    static function getInstance(){
        if(self::$db){
            return self::$db;
        }else{
            self::$db = new self();
            return self::$db;
        }
    }
}
$db = Database::getInstance();
```

单例模式用于数据库连接等只需要一个对象的场景，避免资源的浪费。

**注册器模式**

> Register.php

```php
<?php
class Register{
    protected static $objects;
    static function set($name, $object){
        self::objects[$name] = $object;
    }
    static function get($name){
        return self::objects[$name];
    }
    static function _unset($name){
        unset(self::objects[$name]);
    }
}
Register::set('db1',$db);
$db = Register::get('$db1');
```

**适配器模式**

> 1.适配器模式，可以将截然不同的函数接口封装成统一的API
> 
> 2.实际应用举例，PHP的数据库操作有mysql,musqli,pdo三种，可以用适配器模式统一成一致。类似的场景还有cache适配器，将memcache，redis，file，apc等不同的缓存函数，统一成一致

> Database.php

```php
<?php
interdace IDatabase{
    function connect($host, $user, $passwd, $dbname);
    function query($sql);
    function close();
}
```

在Database.php中定义了数据库操作的接口，接下来将MySQL、MySQLi、PDO三种数据库操作适配为接口中定义的方法。

> MySQL.php

```php
<?php
namespace Database;
class MySQL implements IDatabase{
    protected $conn;
    function connect($host, $user, $passwd, $dbname){
        $conn = mysql_connect($host, $user, $passwd);
        mysql_select_db($dbname, $conn);
        this->conn = $conn;
    }
    function query($sql){
        $res = mysql_query($sql, $this->conn);
        return $res;
    }
    function close(){
        mysql_close($this->conn);
    }
}
```

> MySQLi.php

```php
<?php
namespace Database;
class MySQLi implements IDatabase{
    protected $conn;
    function connect($host, $user, $passwd, $dbname){
        $conn = mysqli_connect($host, $user, $passwd, $dbname);
        this->conn = $conn;
    }
    function query($sql){
        $res = mysqli_query($this->conn, $sql);
        return $res;
    }
    function close(){
        mysqli_close($this->conn);
    }
```

> PDO.php

```php
<?php
namespace Database;
class PDO implements IDatabase{
    protected $conn;
    function connect($host, $user, $passwd, $dbname){
        new PDO("mysql:host=$host;dbname=$dbname", $user, $passwd);
        $this->conn = $conn;
    }
    function query($sql){
        return $this->conn->query($sql);
    }
    function close(){
        unset($this->conn);
    }
```

然后在应用中可以这样使用：

> index.php  

```php
<?php
$db = new DatabaseMySQL();
$db->connect('localhost', 'root', 'root', 'test');
$db->query('show database');
$db->close();
```

或者实例化其他类型的数据库，只需要使用同一种标准。
