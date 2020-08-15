
// 获得相对路径
function getUrlRelativePath() {
　　var url = document.location.toString();
　　var arrUrl = url.split("//");

　　var start = arrUrl[1].indexOf("/");
　　var relUrl = arrUrl[1].substring(start); //stop省略，截取从start开始到结尾的所有字符

　　if(relUrl.indexOf("?") != -1){
　　　　relUrl = relUrl.split("?")[0];
　　}
　　return relUrl;
}

// 入口
$(() => {
  // tooltip
  $('[data-toggle="tooltip"]').tooltip();

  // 代码高亮
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightBlock(block);
  });

  // 文章总数
  if (document.getElementById("articleCounts") != undefined) {
    localStorage.setItem("articleCounts", document.getElementById("articleCounts").innerHTML)
  }
  if (document.getElementById("articleCountsAbout") != undefined) {
    document.getElementById("articleCountsAbout").innerHTML=localStorage.getItem("articleCounts")
  }

  // 首页预加载微博内容
  if (getUrlRelativePath() == '/') {
    let url = 'https://api.github.com/repos/smallyunet/hexo-blog/issues/7/comments'
    $.get(url, res => {
      localStorage.setItem('micro-blog-content', JSON.stringify(res))
    })
  }

});

