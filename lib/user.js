const jwt = require('jsonwebtoken');
const conn = require('../services/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const authVerify = require('./middleware/authVerify');

const storage = multer.diskStorage({
  // 确定上传文件存放服务器的物理路径
  destination: (req, file, callback) => {
    // 文件不存在，跳过不存储
    if (!file.originalname) {
      return;
    }
    callback(null, req.app.get('imagesPath'));
  },
  filename: (req, file, callback) => {
    if (!file.originalname) {
      return;
    }
    // 根据上传时间的 unix 时间戳来命名文件名
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

class User {
  constructor(obj) {
    for (const key in obj) { // 循环遍历传入对象的键
      this[key] = obj[key]; // 合并值
    }
  }

  async register(req, res, next) {
    // 头像存放地址
    const avatar = req.file ? `${req.app.get('serverPath')}images/${req.file.filename}` : '';
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    conn.query(
      `SELECT * FROM user WHERE username=?`,
      [username],
      (err, result) => {
        if (err) return next(err);
        if (result.length !== 0) return next(new Error('user already exists'));

        conn.query(
          'INSERT INTO user VALUES (?,?,?)',
          [username, hashedPassword, avatar],
          (err, result) => {
            if (err) return next(err);

            res.statusCode = 201;
            res.send(JSON.stringify({
              code: 200,
              message: 'success',
            }));
          }
        );
      });
  }

  login(req, res, next) {
    const { username, password } = req.body;
    conn.query(
      `SELECT * FROM user WHERE username=?`,
      [username],
      async (err, result) => {
        if (err) return next(err);

        if (result.length === 0) {
          res.statusCode = 404;
          res.send(JSON.stringify({
            code: -1,
            message: 'user does not exist',
          }));

          return next(new Error('user does not exist'));
        }

        const hashedPassword = result[0].password;
        const isPasswordEqual = await bcrypt.compare(password, hashedPassword);
        if (isPasswordEqual) {
          const data = {
            username: result[0].username,
            avatar: result[0].avatar,
          };
          // record userinfo
          req.session.userInfo = data;
          // sending back the token
          const token = authVerify.generateToken(data);
          res.header(process.env.TOKEN_HEADER_KEY, token);
          res.send(JSON.stringify({
            code: 200,
            message: `${username} is logged in!`,
            data,
            token,
          }));
        } else {
          res.send(JSON.stringify({
            code: -1,
            message: 'password incorrect!',
          }));
        }
      });
  }

  logout(req, res, next) {
    req.session.destroy((err) => {
      if (err) return next(err);

      res.send({
        code: 200,
        message: 'logout successfully',
      });
    });
  }

  searchUser(req, res, next) {
    if (res.locals.userInfo) {
      res.send({
        code: 200,
        message: 'success',
        data: res.locals.userInfo,
      });
    } else {
      // Access Denied 
      res.send({
        code: -1,
        message: 'user not login, please login first',
      });
    }
  }

  update(req, res, next) {
    const newUsername = req.body.username;
    const oldUsername = req.session.userInfo.username;
    const oldAvatar = req.session.userInfo.avatar;
    if (!newUsername) return next(new Error('must specific username!'));

    const newAvatar = req.file ? `${req.app.get('serverPath')}images/${req.file.filename}` : oldAvatar;
    conn.query(
      `UPDATE user SET username=?, avatar=? WHERE username=?`,
      [newUsername, newAvatar, oldUsername],
      (err) => {
        if (err) return next(err);

        const data = {
          username: newUsername,
          avatar: newAvatar,
        };
        // 更新用户登录态
        req.session.userInfo = data;
        res.send(JSON.stringify({
          code: 200,
          message: 'success',
        }));
      });
  }
}

module.exports = { User, upload };