'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  uploadDir: path.resolve(__dirname, '..', 'uploads'),
  channelName: process.env.CHANNEL_NAME || 'mychannel',
  chaincodeName: process.env.CHAINCODE_NAME || 'instaledger',
  mspId: process.env.MSP_ID || 'Org1MSP',
  fabricNetworkEnabled: process.env.FABRIC_NETWORK_ENABLED === 'true',
  connectionProfilePath: process.env.FABRIC_CONNECTION_PROFILE || path.resolve(__dirname, '..', '..', 'network', 'connection-org1.json'),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || 'instaledger',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryUrl: process.env.CLOUDINARY_URL || ''
};
