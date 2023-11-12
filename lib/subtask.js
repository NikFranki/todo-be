const conn = require('../services/db');

class Subtask {
  async getSubtaskById(req, res, next) {
    const { id } = req.body;
    try {
      const list = await conn.queryPromise('SELECT * FROM subtask WHERE id=?', [id]);
      res.send({
        code: 200,
        message: 'success',
        data: list[0],
      });
    } catch (error) {
      return next(error);
    }
  }

  async getList(req, res, next) {
    const {
      id,
      todo_id,
    } = req.body;
    const sqlTotal = 'SELECT *, DATE_FORMAT(create_time, "%Y-%m-%d %H:%i:%s") AS create_time_alias, DATE_FORMAT(update_time, "%Y-%m-%d %H:%i:%s") AS update_time_alias FROM subtask';
    const idQuery = id ? ' WHERE subtask.id=?' : '';
    const todoIdQuery = todo_id ? ` ${idQuery ? 'AND' : 'WHERE'} todo_id=?` : '';
    const sqlStatus = `${sqlTotal}${idQuery}${todoIdQuery} ORDER BY subtask.create_time DESC`;
    const values = [];
    if (idQuery) {
      values.push(id);
    }
    if (todoIdQuery) {
      values.push(todo_id);
    }
    
    try {
      const result = await conn.queryPromise(sqlStatus, values);

      const simpliedResult = result.map(item => {
        item.create_time = item.create_time_alias;
        item.update_time = item.update_time_alias;

        delete item.create_time_alias;
        delete item.update_time_alias;
        return item;
      });

      res.send({
        code: 200,
        message: 'success',
        list: simpliedResult,
      });
    } catch (error) {
      return next(error);
    }
  }

  async addSubtask(req, res, next) {
    if (!req.body.content) return next(new Error('content can not be empty!'));

    const {
      content,
      todo_id,
      marked_as_completed = 0,
    } = req.body;

    const values = [
      content,
      todo_id,
      marked_as_completed,
    ];
    try {
      await conn.queryPromise('INSERT INTO subtask (content, todo_id, marked_as_completed) VALUES (?, ?, ?)', values);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateSubtask(req, res, next) {
    const { content, marked_as_completed = 0, id } = req.body;
    if (!id) return next(new Error('must specific id!'));

    const map = new Map([
      ['content=?', content],
      ['marked_as_completed=?', marked_as_completed],
    ]);
    const updateFields = Array.from(map).filter(([_, value]) => value !== undefined).map(([key, _]) => key).join(', ');
    const values = Array.from(map).filter(([_, value]) => value !== undefined).map(([_, value]) => value);

    try {
      await conn.queryPromise(`UPDATE subtask SET ${updateFields} WHERE id=?`, [...values, id]);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteSubtask(req, res, next) {
    if (!req.body.id) next(new Error('must specific id!'));

    try {
      await conn.queryPromise('DELETE FROM subtask WHERE id=?', [req.body.id]);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = { Subtask };