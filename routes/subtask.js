const express = require('express');
const router = express.Router();

const { Subtask } = require('../lib/subtask');

const todo = new Subtask({});

router.post('/list', todo.getList);

router.post('/get_list_by_id', todo.getSubtaskById);

router.post('/add', todo.addSubtask);

router.post('/delete', todo.deleteSubtask);

router.post('/update', todo.updateSubtask);

module.exports = router;
