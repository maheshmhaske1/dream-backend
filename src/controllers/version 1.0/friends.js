const { User, UserFriend, Post } = require('../../models');
const logger = require('../../utils/logger');

const addFriend = async (req, res, next) => {
  logger.info("FRIEND: ADD FRIEND API CALLED");
  const { friendId } = req.body
  const userId = req.userData.id
  // console.log(userId,"userid")
  try {
    if (friendId) {
      if (friendId === userId) {
        res.status(400).json({ response: 'user cannot follow self' })
      } else {
        const checkFriend = await User.findOne({ where: { id: friendId } })
        if (checkFriend) {
          const isAdded = await UserFriend.findOne({
            where: { user_id: userId, friend_id: friendId },
          })
          if (isAdded) {
            res.status(200).json({ response: 'already added', isFriend: true })
          } else {
            const newFriend = await UserFriend.create({
              user_id: userId,
              friend_id: friendId,
            })
            res.status(200).json({ response: 'added', isFriend: true,newFriend })
          }
        } else {
          res.status(404).json({ response: 'friend not found' })
        }
      }
    } else {
      res.status(422).json({ response: 'friendId not preent' })
    }
  } catch (error) {
    logger.error(error)
    res.status(500).json({ response: 'error occured' })
  }
}

const removeFriend = async (req, res, next) => {
  logger.info("FRIEND: REMOVE FRIEND API CALLED");
  const { friendId } = req.body
  const userId = req.userData.id
  try {
    if (friendId) {
      const isAdded = await UserFriend.findOne({
        where: { userId: userId, friendId: friendId },
      })
      if (isAdded) {
        await UserFriend.destroy({
          where: { userId: userId, friendId: friendId },
        })
        res.status(200).json({ response: 'removed', isFriend: false })
      } else {
        res.status(404).json({ response: 'not friend', isFriend: false })
      }
    } else {
      res.status(422).json({ response: 'friendId not preent' })
    }
  } catch (error) {
    logger.error(error)
    res.status(500).json({ response: 'error occured' })
  }
}

const getAllUserFriends = async (req, res, next) => {
  logger.info("FRIEND: GET ALL USER FRIENDS API CALLED");
  const userId = req.params.userId
  try {
    const allFriends = await User.findOne({
      where: { id: userId },
      attributes: ['id'],
      include: [
        {
          model: User,
          attributes: ['id'],
          as: 'friend',
          through: { attributes: [] },
        },
      ],
    })
    res.status(200).json({ user: allFriends })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ response: 'error occured' })
  }
}

module.exports = {
  addFriend,
  removeFriend,
  getAllUserFriends,
}
