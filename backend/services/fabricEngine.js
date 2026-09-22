'use strict';

const crypto = require('crypto');
const InstaLedgerContract = require('../../chaincode/lib/instaledger-contract');
const config = require('../config/config');

class EngineIterator {
  constructor(items) {
    this.items = items;
    this.currentIndex = 0;
  }

  async next() {
    if (this.currentIndex < this.items.length) {
      const item = this.items[this.currentIndex++];
      return { value: item, done: false };
    }
    return { value: null, done: true };
  }

  async close() {
    this.items = [];
  }
}

class EngineStub {
  constructor(worldState, rwSet) {
    this.worldState = worldState;
    this.rwSet = rwSet; // { reads: [], writes: [], deletes: [] }
  }

  async putState(key, value) {
    const valBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
    this.worldState.set(key, valBuffer);
    this.rwSet.writes.push({ key, valueLength: valBuffer.length });
  }

  async getState(key) {
    const val = this.worldState.get(key) || Buffer.alloc(0);
    this.rwSet.reads.push({ key, found: val.length > 0 });
    return val;
  }

  async deleteState(key) {
    this.worldState.delete(key);
    this.rwSet.deletes.push({ key });
  }

  createCompositeKey(objectType, attributes) {
    return `\u0000${objectType}\u0000${attributes.join('\u0000')}\u0000`;
  }

  splitCompositeKey(compositeKey) {
    const parts = compositeKey.split('\u0000').filter(p => p.length > 0);
    return {
      objectType: parts[0],
      attributes: parts.slice(1)
    };
  }

  async getStateByRange(startKey, endKey) {
    const results = [];
    for (const [key, value] of this.worldState.entries()) {
      if (key >= startKey && (endKey === '' || key <= endKey)) {
        results.push({ key, value });
      }
    }
    return new EngineIterator(results);
  }

  async getStateByPartialCompositeKey(objectType, attributes) {
    const prefix = `\u0000${objectType}\u0000${attributes.join('\u0000')}`;
    const results = [];
    for (const [key, value] of this.worldState.entries()) {
      if (key.startsWith(prefix)) {
        results.push({ key, value });
      }
    }
    return new EngineIterator(results);
  }
}

class FabricEngine {
  constructor() {
    this.contract = new InstaLedgerContract();
    this.worldState = new Map();
    this.blocks = [];
    this.transactions = new Map();
    this.blockNumber = 0;
    this.previousBlockHash = '0000000000000000000000000000000000000000000000000000000000000000';
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Create Genesis Block #0
    const genesisTime = new Date('2026-09-01T00:00:00.000Z').toISOString();
    const genesisHash = crypto.createHash('sha256').update('genesis-instaledger-channel').digest('hex');
    const genesisBlock = {
      blockNumber: 0,
      blockHash: genesisHash,
      previousBlockHash: this.previousBlockHash,
      channelId: config.channelName,
      timestamp: genesisTime,
      transactionsCount: 1,
      transactions: [
        {
          txId: 'tx_genesis_init_000',
          creatorMsp: config.mspId,
          chaincode: config.chaincodeName,
          function: 'initLedger',
          args: [],
          status: 'COMMITTED',
          timestamp: genesisTime,
          rwSet: { reads: [], writes: [{ key: 'Genesis', valueLength: 32 }], deletes: [] }
        }
      ]
    };
    this.blocks.push(genesisBlock);
    this.previousBlockHash = genesisHash;
    this.blockNumber = 1;

    // Run contract initLedger
    await this.submitTransaction('initLedger');
    console.log('Hyperledger Fabric Engine initialized with genesis data on channel:', config.channelName);
  }

  createContext(rwSet) {
    return {
      stub: new EngineStub(this.worldState, rwSet)
    };
  }

  /**
   * Submit transaction (invokes contract, creates block with rwset)
   */
  async submitTransaction(functionName, ...args) {
    if (typeof this.contract[functionName] !== 'function') {
      throw new Error(`Chaincode method '${functionName}' not found`);
    }

    const txId = 'tx_' + crypto.randomBytes(16).toString('hex');
    const rwSet = { reads: [], writes: [], deletes: [] };
    const ctx = this.createContext(rwSet);

    const startTime = Date.now();
    let result;
    try {
      result = await this.contract[functionName](ctx, ...args);
    } catch (err) {
      console.error(`Transaction execution failed for ${functionName}:`, err.message);
      throw err;
    }

    const timestamp = new Date().toISOString();
    const txRecord = {
      txId,
      blockNumber: this.blockNumber,
      channelId: config.channelName,
      chaincode: config.chaincodeName,
      creatorMsp: config.mspId,
      function: functionName,
      args: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))),
      status: 'COMMITTED',
      timestamp,
      executionTimeMs: Date.now() - startTime,
      rwSet
    };

    // Mine into a block
    const blockData = JSON.stringify({
      num: this.blockNumber,
      prev: this.previousBlockHash,
      tx: txRecord
    });
    const blockHash = crypto.createHash('sha256').update(blockData).digest('hex');

    const newBlock = {
      blockNumber: this.blockNumber,
      blockHash,
      previousBlockHash: this.previousBlockHash,
      channelId: config.channelName,
      timestamp,
      transactionsCount: 1,
      transactions: [txRecord]
    };

    this.blocks.unshift(newBlock); // newest block first
    this.transactions.set(txId, txRecord);
    this.previousBlockHash = blockHash;
    this.blockNumber++;

    return result;
  }

  /**
   * Evaluate transaction (read-only query, no block created)
   */
  async evaluateTransaction(functionName, ...args) {
    if (typeof this.contract[functionName] !== 'function') {
      throw new Error(`Chaincode method '${functionName}' not found`);
    }
    const rwSet = { reads: [], writes: [], deletes: [] };
    const ctx = this.createContext(rwSet);
    return await this.contract[functionName](ctx, ...args);
  }

  getBlocks(limit = 50) {
    return this.blocks.slice(0, limit);
  }

  getBlock(blockNumber) {
    return this.blocks.find(b => b.blockNumber === Number(blockNumber));
  }

  getTransaction(txId) {
    return this.transactions.get(txId);
  }

  getStatus() {
    return {
      status: 'ONLINE',
      mode: 'HYPERLEDGER_FABRIC_ENGINE',
      channelId: config.channelName,
      chaincodeId: config.chaincodeName,
      mspId: config.mspId,
      blockHeight: this.blocks.length,
      totalTransactions: this.transactions.size + 1,
      stateKeysCount: this.worldState.size
    };
  }
}

const engineInstance = new FabricEngine();
// Kick off initialization
engineInstance.init().catch(err => console.error('Error initializing Fabric Engine:', err));

module.exports = engineInstance;
