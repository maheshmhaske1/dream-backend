const express = require('express');
const router = express.Router();

const { userAuth } = require('../middlewares/auth');
const { like } = require('../controllers/version 1.0/likes');
const { handleClicks } = require('../controllers/version 2.0/videos');

/************************************* CONTROLLER VERSION 1.0 */
router.post('/', userAuth, like)
router.post('/LikeVideo/:video_id', userAuth, handleClicks)

module.exports = router
