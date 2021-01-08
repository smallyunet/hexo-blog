
Date.prototype.format = function(fmt) { 
    var o = { 
       "M+" : this.getMonth()+1,                 //月份 
       "d+" : this.getDate(),                    //日 
       "h+" : this.getHours(),                   //小时 
       "m+" : this.getMinutes(),                 //分 
       "s+" : this.getSeconds(),                 //秒 
       "q+" : Math.floor((this.getMonth()+3)/3), //季度 
       "S"  : this.getMilliseconds()             //毫秒 
   }; 
   if(/(y+)/.test(fmt)) {
           fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
   }
    for(var k in o) {
       if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
   return fmt; 
} 

$(() => {
    // 根据路由指定 active tab
    let defaultYear = "2021"
    let seg = location.href.split("#").length >= 2 ? location.href.split("#")[1] : defaultYear
    let seg2 = seg.split("-").length >= 2 ? seg.split("-")[0]: defaultYear
    let ele = $(`.nav.nav-tabs a[href=#${seg2}]`).parent()
    ele.addClass("active")
    let ele2 = $(`.tab-content #${seg2}`)
    ele2.addClass("active")
})

// content
$(() => {

    // 内容渲染
    let ul = $('.micro-blog .ul-content-2020')
    ul.append(`
        <div style="text-align:center;">
            <div class="loadingio-spinner-ripple-8txk08frrfa">
                <div class="ldio-fwkeq5l2tj8"><div></div><div></div></div>
            </div>
        </div>
    `)

    let process = res => {
        ul.html(``)
        // 时间倒序
        res.sort((a, b) => {
            return a.created_at >= b.created_at ? -1 : 1
        })
        let id = res.length
        res.map(i => {
            let date = new Date(i.created_at).format("yyyy年MM月dd日 hh:mm:ss")
            let item = `<li class="list-group-item">`
            item += `<div class="date">${date}`
            item +=     `<a href="#2020-${id}" name=2020-${id}>#${id}</a>`
            item += `</div>`
            item += `<div class="content" style="margin-top:5px;">${marked(i.body)}</div>`
            item += `</li>`
            ul.append(item)
            id -= 1
        })
    }

    let processError = (jqXHR, textStatus, errorThrown) => {
        ul.html(`网络异常，请刷新页面重试。 <a href="/micro-blog">点击刷新</a>`)
        let outer = $('.outer')
        outer.append(`
            <br>
            <p style="font-size:85%;">状态：${textStatus}</p>
            <p style="font-size:85%;">信息：${errorThrown}</p>
        `)
    }
    
    let reqUrlWithProcess = () => {
        let url = '/micro-blog/2020.json'
        $.ajax({
            url: url,
            success: res => {
                process(res)
                localStorage.setItem('micro-blog-2020', JSON.stringify(res))
            },
            error: (jqXHR, textStatus, errorThrown) => {
                let res = localStorage.getItem('micro-blog-2020')
                if (res == null) {
                    processError(jqXHR, textStatus, errorThrown)
                }
            }
        })
    }

    // 先读取预加载的内容
    let res = localStorage.getItem('micro-blog-2020')
    if (res) {
        process(JSON.parse(res))
    }
    // 然后发请求 
    reqUrlWithProcess()

})

// content
$(() => {

    // 内容渲染
    let ul = $('.micro-blog .ul-content-2021')
    ul.append(`
        <div style="text-align:center;">
            <div class="loadingio-spinner-ripple-8txk08frrfa">
                <div class="ldio-fwkeq5l2tj8"><div></div><div></div></div>
            </div>
        </div>
    `)

    let process = res => {
        ul.html(``)
        // 时间倒序
        res.sort((a, b) => {
            return a.created_at >= b.created_at ? -1 : 1
        })
        let id = res.length
        res.map(i => {
            let date = new Date(i.created_at).format("yyyy年MM月dd日 hh:mm:ss")
            let item = `<li class="list-group-item">`
            item += `<div class="date">${date}`
            item +=     `<a href="#2021-${id}" name=2021-${id}>#${id}</a>`
            item += `</div>`
            item += `<div class="content" style="margin-top:5px;">${marked(i.body)}</div>`
            item += `</li>`
            ul.append(item)
            id -= 1
        })
    }

    let processError = (jqXHR, textStatus, errorThrown) => {
        ul.html(`网络异常，请刷新页面重试。 <a href="/micro-blog">点击刷新</a>`)
        let outer = $('.outer')
        outer.append(`
            <br>
            <p style="font-size:85%;">状态：${textStatus}</p>
            <p style="font-size:85%;">信息：${errorThrown}</p>
        `)
    }
    
    let reqUrlWithProcess = () => {
        let url = '/micro-blog/2021.json'
        $.ajax({
            url: url,
            success: res => {
                process(res)
                localStorage.setItem('micro-blog-2021', JSON.stringify(res))
            },
            error: (jqXHR, textStatus, errorThrown) => {
                let res = localStorage.getItem('micro-blog-2021')
                if (res == null) {
                    processError(jqXHR, textStatus, errorThrown)
                }
            }
        })
    }

    // 先读取预加载的内容
    let res = localStorage.getItem('micro-blog-2021')
    if (res) {
        process(JSON.parse(res))
    }
    // 然后发请求 
    reqUrlWithProcess()

})

