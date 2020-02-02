const express = require("express");
const app = express();
const fs = require("fs");
const config = require("./config/config.json");
const mysql = require("mysql2");
const axios = require("axios");
const utils = require("./utils/index");
// 解析请求体
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(8080);
// 任务列表
const taskLists = [];
// 异步读取json文件
const readFile = url => {
  return new Promise((resolve, reject) => {
    fs.readFile(url, "utf-8", (err, data) => {
      resolve(data);
    });
  });
};
// 异步写入json文件
const writeFile = (url, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(url, data, "utf-8", err => {
      if (err) {
        reject(err);
      }
    });
  });
};
// 连接数据库
const connection = mysql.createConnection(config);
connection.connect();
// 添加用户
app.post("/task/add/user", (req, res) => {
  const { userId, avatar, nickName, gender } = req.body;
  const sql = `insert into task_user (user_id, avatar, wx_name, gender) values ("${userId}", "${avatar}", "${nickName}", "${gender}")`;
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(true);
    } else {
      // 主键不能重复所以插入失败
      res.send(false);
    }
  });
});
// 查询任务列表
app.get("/task/getLists", (req, res) => {
  const { userId } = req.query;
  const sql = `select * from task_lists where user_id = ${userId}`;
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(result);
    }
  });
});
// 查询任务详情
app.get("/task/getDetails", (req, res) => {
  const { id } = req.query;
  const sql = `select * from task_lists where id = ${id}`;
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(result);
    }
  });
});
// 修改任务详情
app.post("/task/changeDetails", (req, res) => {
  const {
    taskName,
    startDate,
    endDate,
    taskType,
    taskHour,
    actualHour,
    taskDes = {},
    id
  } = req.body;
  const sql = `update task_lists set task_name="${taskName}", start_date="${startDate}", end_date="${endDate}", task_type="${taskType}", task_hour=${taskHour},actual_hour=${actualHour},task_des="${taskDes}" where id=${id}`;
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(true);
    }
  });
});
// 查询明细列表
app.get("/detail/getLists", (req, res) => {
  const { startDate, userId } = req.query;
  const sql = `select task_name, task_hour, actual_hour,start_date from task_lists where start_date = "${startDate}" and user_id = ${Number(
    userId
  )}`;
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(result);
    }
  });
});
// 查询统计列表
app.get("/count/getLists", (req, res) => {
  const { startDate, userId, dateType } = req.query;
  let sql;
  if (dateType === "上月") {
    sql = `SELECT task_name, task_hour, actual_hour FROM task_lists WHERE DATE_FORMAT( start_date, '%Y%m' ) = DATE_FORMAT( CURDATE( ) , '%Y%m' ) - 1`;
  } else if (dateType === "本月") {
    sql = `SELECT task_name, task_hour, actual_hour FROM task_lists WHERE DATE_FORMAT( start_date, '%Y%m' ) = DATE_FORMAT( CURDATE( ) , '%Y%m' )`;
  } else if (dateType === "去年") {
    sql = `SELECT task_name, task_hour, actual_hour FROM task_lists WHERE DATE_FORMAT( start_date, '%Y' ) = DATE_FORMAT( CURDATE( ) , '%Y' ) - 1`;
  } else if (dateType === "今年") {
    sql = `SELECT task_name, task_hour, actual_hour FROM task_lists WHERE DATE_FORMAT( start_date, '%Y' ) = DATE_FORMAT( CURDATE( ) , '%Y' )`;
  } else {
    sql = `select task_name, task_hour, actual_hour from task_lists where user_id = ${Number(
      userId
    )} and date(start_date) between date_sub(date('${startDate}'), interval weekday(date('${startDate}')) day) and date_sub(date('${startDate}'), interval weekday(date('${startDate}')) -6 day) order by weekday(date(start_date))`;
  }
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(result);
    }
  });
});

// 添加任务
app.post("/task/add/taskItem", (req, res) => {
  const {
    taskName,
    taskType,
    taskHour,
    taskDes,
    userId,
    startDate,
    endDate
  } = req.body;
  const sql = `insert into task_lists (task_name, task_type, task_hour, task_des, user_id, start_date, end_date) values ("${taskName}", "${taskType}", ${taskHour}, "${taskDes}", ${userId}, "${startDate}", "${endDate}")`;
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(true);
    }
  });
});
// 删除任务
app.delete("/task/delete/taskItem", (req, res) => {
  const { id } = req.body;
  const sql = `delete from task_lists where id=${id}`;
  connection.query(sql, (err, result) => {
    if (!err) {
      res.send(true);
    }
  });
});
// 用户登录
app.get("/task/login", (req, res) => {
  const { code } = req.query;
  // 通过code换取openId和session_key
  if (code) {
    axios
      .get("https://api.weixin.qq.com/sns/jscode2session", {
        params: {
          appid: "wx27d183902cd7eb24",
          secret: "5d2476a80028d3d4104bff9e981d4353",
          js_code: code,
          grant_type: "authorization_code"
        }
      })
      .then(({ data }) => {
        res.send({
          openId: utils.cryptPwd(data.openid),
          sessionKey: data.session_key
        });
      });
  }
});
