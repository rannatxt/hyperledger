'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/config');

// RFC4648 Base32 alphabet for IPFS CIDv1 formatting
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

function toBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generate a CIDv1 (raw leaf with SHA-256 multihash)
 * Multicodec: 0x55 (raw), Multihash: 0x12 (sha2-256), 0x20 (32 bytes length)
 */
function generateCidV1(buffer) {
  const sha256 = crypto.createHash('sha256').update(buffer).digest();
  // multihash header: 0x01 (cidv1), 0x55 (raw codec), 0x12 (sha-256), 0x20 (32 bytes)
  const header = Buffer.from([0x01, 0x55, 0x12, 0x20]);
  const multihash = Buffer.concat([header, sha256]);
  return 'bafk' + toBase32(multihash);
}

class IpfsService {
  constructor() {
    this.uploadDir = config.uploadDir;
    this.manifestPath = path.join(this.uploadDir, 'ipfs_manifest.json');
    this.manifest = new Map();

    this.ensureUploadDir();
    this.loadManifest();
    this.seedGenesisMedia();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  seedGenesisMedia() {
    const genesisItems = [
      {
        cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        filename: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.svg',
        mimeType: 'image/svg+xml',
        originalName: 'genesis_fabric_block.svg',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f2027" />
              <stop offset="50%" stop-color="#203a43" />
              <stop offset="100%" stop-color="#2c5364" />
            </linearGradient>
            <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0095f6" />
              <stop offset="100%" stop-color="#00f2fe" />
            </linearGradient>
          </defs>
          <rect width="800" height="800" fill="url(#g1)" />
          <circle cx="400" cy="400" r="220" fill="none" stroke="url(#glow)" stroke-width="4" stroke-dasharray="12 8" opacity="0.6"/>
          <circle cx="400" cy="400" r="140" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
          <text x="400" y="380" fill="#ffffff" font-size="38" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" text-anchor="middle">HYPERLEDGER</text>
          <text x="400" y="430" fill="#0095f6" font-size="28" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600" text-anchor="middle">FABRIC GENESIS</text>
          <text x="400" y="470" fill="#888888" font-size="16" font-family="monospace" text-anchor="middle">Channel: mychannel · Block #0</text>
        </svg>`
      },
      {
        cid: 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
        filename: 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku.svg',
        mimeType: 'image/svg+xml',
        originalName: 'decentralized_identity.svg',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
          <defs>
            <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#141e30" />
              <stop offset="100%" stop-color="#243b55" />
            </linearGradient>
            <linearGradient id="gpink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f857a6" />
              <stop offset="100%" stop-color="#ff5858" />
            </linearGradient>
          </defs>
          <rect width="800" height="800" fill="url(#g2)" />
          <polygon points="400,200 550,300 550,500 400,600 250,500 250,300" fill="none" stroke="url(#gpink)" stroke-width="4"/>
          <text x="400" y="390" fill="#ffffff" font-size="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" text-anchor="middle">IMMUTABLE IDENTITY</text>
          <text x="400" y="435" fill="#f857a6" font-size="20" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="500" text-anchor="middle">Org1MSP Verified</text>
          <text x="400" y="475" fill="#a0a0a0" font-size="14" font-family="monospace" text-anchor="middle">Composite Key: Follow~elena~satoshi</text>
        </svg>`
      },
      {
        cid: 'bafybeibml5fanx2qipldt7n76l7l2y77jygz7z3y6y5z4k7p4w6y4i5v5y',
        filename: 'bafybeibml5fanx2qipldt7n76l7l2y77jygz7z3y6y5z4k7p4w6y4i5v5y.svg',
        mimeType: 'image/svg+xml',
        originalName: 'generative_ipfs_asset.svg',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
          <defs>
            <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#090a0f" />
              <stop offset="100%" stop-color="#1b2735" />
            </linearGradient>
            <linearGradient id="gpurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#8a2387" />
              <stop offset="50%" stop-color="#e94057" />
              <stop offset="100%" stop-color="#f27121" />
            </linearGradient>
          </defs>
          <rect width="800" height="800" fill="url(#g3)" />
          <circle cx="400" cy="400" r="180" fill="none" stroke="url(#gpurple)" stroke-width="8"/>
          <text x="400" y="385" fill="#ffffff" font-size="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" text-anchor="middle">IPFS PINNED ASSET</text>
          <text x="400" y="430" fill="#e94057" font-size="22" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600" text-anchor="middle">Content Addressed</text>
          <text x="400" y="470" fill="#888888" font-size="14" font-family="monospace" text-anchor="middle">CIDv1 SHA-256 Multihash</text>
        </svg>`
      }
    ];

    for (const item of genesisItems) {
      const filePath = path.join(this.uploadDir, item.filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, item.svg, 'utf8');
      }
      if (!this.manifest.has(item.cid)) {
        this.manifest.set(item.cid, {
          cid: item.cid,
          filename: item.filename,
          originalName: item.originalName,
          mimeType: item.mimeType,
          size: Buffer.byteLength(item.svg),
          timestamp: new Date('2026-09-01T00:00:00.000Z').toISOString(),
          pinned: true
        });
      }
    }
    this.saveManifest();
  }

  loadManifest() {
    try {
      if (fs.existsSync(this.manifestPath)) {
        const raw = fs.readFileSync(this.manifestPath, 'utf8');
        const data = JSON.parse(raw);
        for (const [cid, item] of Object.entries(data)) {
          this.manifest.set(cid, item);
        }
      }
    } catch (err) {
      console.warn('Could not read existing IPFS manifest, starting fresh:', err.message);
    }
  }

  saveManifest() {
    try {
      const obj = {};
      for (const [cid, item] of this.manifest.entries()) {
        obj[cid] = item;
      }
      fs.writeFileSync(this.manifestPath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save IPFS manifest:', err.message);
    }
  }

  /**
   * Upload binary buffer to simulated IPFS
   */
  async uploadBuffer(buffer, originalName = 'media.bin', mimeType = 'application/octet-stream') {
    this.ensureUploadDir();

    const cid = generateCidV1(buffer);
    const ext = path.extname(originalName) || (mimeType.includes('png') ? '.png' : mimeType.includes('video') ? '.mp4' : '.jpg');
    const filename = `${cid}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save binary data to storage
    fs.writeFileSync(filePath, buffer);

    const record = {
      cid,
      filename,
      originalName,
      mimeType,
      size: buffer.length,
      timestamp: new Date().toISOString(),
      pinned: true
    };

    this.manifest.set(cid, record);
    this.saveManifest();

    return record;
  }

  /**
   * Get file metadata and file path by CID
   */
  getFile(cid) {
    const item = this.manifest.get(cid);
    if (!item) {
      return null;
    }

    const filePath = path.join(this.uploadDir, item.filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return {
      ...item,
      filePath
    };
  }

  /**
   * Retrieve all pinned CIDs
   */
  getAllCids() {
    return Array.from(this.manifest.values());
  }

  /**
   * Return IPFS storage statistics
   */
  getStats() {
    let totalSize = 0;
    for (const item of this.manifest.values()) {
      totalSize += item.size || 0;
    }
    return {
      status: 'ONLINE',
      protocol: 'IPFS / CIDv1',
      pinnedCount: this.manifest.size,
      totalBytes: totalSize,
      storagePath: this.uploadDir
    };
  }
}

module.exports = new IpfsService();
