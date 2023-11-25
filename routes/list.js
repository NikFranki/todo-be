const express = require('express');
const router = express.Router();

const List = require('../lib/list');
const list = new List();

router.post('/all', list.getList);

router.post('/add', list.addList);

router.post('/delete', list.deleteList);

router.post('/update', list.updateList);

router.post('/update-by-drag-and-drop', list.updateListByDragAndDrop);

module.exports = router;

