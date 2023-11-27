const fs = require('fs');
const uuid = require("uuid");
const dayjs = require("dayjs");
const XLSX = require("xlsx");
const path = require('path');
const multer = require('multer');
const schedule = require('node-schedule');

const conn = require('../services/db');
const { MY_DAY, IMPORTANT, PLANNED, DEFAULT_LIST_IDS, MARKED_AS_IMPORTANT, ADDED_MY_DAY } = require('../constant');

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

const todoAttachmentsStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (!file.originalname) {
      return;
    }
    
    const dir = `${req.app.get('todoAttachmentFilePath')}${req.body.id}`;

    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    if (!file.originalname) {
      return;
    }
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    callback(null, file.originalname);
  },
});
const todoAttachmentsUpload = multer({ storage: todoAttachmentsStorage });

class Todo {
  constructor() {
    this.reminderTodos = [];
    this.getReminderTodo();
    
    const rule = new schedule.RecurrenceRule();
    rule.second = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]; // 每隔1秒执行一次
    
    const job = schedule.scheduleJob(rule, () => {
      const currentDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const dayTimeOnlyTime = dayjs().format('HH:mm:ss');
      const noticedTodo = [];
      this.reminderTodos.forEach(item => {
        const dateTimeEqual = item.reminder_time_alias === currentDateTime;
        const onlyTimeEqual = item.repeated && item.reminder_time_only_time_alias === dayTimeOnlyTime;
        if (dateTimeEqual || onlyTimeEqual) {
          noticedTodo.push(item);
        }
      });
      // avoid circular dependencies
      setTimeout(() => {
        const io = require('../socket');

        // console.log('sent to the client', noticedTodo);
        io.emit('todo-message', noticedTodo);
      }, 0);
    });

    // job.cancel();
  }

  async getReminderTodo() {
    const list = await conn.queryPromise('SELECT *, DATE_FORMAT(reminder, "%Y-%m-%d %H:%i:%s") AS reminder_time_alias, DATE_FORMAT(reminder, "%H:%i:%s") AS reminder_time_only_time_alias FROM todo WHERE reminder IS NOT NULL', []);
    this.reminderTodos = list;
  }

  async getTodoById(req, res, next) {
    const { id } = req.body;
    try {
      const list = await conn.queryPromise('SELECT *, DATE_FORMAT(reminder, "%Y-%m-%d %H:%i:%s") AS reminder_alias, DATE_FORMAT(due_date, "%Y-%m-%d") AS due_date_alias, DATE_FORMAT(create_time, "%Y-%m-%d %H:%i:%s") AS create_time_alias, DATE_FORMAT(update_time, "%Y-%m-%d %H:%i:%s") AS update_time_alias FROM todo WHERE id=?', [id]);
      const todoItem = list[0];

      todoItem.reminder = todoItem.reminder_alias;
      todoItem.due_date = todoItem.due_date_alias;
      todoItem.create_time = todoItem.create_time_alias;
      todoItem.update_time = todoItem.update_time_alias;

      delete todoItem.reminder_alias;
      delete todoItem.due_date_alias;
      delete todoItem.create_time_alias;
      delete todoItem.update_time_alias;
      
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
      content,
      list_id,
    } = req.body;
    const sqlTotal = `SELECT *, DATE_FORMAT(reminder, "%Y-%m-%d %H:%i:%s") AS reminder_alias, DATE_FORMAT(due_date, "%Y-%m-%d") AS due_date_alias, DATE_FORMAT(create_time, "%Y-%m-%d %H:%i:%s") AS create_time_alias, DATE_FORMAT(update_time, "%Y-%m-%d %H:%i:%s") AS update_time_alias FROM todo WHERE user_id='${res.locals.username}'`;
    const listIdQuery = list_id && !DEFAULT_LIST_IDS.includes(list_id) ? ` AND list_id=?` : '';
    const addedMyDayQuery = list_id === MY_DAY ? ` AND added_my_day=?` : '';
    const markedAsImportantQuery = list_id === IMPORTANT ? ` AND marked_as_important=?` : '';
    const planedQuery = list_id === PLANNED ? ` AND todo.due_date IS NOT NULL` : '';
    const contentQuery = content ? ` AND content LIKE '${content}%'` : '';
    const sqlStatus = `${sqlTotal}${listIdQuery}${addedMyDayQuery}${markedAsImportantQuery}${planedQuery}${contentQuery} ORDER BY todo.create_time DESC`;
    const values = [];
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
        item.reminder = item.reminder_alias;
        item.due_date = item.due_date_alias;
        item.create_time = item.create_time_alias;
        item.update_time = item.update_time_alias;

        delete item.reminder_alias;
        delete item.due_date_alias;
        delete item.create_time_alias;
        delete item.update_time_alias;
        return item;
      });

      if (simpliedResult.length) {
        const resultToIds = [...new Set(simpliedResult.map(item => `"${item.id}"`))].join(',');
        const subtaskResult = await conn.queryPromise(`SELECT * FROM subtask WHERE todo_id IN (${resultToIds})`, []);
        const subtaskResultMap = subtaskResult.reduce((prev, curr) => {
          prev[curr.todo_id] = prev[curr.todo_id] ? prev[curr.todo_id].concat(curr) : [curr];
          return prev;
        }, {});
        simpliedResult.forEach(item => {
          item.subtask = subtaskResultMap[item.id] ? subtaskResultMap[item.id] : [];
        });
      }

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
      repeated = 0,
      note,
      category,
    } = req.body;

    const values = [
      uuid.v4(),
      content,
      res.locals.username,
      list_id,
      added_my_day,
      marked_as_important,
      marked_as_completed,
      due_date,
      repeated,
      note,
      category,
    ];
    try {
      await conn.queryPromise('INSERT INTO todo (id, content, user_id, list_id, added_my_day, marked_as_important, marked_as_completed, due_date, repeated, note, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values);
      res.send({
        code: 200,
        message: 'success',
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateTodo(req, res, next) {
    const { 
      content,
      list_id,
      added_my_day = 0,
      marked_as_important = 0,
      marked_as_completed = 0,
      due_date,
      repeated,
      reminder,
      note,
      category,
      removed_file,
      id,
    } = req.body;
    if (!id) return next(new Error('must specific id!'));

    let file = null;
    if (req.file) {
      file = `${req.app.get('serverPath')}todo-attachment/${id}/${req.file.filename}`;
    }

    if (removed_file) {
      const dir = `${req.app.get('todoAttachmentFilePath')}${id}`;
      if (fs.existsSync(dir)){
        fs.unlinkSync(`${dir}/${removed_file}`);
      }
    }

    const map = new Map([
      ['content=?',
       content],
      ['user_id=?', res.locals.username],
      ['list_id=?', list_id],
      ['added_my_day=?', added_my_day],
      ['marked_as_important=?', marked_as_important],
      ['marked_as_completed=?', marked_as_completed],
      ['reminder=?', reminder],
      ['due_date=?', due_date],
      ['repeated=?', repeated],
      ['category=?', category],
      ['file=?', file],
      ['note=?', note],
    ]);
    const updateFields = Array.from(map).filter(([_, value]) => value !== undefined).map(([key, _]) => key).join(', ');
    const values = Array.from(map).filter(([_, value]) => value !== undefined).map(([_, value]) => value);

    try {
      await conn.queryPromise(`UPDATE todo SET ${updateFields} WHERE id=?`, [...values, id]);
      this.getReminderTodo();
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
      this.getReminderTodo();
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
        SELECT todo.id, content, user_id, list_id, added_my_day, marked_as_important, marked_as_completed, due_date, repeated, note, category 
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
      const headings = [['id', 'content', 'user_id', 'list_id', 'added_my_day', 'marked_as_important', 'marked_as_completed', 'due_date', 'repeated', 'note', 'category']];
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
          row['user_id'],
          row['list_id'],
          row['added_my_day'],
          row['marked_as_important'],
          row['marked_as_completed'],
          row['due_date'],
          row['repeated'],
          row['note'],
          row['category'],
        ]));

      try {
        const url = 'INSERT INTO todo (`id`, `content`, `user_id`, `list_id`, `added_my_day`, `marked_as_important`, `marked_as_completed`, `due_date`, `repeated`, `note`, `category`) VALUES ?';
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

module.exports = { Todo, upload, todoAttachmentsUpload };