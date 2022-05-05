 /**
  * @function 获取格式化后的时间
  */
 module.exports = date => {
     let year = date.getFullYear(),
         month = date.getMonth() + 1,
         day = date.getDate(),
         hour = date.getHours(),
         min = date.getMinutes(),
         sec = date.getSeconds();

     month = month < 10 ? '0' + month : month
     day = day < 10 ? '0' + day : day
     hour = hour < 10 ? '0' + hour : hour
     min = min < 10 ? '0' + min : min
     sec = sec < 10 ? '0' + sec : sec

     return `${year}-${month}-${day} ${hour}:${min}:${sec}`
 }