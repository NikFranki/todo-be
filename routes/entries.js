const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

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
