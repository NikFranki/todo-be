const express = require('express');
const router = express.Router();

const { User, upload } = require('../lib/user');
const user = new User({});

/* user register */
router.post('/register', upload.single("avatar"), user.register);

/* userinfo update */
router.post('/update', upload.single("avatar"), user.update);

/* user login */
router.post('/login', user.login);

/* user search */
router.post('/searchUser', user.searchUser);

/* user logout */
router.post('/logout', user.logout);

module.exports = router;