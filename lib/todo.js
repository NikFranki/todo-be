const uuid = require("uuid");
const dayjs = require('dayjs');
const XLSX = require("xlsx");
const path = require('path');
const multer = require('multer');

const conn = require('../services/db');
const { MY_DAY, IMPORTANT, PLANNED, DEFAULT_LIST_IDS, MARKED_AS_IMPORTANT, MARKED_AS_UNCOMPLETED, ADDED_MY_DAY, TASKS } = require('../constant');

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
      const todoItem = list[0];
      todoItem.subtask = await conn.queryPromise('SELECT * FROM subtask WHERE todo_id=?', [id]);
      res.send({
        code: 200,
        message: 'success',
        data: todoItem,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getList(req, res, next) {
    const {
      id,
      content,
      list_id,
    } = req.body;
    const sqlTotal = 'SELECT *, DATE_FORMAT(due_date, "%Y-%m-%d") AS due_date_alias, DATE_FORMAT(create_time, "%Y-%m-%d %H:%i:%s") AS create_time_alias, DATE_FORMAT(update_time, "%Y-%m-%d %H:%i:%s") AS update_time_alias FROM todo';
    const idQuery = id ? ' WHERE todo.id=?' : '';
    const listIdQuery = list_id && !DEFAULT_LIST_IDS.includes(list_id) ? ` ${idQuery ? 'AND' : 'WHERE'} list_id=?` : '';
    const addedMyDayQuery = list_id === MY_DAY ? ` ${idQuery ? 'AND' : 'WHERE'} added_my_day=?` : '';
    const markedAsImportantQuery = list_id === IMPORTANT ? ` ${idQuery ? 'AND' : 'WHERE'} marked_as_important=?` : '';
    const planedQuery = list_id === PLANNED ? ` ${idQuery ? 'AND' : 'WHERE'} todo.due_date IS NOT NULL` : '';
    const contentQuery = content ? ` WHERE content LIKE '${content}%'` : '';
    const sqlStatus = `${sqlTotal}${idQuery}${listIdQuery}${addedMyDayQuery}${markedAsImportantQuery}${planedQuery}${contentQuery} ORDER BY todo.create_time DESC`;
    const values = [];
    if (idQuery) {
      values.push(id);
    }
    if (listIdQuery) {
      values.push(list_id);
    }
    if (addedMyDayQuery) {
      values.push(ADDED_MY_DAY);
    }
    if (markedAsImportantQuery) {
      values.push(MARKED_AS_IMPORTANT);
    }
    if (content) {
      values.push(content);
    }
    
    try {
      const result = await conn.queryPromise(sqlStatus, values);

      const simpliedResult = result.map(item => {
        item.due_date = item.due_date_alias;
        item.create_time = item.create_time_alias;
        item.update_time = item.update_time_alias;

        delete item.due_date_alias;
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

  async addTodo(req, res, next) {
    if (!req.body.content) return next(new Error('content can not be empty!'));

    const {
      content,
      list_id,
      added_my_day = 0,
      marked_as_important = 0,
      marked_as_completed = 0,
      due_date,
      note,
      category,
    } = req.body;

    const values = [
      uuid.v4(),
      content,
      list_id,
      added_my_day,
      marked_as_important,
      marked_as_completed,
      due_date,
      note,
      category,
    ];
    try {
      await conn.queryPromise('INSERT INTO todo (id, content, list_id, added_my_day, marked_as_important, marked_as_completed, due_date, note, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', values);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateTodo(req, res, next) {
    const { content, list_id, added_my_day = 0, marked_as_important = 0, marked_as_completed = 0, due_date, note, category, id } = req.body;
    if (!id) return next(new Error('must specific id!'));

    const map = new Map([
      ['content=?', content],
      ['list_id=?', list_id],
      ['added_my_day=?', added_my_day],
      ['marked_as_important=?', marked_as_important],
      ['marked_as_completed=?', marked_as_completed],
      ['due_date=?', due_date],
      ['note=?', note],
      ['category=?', category],
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
        SELECT todo.id, content, list_id, added_my_day, marked_as_important, marked_as_completed, due_date, note, category 
        FROM todo, list 
        WHERE todo.list_id = list.id
      `, []);
      const todo = result.map((item) => {
        return item;
      });
      /** Converts an array of JS objects to a worksheet. */
      const ws = XLSX.utils.json_to_sheet(todo, {
        origin: 'A2',
        skipHeader: true
      });
      const headings = [['id', 'content', 'list_id', 'added_my_day', 'marked_as_important', 'marked_as_completed', 'due_date', 'note', 'category']];
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
          row['list_id'],
          row['added_my_day'],
          row['marked_as_important'],
          row['marked_as_completed'],
          row['due_date'],
          row['note'],
          row['category'],
        ]));

      try {
        const url = 'INSERT INTO todo (`id`, `content`, `list_id`, `added_my_day`, `marked_as_important`, `marked_as_completed`, `due_date`, `note`, `category`) VALUES ?';
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