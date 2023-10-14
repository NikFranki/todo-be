const express = require('express');
const router = express.Router();

const Folder = require('../lib/folder');
const folder = new Folder();

/* post 查询列表 */
router.post('/list', folder.getList);

/* post 添加一项 */
router.post('/add', folder.addFolder);

/* post 删除一项 */
router.post('/delete', folder.deleteFolder);

/* post 更新一项 */
router.post('/update', folder.updateFolder);

module.exports = router;
