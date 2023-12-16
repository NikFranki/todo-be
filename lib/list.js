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

      DEFAULT_LIST_NAMES.forEach((name, index) => {
        conn.query(
          `INSERT INTO list (name, index_order, user_id) VALUES (?, ?, ?)`,
          [name, index + 1, 'common'],
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
      const fixedList = await conn.queryPromise('SELECT * FROM list WHERE user_id=? ORDER BY index_order', ['common']);
      const otherList = await conn.queryPromise('SELECT * FROM list WHERE user_id=? ORDER BY index_order', [res.locals.username]);
      const addedMyDayTodo = await conn.queryPromise(`SELECT count(id) AS addede_my_day_todo_count FROM todo WHERE user_id='${res.locals.username}' AND todo.added_my_day = 1 AND todo.marked_as_completed=0`);
      const markedAsImportantTodo = await conn.queryPromise(`SELECT count(id) AS marked_as_important_todo_count FROM todo WHERE user_id='${res.locals.username}' AND todo.marked_as_important = 1 AND todo.marked_as_completed=0`);
      const plannedTodo = await conn.queryPromise(`SELECT count(id) AS planned_todo_count FROM todo WHERE user_id='${res.locals.username}' AND todo.due_date IS NOT NULL AND todo.marked_as_completed=0`);
      const taskTodo = await conn.queryPromise(`SELECT count(id) AS task_todo_count FROM todo WHERE user_id='${res.locals.username}' AND todo.list_id=5 AND todo.marked_as_completed=0`);
      const numberOfTodoInListId = await conn.queryPromise(`SELECT list_id, count(list_id) FROM todo WHERE user_id='${res.locals.username}' AND todo.marked_as_completed=0 GROUP BY list_id`);
      const numberOfTodoInListIdMap = numberOfTodoInListId.reduce((acc, prev) => {
        acc[prev.list_id] = prev['count(list_id)'];
        return acc;
      }, {});
      // special logic
      numberOfTodoInListIdMap[MY_DAY] = addedMyDayTodo[0].addede_my_day_todo_count;
      numberOfTodoInListIdMap[IMPORTANT] = markedAsImportantTodo[0].marked_as_important_todo_count;
      numberOfTodoInListIdMap[PLANNED] = plannedTodo[0].planned_todo_count;
      numberOfTodoInListIdMap[TASKS] = taskTodo[0].task_todo_count;
      const list = [...fixedList, ...otherList];
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
      const list = await conn.queryPromise('SELECT * FROM list');
      const isExisted = list.some(item => item.name === name);
      if (isExisted) return next(new Error('list name can be unqiue!'));
      const orderResults = await conn.queryPromise('SELECT IFNULL((SELECT index_order FROM list ORDER BY index_order DESC LIMIT 1) ,0) as max_index_order');
      await conn.queryPromise(`INSERT INTO list (name, index_order, user_id) VALUES (?, ?, ?)`, [req.body.name, orderResults[0].max_index_order + 1, res.locals.username]);
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

  async updateListByDragAndDrop(req, res, next) {
    const list = req.body.list;
    try {
      for (const item of list) {
        await conn.queryPromise('UPDATE list SET index_order=? WHERE id=?', [item.index_order, item.id]);
      }
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