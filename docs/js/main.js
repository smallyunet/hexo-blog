
document.addEventListener('DOMContentLoaded', (event) => {
  // 判断移动设备
  if (/mobile/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent)) {
    document.body.classList.add('mobile')
  }

  // 代码高亮
  document.querySelectorAll('.highlight').forEach((block) => {
    hljs.highlightBlock(block);
  });

  // 文章总数
  if (document.getElementById("articleCounts") != undefined) {
    localStorage.setItem("articleCounts", document.getElementById("articleCounts").innerHTML)
  }
  if (document.getElementById("articleCountsAbout") != undefined) {
    document.getElementById("articleCountsAbout").innerHTML=localStorage.getItem("articleCounts")
  }

});

