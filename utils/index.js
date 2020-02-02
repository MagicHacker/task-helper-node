// 工具类
const crypto = require("crypto");
// 获取随机盐值
const getRandomSalt = () => {
  return Math.random()
    .toString()
    .slice(2, 5);
};
// 加盐md5
const cryptPwd = val => {
  const md5 = crypto.createHash("md5");
  const result = val + getRandomSalt();
  return md5.update(result).digest("base64");
};
module.exports = {
  cryptPwd
};
