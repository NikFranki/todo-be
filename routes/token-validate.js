const express = require('express');
const router = express.Router();

const tokenValidate = require('../lib/token-validate');

router.post('/tokenValidate', tokenValidate);

module.exports = router;
