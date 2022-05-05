const db = require('./db')
const data = require('./about_author.json')

function insertAuthor() {
    const quene = data.map((item, index) => {
        const sqlStr = 'INSERT INTO author SET ?'
        const author = {
            author_id: item['author_id'],
            author_name: item['kanji_name'],
            kana_name: item['kana_name'],
            roman_name: item['roman_name'],
            about: item['about']
        }
        return new Promise((resove, reject) => {
            db.query(sqlStr, [author], (err, results) => {
                if (err) return reject(err)

                resove('ok', index)
            })
        })

    })

    Promise.all(quene).then(() => {
        console.log('ok');
    })
}

insertAuthor()