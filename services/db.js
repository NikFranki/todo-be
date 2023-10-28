const mysql = require('mysql');

// TODO: process.env.DB_HOST can't get the value at the beginning
const conn = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234567890',
  database: process.env.DB_NAME || 'todo',
});

/* table todo */
conn.query(
  'CREATE TABLE IF NOT EXISTS todo (' +
  'id VARCHAR(40) NOT NULL, ' +
  'content VARCHAR(512) NOT NULL, ' +
  'status INT(10) NOT NULL, ' +
  'list_id INT NOT NULL, ' +
  'note VARCHAR(512), ' +
  'category INT(10), ' +
  'date Date, ' +
  '`create_time` datetime DEFAULT CURRENT_TIMESTAMP, ' +
  '`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
  'PRIMARY KEY(id))',
);

/* table user */
conn.query(
  'CREATE TABLE IF NOT EXISTS user (' +
  'username VARCHAR(60) NOT NULL, ' +
  'password VARCHAR(100) NOT NULL, ' +
  'avatar VARCHAR(512), ' +
  'PRIMARY KEY(username))',
);

/* table list */
conn.query(
  'CREATE TABLE IF NOT EXISTS list (' +
  'id INT UNSIGNED NOT NULL AUTO_INCREMENT, ' +
  'name VARCHAR(512) NOT NULL, ' +
  '`create_time` datetime DEFAULT CURRENT_TIMESTAMP, ' +
  '`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
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

