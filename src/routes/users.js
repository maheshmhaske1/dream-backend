const express = require('express');
const router = express.Router();

const { remove, update } = require('../controllers/version 1.0/users');
const { getAllPosts, getFeeds } = require('../controllers/version 1.0/userPost');
const { getAllUserFriends } = require('../controllers/version 1.0/friends');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/uploadData');
const { userAuth } = require('../middlewares/auth');
const userApis2 = require('../controllers/version 2.0/users');
const userValidation = require('../validations/user');


/************************************* CONTROLLER VERSION 1.0 */
router.delete('/delete', userAuth, remove);
router.patch('/update', userAuth, update);


//User posts routes
router.get('/:userId/posts', getAllPosts);
router.get('/:userId/friends', getAllUserFriends);
router.get('/:userId/feeds', getFeeds);

/************************************* VERSION 2.0 */
router.post('/signup', validate(userValidation.signup), userApis2.signup);
router.post('/login', validate(userValidation.login), userApis2.login);
router.put('/update', userAuth, validate(userValidation.updateUser), userApis2.updateUser);
router.get('/info', userAuth, userApis2.userInfo);


router.post('/upload', upload.fields([{ name: "source", maxCount: 1 }]), userApis2.uploadData);
router.get('/infoById/:user_id', userAuth, validate(userValidation.userInfoById), userApis2.userInfoById);
router.get('/gifts', userAuth,  userApis2.categorized_gift);
router.post('/user-awarded-diamonds', userAuth,  userApis2.handlediamonds);
router.post('/lang-translate', userAuth,  userApis2.language_traslator);
router.post('/start-session/:user_id', userAuth,  userApis2.trackUserStartTime);
router.post('/end-session/:user_id', userAuth,  userApis2.trackUserEndTime);
router.post('/private-message/:user_id', userAuth,  userApis2.sendMessageToPrivateAccount);
router.post('/:id/links', userAuth,  userApis2.addExternalLinks);



module.exports = router
