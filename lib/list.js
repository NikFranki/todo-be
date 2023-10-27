const conn = require('../services/db');


class List {

  constructor() {
    this.init();
  }

  async init() {
    try {
      const list = await conn.queryPromise('SELECT * FROM list');
      // default list: [Today->1, Important->2, Planned->3, Assigned to me->4, Tasks->5]
      const defaultListNames = [
        'Today',
        'Important',
        'Planned',
        'Assigned to me',
        'Tasks',
      ];
      const listNames = list.map(item => item.name);
      const hasDefaultList = listNames.length && defaultListNames.every((item) => listNames.includes(item));
      if (hasDefaultList) return;

      defaultListNames.forEach(name => {
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
      const numberOfTodoInListId = await conn.queryPromise('SELECT list_id, count(list_id) FROM todo GROUP BY list_id');
      const numberOfTodoInListIdMap = numberOfTodoInListId.reduce((acc, prev) => {
        acc[prev.list_id] = prev['count(list_id)'];
        return acc;
      }, {});
      list.map(item => {
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