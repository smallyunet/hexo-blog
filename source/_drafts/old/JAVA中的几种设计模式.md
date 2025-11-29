---
title: JAVA 中的几种设计模式
date: 2017-02-11 00:00:00
tags:
  - JAVA
  - 设计模式
---


**单例模式**

饿汉模式

> Singleton.java

```java
package com.imooc;
public class Singleton {
    // 1.将构造方法私有化，不允许外部直接创建对象
    private Singleton() {
        
    }
    // 2.创建类的唯一示例,使用private static修饰
    private static Singleton instance = new Singleton();
    // 3.提供一个用于获取示例的方法
    public static Singleton getInstance() {
        return instance;
    }
}
```

饿汉模式指第二步时，加载类的同时生成了实例化的对象。特点是加载类时比较慢，但运行时获取对象的速度比较快，线程安全。

> Test.java

```java
package com.imooc;
public class Test {
    private static void main(String\[\] args) {
        Singleton s1 = Singleton.getInstance;
        Singleton s2 = Singleton.getInstance;
    }
}
```

懒汉模式

> Singleton2.java

```java
package com.imooc

public class Singleton2 {
    // 1.将构造方法私有化，不允许外部直接创建对象
    private Singleton2() {
        
    }

    // 2.创建类的唯一示例,使用private static修饰
    private static Singleton2 instance;

    // 3.提供一个用于获取示例的方法
    public static Singleton2 getInstance() {
        if(install==null){
            instance = new Singleton2();
        }
        return instance;
    }
}
```

懒汉模式指第二步没有实例化对象，而是在第三步，当调用方法，才会判断并进行实例化，特点是加载类时比较快，但运行时获取对象的速度比较慢，线程不安全。

**模板方法模式**  

应用场景为模拟制备饮料。制备饮料一共有四个步骤，即为RefreshBeverage.java中注释中写到的四步。泡制饮料和加入调味料在抽象基类中没有提供具体的实现方法，只是定义接口方法，在子类中应用模板方法模式分别实现具体内容。

第四步加入调味料用到了钩子方法，可以提高代码灵活性，判断子类要泡制的饮料中要不要加入调味料。

> RefreshBeverage.java

```java
package com.imooc.pattern.template;

/**
 * 抽象基类，为所有子类提供一个算法框架
 * 
 * 提神饮料
 */
public abstract class RefreshBeverage {
    
    /**
     * 制备饮料的模板方法
     * 封装了所有子类共同遵循的算法框架
     */
    public final void prepareBeverageTemplate() {
        // 步骤1 将水煮沸
        boilWater();
        // 步骤2 泡制饮料
        brew();
        // 步骤3 将饮料倒入杯中
        pourInCup();
        if(isCustomerWantsCondiments()){
            // 步骤4 加入调味料
            addCondiments();
        }
    }

    /**
     * Hook，钩子函数，提供一个默认或空的实现
     * 具体的子类可以自行决定是否挂钩或者如何挂钩
     * 询问用户是否加入调料
     */
    protected boolean isCustomerWantsCondiments() {
        return true;
    }

    /**
     * 基本方法，将水煮沸
     */
    private void boilWater() {
        System.out.println("将水煮沸");
    }

    /**
     * 抽象的基本方法，泡制饮料
     */
    protected abstract void brew();

    /**
     * 基本方法，将饮料倒入杯中
     */
    private void pourInCup() {
        System.out.println("将饮料倒入杯中");
    }

    /**
     * 抽象的基本方法，加入调味料
     */
    protected abstract void addCondiments();
}
```

> Coffee.java

```java
package com.imooc.pattern.template;

/**
 * 具体子类，提供了咖啡制备的具体实现
 */
public class Coffee extends RefreshBeverage {
    
    protected void brew() {
        System.out.println("用沸水冲泡咖啡");
    }

    protected void addCondiments() {
        System.out.println("加入糖和牛奶");
    }
}
```

> Tea.java

```java
package com.imooc.pattern.template;

/**
 * 具体子类，提供了制备茶的具体实现
 */
public class Tea extends RefreshBeverage {

    protected void brew() {
        System.out.println("用80度的热水浸泡茶叶5分钟");
    }

    protected void addCondiments() {
        System.out.println("加入柠檬");
    }
    
    /**
     * 子类通过覆盖的方式选择挂载钩子函数
     */
    protected boolean isCustomerWantsCondiments(){
        return false;
    }

}
```

> RefreshBeverageTest.java

```java
package com.imooc.pattern.template;

public class RefreshBeverageTest {

    public static void main(String\[\] args) {

        System.out.println("制备咖啡...");
        RefreshBeverage b1 = new Coffee();
        b1.prepareBeverageTemplate();
        System.out.println("咖啡好了！");
        
        System.out.println("****************************************");
        
        System.out.println("制备茶...");
        RefreshBeverage b2 = new Tea();
        b2.prepareBeverageTemplate();
        System.out.println("茶好了！");
    }

}
```

运行结果：  

```
制备咖啡...    
将水煮沸   
用沸水冲泡咖啡        
将饮料倒入杯中    
加入糖和牛奶    
咖啡好了！    
\**********************************   
制备茶...   
将水煮沸    
用80度的热水浸泡茶叶5分钟   
将饮料倒入杯中    
茶好了！    
```

其中用到的钩子方法会使子类更加灵活。

**适配器模式**

应用场景为模拟二相转三相插座适配器，NoteBook需要三相电流供电，但只有二相电流插座，TwoPlugAdapter.java中适配了二相电流。

> ThreePlugIf.java

```java
package com.imooc.apttern.adapter;
/**
 * 三相插座接口
 */
public interface ThreePlugIf {
  // 使用三相电流供电
  public void powerWithThree(){
        
  }
}
```

> GBTwoPlug.java

```java
package com.imooc.apttern.adapter;

public class GBTwoPlug {
  // 使用二相电流供电
  public void powerWithTwo(){
    System.out.println("使用二相电流供电");
  }
}
```

> NoteBook.java

```java
package com.imooc.apttern.adapter;

public class NoteBook {
  private ThreePlugIf plug;
  public NoteBook(ThreePlugIf plug){
    this.plug = plug;
  }
  // 使用插座充电
  public void change(){
    plug.powerWithThree();
  }
  public static void main(String[] args){
    GBTwoPlug two = new GBTwoPlug();
    ThreePlugIf three = new TwoPlugAdapter(two);
    NoteBook nb = new NoteBook(three);
    nb.change();
  }
}
```

> TwoPlugAdapter.java

```java
package com.imooc.apttern.adapter;

/**
 * 二相转三相的插座适配器
 */
public class TwoPlugAdapter implements ThreePlugIf {
  private GBTwoPlug plug;
  public TwoPlugAdapter(GBTwoPlug plug){
    this.plug = plug;
  }
  public void powerWithThree() {
    System.out.println("通过转化");
    plug.powerWithTwo();
  }
}
```

运行结果：  

```
通过转化
使用二相电流供电
```

**策略模式**

策略模式将可变部分从程序中抽象分离成算法接口，在该接口下分别封装一系列算法实现

What is composition ?

在类中增加一个私有域，引用另一个已有的类的实例，通过调用引用实例的方法从而获得新的功能，这种设计被称作组合（复合）。

策略模式的优点：

> 1.使用了组合，是架构更加灵活
> 
> 2.富有弹性，可以较好的应对变化（开——闭原则）
> 
> 3.更好的代码复用性（相对于继承）
> 
> 4.消除大量的条件语句

策略模式的缺点：

> 1.客户代码需要了解每个策略的细节
> 
> 2.增加了对象的数目

策略模式的应用场景：

> 1.许多相关的类仅仅是行为差异
> 
> 2.运行时选取不同的算法变体
> 
> 3.通过条件语句在多个分支中选取一

代码的应用场景模拟了鸭子的生产过程，鸭子一共有三个行为：展示、鸣叫、飞行。不同的鸭子有不同的飞行行为，使用到了策略模式。  

> Duck.java

```java
package com.imooc.pattern.strategy;

/**
 * 超类，所有的鸭子都要继承此类
 * 抽象了鸭子的行为：显示和鸣叫
 */
public abstract class Duck {
  /**
   * 鸭子发出叫声
   * 通用行为，由超类实现
   */
  public void quack(){
    System.out.println("嘎嘎嘎");
  }
  /**
   * 显示鸭子的外观
   * 鸭子的外观不相同，声明为abstract，由子类实现
   */
  public abstract void display();
  private FlyingStrategy flyingStrategy;
  public void setFlyingStrategy(FlyingStrategy flyingStrategy){
    this.flyingStrategy = flyingStrategy;
  }
  public void fly(){
    flyingStrategy.performFly();
  }
}
```

> FlyingStrategy.java

```java
package com.imooc.pattern.strategy;

/**
 * 策略接口，实现鸭子的飞行行为
 */
public interface FlyingStrategy {
  void performFly();
}
```

> MallardDuck.java

```java
package com.imooc.pattern.strategy;

import com.imooc.pattern.strategy.impl.FlyWithWin;

// 绿脖鸭
public class MallardDuck extends Duck {
  public MallardDuck(){
    super();
    super.setFlyingStrategy(new FlyWithWin());
  }
  @Override
  public void display() {
    System.out.println("我的脖子是绿色的");
  }
}
```

> RedheadDuck.java

```java
package com.imooc.pattern.strategy;

import com.imooc.pattern.strategy.impl.FlyWithWin;

// 红头鸭
public class RedheadDuck extends Duck {
  public RedheadDuck(){
    super();
    super.setFlyingStrategy(new FlyWithWin());
  }
  public void display() {
    System.out.println("我的头是红色的");
  }
}
```

> RubberDuck.java

```java
package com.imooc.pattern.strategy;

import com.imooc.pattern.strategy.impl.FlyNoWay;

// 橡胶鸭
public class RubberDuck extends Duck {
  public RubberDuck(){
    super();
    super.setFlyingStrategy(new FlyNoWay());
  }
  @Override
  public void display() {
    System.out.println("我全身发黄，嘴巴很红");
  }
  public void quack(){
    // 叫声稍有不同，复写了父类方法
    System.out.println("嘎~嘎~嘎~");
  }
}
```

不同的飞行策略类：

> FlyWithWin.java

```java
package com.imooc.pattern.strategy.impl;

import com.imooc.pattern.strategy.FlyingStrategy;

public class FlyWithWin implements FlyingStrategy {
  @Override
  public void performFly() {
    System.out.println("振翅高飞");
  }
}
```

> FlyNoWay.java

```java
package com.imooc.pattern.strategy.impl;

import com.imooc.pattern.strategy.FlyingStrategy;

public class FlyNoWay implements FlyingStrategy {
  @Override
  public void performFly() {
    System.out.println("我不会飞行！");
  }
}
```

最后测试生产出的鸭子：  

> DuckTest.java

```java
package com.imooc.pattern.strategy;

public class DuckTest {
  public static void main(String[] args){
    System.out.println("测试鸭子程序");
    Duck duck = null;
//      duck = new MallardDuck();
//      duck = new RedheadDuck();
    duck = new RubberDuck();
    duck.display();
    duck.quack();
    duck.fly();
    System.out.println("测试完毕");
  }
}
```

运行结果:

```
测试鸭子程序    
我全身发黄，嘴巴很红    
嘎~嘎~嘎~   
我不会飞行！    
测试完毕    
```

这样就用JAVA实现了策略模式。

**代理模式**

> 远程代理：为不同地理的对象提供局域网代表对象
> 
> 虚拟代理：根据需要将资源消耗很大的对象进行延迟，真正需要的时候进行创建
> 
> 保护代理：控制用户的访问权限
> 
> 智能引用代理：提供对目标对象额外服务

应用场景模拟了汽车行驶时间的显示和日志记录两个功能。  

> Moveable.java

```java
package com.imooc.proxy;

// 接口文件
public interface Moveable {
  void move();
}
```

> Car.java

```java
package com.imooc.proxy;

import java.util.Random;

public class Car implements Moveable {
  public void move() {
    // 实现开车
    try{
      Thread.sleep(new Random().nextInt(1000));
      System.out.println("汽车行驶中……");
    }catch(InterruptedException e){
      e.printStackTrace();
    }
  }
}
```

> Car2.java  

```java
package com.imooc.proxy;

// 实现汽车行驶时间
public class Car2 extends Car {
  public void move(){
    long strattime = System.currentTimeMillis();
    System.out.println("汽车开始行驶……");
    super.move();
    long endtime = System.currentTimeMillis();
    System.out.println("汽车结束行驶中…… 汽车行驶时间："+(endtime-strattime)+"毫秒！");
  }
}
```

> Car3.java

```java
package com.imooc.proxy;

// 时间代理实现汽车行驶时间
public class Car3 implements Moveable {
  public Car3(Car car) {
    super();
    this.car = car;
  }
  private Car car;
  public void move(){
    long strattime = System.currentTimeMillis();
    System.out.println("汽车开始行驶……");
    car.move();
    long endtime = System.currentTimeMillis();
    System.out.println("汽车结束行驶中…… 汽车行驶时间："+(endtime-strattime)+"毫秒！");
  }
}
```

> Car4.java

```java
package com.imooc.proxy;

// 增加log记录代理
public class Car4 implements Moveable {
  public Car4(Moveable m) {
    super();
    this.m = m;
  }
  private Moveable m;
  public void move(){
    System.out.println("日志开始……");
    m.move();
    System.out.println("日志结束……");
  }
}
```

> Client.java

```java
package com.imooc.proxy;

/**
 * 测试类
 */
public class Client {
    public static void main(String[] args){
  // 直接
//      Car car = new Car();
//      car.move();
  // 使用集成方法
//      Moveable m = new Car2();
//      m.move();
  // 使用聚合方法
//      Car car = new Car();
//      Moveable m = new Car3(car);
//      m.move();
  // 增加日志记录
  Car car = new Car();
  Car3 ctp = new Car3(car);
  Car4 clp = new Car4(ctp);
  clp.move();
    }
}
```

运行结果像这样：  

```
日志开始……    
汽车开始行驶……    
汽车行驶中……    
汽车结束行驶中…… 汽车行驶时间：497毫秒！    
日志结束……    
```

下面使用动态代理来是代码更灵活（**有错误**）。

> TimeHandler.java

```java
package com.imooc.jdkproxy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

import com.imooc.proxy.Car;

/**
 * JDK动态代理
 * 只能代理实现了接口的类
 * 没有实现接口的类不能实现JDK的动态代理
 */
public class TimeHandler implements InvocationHandler {
  public TimeHandler(Object target){
    super();
    this.target = target;
  }
  private Object target;
  /**
   * 参数
   * proxy 被代理对象
   * method 被代理的方法
   * args 方法的参数
   * 返回值
   * Object 方法的返回值
   */
  @Override
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    long strattime = System.currentTimeMillis();
    System.out.println("汽车开始行驶……");
    method.invoke(target, args);
    long endtime = System.currentTimeMillis();
    System.out.println("汽车结束行驶中…… 汽车行驶时间："+(endtime-strattime)+"毫秒！");
    return null;
  }
}
```

> Test.java

```java
package com.imooc.jdkproxy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

import com.imooc.proxy.Car;
import com.imooc.proxy.Moveable;

/**
 * JDK动态代理测试类
 */
public class Test {
  public static void main(String[] args){
    Car car = new Car();
    InvocationHandler h = new TimeHandler(car);
    Class<?> cls = car.getClass();
    /**
     * loader 类加载器
     * interface 实现接口
     * h InvocationHandler
     */
    Moveable m = (Moveable)Proxy.newProxyInstance(cls.getClassLoader(), cls.getInterfaces(), h);
    m.move();
  }
}
```

etc.
