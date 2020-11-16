---
title: 关于
date: 2018-11-02 21:25:43
type: about
---

Hi~ My name is...

<img src="img/avatar.jpg" 
  width="15%" 
  style="margin-left:0;" 
  class="no-shadow">

### 导航

<p>
  当前页面：<a href="#ex1" 
    class="exBtn" 
    rel="modal:open" 
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="音乐的力量">网易云音乐</a>
</p>

<p>
  站内链接：<a href="/pages/said-before" 
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="以前的信仰">说过的话</a>
    |
  <a href="/pages/books-read"
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="">看过的书</a> 
</p>
<p style="margin-left:5em;"> 
  <a href="/pages/tv-us"
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="爱和正义">看过的美剧</a> 
  |
  <a href="/pages/tv-jp"
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="">好看的日漫</a> 
</p>

<p>
  站外链接：<a href="https://github.com/smallyunet" 
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="">GitHub</a>
  |
  <a href="https://leetcode-cn.com/u/smallyu/" 
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="">LeetCode</a>
  |
  <a href="https://www.yuque.com/smallyu" 
    data-toggle="tooltip" 
    data-placement="bottom" 
    title="">语雀</a>
</p>

<div id="ex1" class="modal">
  <img src="img/NetEase.jpg" width="60%" class="no-shadow">
  <a href="#" rel="modal:close">关闭</a>
</div>

<script>
$(".exBtn").click(function() {
  $(this).modal({
    escapeClose: true,
    clickClose: true,
    showClose: true,
    fadeDuration: 100
  });
  return false
})
</script>

### 联系

如果你对任何话题感兴趣，可以发送信息到邮箱 hello@smallyu.net 。

