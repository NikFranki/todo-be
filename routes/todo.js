const express = require('express');
const router = express.Router();

const { Todo, upload, todoAttachmentsUpload } = require('../lib/todo');

const todo = new Todo();

router.post('/list', todo.getList.bind(todo));

router.post('/get_list_by_id', todo.getTodoById);

router.post('/add', todo.addTodo);

router.post('/delete', todo.deleteTodo.bind(todo));

router.post('/update', todoAttachmentsUpload.single("file"), todo.updateTodo.bind(todo));

router.get('/export', todo.exportFile);

router.post('/import', upload.single("todo"), todo.importFile);

module.exports = router;
