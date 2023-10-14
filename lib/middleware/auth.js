const auth = (req, res, next) => {
  const userInfo = req.session.userInfo;
  if (userInfo) {
    next();
  } else {
    res.render('fail', { message: '请先登录！' })
  }
}

module.exports = auth;