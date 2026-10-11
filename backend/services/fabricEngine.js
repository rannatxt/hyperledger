'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const InstaLedgerContract = require('../../chaincode/lib/instaledger-contract');
const config = require('../config/config');

const PERSISTENCE_FILE = path.resolve(__dirname, '..', 'data', 'ledger_world_state.json');

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

  persist() {
    try {
      const stateObj = {};
      for (const [key, val] of this.worldState.entries()) {
        stateObj[key] = Buffer.isBuffer(val) ? val.toString('base64') : Buffer.from(val).toString('base64');
      }
      const data = {
        blockNumber: this.blockNumber,
        previousBlockHash: this.previousBlockHash,
        blocks: this.blocks,
        transactions: Array.from(this.transactions.entries()),
        worldState: stateObj
      };
      const dataDir = path.dirname(PERSISTENCE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const tmpFile = PERSISTENCE_FILE + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpFile, PERSISTENCE_FILE);
    } catch (err) {
      console.warn('Failed to persist Fabric World State to disk:', err.message);
    }
  }

  loadFromDisk() {
    try {
      if (!fs.existsSync(PERSISTENCE_FILE)) return false;
      const raw = fs.readFileSync(PERSISTENCE_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data || !data.worldState) return false;

      this.worldState.clear();
      for (const [key, b64] of Object.entries(data.worldState)) {
        this.worldState.set(key, Buffer.from(b64, 'base64'));
      }
      this.blocks = data.blocks || [];
      this.transactions = new Map(data.transactions || []);
      this.blockNumber = data.blockNumber || 0;
      this.previousBlockHash = data.previousBlockHash || '0000000000000000000000000000000000000000000000000000000000000000';
      return true;
    } catch (err) {
      console.warn('Could not restore Fabric World State from disk:', err.message);
      return false;
    }
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (this.loadFromDisk() && this.blocks.length > 0 && this.worldState.size > 0) {
      console.log(`Hyperledger Fabric Engine restored from disk (${this.blocks.length} blocks, ${this.worldState.size} world state keys).`);
      return;
    }

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
    this.persist();
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

    this.persist();

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
