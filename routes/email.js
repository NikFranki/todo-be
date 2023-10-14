const express = require('express');
const router = express.Router();

const sendEmail = require('../lib/email');

/* send email */
router.post('/send', sendEmail);

module.exports = router;
