/**
 * 后台项目
 */

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = 5001
const db = require('./db/db')
const getFormarTime = require('./utils/getFormatTime')

/**
 * 解决跨域
 */
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// 读取 body
app.use(bodyParser.json());

app.use('/img', express.static('./img/'))

/**
 * 获取首页的推荐 (目前是假的数据)
 * */
app.get('/api/recommend', (req, res) => {
    const db = require('./db/recommend.json')

    const data = []
    for (let i = 0; i < db.length; i++) {
        const book = {
            title: db[i][0],
            articleId: db[i][1],
            imgUrl: db[i][2],
        }
        data.push(book)
    }

    res.json({
        status: 200,
        data
    })
})


/**
 * 关键词搜索 
 * 参数
 *      keyword :关键词
 *      choice :类型
 *              author 获取作者
 *              book 获取作品
 * sql 查询语句应该尽量只 查找 “需要的”数据
 * 
 * 返回值
 *       data ==> Array [{},{}]
 */
app.post('/api/getInfo', (req, res) => {
    let { keyword, choice } = req['body']
    keyword = keyword.trim()

    let query
    let sqlStr

    switch (choice) {
        case 'author':
            sqlStr = 'SELECT author_id as authorId,author_name as authorName,about FROM author WHERE author_name like ?'
            query = ['%' + keyword + "%"]
            break;
        case 'book':
            sqlStr = `SELECT a.article_id as articleId,a.author_id as authorId,a.title,
                    b.author_name as authorName    
                    FROM article AS a,author AS b 
                    WHERE title like ? AND a.author_id = b.author_id`
            query = ['%' + keyword + "%"]
            break;
        default:
            break
    }
    db.query(sqlStr, query, (err, results) => {
        if (err || !results) return res.json({ message: err || 'wrong', status: 500 })
        else res.json({ status: 200, data: results })
    })
})

/**
 * 获取作者信息 以及 他的作品
 * 参数
 *      authorId:   作者的 author_id 为 author 表的主键
 * 返回值
 *      data  ==>  Object {
 *              authorName,
 *              about, 
 *              authorId,
 *              object article
 *             }
 */
app.get('/api/getAuthorInfo', async(req, res) => {
    const authorId = req.query.authorId || 0
    const sqlStr = 'SELECT author_name as authorName,author_id as authorId,about FROM author WHERE author_id=?'
    db.query(sqlStr, [authorId], (err, results) => {
        if (err || !results) return res.json({ message: err || 'wrong', status: 500 })
        else if (results.length == 1) {
            const response = results[0]

            // 继续获取书籍信息
            const sqlStr = 'SELECT article_id as articleId,title FROM article WHERE author_id=?'
            db.query(sqlStr, [authorId], (err, results) => {
                if (err || !results) return res.json({ message: err || 'wrong', status: 500 })
                response['articles'] = results
                return res.json({
                    status: 200,
                    data: response
                })
            })
        } else res.json({ status: 404, message: 'not found author' })
    })
})


/**
 * 获取一篇文章
 * 参数
 *      articleId: 文章的 article_id 应该是 article 表的主键
 * 返回值
 *      data  ==>  Object {
 *                  title:标题信息，用于显示  
 *                  text:文章正文
 *                  articleId
 *                  authorId: 用于回滚到作者页
 *                  authorName: 用于显示                 
 *              }
 */
app.get('/api/getText', (req, res) => {
    const articleId = req.query.articleId || 0
    const sqlStr = `SELECT a.title,a.text,a.article_id AS articleId,a.author_id AS authorId,
                    b.author_name AS authorName
                    FROM article AS a,author AS b                
                    WHERE a.article_id=? AND a.author_id = b.author_id`
    db.query(sqlStr, [articleId], (err, results) => {
        if (err || !results) return res.json({ message: err || 'wrong', status: 500 })
        else if (results.length == 1) {
            return res.json({ status: 200, data: results[0] })
        } else res.json({ message: 'not found article', status: 404 })
    })
})

/**
 * 发送一条评论
 * 参数
 *      data =>{
 *          articleId:用于确定属于哪篇文章
 *          gender:存储性别
 *          comment:评论
 *      }
 * comments 表字段
 *          article_id
 *          gender
 *          comment
 *          time
 */
app.post('/api/sendComment', (req, res) => {
    const { articleId, gender, comment } = req['body']

    // 获取当前时间字符串
    let time = getFormarTime(new Date())
    const sqlStr = 'INSERT INTO comments SET ?'
    const data = {
        article_id: articleId,
        gender,
        comment,
        time
    }
    db.query(sqlStr, [data], (err, results) => {
        if (err || !results) return res.json({ message: err || 'wrong', status: 500 })
        else if (results.affectedRows == 1) {
            return res.send(JSON.stringify({
                status: 200,
                message: '成功'
            }))
        } else res.json({ message: 'wrong to insert comment', status: 500 })
    })
})

/**
 * 获取评论
 * 参数
 *      articleId
 *      order:
 *          desc 默认 降序
 *          asc  升序
 * sql 字段
 *      全部
 * 返回值
 *      全部
 *      data => Array [{}]
 */
app.get('/api/getComment', (req, res) => {
    const articleId = req.query.articleId || 0
    const order = req.query.order || 'desc'
    const sqlStr = `SELECT * FROM comments WHERE article_id=? ORDER BY id ${order}`
    db.query(sqlStr, [articleId, order], (err, results) => {
        if (err || !results) return res.json({ message: err || 'wrong', status: 500 })
        else {
            res.json({ status: 200, data: results })
        }
    })
})

/**
 * 检查是否有名字 用于上传名称时 检测
 * 参数
 *      ?name=name
 * 返回值
 *      data => boolean
 *                  true  name 存在
 *                  false  name 不存在
 */
app.get('/api/checkAuthorName', (req, res) => {
    const name = req.query.name || ''
    const sqlStr = 'SELECT author_id FROM author WHERE author_name=?'
    db.query(sqlStr, [name], (err, results) => {
        if (err || !results) return res.json({ message: 'wrong', status: 500 })
        else res.json({ status: 200, data: results.length > 0 ? true : false })
    })
})

/**
 * 上传新的作者，返回结果
 * 参数
 *      name
 *      description
 * 返回值
 *      成功 返回 true
 */
app.post('/api/uploadAuthor', (req, res) => {
    const { name, description } = req['body']
        //  统计 以 确认id
    const sqlStr = 'SELECT author_id FROM author'
    db.query(sqlStr, [], (err, results) => {
        if (err || !results) return res.json({ message: 'wrong', status: 500 })
        let author_id
        if (results.length == 0) author_id = 1
        else {
            const last_id = results[results.length - 1]['author_id']
            author_id = parseInt(last_id) + 1
        }
        // 插入数据
        const data = {
            author_id,
            author_name: name,
            about: description
        }
        const sqlStr = 'INSERT INTO author SET ?'
        db.query(sqlStr, [data], (err, results) => {
            if (err || !results || results.affectedRows != 1) return res.json({ message: 'wrong to add author', status: 500 })
            else res.json({ message: 'success', status: 200, data: true })
        })
    })
})

/**
 * 返回作者的authot_id 没有 则为 -1,
 * 用于判断新增作品是否存在作者
 * 参数
 *      name
 * 返回值
 *      data => int 不存在为 -1
 */
app.get('/api/getAuthorId', (req, res) => {
    const name = req.query.name || ''
    const sqlStr = 'SELECT author_id FROM author WHERE author_name=?'
    db.query(sqlStr, [name], (err, results) => {
        if (err || !results) return res.json({ message: 'wrong', status: 500 })
        else {
            let response
            if (results.length == 0) {
                response = -1
            } else {
                response = results[0]['author_id']
            }
            return res.json({ status: 200, data: response })
        }
    })
})

/**
 * 上传一个作品，返回结果
 * 参数
 *      title
 *      text
 *      author_id
 * article 字段
 *      author_id
 *      title
 *      time
 *      text
 *      (article_id 是主键)
 * 返回值
 *      data => 成功 返回 true
 */
app.post('/api/uploadArticle', (req, res) => {
    const { title, text, author_id } = req['body']
    const data = {
        time: parseInt(Date.now() / 1000), // 精确到秒
        author_id,
        title,
        text
    }
    const sqlStr = 'INSERT INTO article SET ?'
    db.query(sqlStr, [data], (err, results) => {
        if (err || !results || results.affectedRows != 1) return res.json({ message: 'wrong to add article', status: 500 })
        else res.json({ message: 'success to add article', status: 200, data: true })
    })
})


/** 
 * 上传讨论
 * 参数     
 *      to_id: reply 类型时有效
 *      type:['comment','reply']
 *      comment
 *      gender
 * discussion 表
 *      id 主键
 *      to_id  
 *      type
 *      time
 *      comment
 *      gender
 * 返回值
 *      data => 成功 true
 * */
app.post('/api/sendDiscussion', (req, res) => {
    let { to_id, type, gender, comment } = req['body']
    comment = comment.replace(/[<>]/, '')
        // 匹配url
        // /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    const reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g
    const str = comment.match(reg)
    const host = 'http://localhost:8080/'
    if (str && str.length > 0) {
        str.forEach(v => {
            const index = v.indexOf(host)
            if (index == 0) {
                const newStr = '<a href="' + v + '">' + v + '</a>'
                comment = comment.replace(v, newStr)
            }
        })
    }
    const sqlStr = 'INSERT INTO discussion SET ?'
    const data = {
        to_id,
        type,
        gender,
        comment,
        time: getFormarTime(new Date())
    }
    db.query(sqlStr, [data], (err, results) => {
        if (err || !results || results.affectedRows != 1) return res.json({ message: 'wrong to add discussion', status: 500 })
        else res.json({ status: 200, data: true, message: 'success to add discussion' })
    })
})

/**
 * 获取讨论
 * 参数
 *      keyword 
 *      order :['desc','asc']
 * 返回值
 *      data => Array [{}]
 */
app.get('/api/getDiscussion', (req, res) => {
    const keyword = req.query.keyword || ''
    const order = req.query.order || 'desc'

    let sqlStr
    let query

    if (keyword == '') {
        sqlStr = 'SELECT * FROM discussion WHERE type=?'
        query = [
            'comment'
        ]
    } else {
        sqlStr = 'SELECT * FROM discussion WHERE type=? AND comment like ?'
        query = [
            'comment',
            '%' + keyword + '%'
        ]
    }
    db.query(sqlStr, query, (err, results) => {
        if (err || !results) return res.json({ message: 'wrong to get discussion', status: 500 })
        let response = []
        if (results.length > 0) {
            response = results
            if (order == 'desc') {
                response.sort((a, b) => {
                    return b.id - a.id
                })
            }
            response.forEach(v => v['reply'] = [])
            const sqlStr = 'SELECT * from discussion WHERE type=?'
            const query = 'reply'
            db.query(sqlStr, [query], (err, results) => {
                if (err || !results) return res.json({ message: 'wrong to get discussion', status: 500 })
                results.forEach(reply => {
                    response.forEach(comt => {
                        if (reply.to_id == comt.id) comt['reply'].push(reply)
                    })
                })
                res.json({ status: 200, data: response })
            })

        } else res.json({ status: 200, data: response })
    })
})

/**
 * 获取新上传的作品,在首页展示
 */
app.get('/api/getNewArticle', (req, res) => {
    const latestTime = parseInt(Date.now() / 1000) - 86400
    const sqlStr = `SELECT a.article_id as articleId,a.author_id as authorId,a.title,a.time,
                    b.author_name as authorName from article AS a,author as b    
                    WHERE a.time > ? AND a.author_id = b.author_id ORDER BY article_id DESC`
    db.query(sqlStr, [latestTime], async(err, results) => {
        if (err || !results) return res.json({ message: err || 'wrong to get new articles', status: 500 })
        const response = results
        response.forEach(v => {
            v['time'] = getFormarTime(new Date(v['time'] * 1000))
        })
        res.json({ status: 200, data: response, message: 'success' })
    })
})


app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
})