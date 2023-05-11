const { sq } = require("../config/db");
const { DataTypes } = require("sequelize");

const User = sq.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      // unique: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firebase_uid: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM,
      values: ["user", "admin"],
      defaultValue: "user",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    social_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    intro_video: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_attachement: {
      type: DataTypes.STRING,
      allowNull: true
    },
    secret_sign: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    language: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    diamonds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lat: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    lng: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    DOB: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allowedToSendGift: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    isPremiumUser: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    isProfileCrownEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    verificationStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      values: [1, 0],
      defaultValue: 1,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: function () {
        let d = new Date();
        return d.toISOString();
      },
    },
    timestamp:
     { type: DataTypes.DATE, default: Date.now() },
    duration: 
    { type: DataTypes.INTEGER, required: true },
    user_likes:
     { type: DataTypes.INTEGER, default: 0 },
    //  bio: { type: DataTypes.STRING, required: true },
     externalLinks: { type:  DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true}
  },

  {
    timestamps: false,
    freezeTableName: true,
  }
);

module.exports = User;
