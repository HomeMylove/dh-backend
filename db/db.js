const mysql = require('mysql')


const database = {
    host: 'localhost', // 数据库的 IP 地址
    user: 'root', // 登录数据库的账号
    password: 'password', // 登录数据库的密码
    database: 'dh', // 要操作的数据库
}

module.exports = mysql.createPool(database)