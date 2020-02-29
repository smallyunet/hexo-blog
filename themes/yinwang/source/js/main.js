if (/mobile/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent)) {
  document.body.classList.add('mobile')
}

// 阅读时长统计
(() => {
  var e = document.getElementById('time-statistics')
  var second = 0
  var render = () => { 
    var s = ''
    if (second < 60) {
      s = `${second}秒`
    } else if (second < 3600) {
      s = `${parseInt(second/60)}分钟${second%60}秒`
    } else {
      s = `${parseInt(second/3600)}小时...哇哦!`
    }
    e.innerHTML = s
    second += 1
  }
  setInterval(render, 1000);
})()

