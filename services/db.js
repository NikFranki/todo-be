const mysql = require('mysql');

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* table user */
conn.query(
  'CREATE TABLE IF NOT EXISTS user (' +
  'username VARCHAR(60) NOT NULL, ' +
  'password VARCHAR(100) NOT NULL, ' +
  'avatar VARCHAR(512), ' +
  'PRIMARY KEY(username))',
);

/* table todo */
conn.query(
  'CREATE TABLE IF NOT EXISTS todo (' +
  'id VARCHAR(40) NOT NULL, ' +
  'content VARCHAR(512) NOT NULL, ' +
  'list_id INT NOT NULL, ' +
  'added_my_day TINYINT(1) NOT NULL, ' +
  'marked_as_important TINYINT(1) NOT NULL, ' +
  'marked_as_completed TINYINT(1) NOT NULL, ' +
  'reminder DATETIME, ' +
  'due_date Date, ' +
  'repeated TINYINT(1) NOT NULL, ' +
  'note VARCHAR(1000), ' +
  'category VARCHAR(100), ' +
  '`create_time` DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
  '`update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
  'PRIMARY KEY(id))',
);

/* table sub task */
conn.query(
  'CREATE TABLE IF NOT EXISTS subtask (' +
  'id INT UNSIGNED NOT NULL AUTO_INCREMENT, ' +
  'content VARCHAR(512) NOT NULL, ' +
  'todo_id VARCHAR(40) NOT NULL, ' +
  'marked_as_completed TINYINT(1) NOT NULL, ' +
  '`create_time` DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
  '`update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
  'PRIMARY KEY(id))',
);

/* table list */
conn.query(
  'CREATE TABLE IF NOT EXISTS list (' +
  'id INT UNSIGNED NOT NULL AUTO_INCREMENT, ' +
  'name VARCHAR(512) NOT NULL, ' +
  '`create_time` DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
  '`update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
  'PRIMARY KEY(id))',
);

conn.queryPromise = (sql, values = []) => {
  return new Promise((resolve, reject) => {
    conn.query(
      sql,
      values,
      (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
  });
}

module.exports = conn;

