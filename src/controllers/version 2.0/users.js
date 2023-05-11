const { User } = require("../../models");
const { UserFriend}=require("../../models");
const {Gift} =require("../../models")
const fs = require('fs');
const errorHandler = require("../../utils/errorObject");
const { JWT_KEY } = process.env;
const logger = require('../../utils/logger');
const jwt = require("jsonwebtoken");
const cloudinary = require('../../config/cloudinary');
const { use } = require("../../routes/likes");
const signup = async (req, res, next) => {
  logger.info("VERSION 2.0 -> USER: SIGN UP API CALLED");
  try {
    let {
      user_name, email, firebase_uid,
      profile_image, bio,
      intro_video, id_type, id_number,
      language, avatar, country,
      countryCode, lat, lng, DOB, gender,
      id_attachement, secret_sign, id_verified,
    } = req.body;

    let user = await User.findOne({
      where: { email }
    });

    !language && (language = "EN");

    if (user) throw errorHandler("User already exists!", "duplication");

    let created_user = await User.create({
      user_name, email, firebase_uid, bio,
      lat, lng, DOB, countryCode,
      intro_video, id_type, id_number,
      language, avatar, country, gender,
      id_attachement, secret_sign, id_verified,
      role: "user", active: true, profile_image
    });
    created_user = JSON.parse(JSON.stringify(created_user));

    if (!created_user) throw errorHandler("Unexpected error occured while creating user!", "badRequest");

    return res.status(201).json({
      success: true,
      message: "user created successfully",
      payload: {
        ...created_user,
        auth_token: jwt.sign({ user_id: created_user.id, email: created_user.email, firebase_uid: created_user.firebase_uid }, JWT_KEY),
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const login = async (req, res, next) => {
  logger.info("VERSION 2.0 -> USER: LOGIN UP API CALLED");
  try {
    let {
      email, firebase_uid, social_id
    } = req.body,
      condition = {
        email
      };

    firebase_uid && (condition.firebase_uid = firebase_uid);
    social_id && (condition.social_id = social_id);

    let user = await User.findOne({
      attributes: {
        exclude: ['password']
      },
      where: condition
    });
    user = JSON.parse(JSON.stringify(user));

    if (!user) throw errorHandler("User not found!", "notFound");

    return res.status(201).json({
      success: true,
      message: "Logged-in successfully",
      payload: {
        ...user,
        auth_token: jwt.sign({ user_id: user.id, email: user.email, firebase_uid: user.firebase_uid }, JWT_KEY),
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const userInfo = async (req, res, next) => {
  logger.info("VERSION 2.0 -> USER: GET USER INFO API CALLED");
  try {
    let { id, email } = req.userData;

    let user = await User.findOne({
      attributes: {
        exclude: ['password']
      },
      where: { id, email }
    });
    user = JSON.parse(JSON.stringify(user));

    if (!user) throw errorHandler("User not found", "notFound");

    return res.status(200).json({
      success: true,
      message: "User info fetched successfully!",
      payload: user
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const userInfoById = async (req, res, next) => {
  logger.info("VERSION 2.0 -> USER: GET OTHER USER INFO BY ID API CALLED");
  try {
    let { user_id } = req.params;

    let user = await User.findOne({
      attributes: {
        exclude: ['password']
      },
      where: { id: user_id }
    });
    user = JSON.parse(JSON.stringify(user));

    if (!user) throw errorHandler("User not found", "notFound");

    return res.status(200).json({
      success: true,
      message: "User info fetched successfully!",
      payload: user
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  logger.info("VERSION 2.0 -> USER: USER UPDATE API CALLED");
  try {
    let data = req.body,
      { id, email } = req.userData;

    await User.update(
      data,
      { where: { id, email } }
    );

    let user = await User.findOne({
      attributes: {
        exclude: ['password']
      },
      where: {
        id, email
      }
    });
    user = JSON.parse(JSON.stringify(user));

    return res.status(200).json({
      success: true,
      message: "User info updated successfully!",
      payload: user
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const uploadData = async (req, res, next) => {
  logger.info("VERSION 2.0 -> USER: UPLOAD DATA API CALLED");
  try {
    let path = req?.files?.source[0]?.path;

    if (!path) throw errorHandler("data is not present in body", "badRequest");

    let uploadedVideo = await cloudinary.uploads(path, "SocialMedia"),
      url = uploadedVideo.url;

    fs.unlinkSync(path);

    res.status(201).json({
      success: true,
      message: "Data uploaded successfully!",
      payload: {
        url
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};


// This function retrieves all gifts that match a specified type
const categorized_gift = async (req, res) => {
  // Extract the `type` header from the request
  const type = req.headers.type;
  const gift_type = type;
  const gifts = await Gift.findAll({ where: { gift_type } });
  const data = JSON.parse(JSON.stringify(gifts));
  res.send(data);
};


const handlediamonds = async (req, res) => {
  const { from, to } = req.headers;
  const amount = parseInt(req.headers.amount);
  if (!from || !to || !amount || isNaN(parseInt(amount))) {
    res.status(422).send('Invalid request');
    return;
  }

  try {
    const sender = await User.findOne({ where: { id: from } });
    const receiver = await User.findOne({ where: { id: to } });
    if (!sender || !receiver) {
      res.status(404).send('One or more users do not exist');
      return;
    }

    if (sender.diamonds < amount) {
      res.status(403).send('Insufficient diamonds');
      return;
    }

    sender.diamonds -= amount;
    receiver.diamonds += amount;

    await sender.save();
    await receiver.save();

    res.send(`Transferred ${amount} diamonds from ${sender.user_name} to ${receiver.user_name} diamonds left ${sender.diamonds}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

const language_traslator=async(req,res)=>{
  try {
    // Get the input parameters from the request body
    const { text, sourceLanguage, targetLanguage } = req.body;
    const { default: translate } = await import("translate");
    const translation = await translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });

    // Return the translated text to the client
    res.status(200).json({ translation });
  } catch (err) {
    console.error(`Error translating text: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}
const trackUserStartTime=async(req,res)=>{
  const  userId  = req.params.user_id;

  try {
    const user = await User.findOne({ where: { id: userId } });
    // console.log(user,"user")
    if (!user) {
      res.status(403).send('User is not defined!');
    }else{
      user.duration=0;
      user.timestamp=Date.now()
      await user.save();
      res.status(200).json({
        status:"success"
      })
    }
  } catch (error) {
    console.error(`Error translating text: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }}

const trackUserEndTime=async(req,res)=>{
  const  userId  = req.params.user_id;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      res.status(403).send('User is not defined!');
    }else{
      user.duration +=Date.now() -user.timestamp;
      await user.save();
      res.status(200).json({
        status:"success",
        
      })
    }
  } catch (error) {
    console.error(`Error translating text: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// const trackUserTime=(req, res) => {
//     const { userId } = req.body;
//   const time=Date.now();
//   console.log(time,"timestamp")
//     // If the user session exists, calculate the total time spent and update the session data
//     // if (userSessions[userId]) {
//     //   userSessions[userId].totalTime += Date.now() - userSessions[userId].startTime;
//     //   userSessions[userId].startTime = 0;
//     // }
//     res.send({
//       status:"succes"
//     });
// }


const sendMessageToPrivateAccount = async (req, res) => {
  const { recipientId, message } = req.body;
  const senderId = req.params.user_id; // assuming the authenticated user is the sender
  try {
    // check if sender and recipient are friends
    // const sender = await User.findById(senderId);
    const sender=await User.findOne({where:{id:senderId}});
    const gifts=await Gift.findAll({where:{id:senderId}});
    console.log(JSON.parse(JSON.stringify(gifts)),"sendre")
    // const userFriend=await UserFriend.findAll({ where: { id: senderId }})
    const allFriends = await UserFriend.findAll({
      where: { id: senderId },
      attributes: ['id'],
      include: [
        {
          model: User,
          attributes: ['id'],
          as: 'friend',
        },
      ],
    })

// console.log( JSON.parse(JSON.stringify(allFriends)),"allfriend")

    if (!allFriends.friend.includes(recipientId)) {
      return res.status(400).json({ message: 'You can only message your friends.' });
    }
    // check if sender has enough diamonds to send message
    const diamonds = req.body.diamonds || 0; // default value is 0
    const gift = req.body.gift || 0; // default value is 0
    let messageCount = 1;
    if (gift > 0) {
      if (gift === 500) {
        if (gifts.includes(recipientId)) {
          return res.status(400).json({ message: 'You can only send one 500-diamond gift to this user.' });
        } else {
         gifts.push(recipientId);
        }
      } else if (gift === 900) {
        messageCount = 2;
      } else if (gift === 1350) {
        messageCount = 3;
      } else if (gift === 5000) {
        sender.monthlyGift = true;
      }
    }
    if (diamonds > 0 && sender.diamonds < diamonds * messageCount) {
      return res.status(400).json({ message: 'You do not have enough diamonds to send this message.' });
    }

    // deduct diamonds from sender's account
    if (diamonds > 0) {
      sender.diamonds -= diamonds * messageCount;
      await sender.save();
    }

    // send message to recipient
    const recipient = await User.findOne(recipientId);
    recipient.messages.push({ sender: senderId, message });
    await recipient.save();

    res.json({ message: 'Message sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const addExternalLinks=async (req, res) => {
  const userId = req.params.id;
  const link1 = req.body.link;
  try {
    const user = await User.findOne({where:{id:userId}});
    console.log(user,"userdata")
    // console.log(user.externalLinks,"linksarr")
    user.externalLinks.push(link1);
    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  updateUser,
  userInfo,
  userInfoById,
  uploadData,
  categorized_gift,
  handlediamonds,
  language_traslator,
  trackUserStartTime,
  trackUserEndTime,
  sendMessageToPrivateAccount,
  addExternalLinks
};
