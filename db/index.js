// 数据库的操作
const config = require("../config/config.json");
const mysql = require("mysql2");
const connectDatabase = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(config);
    if (connection) {
      resolve(connection);
    }
  });
};
module.exports = {
  connectDatabase
};
