const uuid = require("uuid");
const dayjs = require('dayjs');
const XLSX = require("xlsx");
const path = require('path');
const multer = require('multer');
const conn = require('../services/db');

const FILTER_ALL = 1;
const FILTER_TODO = 2;
// const FILTER_DONE = 3;

const storage = multer.diskStorage({
  // 确定上传文件存放服务器的物理路径
  destination: (req, file, callback) => {
    // 文件不存在，跳过不存储
    if (!file.originalname) {
      return;
    }
    callback(null, req.app.get('xlsxsPath'));
  },
  filename: (req, file, callback) => {
    if (!file.originalname) {
      return;
    }
    // 根据上传时间的 unix 时间戳来命名文件名
    callback(null, file.fieldname + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

class Entry {
  constructor(obj) {
    for (const key in obj) { // 循环遍历传入对象的键
      this[key] = obj[key]; // 合并值
    }
  }

  async getTodoById(req, res, next) {
    const { id } = req.body;

    conn.query(
      'SELECT * FROM todolist WHERE id=?',
      [id],
      (err, list) => {
        if (err) return next(err);

        res.send({
          code: 200,
          message: 'success',
          data: list.map((item) => {
            item.date = dayjs(item.date).format('YYYY-MM-DD');
            item.position_id = JSON.parse(item.position_id || '[]');
            return item;
          })[0],
        });
      });
  }

  async getList(req, res, next) {
    const {
      id,
      status,
      content,
      pageSize,
      pageNo,
      parent_id,
    } = req.body;
    const isGtFILTER_ALL = status > FILTER_ALL;
    // SELECT todolist.id, content, status, position_id, folder_id, folders.name as folder_name, date FROM todolist, folders WHERE todolist.folder_id = folders.id;
    const sqlTotal = 'SELECT todolist.id, content, status, position_id, folder_id, folders.name as folder_name, date FROM todolist, folders';
    const idQuery = id ? ' WHERE todolist.id=?' : '';
    const statusQuery = isGtFILTER_ALL ? ` ${idQuery ? 'AND' : 'WHERE'} status=?` : '';
    const contentQuery = content ? ` ${statusQuery ? 'AND' : 'WHERE'} content LIKE '${content}%'` : '';
    const folderQuery = ` ${idQuery || statusQuery || contentQuery ? 'AND' : 'WHERE'} todolist.folder_id = folders.id`;
    const paginationQuery = pageSize && pageNo ? ` LIMIT ${pageSize} OFFSET ${pageSize * (pageNo - 1)}` : '';
    const sqlStatus = `${sqlTotal}${idQuery}${statusQuery}${contentQuery}${folderQuery} ORDER BY date DESC`;
    const query = `${sqlStatus}${paginationQuery}`;
    const values = [];
    if (idQuery) {
      values.push(id);
    }
    if (isGtFILTER_ALL) {
      values.push(status);
    }
    if (content) {
      values.push(content);
    }

    const self = this;
    conn.query(
      query,
      values,
      (err, list) => {
        if (err) return next(err);

        conn.query(sqlStatus, values, (err, result) => {
          if (err) return next(err);

          // 当发现 pageNo > Math.ceil(total / pageSize) 时，说明分页索引越界了，需要往前查询
          const pageCounts = Math.ceil(result.length / pageSize);
          if (result.length > 0 && pageNo > pageCounts) {
            req.body.pageNo = pageCounts;
            req.body.pageSize = pageSize;
            req.body.status = status;
            self.getList(req, res, next);
            return;
          }

          let data = list.map((item) => {
            item.date = dayjs(item.date).format('YYYY-MM-DD');
            item.position_id = JSON.parse(item.position_id || '[]');
            return item;
          });
          if (!isNaN(parent_id)) {
            data = data.filter(item => item.position_id.includes(parent_id));
          }

          res.send({
            code: 200,
            message: 'success',
            list: data,
            pageNo,
            pageSize,
            total: result.length,
          });
        });
      });
  }

  async addTodo(req, res, next) {
    if (!req.body.content) return next(new Error('content can not be empty!'));
    if (!req.body.date) return next(new Error('date can not be empty!'));

    const values = [
      uuid.v4(),
      req.body.content,
      FILTER_TODO,
      JSON.stringify(req.body.position_id),
      req.body.folder_id,
      req.body.date,
    ];
    conn.query(
      'INSERT INTO todolist (id, content, status, position_id, folder_id, date) VALUES (?, ?, ?, ?, ?, ?)',
      values,
      (err) => {
        if (err) return next(err);

        res.send({
          code: 200,
          message: 'success',
        });
      });
  }

  async updateTodo(req, res, next) {
    const { content, status, position_id, folder_id, date, id } = req.body;
    if (!id) return next(new Error('must specific id!'));

    const map = new Map([
      ['content=?', content],
      ['status=?', status],
      ['position_id=?', JSON.stringify(position_id)],
      ['folder_id=?', folder_id],
      ['date=?', date],
    ]);
    const updateFields = Array.from(map).filter(([_, value]) => value !== undefined).map(([key, _]) => key).join(', ');
    const values = Array.from(map).filter(([_, value]) => value !== undefined).map(([_, value]) => value);

    conn.query(
      `UPDATE todolist SET ${updateFields} WHERE id=?`,
      [...values, id],
      (err) => {
        if (err) return next(err);

        res.send({
          code: 200,
          message: 'success',
        });
      });
  }

  async deleteTodo(req, res, next) {
    if (!req.body.id) next(new Error('must specific id!'));

    conn.query(
      'DELETE FROM todolist WHERE id=?',
      [req.body.id],
      (err) => {
        if (err) return next(err);

        res.send({
          code: 200,
          message: 'success',
        });
      });
  }

  async exportFile(req, res, next) {
    const headings = [['id', 'content', 'status', 'position_id', 'folder_id', 'folder_name', 'date']];

    conn.query(
      `
        SELECT todolist.id, content, status, position_id, folder_id, folders.name as folder_name, date 
        FROM todolist, folders 
        WHERE todolist.folder_id = folders.id
      `,
      [],
      (err, list) => {
        if (err) return next(err);

        const todos = list.map((item) => {
          item.date = dayjs(item.date).format('YYYY-MM-DD');
          return item;
        });
        /** Converts an array of JS objects to a worksheet. */
        const ws = XLSX.utils.json_to_sheet(todos, {
          origin: 'A2',
          skipHeader: true
        });
        /** Add an array of arrays of JS data to a worksheet */
        XLSX.utils.sheet_add_aoa(ws, headings);

        /** Creates a new workbook */
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'todos');

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.attachment('todos.xlsx');
        res.send(buffer);

        // store file in server path
        // const outputPath = path.resolve(__dirname, '../storage/outputs/xlsxs');
        // const filepath = `${outputPath}/todos.xlsx`;
        // XLSX.writeFile(wb, filepath);
        // res.download(filepath);
      });
  }

  async importFile(req, res, next) {
    if (!req.file?.path) return next(new Error('file not found!'));

    const wb = XLSX.readFile(req.file.path);
    const sheets = wb.SheetNames;

    if (sheets.length > 0) {
      const data = XLSX.utils.sheet_to_json(wb.Sheets[sheets[0]]);
      const values = data
        .map((row) => ([
          uuid.v4(),
          row['content'],
          row['status'],
          row['position_id'],
          row['folder_id'],
          row['date'],
        ]));
      conn.query(
        'INSERT INTO todolist (`id`, `content`, `status`, `position_id`, `folder_id`, `date`) VALUES ?',
        [values],
        (err) => {
          if (err) return next(err);

          res.send({
            code: 200,
            message: 'success',
          });
        });
    }
  }
}

module.exports = { Entry, upload };