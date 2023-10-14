const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * 第一个版本-把数据放到内存里面，服务器关闭或者重启后数据会丢失
 */
// var items = [];

// /* post 获取列表 */
// router.post('/list', function(req, res, next) {
//   const status = req.body.status;
//   var list = [];
//   switch(status) {
//     case FILTER_ALL:
//       list = items;
//       break;
//     case FILTER_TODO:
//       list = items.filter(item => item.status === FILTER_TODO);
//       break;
//     case FILTER_DONE:
//       list = items.filter(item => item.status === FILTER_DONE);
//       break;
//     default:
//       break;
//   }
//   res.send(JSON.stringify(list));
// });

// /* post 添加一项 */
// router.post('/add', function(req, res, next) {
//   var content = req.body.content;
//   var id = uuid.v4();
//   items.push({ id, content, status: FILTER_TODO });
//   console.log('items: ', items);
//   res.send('add successfully');
// });

// /* post 删除一项 */
// router.post('/delete', function(req, res, next) {
//   var id = req.body.id;
//   var index = items.findIndex(item => item.id === id);
//   if (index === -1) {
//     res.send('Not found this item');
//     return;
//   }
//   items.splice(index, 1);
//   console.log('items: ', items);
//   res.send('delete successfully');
// });

// /* post 更新一项 */
// router.post('/update', function(req, res, next) {
//   var id = req.body.id;
//   var content = req.body.content;
//   var status = req.body.status;
//   var index = items.findIndex(item => item.id === id);
//   if (index === -1) {
//     res.send('Not found this item');
//     return;
//   }
//   items[index].content = content || items[index].content;
//   items[index].status = status || items[index].status;
//   console.log('items: ', items);
//   res.send('update successfully');
// });

/* ===================================================== */

/**
 * 第二个版本-把数据放到文件里面，多个人同时修改会出问题
 */
// const path = require('path');
// const fs = require('fs');
// const dbPath = path.resolve(__dirname, '../db.json');

// /* 读取 db.json */
// const readDB = () => {
//   return new Promise((resolve) => {
//     if (fs.existsSync(dbPath)) {
//       fs.readFile(dbPath, (err, data) => {
//         if (err) {
//           throw err;
//         } else {
//           resolve(data.toString() ? JSON.parse(data.toString()) : []);
//         }
//       });
//     } else {
//       throw new Error('not found');
//     }
//   });
// };

// /* 写入 db.json */
// const writeDB = (data) => {
//   return new Promise((resolve, reject) => {
//     fs.writeFile(dbPath, data, 'utf8', (err) => {
//       if (err) {
//         throw err;
//       }
//       resolve();
//     });
//   });
// };

// /* post 获取列表 */
// router.post('/list', async (req, res, next) => {
//   const data = await readDB();
//   let list = [];
//   switch(req.body.status) {
//     case FILTER_ALL:
//       list = data;
//       break;
//     case FILTER_TODO:
//       list = data.filter(item => item.status === FILTER_TODO);
//       break;
//     case FILTER_DONE:
//       list = data.filter(item => item.status === FILTER_DONE);
//       break;
//     default:
//       list = data;
//       break;
//   }
//   res.send(JSON.stringify(list));
// });

// /* post 添加一项 */
// router.post('/add', async (req, res, next) => {
//   const data = await readDB();
//   const content = req.body.content;
//   const id = uuid.v4();
//   data.push({ id, content, status: FILTER_TODO });
//   await writeDB(JSON.stringify(data));
//   res.send('add successfully');
// });

// /* post 删除一项 */
// router.post('/delete', async (req, res, next) => {
//   const data = await readDB();
//   const id = req.body.id;
//   const index = data.findIndex(item => item.id === id);
//   if (index === -1) {
//     res.send('Not found this item');
//     return;
//   }
//   data.splice(index, 1);
//   await writeDB(JSON.stringify(data));
//   res.send('delete successfully');
// });

// /* post 更新一项 */
// router.post('/update', async (req, res, next) => {
//   const data = await readDB();
//   const id = req.body.id;
//   const content = req.body.content;
//   const status = req.body.status;
//   const index = data.findIndex(item => item.id === id);
//   if (index === -1) {
//     res.send('Not found this item');
//     return;
//   }
//   data[index].content = content || data[index].content;
//   data[index].status = status || data[index].status;
//   await writeDB(JSON.stringify(data));
//   res.send('update successfully');
// });

/* ===================================================== */

/**
 * 第三个版本-把数据存放到 mysql
 */
const { Entry, upload } = require('../lib/entry');

const entry = new Entry({});

/**
 * post 获取列表
 * 支持条件查询
 * 支持分页查询
 */
router.post('/list', entry.getList.bind(entry));

/**
 * post 获取列表
 * 根据 id 查询
 */
router.post('/get_list_by_id', entry.getTodoById);

/* post 添加一项 */
router.post('/add', entry.addTodo);

/* post 删除一项 */
router.post('/delete', entry.deleteTodo);

/* post 更新一项 */
router.post('/update', entry.updateTodo);

/* post 导出文件 */
router.get('/export', entry.exportFile);

/* post 导入文件 */
// router.post('/import', entry.importFile);
router.post('/import', upload.single("todos"), entry.importFile);

module.exports = router;
