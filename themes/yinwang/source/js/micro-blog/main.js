
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



// content
$(() => {

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
        res.map(i => {
            let date = new Date(i.created_at).format("yyyy年MM月dd日 hh:mm:ss")
            let item = `<li class="list-group-item">`
            item += `<div class="date">${date}</div>`
            item += `<div class="content" style="margin-top:5px;">${marked(i.body)}</div>`
            item += `</li>`
            ul.append(item)
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
        let url = 'https://api.github.com/repos/smallyunet/hexo-blog/issues/7/comments'
        $.ajax({
            url: url,
            success: res => {
                process(res)
                localStorage.setItem('micro-blog-content', JSON.stringify(res))
            },
            error: (jqXHR, textStatus, errorThrown) => {
                let res = localStorage.getItem('micro-blog-content')
                if (res == null) {
                    processError(jqXHR, textStatus, errorThrown)
                }
            }
        })
    }

    // 先读取预加载的内容
    let res = localStorage.getItem('micro-blog-content')
    if (res) {
        process(JSON.parse(res))
    }
    // 然后发请求 
    reqUrlWithProcess()

})

