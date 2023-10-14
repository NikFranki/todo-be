module.exports = function(req, res, next) {
  res.status(404).format({
    html: () => {
      res.render('404', { title: 'Not Found' });
    },
    json: () => {
      res.send({ message: 'Resource not found' });
    },
    xml: () => {
      res.write('<error>\n');
      res.write(' <message>Resource not found</message>\n');
      res.write('</error>\n');
      res.send();
    },
    text: () => {
      res.send('Resource not found');
    },
  });
};