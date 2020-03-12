if (/mobile/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent)) {
  document.body.classList.add('mobile')
}

document.addEventListener('DOMContentLoaded', (event) => {
  document.querySelectorAll('.highlight').forEach((block) => {
    hljs.highlightBlock(block);
  });

  // 文章总数
  if (document.getElementById("articleCounts") != undefined) {
    localStorage.setItem("articleCounts", document.getElementById("articleCounts").innerHTML)
  }
  console.log()
  if (document.getElementById("articleCountsAbout") != undefined) {
    document.getElementById("articleCountsAbout").innerHTML=localStorage.getItem("articleCounts")
  }
});

