const { VideoLike, Comment, CommentReply, Tag, Like, User, Gift,Video } = require("../../models");

const cloudinary = require("../../config/cloudinary");
const fs = require("fs");
const logger = require("../../utils/logger");
const errorHandler = require("../../utils/errorObject");
const sequelize = require('sequelize');
const { sq } = require('../../config/db');

const uploadVideo = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: CREATE VIDEO API CALLED");
  try {
    let {
      mediaType, postedDateTime,
      commentsEnabled, tags, status
    } = req.body, dbObjectForTags = [],
      { id } = req.userData,
      video = req.files.source ? req.files.source[0] : null,
      image = req.files.cover ? req.files.cover[0] : null,
      videoPath = video?.path, imagePath = image?.path,
      promises = [], uploadedVideo, uploadedImage;

    if (!videoPath) throw errorHandler("data is not present in body", "badRequest");

    uploadedVideo = await cloudinary.uploads(videoPath, "SocialMedia");
    promises.push(fs.unlinkSync(videoPath));

    if (imagePath) {
      uploadedImage = await cloudinary.uploads(imagePath, "SocialMedia");
      promises.push(fs.unlinkSync(imagePath));
    }

    let addVideo = await Video.create({
      type: mediaType, postedDateTime,
      commentsEnabled, cover: uploadedImage?.url || null,
      video: uploadedVideo.url, user_id: id, status
    });
    addVideo = JSON.parse(JSON.stringify(addVideo));

    if (tags) {
      let allTags = tags.split(',');

      for (let i = 0; i < allTags?.length; i++) {
        dbObjectForTags.push({
          video_id: addVideo.id,
          title: allTags[i]
        });
      }

    }
    let videoTags = await Tag.bulkCreate(dbObjectForTags);
    videoTags = JSON.parse(JSON.stringify(videoTags));

    await Promise.all(promises);

    res.status(201).json({
      success: true,
      message: "Video posted successfully!",
      payload: {
        ...video,
        tags: videoTags
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const allVideos = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: GET ALL VIDEOS API CALLED");
  try {
    const videos = await Video.findAll({
      where: {
        status: "public"
      },
      include: [
        {
          model: Comment,
          as: "comments",
        },
        {
          attributes: {
            exclude: ["first_name", "last_name", "password"]
          },
          model: User,
          as: "user"
        }
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Videos fetched successfully",
      videos
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const getVideo = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: GET VIDEO BY FILTERS API CALLED");
  try {
    let { video_id, user_id, status } = req.query,
      condition = {};

    video_id && (condition.id = video_id);
    user_id && (condition.user_id = user_id);
    status && (condition.status = status);

    const videos = await Video.findAll({
      where: condition,
      include: [
        {
          as: "comments",
          model: Comment,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Videos fetched successfully",
      videos
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const getAllUserVideos = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: GET ALL USER VIDEOS API CALLED");
  try {
    let { id } = req.userData;

    const videos = await Video.findAll({
      where: { user_id: id },
      include: [
        {
          as: "comments",
          model: Comment,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Successfully fetched videos!",
      videos
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const getUserPostedImages = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: GET ALL USER POSTED IMAGES API CALLED");
  try {
    let { status } = req.query,
      condition = {};

    condition.status = status;
    condition.type = "image";

    const videos = await Video.findAll({
      where: condition,
    });

    return res.status(200).json({
      success: true,
      message: "Successfully fetched images!",
      images: videos
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const updateVideo = (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: UPDATE VIDEO API CALLED");
  try {

  } catch (error) {

  }
};

const deleteVideo = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: DELETE VIDEO API CALLED");
  try {
    let { id } = req.params;

    const video = await Video.destroy({
      where: { id },
    });

    if (!video) throw errorHandler("Video not found!", "notFound");

    return res.status(200).json({
      success: true,
      message: "Video successfully deleted!"
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const likeVideo = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: LIKE VIDEO API CALLED");
  try {
    let { video_id } = req.params,
      { status } = req.body,
      user_id = req.userData.id,
      { like_id } = req.query,
      dbPayload = {
        video_id,
        user_id,
        status
      };

    like_id && (dbPayload.id = like_id);

    let liked = await Like.upsert(dbPayload);
    liked = JSON.parse(JSON.stringify(liked));

    if (!liked) throw errorHandler("Unexpected error occured while liking video!", "notFound");

    let totalVideoLikes = await Like.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_likes'],
      ],
      where: { id: video_id },
      group: ['video_id']
    });
    totalVideoLikes = JSON.parse(JSON.stringify(totalVideoLikes));

    return res.status(200).json({
      success: true,
      message: status === true ? "Liked video successfully!" : "Disliked video successfully!",
      payload: {
        liked,
        totalVideoLikes: totalVideoLikes[0]?.total_likes
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const commentVideo = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: COMMENT VIDEO API CALLED");
  try {
    let { video_id } = req.params,
      { comment } = req.body,
      user_id = req.userData.id;

    let commented = await Comment.create({
      video_id, comment, user_id
    });
    commented = JSON.parse(JSON.stringify(commented));

    if (!commented) throw errorHandler("Unexpected error occured while commenting on video!", "notFound");

    let totalComments = await Comment.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_comments']
      ],
      where: { video_id },
      group: ['video_id'],
      distinct: true
    });
    totalComments = JSON.parse(JSON.stringify(totalComments));

    return res.status(200).json({
      success: true,
      message: "Commented on video successfully!",
      payload: {
        comment: commented,
        totalComments: totalComments[0]?.total_comments
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const replyComment = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: REPLY COMMENT VIDEO API CALLED");
  try {
    let { comment_id } = req.params,
      { reply } = req.body,
      user_id = req.userData.id;

    let replied = await CommentReply.create({
      comment_id, reply, user_id
    });
    replied = JSON.parse(JSON.stringify(replied));

    if (!replied) throw errorHandler("Unexpected error occured while replying comment on video!", "notFound");

    let totalComments = await Comment.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_comments']
      ],
      where: { video_id },
      group: ['video_id'],
      distinct: true
    });
    totalComments = JSON.parse(JSON.stringify(totalComments));

    return res.status(200).json({
      success: true,
      message: "Commented on video successfully!",
      payload: {
        reply: replied,
        totalComments: totalComments[0]
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const userInvolvedVideos = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: USER INVOLVED VIDEOS API CALLED");
  try {
    let user_id = req.userData.id;

    let userLikedVideos = await Video.findAll({
      attributes: ['id', 'video'],
      include: [
        {
          where: { user_id },
          model: Like,
          as: "likes"
        },
      ]
    });

    let userCommentedVideos = await Video.findAll({
      attributes: ['id', 'video'],
      include: [
        {
          where: { user_id },
          required: true,
          model: Comment,
          as: "comments"
        },
      ]
    });

    userLikedVideos = JSON.parse(JSON.stringify(userLikedVideos));
    userCommentedVideos = JSON.parse(JSON.stringify(userCommentedVideos));


    return res.status(200).json({
      success: true,
      message: "User Involved videos fetched successfully!",
      payload: {
        userLikedVideos,
        userCommentedVideos
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const userInvolvedVideosById = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: USER INVOLVED VIDEOS BY ID API CALLED");
  try {
    let { user_id } = req.params;

    let userLikedVideos = await Video.findAll({
      attributes: ['id', 'video'],
      include: [
        {
          where: { user_id },
          model: Like,
          as: "likes"
        },
      ]
    });

    let userCommentedVideos = await Video.findAll({
      attributes: ['id', 'video'],
      include: [
        {
          where: { user_id },
          required: true,
          model: Comment,
          as: "comments"
        },
      ]
    });

    userLikedVideos = JSON.parse(JSON.stringify(userLikedVideos));
    userCommentedVideos = JSON.parse(JSON.stringify(userCommentedVideos));


    return res.status(200).json({
      success: true,
      message: "User Involved videos fetched successfully!",
      payload: {
        userLikedVideos,
        userCommentedVideos
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const allComments = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: VIDEO ALL COMMENTS API CALLED");
  try {
    let { video_id } = req.params;

    let videoComments = await Video.findOne({
      attributes: ['id', 'video'],
      where: { id: video_id },
      include: [
        {
          model: Comment,
          as: "comments",
          include: {
            model: User,
            as: "user"
          }
        },
      ]
    });
    videoComments = JSON.parse(JSON.stringify(videoComments));

    if (!videoComments) throw errorHandler("Video does not exist!", "notFound");

    let totalComments = await Comment.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_comments']
      ],
      where: { video_id },
      group: ['video_id'],
      distinct: true
    });
    totalComments = JSON.parse(JSON.stringify(totalComments));
    videoComments.totalComments = totalComments[0]?.total_comments || 0;


    return res.status(200).json({
      success: true,
      message: "Video all comments fetched successfully!",
      payload: videoComments
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const giftVideo = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: GIFT VIDEO API CALLED");
  try {
    let data = req.body,
      {
        to_video_id, num_of_diamonds
      } = data,
      reciever_id = data.to_user_id,
      sender_id = req.userData.id,
      user_diamonds = req.userData.diamonds;

    if (num_of_diamonds >= user_diamonds) throw errorHandler("You don't have enough diamonds!", "badRequest");

    let gift = await Gift.create({
      sender_id, reciever_id, video_id: to_video_id, diamonds: num_of_diamonds
    });
    gift = JSON.parse(JSON.stringify(gift));

    if (!gift) throw errorHandler("Unexpected error occured giving diamonds to video!", "badRequest");

    let user = await User.findOne({ where: { id: sender_id } });
    user.diamonds = user.diamonds - num_of_diamonds;
    user.save();

    let total_diamonds_gifted_to_video = await Gift.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('diamonds')), 'total_diamonds_gifted_to_video']
      ],
      where: { video_id: to_video_id },
      group: ['video_id']
    });
    total_diamonds_gifted_to_video = JSON.parse(JSON.stringify(total_diamonds_gifted_to_video));

    console.log(total_diamonds_gifted_to_video)

    return res.status(200).json({
      success: true,
      message: "Gifted diamonds successfully!",
      payload: {
        video_id: to_video_id,
        diamonds_gifted: num_of_diamonds,
        total_diamonds_gifted_to_video:
          parseInt(total_diamonds_gifted_to_video[0]?.total_diamonds_gifted_to_video) + parseInt(num_of_diamonds),
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const searchAllVideos = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: SEARCH ALL VIDEOS BY KEYWORD API CALLED");
  try {
    let { keyword } = req.query;

    const videos = await Video.findAll({
      attributes: ['id', 'video'],
      where: {
        status: "public",
        // keyword filter has to be added
      },
    });

    return res.status(200).json({
      success: true,
      message: "Videos fetched successfully",
      videos
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const searchVideosFromProfile = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: SEARCH PROFILE VIDEOS BY KEYWORD API CALLED");
  try {
    let { keyword, status } = req.query,
      user_id = req.userData.id,
      condition = {};

    status && (condition.status = status);
    condition.user_id = user_id;

    const videos = await Video.findAll({
      attributes: ['id', 'video'],
      where: condition,
    });

    return res.status(200).json({
      success: true,
      message: "Videos fetched successfully",
      videos
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};

const videoStats = async (req, res, next) => {
  logger.info("VERSION 2.0 -> VIDEO: VIDEO STATS BY ID API CALLED");
  try {
    let { video_id } = req.params,
      user_id = req.userData.id;

    let video = await Video.findAll({
      include: [
        {
          required: false,
          attributes: [
            [sequelize.fn("COUNT", sequelize.col('video_id')), "total_likes"]
          ],
          where: { video_id, status: true },
          model: Like,
          as: "likes"
        },
        {
          attributes: {
            exclude: ['firebase_uid']
          },
          model: User,
          as: "user"
        }
      ],
      group: ['video_id']
    });
    video = JSON.parse(JSON.stringify(video));


    let liked = await Like.findOne({
      attributes: [
        ['status', 'did_liked_before']
      ],
      where: { user_id, video_id }
    })
    liked = JSON.parse(JSON.stringify(liked));

    let gift = await Gift.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col('gift.diamonds')), "total_diamonds_gifted"]
      ],
      where: { video_id },
      group: ['video_id']
    });
    gift = JSON.parse(JSON.stringify(gift));

    return res.status(200).json({
      success: true,
      message: "Video stats successfully!",
      payload: {
        ...video[0],
        ...gift[0],
        ...liked
      }
    });
  } catch (error) {
    logger.error(error);

    return next(error);
  }
};


const handleClicks=async (req, res) => {
    const {video_id } = req.params;
    const { clicks } = req.body;
  
    // Check for valid number of clicks
    if (clicks < 2 || clicks > 4) {
      return res.status(400).json({ error: 'Invalid number of clicks' });
    }
    // Update clicks in database
    try {
      const video = await VideoLike.findOne({where:{id:video_id}});
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      // Handle message sending based on clicks
      let message;
      if (clicks === 2) {
        video.clicks ++;
        message = '(1) You have liked this video.';
      } else if (clicks === 3) {
        message = '(2) You have notified administration.';
      } else if (clicks === 4) {
        video.clicks++;
        message = '(3) You have liked this video again.';
      }
      // Send response with message
      res.status(200).json({ message });
    } catch (err) {
      console.error('Error updating clicks:', err);
      res.status(500).json({ error: 'Error updating clicks' });
    }
}


module.exports = {
  uploadVideo,
  allVideos,
  getVideo,
  updateVideo,
  getAllUserVideos,
  deleteVideo,
  likeVideo,
  commentVideo,
  replyComment,
  userInvolvedVideos,
  allComments,
  giftVideo,
  getUserPostedImages,
  searchAllVideos,
  searchVideosFromProfile,
  userInvolvedVideosById,
  videoStats,
  handleClicks
};
