# 这是后台部分

## 前言

本项目后台由nodejs搭建，在开始之前，请确定配置好了node环境，以及安装 npm包管理工具

## 安装依赖

在根目录执行

```shell
npm install
```

安装所需依赖

## 准备

在启动服务器之前，请配置好数据库

本项目使用了MySQL数据库

在命令行依次执行以下命令

创建数据库

```sql
CREATE DATABASE IF NOT EXISTS dh;
USE dh;
```

推荐使用 dh 作为数据库名

创建 article数据表

```sql
CREATE TABLE `dh`.`article` (
  `article_id` INT NOT NULL AUTO_INCREMENT,
  `author_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `text` MEDIUMTEXT NOT NULL,
  `time` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`article_id`));
```

article_id: 文章 id 主键

author_id: 作者 id

title: 文章标题

text: 正文

time: 上传时间，在用户上传时有用

创建 author数据表

```sql
CREATE TABLE `dh`.`author` (
  `author_id` INT NOT NULL,
  `author_name` VARCHAR(45) NOT NULL,
  `kana_name` VARCHAR(100) NULL,
  `roman_name` VARCHAR(100) NULL,
  `about` VARCHAR(2000) NULL,
  PRIMARY KEY (`author_id`));
```

author_id: 作者id

author_name: 作者汉字名

kana_name: 作者假名

roman_name:作者罗马音

about:作者简介

创建 comments数据表

```sql
CREATE TABLE `dh`.`comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `article_id` INT NOT NULL,
  `gender` VARCHAR(45) NOT NULL,
  `comment` VARCHAR(1000) NOT NULL,
  `time` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`));
```

id: 评论 id 主键

article_id: 评论文章

gender: 性别，用于确定头像

comment:评论内容

time: 评论时间

创建 discussion 数据表

```sql
CREATE TABLE `dh`.`discussion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `to_id` VARCHAR(45) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `comment` VARCHAR(2000) NOT NULL,
  `time` VARCHAR(45) NOT NULL,
  `gender` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`));
```

id: 讨论id

to_id:在 type为reply时有用

type:区分回复和讨论

comment:讨论内容

time：时间

gender：性别，用于确定头像

## 插入数据

进入db文件夹

```shell
cd db
```

在 db.js中配置数据库

```javascript
const database = {
    host: 'localhost', // 数据库的 IP 地址
    user: 'root', // 登录数据库的账号
    password: 'password', // 登录数据库的密码
    database: 'dh', // 要操作的数据库
}
```

需要修改password属性的值为数据库的密码，如果数据库命不为dh，还需要修改datatabase的值

运行文件夹下的 addAuthor.js文件，将about_author.json中的数据写入数据库

```shell
node addAuthor.js
```

运行文件夹下的addArticle.js文件，将src文件夹中的数据写入数据库

```shell
node addArticle.js
```

> 本项目数据来源为 青空文库
>
> about_author.json 几乎为全部的作者
>
> resource 文件夹中的内容经过了删减，原数据由爬虫抓取

## 启动

执行

```shell
node app.js
```