const fs = require('fs');
const path = require('path');
const conn = require('../../services/db');

module.exports = function(req, res, next) {
  conn.query(
    `SELECT * FROM user`,
    [],
    async (err, result) => {
      if (err) return next(err);

      // 获取所有的头像图片地址
      const avatars = result.map((item) => item.avatar?.replace(req.app.get('serverPath') + 'images/', '')).filter(item => item);

      // 进入 public/images 目录，把不存在的用户头像文件删除
      const pathName = req.app.get('imagesPath');
      fs.stat(pathName, (error, stats) => {
        if (error) {
          return next(error);
        }

        if (stats.isDirectory()) {
          fs.readdir(pathName, (error, files) => {
            if (error) {
              return next(error);
            }

            const filenames = [];
            (function iterator(count) {
              if (count === files.length) {
                const redundantFiles = filenames.filter(filename => !avatars.includes(filename));
                redundantFiles.forEach((filename) => {
                  if (fs.existsSync(`${pathName}${filename}`)) {
                    fs.unlink(`${pathName}${filename}`, (err) => {
                      if (err) {
                        return next(error);
                      }
                    });
                  } else {
                    console.log("文件不存在");
                  }
                });

                return next();
              }

              fs.stat(path.join(pathName, files[count]), (error, stats) => {
                if (error) {
                  return next(error);
                }

                if (stats.isFile() && /\.(jpg|jpeg|png|GIF|JPG|PNG)$/.test(files[count])) {
                  filenames.push(files[count]);
                }

                iterator(count + 1);
              })
            })(0);
          });
        }
      });
    });
};