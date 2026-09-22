#!/usr/bin/env bash
# ==============================================================================
# Script to package, install, approve, and commit the InstaLedger chaincode
# to Hyperledger Fabric test-network with CouchDB
# ==============================================================================

set -euo pipefail

CHANNEL_NAME=${1:-"mychannel"}
CC_NAME=${2:-"instaledger"}
CC_SRC_PATH=${3:-"../chaincode"}
CC_VERSION=${4:-"1.0"}
CC_SEQUENCE=${5:-"1"}
CC_INIT_FCN=${6:-"initLedger"}

echo "=== Packaging chaincode: ${CC_NAME} (v${CC_VERSION}) ==="
peer lifecycle chaincode package ${CC_NAME}.tar.gz \
  --path ${CC_SRC_PATH} \
  --lang node \
  --label ${CC_NAME}_${CC_VERSION}

echo "=== Installing chaincode on Org1 peer ==="
peer lifecycle chaincode install ${CC_NAME}.tar.gz

export CC_PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)
echo "Chaincode Package ID: ${CC_PACKAGE_ID}"

echo "=== Approving chaincode definition for Org1 ==="
peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --package-id ${CC_PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} \
  --init-required

echo "=== Committing chaincode definition to channel ${CHANNEL_NAME} ==="
peer lifecycle chaincode commit -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --sequence ${CC_SEQUENCE} \
  --init-required

echo "=== Initializing ledger with genesis data ==="
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --isInit \
  -c '{"Args":["initLedger"]}'

echo "=== InstaLedger Chaincode Deployed Successfully ==="
