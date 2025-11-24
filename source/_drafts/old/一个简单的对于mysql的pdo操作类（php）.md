---
title: 一个简单的对于Mysql的PDO操作类（PHP）
date: 2017-03-03 00:00:00
tags:
  - PHP
  - PDO
---


类结构本身稍微混乱，方法没有规章，这是缺点。  

> PDOMysql.class.php  

```php
<?php

define("DB_HOST", "localhost");
define("DB_USER", 'root');
define("DB_PWD", 'root');
define("DB_NAME", 'minyy');
define("DB_PORT", '3306');
define("DB_TYPE", 'mysql');
define("DB_CHARSET", 'utf8');

class PDOMySQL{

    public static $config = array();  // 设置连接参数 配置信息
    public static $link = null; // 保存连接标志符
    public static $pconnect = false;   // 是否开启长连接
    public static $dbVersion = null;    // 保存数据库版本
    public static $connected = false;   // 是否连接成功
    public static $PDOStatement = null; // 保存PDOStatement对象
    public static $queryStr = null; // 保存最后执行的操作
    public static $error = null;    // 报错错误信息
    public static $lastInsertId = 0;    // 保存上一步插入操作产生AUTO_INSREMENT
    public static $numRows = 0; // 上一步操作产生受影响的记录条数

    /**
     * 构造函数实现连接数据库
     * @param array $dbConfig 配置项参数
     */
    public function __construct($dbConfig = ''){
        if(!class_exists("PDO")){
            self::throw_exception('不支持PDO，请先开启');
        }
        if(!$dbConfig || !is_array($dbConfig)){
            $dbConfig = array(
                'hostname' => DB_HOST,
                'username' => DB_USER,
                'password' => DB_PWD,
                'database' => DB_NAME,
                'hostport' => DB_PORT,
                'dbms' => DB_TYPE,
                'dsn' => DB_TYPE.":host=".DB_HOST.";dbname=".DB_NAME,
                );
        }
        if(empty($dbConfig['hostname'])) self::throw_exception('没有定义数据库配置');
        self::$config = $dbConfig;
        if(empty(self::$config['params'])) self::$config['params'] = array();
        if(!isset(self::$link)){
            $configs = self::$config;
            if(self::$pconnect){
                // 开启长连接，添加到配置数组中
                $configs['params'][constant("PDO::ATTR_PERSISTENT")] = true;
            }
            try{
                self::$link = new PDO($configs['dsn'], $configs['username'], $configs['password'], $configs['params']);
            }catch(PDOException $e){
                self::throw_exception($e->getMessage());
            }
            if(!self::$link){
                self::throw_exception('PDO连接错误');
                return false;
            }
            self::$link->exec('SET NAMES '.DB_CHARSET);
            self::$dbVersion = self::$link->getAttribute(constant("PDO::ATTR_SERVER_VERSION"));
            self::$connected = true;
            unset($configs);
        }
    }

    /**
     * 得到所有记录
     * @param  string $sql SQL语句
     * @return array      得到所有数据
     */
    public static function getAll($sql = null){
        if($sql){
            self::query($sql);
        }
        $result = self::$PDOStatement->fetchAll(constant("PDO::FETCH_ASSOC"));
        return $result;
    }

    /**
     * 得到结果集中的一条记录
     * @param  string $sql sql语句
     * @return array      返回一条数据
     */
    public static function getRow($sql = null){
        if($sql != null){
            self::query($sql);
        }
        $result = self::$PDOStatement->fetch(constant("PDO::FETCH_ASSOC"));
        return $result;
    }

    /**
     * 根据主键查找记录
     * @param  string $tabName 表名
     * @param  string $priId   主键id
     * @param  string $field   查询项
     * @return array          一条记录
     */
    public static function findById($tabName, $priId, $field='*'){
        $sql = "SELECT %s FROM %s WHERE id=%d";
        return self::getRow(sprintf($sql, self::parseField($field), $tabName, $priId));
    }

    /**
     * 执行普通查询
     * @param  string $tables 查询表名
     * @param  string $where  where
     * @param  string $fields 要查询字段
     * @param  string $group  group by
     * @param  string $having having
     * @param  string $order  order
     * @param  string $limit  limit
     * @return array         [description]
     */
    public static function find($tables, $where = null, $fields = '*', $group = null, $having = null, $order = null, $limit = null){
        $sql = 'SELECT '.self::parseField($fields).' FROM '.$tables
            .self::parseWhere($where)
            .self::parseGroup($group)
            .self::parseHaving($having)
            .self::parseOrder($order)
            .self::parseLimit($limit);
        $dataAll = self::getAll($sql);

        return count($dataAll)==1 ? $dataAll[0] : $dataAll;
    }

    /**
     * 添加记录的操作
     * @param array $data  要添加的内容
     * @param int $table 受影响的条数
     */
    public static function add($data, $table){
        $keys = array_keys($data);
        array_walk($keys,array('PDOMySQL','addSpecilChar'));
        $fieldsStr=join(',',$keys);
        $values="'".join("','",array_values($data))."'";
        $sql = "INSERT {$table}({$fieldsStr}) VALUES({$values})";
        return self::execute($sql);
    }

    /**
     * 更新记录
     * @param  array $data  要更新内容
     * @param  string $table 表名
     * @param  string $where 条件
     * @param  string $order 排序
     * @param  string $limit 限制
     * @return int       受影响条数
     */
    public static function update($data, $table, $where = null, $order = null, $limit = null){
        $sets = '';
        foreach ($data as $key => $val) {
            $sets .= $key."='".$val."',";
        }
        $sets = rtrim($sets,',');
        $sql = "UPDATE {$table} SET {$sets} ".self::parseWhere($where).self::parseOrder($order).self::parseLimit($limit);
        return self::execute($sql);
    }

    /**
     * 解析字段
     * @param  string $fields 字段
     * @return string         解析后的字段
     */
    public static function parseField($fields){
        if(is_array($fields)){
            array_walk($fields, array('PDOMySQL', 'addSpecilChar'));
            $fieldsStr = implode(',',$fields);
        }elseif(is_string($fields) && !empty($fields)){
            if(strpos($fields, '`') === false){
                $fields = explode(',', $fields);
                array_walk($fields, array('PDOMySQL', 'addSpecilChar'));
                $fieldsStr = implode(',',$fields);
            }else{
                $fieldsStr = $fields;
            }
        }else{
            $fieldsStr = '*';
        }
        return $fieldsStr;
    }

    /**
     * 删除操作
     * @param  string  $table 表名
     * @param  string  $where 条件
     * @param  string  $order 排序
     * @param  integer $limit 限制
     * @return integer        受影响条数
     */
    public static function delete($table, $where=null, $order=null, $limit=0){
        $sql = "DELETE FROM {$table} ".self::parseWhere($where).self::parseOrder($order).self::parseLimit($limit);
        return self::execute($sql);
    }

    /**
     * 得到最后执行的sql语句
     * @return string sql语句
     */
    public static function getLastSql(){
        $link=self::$link;
        if(!$link) return false;
        return self::$queryStr;
    }

    /**
     * 得到插入操作产生的AUTO_INCREMENT
     * @return int 被操作id
     */
    public static function getLastInsertId(){
        $link=self::$link;
        if(!$link) return false;
        return self::$lastInsertId;
    }

    /**
     * 得到数据库的版本
     * @return float 数据库版本
     */
    public static function getDbVersion(){
        $link=self::$link;
        if(!$link) return false;
        return self::$dbVersion;
    }

    /**
     * 得到数据库中的数据表
     * @return array 所有数据表
     */
    public static function showTbales(){
        $tables = [];
        if(self::query("SHOW TABLES")){
            $result = self::getAll();
            foreach ($result as $key => $value) {
                $tables[$key]=current($value);
            }
        }
        return $tables;
    }

    /**
     * 解析where字段
     * @param  string $where 字段
     * @return string        解析后的字段
     */
    public static function parseWhere($where){
        $whereStr = '';
        if(is_string($where) && !empty($where)){
            $whereStr = $where;
        }
        return empty($whereStr) ? '' : ' WHERE '.$whereStr;
    }

    /**
     * 解析分组字段group by
     * @param  string $group 字段
     * @return string        解析后的字段
     */
    public static function parseGroup($group){
        $groupStr = '';
        if(is_array($group)){
            $groupStr .= ' GROUP BY '.implode(',', $group);
        }elseif(is_string($group) && !empty($group)){
            $groupStr .= ' GROUP BY '.$group;
        }
        return empty($groupStr) ? '' : $groupStr;
    }

    /**
     * 对分组进行二次筛选
     * @param  string $having 字段
     * @return string         解析后的字段
     */
    public static function parseHaving($having){
        $havingStr = '';
        if(is_string($having) && !empty($having)){
            $havingStr = ' HAVING '.$having;
        }
        return $havingStr;
    }

    /**
     * 解析order by
     * @param  string $order 字段
     * @return string        解析后的字段
     */
    public static function parseOrder($order){
        $orderStr = '';
        if(is_array($order)){
            $orderStr .= ' ORDER BY '.join(',',$order);
        }elseif(is_string($order) && !empty($order)){
            $orderStr .= ' ORDER BY '.$order;
        }
        return $orderStr;
    }

    /**
     * 解析limit
     * @param  strign $limit 字段
     * @return strign        解析后的字段
     */
    public static function parseLimit($limit){
        $limitStr = '';
        if(is_array($limit)){
            if(count($limit) > 1){
                $limitStr = ' LIMIT '.$limit[0].','.$limit[1];
            }else{
                $limitStr = ' LIMIT '.$limit[0];
            }
        }elseif(!empty($limit)){
            $limitStr .= ' LIMIT '.$limit;
        }
        return $limitStr;
    }

    /**
     * 通过反引号引用字段
     * @param string &$value 不同类型字段
     */
    public static function addSpecilChar(&$value){
        if($value === '*' || strpos($value, '.') != false || strpos($value, '`') != false){
            // 不做处理
        }elseif(strpos($value, '`') === false){
            $value = '`'.trim($value).'`';
        }
        return $value;
    }

    /**
     * 执行增删改操作，返回受影响的记录条数
     * @param  string $sql sql语句
     * @return int      受影响条数
     */
    public static function execute($sql = null){
        $link = self::$link;
        if(!$link) return false;
        self::$queryStr = $sql;
        if(!empty(self::$PDOStatement)) self::free();
        $result = $link->exec(self::$queryStr);
        self::haveErrorThrowException();
        if($result){
            self::$lastInsertId = $link->lastInsertId();
            self::$numRows = $result;
            return self::$numRows;
        }else{
            return false;
        }
    }

    /**
     * 释放结果集
     * @return null null
     */
    public static function free(){
        self::$PDOStatement = null;
    }

    public static function query($sql = ''){
        $link = self::$link;
        if(!$link) return false;
        // 判断之前是否有结果集，如果有，释放结果集
        if(!empty(self::$PDOStatement)) self::free();
        self::$queryStr = $sql;
        self::$PDOStatement = $link->prepare(self::$queryStr);
        $res = self::$PDOStatement->execute();
        self::haveErrorThrowException();
        return $res;
    }

    public static function haveErrorThrowException(){
        $obj = empty(self::$PDOStatement) ? self::$link : self::$PDOStatement;
        $arrError = $obj->errorInfo();
        if($arrError[0] != '00000'){
            self::$error = 'SQLStatus: '.$arrError[0].'<br />SQLError: '.$arrError[2].'<br />Error SQL: '.self::$queryStr;
            self::throw_exception(self::$error);
            return false;
        }
        if(self::$queryStr == ''){
            self::throw_exception('没有执行的SQL语句');
            return false;
        }
    }

    /**
     * 自定义错误处理
     * @param  string $errMsg 错误信息
     * @return null         null
     */
    public static function throw_exception($errMsg){
        echo $errMsg;
    }

    /**
     * 销毁连接对象，关闭数据库
     * @return null null
     */
    public static function close(){
        self::$link = null;
    }
}
```

在场景中这样来使用，注释后的内容分别用来测试不同方法：

> index.php  

```php
<?php

$PDOMySQL = new PDOMySQL();

// 查询全部记录
$sql = 'SELECT * FROM cheat_exam';
$res = $PDOMySQL->getAll($sql);

// 查询一条记录
$sql = 'SELECT * FROM cheat_exam WHERE id=1';
$res = $PDOMySQL->getRow($sql);

// 插入一条记录
$sql = 'INSERT cheat_exam(name) VALUES (1)';
$res = $PDOMySQL->execute($sql);
echo $PDOMySQL::$lastInsertId;

// 删除一条记录
$sql = 'DELETE FROM cheat_exam WHERE id=115';
$res = $PDOMySQL->execute($sql);

// 更新一条记录
$sql = 'UPDATE arr SET name="1" WHERE id=1';
$res = $PDOMySQL->execute($sql);

// 根据主键查询一条记录
$tabName = 'cheat_exam';
$priId = 1;
$fields='subject,name';
$fields = array('subject','name');
$res = $PDOMySQL->findById($tabName, $priId, $fields);

// 执行普通查询
$tables = 'cheat_exam';
$res = $PDOMySQL->find($tables);
$res = $PDOMySQL->find($tables, 'id>=30');
$res = $PDOMySQL->find($tables, 'id>=30', 'subject,name');
$res = $PDOMySQL->find($tables, 'id>=30', '*', 'subject');
$res = $PDOMySQL->find($tables, 'id>=30', '*', 'subject', 'count(*)>=8');
$res = $PDOMySQL->find($tables, 'id>=30', '*', '', '', 'id desc');
$res = $PDOMySQL->find($tables, 'id>=30', '*', '', '', 'id desc', 5);

// 更新一条记录
$data = [
    'subject' => 'imooc',
    'name' => 'name'
    ];
$table = "cheat_exam";
$res = $PDOMySQL->add($data, $table);
// 也是更新操作
$data = [
    'subject' => 'imooc',
    'name' => 'name'
    ];
$table = "cheat_exam";
$res = $PDOMySQL->update($data, $table, 'id<=3', 'id desc', 5);

// 删除操作
$table = "cheat_exam";
$res = $PDOMySQL->delete($table, 'id<3');

// 得到数据表
$res = $PDOMySQL->showTbales();

print_r($res);
```

会打印出不同结果。  

The End.
