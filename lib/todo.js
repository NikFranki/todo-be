const uuid = require("uuid");
const dayjs = require('dayjs');
const XLSX = require("xlsx");
const path = require('path');
const multer = require('multer');
const conn = require('../services/db');

const TODO_STATUS = 1;
const DONE_STATUS = 2;

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

class Todo {
  constructor(obj) {
    for (const key in obj) {
      this[key] = obj[key];
    }
  }

  async getTodoById(req, res, next) {
    const { id } = req.body;
    try {
      const list = await conn.queryPromise('SELECT * FROM todo WHERE id=?', [id]);
      res.send({
        code: 200,
        message: 'success',
        data: list.map((item) => {
          item.date = dayjs(item.date).format('YYYY-MM-DD');
          return item;
        })[0],
      });
    } catch (error) {
      return next(error);
    }
  }

  async getList(req, res, next) {
    const {
      id,
      content,
      status,
      list_id,
      note,
      category,
      pageSize,
      pageNo,
    } = req.body;
    // SELECT todo.id, content, status, list_id, note, category, date FROM todo, list WHERE todo.list_id = list.id;
    const sqlTotal = 'SELECT todo.id, content, status, list_id, note, category, date FROM todo';
    const idQuery = id ? ' WHERE todo.id=?' : '';
    const listIdQuery = list_id ? ` ${idQuery ? 'AND' : 'WHERE'} list_id=?` : '';
    const statusQuery = status ? ` ${idQuery ? 'AND' : 'WHERE'} status=?` : '';
    const contentQuery = content ? ` ${statusQuery ? 'AND' : 'WHERE'} content LIKE '${content}%'` : '';
    const paginationQuery = pageSize && pageNo ? ` LIMIT ${pageSize} OFFSET ${pageSize * (pageNo - 1)}` : '';
    const sqlStatus = `${sqlTotal}${idQuery}${listIdQuery}${statusQuery}${contentQuery} ORDER BY todo.create_time DESC`;
    const query = `${sqlStatus}${paginationQuery}`;
    const values = [];
    if (idQuery) {
      values.push(id);
    }
    if (listIdQuery) {
      values.push(list_id);
    }
    if (status) {
      values.push(status);
    }
    if (content) {
      values.push(content);
    }

    const self = this;
    try {
      const list = await conn.queryPromise(query, values);
      const result = await conn.queryPromise(sqlStatus, values);

      // 当发现 pageNo > Math.ceil(total / pageSize) 时，说明分页索引越界了，需要往前查询
      const pageCounts = Math.ceil(result.length / pageSize);
      if (result.length > 0 && pageNo > pageCounts) {
        req.body.pageNo = pageCounts;
        req.body.pageSize = pageSize;
        req.body.status = status;
        self.getList(req, res, next);
        return;
      }

      const data = list.map((item) => {
        item.date = dayjs(item.date).format('YYYY-MM-DD');
        return item;
      });

      res.send({
        code: 200,
        message: 'success',
        list: data,
        pageNo,
        pageSize,
        total: result.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async addTodo(req, res, next) {
    if (!req.body.content) return next(new Error('content can not be empty!'));
    // if (!req.body.date) return next(new Error('date can not be empty!'));

    const values = [
      uuid.v4(),
      req.body.content,
      TODO_STATUS,
      req.body.list_id,
      req.body.note,
      req.body.category,
      req.body.date,
    ];
    try {
      await conn.queryPromise('INSERT INTO todo (id, content, status, list_id, note, category, date) VALUES (?, ?, ?, ?, ?, ?, ?)', values);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateTodo(req, res, next) {
    const { content, status, list_id, note, category, date, id } = req.body;
    if (!id) return next(new Error('must specific id!'));

    const map = new Map([
      ['content=?', content],
      ['status=?', status],
      ['list_id=?', list_id],
      ['note=?', note],
      ['category=?', category],
      ['date=?', date],
    ]);
    const updateFields = Array.from(map).filter(([_, value]) => value !== undefined).map(([key, _]) => key).join(', ');
    const values = Array.from(map).filter(([_, value]) => value !== undefined).map(([_, value]) => value);

    try {
      await conn.queryPromise(`UPDATE todo SET ${updateFields} WHERE id=?`, [...values, id]);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteTodo(req, res, next) {
    if (!req.body.id) next(new Error('must specific id!'));

    try {
      await conn.queryPromise('DELETE FROM todo WHERE id=?', [req.body.id]);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async exportFile(req, res, next) {
    try {
      const result = await conn.queryPromise(`
        SELECT todo.id, content, status, list_id, note, category, date 
        FROM todo, list 
        WHERE todo.list_id = list.id
      `, []);
      const todo = result.map((item) => {
        item.date = dayjs(item.date).format('YYYY-MM-DD');
        return item;
      });
      /** Converts an array of JS objects to a worksheet. */
      const ws = XLSX.utils.json_to_sheet(todo, {
        origin: 'A2',
        skipHeader: true
      });
      const headings = [['id', 'content', 'status', 'list_id', 'note', 'category', 'date']];
      /** Add an array of arrays of JS data to a worksheet */
      XLSX.utils.sheet_add_aoa(ws, headings);

      /** Creates a new workbook */
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'todo');

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.attachment('todo.xlsx');
      res.send(buffer);

      // store file in server path
      // const outputPath = path.resolve(__dirname, '../storage/outputs/xlsxs');
      // const filepath = `${outputPath}/todo.xlsx`;
      // XLSX.writeFile(wb, filepath);
      // res.download(filepath);
    } catch (error) {
      return next(error);
    }
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
          row['list_id'],
          row['note'],
          row['category'],
          row['date'],
        ]));

      try {
        const url = 'INSERT INTO todo (`id`, `content`, `status`, `list_id`, `note`, `category`, `date`) VALUES ?';
        await conn.queryPromise(url, [values]);
        res.send({
          code: 200,
          message: 'success',
        });
      } catch (error) {
        return next(error);
      }
    }
  }
}

module.exports = { Todo, upload };