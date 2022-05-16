const db = require('./db')

function insertFrom(strat, to) {
    for (let i = strat; i <= to; i++) {
        const fileName = `../src/work${i}.json`
        const work = require(fileName)
        console.log('正在添加....', i);
        inertMysql(work)
    }
}

function inertMysql(data) {
    const quene = data.map((item, index) => {

        if (item == null) return
        const sqlStr = 'INSERT INTO article SET ?'

        const author = {
            author_id: item['author_id'],
            title: item['title'],
            text: item['text']
        }

        return new Promise((resove, reject) => {
            db.query(sqlStr, [author], (err, results) => {
                if (err) return reject(err)
                resove('ok', index)
            })
        })
    })

    Promise.all(quene).then((data) => {
        console.log('ok', data.length);
    })
}
// 注意，不能一次写入太多数据，否则会连接超时
// 一次大约30
insertFrom(1,1);