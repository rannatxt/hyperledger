# ⛓️ InstaLedger

> **Decentralized Instagram on Hyperledger Fabric & Simulated IPFS**

InstaLedger is a fully functional, end-to-end decentralized social media application inspired by Instagram. All user profiles, post metadata, likes, comments, and follow relationships are immutably recorded on a **Hyperledger Fabric** blockchain network, while media binaries (images and videos) are content-addressed and pinned via **simulated IPFS** with deterministic SHA-256 multihash CIDs.

---

## 🌟 Key Features

- **Hyperledger Fabric Blockchain Core:**
  - Production Node.js Smart Contract (`fabric-contract-api`).
  - Assets: `Profile`, `Post`, `Like`, `Follow`, `Comment`.
  - Atomically updated counters and composite keys (`Like~postId~userId`, `Follow~followerId~targetId`, `Comment~postId~commentId`).
  - Full read/write sets (RWSet), block hashing, and deterministic consensus on channel `mychannel`.
- **Dual-Mode Fabric Middleware:**
  - **Docker / Production Mode:** Seamlessly connects to live Hyperledger Fabric test-network peers and orderers via Fabric Gateway.
  - **Zero-Dependency Engine Mode:** High-fidelity embedded Fabric Node.js contract runtime & state database simulator for Windows/local environments without Docker, providing instant execution, block mining, and transaction history out of the box.
- **Simulated IPFS Media Storage:**
  - Generates authentic **CIDv1** SHA-256 multihashes (`bafk...`).
  - Stores media binaries on disk and serves them through immutable content-addressed routes (`/api/ipfs/:cid`).
- **Modern Instagram-Inspired Frontend:**
  - Built with **React (Vite) + Tailwind CSS** with sleek Instagram dark mode.
  - Double-tap image heart burst animation.
  - Active participant switcher (switch between `@ranna`, `@elena_crypto`, `@marcus_art` with 1 click).
  - Stories tray with colorful gradient rings.
  - Post creation modal with drag-and-drop, visual filter presets (Clarendon, Juno, Moon, etc.), and animated 3-step blockchain consensus commitment.
  - **Live Ledger Explorer:** View blocks, transaction IDs, function arguments, execution times, and state read/write sets.
  - User Profile view with follower counts and post gallery grid.

---

## 🏗️ Repository Architecture

```
hyperledger/
├── api/
│   └── index.js                      # Vercel serverless function entry point
├── chaincode/
│   ├── package.json
│   ├── index.js                      # Contract export
│   ├── lib/
│   │   ├── instaledger-contract.js   # Fabric Smart Contract implementation
│   │   └── utils.js                  # Serialization and iterator helpers
│   └── test/
│       └── instaledger-contract.test.js # Unit & integration tests for chaincode
├── network/
│   ├── connection-org1.json          # Fabric network connection profile
│   ├── deployChaincode.sh            # Script to package/deploy to Fabric test-network
│   └── docker-compose-test-net.yaml  # CouchDB, Peer0 Org1, and Orderer compose config
├── backend/
│   ├── package.json
│   ├── server.js                     # Express REST API middleware
│   ├── config/config.js              # Environment settings
│   ├── services/
│   │   ├── fabricClient.js           # Unified Fabric client
│   │   ├── fabricEngine.js           # High-fidelity embedded Fabric contract & ledger simulator
│   │   └── ipfsService.js            # Simulated IPFS storage daemon with CIDv1 generation
│   ├── routes/
│   │   ├── authRoutes.js             # User registration and profiles
│   │   ├── postRoutes.js             # Post minting and feed retrieval
│   │   ├── interactionRoutes.js      # Likes, comments, follows
│   │   ├── ipfsRoutes.js             # Media upload and streaming
│   │   └── ledgerRoutes.js           # Blocks, transactions, and network status
│   └── test/api.test.js              # Integration tests for backend REST APIs
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Sidebar.jsx           # Left Instagram navigation
│       │   ├── StoriesBar.jsx        # Story ring carousel
│       │   ├── PostCard.jsx          # Post card with media, like heart burst, comments
│       │   ├── UploadModal.jsx       # Media upload drawer with filters & consensus indicator
│       │   ├── ProfileView.jsx       # Profile header, follower counts, gallery grid
│       │   ├── LedgerInspectorModal.jsx # Live blockchain block & transaction explorer
│       │   └── ActivityDrawer.jsx    # Real-time ledger activity drawer
│       ├── services/api.js           # REST API client
│       └── utils/helpers.js          # Helpers (CID truncation, time formatting)
├── vercel.json                       # Deployment config for Vercel
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- npm (v8+)

### 1. Run Automated Tests
Verify both the Hyperledger Fabric chaincode and backend APIs:

```bash
# Test Hyperledger Fabric smart contract
cd chaincode
node --test test/instaledger-contract.test.js

# Test Backend API & IPFS integration
cd ../backend
npm install
npm test
```

### 2. Start Backend Middleware
From the project root:

```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`.*

### 3. Start Frontend
In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🌐 Deploy to Vercel

This repository is pre-configured with `vercel.json` for automated deployment on [Vercel](https://vercel.com/ranna1):

1. Go to your Vercel Dashboard at **[https://vercel.com/ranna1](https://vercel.com/ranna1)**.
2. Click **Add New...** -> **Project**.
3. Select and import your GitHub repository: `https://github.com/rannatxt/hyperledger.git`.
4. Leave build settings as default (Vercel automatically detects the configuration from `vercel.json`).
5. Click **Deploy**!

---

## 🔒 Deploying to a Live Hyperledger Fabric Network (Optional)

If running in a Linux/Docker/WSL2 environment with Fabric test-network:

```bash
cd network
chmod +x deployChaincode.sh
./deployChaincode.sh mychannel instaledger ../chaincode 1.0 1 initLedger
```

Then in `backend/.env`:
```env
FABRIC_NETWORK_ENABLED=true
FABRIC_CONNECTION_PROFILE=../network/connection-org1.json
```

---

## 👤 Author
- **GitHub:** [@rannatxt](https://github.com/rannatxt)
- **Vercel:** [ranna1](https://vercel.com/ranna1)
