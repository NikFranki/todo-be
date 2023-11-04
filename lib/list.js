const conn = require('../services/db');
const { DEFAULT_LIST_NAMES, MY_DAY, IMPORTANT, PLANNED, TASKS } = require('../constant');

class List {

  constructor() {
    this.init();
  }

  async init() {
    try {
      const list = await conn.queryPromise('SELECT * FROM list');
      if (list.length) return;

      DEFAULT_LIST_NAMES.forEach(name => {
        conn.query(
          `INSERT INTO list (name) VALUES (?)`,
          [name, null],
          (err) => {
            if (err) throw new Error(err);
          },
        );
      });
    } catch (error) {
      throw new Error('select error');
    }
  }

  async getList(req, res, next) {
    try {
      const list = await conn.queryPromise('SELECT * FROM list ORDER BY id');
      const addedMyDayTodo = await conn.queryPromise('SELECT count(id) AS addede_my_day_todo_count FROM todo WHERE todo.added_my_day = 1');
      const markedAsImportantTodo = await conn.queryPromise('SELECT count(id) AS marked_as_important_todo_count FROM todo WHERE todo.marked_as_important = 1');
      const plannedTodo = await conn.queryPromise('SELECT count(id) AS planned_todo_count FROM todo WHERE todo.due_date IS NOT NULL');
      const taskTodo = await conn.queryPromise('SELECT count(id) AS task_todo_count FROM todo WHERE todo.list_id=5 AND todo.marked_as_completed=0');
      const numberOfTodoInListId = await conn.queryPromise('SELECT list_id, count(list_id) FROM todo GROUP BY list_id');
      const numberOfTodoInListIdMap = numberOfTodoInListId.reduce((acc, prev) => {
        acc[prev.list_id] = prev['count(list_id)'];
        return acc;
      }, {});
      // special logic
      numberOfTodoInListIdMap[MY_DAY] = addedMyDayTodo[0].addede_my_day_todo_count;
      numberOfTodoInListIdMap[IMPORTANT] = markedAsImportantTodo[0].marked_as_important_todo_count;
      numberOfTodoInListIdMap[PLANNED] = plannedTodo[0].planned_todo_count;
      numberOfTodoInListIdMap[TASKS] = taskTodo[0].task_todo_count;
      list.forEach(item => {
        item.number = numberOfTodoInListIdMap[item.id] || 0;
      });
      res.send({
        code: 200,
        message: 'success',
        list,
      });
    } catch (error) {
      return next(error);
    }
  }

  async addList(req, res, next) {
    const name = req.body.name;
    if (!name) return next(new Error('list name can not be empty!'));

    try {
      const list = await conn.queryPromise('SELECT * FROM list ORDER BY create_time DESC');
      const isExisted = list.some(item => item.name === name);
      if (isExisted) return next(new Error('list name can be unqiue!'));
      await conn.queryPromise(`INSERT INTO list (name) VALUES (?)`, [req.body.name]);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateList(req, res, next) {
    if (!req.body.id) return next(new Error('must specific id!'));
    try {
      await conn.queryPromise('UPDATE list SET name=? WHERE id=?', [req.body.name, req.body.id]);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteList(req, res, next) {
    if (!req.body.id) return next(new Error('must specific id!'));
    try {
      await conn.queryPromise(`DELETE FROM list WHERE id=?`, [req.body.id]);
      await conn.queryPromise('DELETE FROM todo WHERE list_id=?', [req.body.id]);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = List;