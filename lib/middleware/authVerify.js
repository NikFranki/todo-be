const jwt = require('jsonwebtoken');

class AuthVerify {
  generateToken(username) {
    // Validate User Here 
    // Then generate JWT Token 

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
      time: Date(),
      username,
    }

    const token = jwt.sign(data, jwtSecretKey, {
      expiresIn: '24h',
    });

    return token;
  }
  validateToken(req, res, next) {
    // Tokens are generally passed in the header of the request 
    // Due to security reasons. 

    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    try {
      const token = req.header(tokenHeaderKey);
      const verified = jwt.verify(token, jwtSecretKey);
      if (verified) {
        next();
      } else {
        // Access Denied 
        return res.status(401).send('Access Denied');
      }
    } catch (error) {
      // Access Denied 
      return res.status(401).send('Access Denied');
    }
  }
}

module.exports = new AuthVerify();
