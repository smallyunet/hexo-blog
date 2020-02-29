if (/mobile/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent)) {
  document.body.classList.add('mobile')
}

// 秒钟数格式化
var secondRender = (second) => {
  var s = ''
  if (second < 60) {
    s = `${second}秒`
  } else if (second < 3600) {
    s = `${parseInt(second/60)}分钟${second%60}秒`
  } else {
    s = `${parseInt(second/3600)}小时...哇哦!`
  }
  return s
}

// 默认秒钟数
var SECOND_DEFAULT_VALUE = 1

// 当前阅读时长统计
;(() => {
  var e = document.getElementById('time-stat-page-curr')
  if (e == null) return
  // 从本地记录读取
  var second = SECOND_DEFAULT_VALUE
  var render = () => {
    e.innerHTML = secondRender(second)
    second += SECOND_DEFAULT_VALUE
    return render
  }
  setInterval(render(), 1000);
})()

// 当前历史阅读时长统计
;(() => {
  var e = document.getElementById('time-stat-page-total')
  if (e == null) return
  // 从本地记录读取
  var second = parseInt(localStorage.getItem(location.href))
  if (isNaN(second)) {
    second = SECOND_DEFAULT_VALUE
  }
  var render = () => {
    e.innerHTML = secondRender(second)
    second += SECOND_DEFAULT_VALUE
    localStorage.setItem(location.href, second)
    return render
  }
  setInterval(render(), 1000);
})()

// 全站总阅读时长统计
;(() => {
  var e = document.getElementById('time-stat-all-total')
  if (e == null) return
  // 从本地记录读取
  var second = SECOND_DEFAULT_VALUE 
  var ls = localStorage.valueOf()
  for (var i = 0; i < ls.length; i++) {
    second += parseInt(localStorage.getItem(localStorage.key(i)))
  }
  if (isNaN(second)) {
    second = SECOND_DEFAULT_VALUE
  }
  var render = () => {
    e.innerHTML = secondRender(second)
    second += SECOND_DEFAULT_VALUE
    return render
  }
  setInterval(render(), 1000);
})()
