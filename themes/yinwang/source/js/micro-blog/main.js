

$(() => {

    let ul = $('#micro-blog ul')

    let loadingEl = `
        <div class="progress">
            <div id="loading" class="progress-bar progress-bar-info progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%">
            </div>
        </div>
    `
    ul.append(loadingEl)
    let loading = $('#micro-blog ul #loading')

    let w = 0
    let timer = setInterval(() => {
        w += 5
        loading.css('width', `${w}%`)
    }, 200)

    let url = 'https://api.github.com/repos/smallyunet/hexo-blog/issues/7/comments'
    $.ajax({
        url: url,
        success: res => {
            console.log(res)

            loading.css('width', "100%")
            clearInterval(timer)
            ul.html(``)

            res.map(i => {
                let item = `<li class="list-group-item title">`
                item += `<div class="date">${new Date(i.created_at)}</div>`
                item += `<div style="margin-top:5px;">${i.body}</div>`
                item += `</li>`
                ul.append(item)
            })
        },
        error: () => {
            clearInterval(timer)
            ul.html(`网络异常，请刷新页面重试。 <a href="/micro-blog">点击刷新</a>`)
        }
    })

})

