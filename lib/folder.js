const conn = require('../services/db');

class Folder {

  constructor() {
    this.init();
  }

  init() {
    conn.query(
      'SELECT * FROM folders',
      [],
      (err, list) => {
        if (err)  throw new Error('select error');

        const hasDefaultFolder = list.find((item) => item.id === 1);
        if (hasDefaultFolder) {
          return;
        }

        conn.query(
          `INSERT INTO folders (name, parent_id) VALUES (?, ?)`,
          ['default', null],
          (err, result) => {
            if (err) throw new Error(err);
          },
        )
      },
    );
  }

  async getList(req, res, next) {
    conn.query(
      'SELECT * FROM folders ORDER BY create_time DESC',
      [],
      (err, list) => {
        if (err) return next(err);

        conn.query(
          `SELECT folders.id, name, parent_id, create_time, update_time, todolist.id as todo_id, todolist.content as todo_content
          FROM folders, todolist
          WHERE folders.id = todolist.folder_id ORDER BY create_time DESC`,
          [],
          (err, result) => {
            if (err) return next(err);

            const folders = list.map(item => {
              item.isLeaf = false;
              return item;
            });
            
            const files = result.map((item) => ({
              id: item.todo_id,
              name: item.todo_content,
              parent_id: item.id,
              create_time: item.create_time,
              update_time: item.update_time,
              isLeaf: true,
            }));

            const newList = folders.concat(files);
            res.send(JSON.stringify({
              code: 200,
              message: 'success',
              list: newList,
            }));
          });
      });
  }

  addFolder(req, res, next) {
    if (!req.body.name) return next(new Error('content can not be empty!'));

    conn.query(
      `INSERT INTO folders (name, parent_id) VALUES (?, ?)`,
      [req.body.name, req.body.parent_id],
      (err) => {
        if (err) return next(err);

        res.send({
          code: 200,
          message: 'success',
        });
      });
  }

  updateFolder(req, res, next) {
    if (!req.body.id) return next(new Error('must specific id!'));

    conn.query(
      `UPDATE folders SET name=? WHERE id=?`,
      [req.body.name, req.body.id],
      (err) => {
        if (err) return next(err);

        res.send({
          code: 200,
          message: 'success',
        });
      });
  }

  deleteFolder(req, res, next) {
    if (!req.body.id) return next(new Error('must specific id!'));

    conn.query(
      `DELETE FROM folders WHERE id=?`,
      [req.body.id],
      (err) => {
        if (err) return next(err);

        res.send({
          code: 200,
          message: 'success',
        });
      });
  }
}

module.exports = Folder;