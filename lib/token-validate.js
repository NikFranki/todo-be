const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Tokens are generally passed in the header of the request 
  // Due to security reasons. 

  let jwtSecretKey = process.env.JWT_SECRET_KEY;

  try {
    const verified = jwt.verify(req.body.token, jwtSecretKey);
    //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lIjoiV2VkIE9jdCAxOCAyMDIzIDIwOjM0OjUwIEdNVCswODAwIChDaGluYSBTdGFuZGFyZCBUaW1lKSIsInVzZXJuYW1lIjoiZnJhbmtpIiwiaWF0IjoxNjk3NjMyNDkwLCJleHAiOjE2OTc3MTg4OTB9.cFRMtdUERdHiEe5h5cMBGmF2-ZyRjcRYX8ohRF96NUg
    if (verified) {
      res.send({
        code: 200,
        message: 'success',
      });
    } else {
      // Access Denied 
      res.send({
        code: -1,
        message: 'token validate failed',
      });
    }
  } catch (error) {
    // Access Denied 
    res.send({
      code: -1,
      message: 'token validate failed',
    });
  }
};
