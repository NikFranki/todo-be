const express = require('express');
const router = express.Router();

const { Todo, upload } = require('../lib/todo');

const todo = new Todo({});

router.post('/list', todo.getList.bind(todo));

router.post('/get_list_by_id', todo.getTodoById);

router.post('/add', todo.addTodo);

router.post('/delete', todo.deleteTodo);

router.post('/update', todo.updateTodo);

router.get('/export', todo.exportFile);

router.post('/import', upload.single("todo"), todo.importFile);

module.exports = router;
