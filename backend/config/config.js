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
  connectionProfilePath: process.env.FABRIC_CONNECTION_PROFILE || path.resolve(__dirname, '..', '..', 'network', 'connection-org1.json')
};
