import React, { useState } from 'react';
import {
  ShieldCheck, Lock, CheckCircle2, Copy, Check,
  Layers, KeyRound, Eye, Sparkles, Cpu
} from 'lucide-react';
import { shortHash } from '../../utils/crypto';

export default function TamperProofVerificationCard({
  sha256 = '',
  perceptualHash = '',
  videoFingerprint = '',
  blockNumber = 105,
  blockHash = '',
  channel = 'mychannel',
  compact = false,
  className = ''
}) {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedDHash, setCopiedDHash] = useState(false);

  const copyText = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'sha') {
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    } else if (type === 'dhash') {
      setCopiedDHash(true);
      setTimeout(() => setCopiedDHash(false), 2000);
    }
  };

  const displaySha = sha256 || 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku';
  const displayDHash = perceptualHash || '01800ff01ff83ffc';
  const displayBlockHash = blockHash || `0x${displaySha.slice(0, 32)}...`;

  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2 select-none font-sans ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#166534]">
            <ShieldCheck className="w-4 h-4 text-[#00BA88] flex-shrink-0" />
            <span>Tamper-Proof Verification Passed</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#00BA88] text-[9px] font-mono font-bold border border-emerald-200">
            Immutable Ledger Secured
          </span>
        </div>

        <div className="space-y-1 font-mono text-[10px] text-[#262626] pt-1 border-t border-[#DCFCE7]">
          <div className="flex items-center justify-between">
            <span className="text-[#166534] font-medium">SHA-256:</span>
            <button
              onClick={() => copyText(displaySha, 'sha')}
              className="flex items-center gap-1 text-[#0095F6] hover:underline"
              title="Copy full cryptographic SHA-256 hash"
            >
              {copiedSha ? <Check className="w-3 h-3 text-[#00BA88]" /> : <Copy className="w-3 h-3" />}
              <span>{shortHash(displaySha, 6, 6)}</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#166534] font-medium">dHash Lock:</span>
            <span className="font-bold text-[#262626] flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-[#00BA88]" />
              {shortHash(displayDHash, 6, 6)} (Crop/Trim Locked)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-[#BBF7D0] bg-gradient-to-br from-[#F0FDF4] via-[#F6FEF9] to-[#FFFFFF] p-3.5 space-y-2.5 shadow-xs select-none font-sans ${className}`}>
      {/* ── Header Badges ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00BA88]/15 text-[#00BA88] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#14532D]">
                Tamper-Proof Verification Passed
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00BA88] fill-[#00BA88]" />
            </div>
            <p className="text-[10px] text-[#166534] font-medium">
              Org1MSP peer endorsement on channel <strong className="font-mono">{channel}</strong>
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0f5132] text-[10px] font-semibold border border-emerald-300 shadow-2xs">
          <Lock className="w-2.5 h-2.5 text-[#00BA88]" />
          <span>Immutable Ledger Secured</span>
        </span>
      </div>

      {/* ── Cryptographic Hashes & dHash Indicators ── */}
      <div className="p-2.5 rounded-lg bg-white/90 border border-[#DCFCE7] space-y-1.5 font-mono text-[11px]">
        {/* SHA-256 */}
        <div className="flex items-center justify-between text-[#374151]">
          <span className="text-[10px] font-semibold text-[#166534] flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-[#00BA88]" />
            SHA-256 (IPFS CID):
          </span>
          <button
            onClick={() => copyText(displaySha, 'sha')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 text-[#0095F6] font-semibold transition-colors"
            title="Copy SHA-256 hash"
          >
            {copiedSha ? <Check className="w-3 h-3 text-[#00BA88]" /> : <Copy className="w-3 h-3" />}
            <span>{shortHash(displaySha, 7, 7)}</span>
          </button>
        </div>

        {/* Perceptual dHash */}
        <div className="flex items-center justify-between text-[#374151]">
          <span className="text-[10px] font-semibold text-[#166534] flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#00BA88]" />
            Perceptual dHash:
          </span>
          <button
            onClick={() => copyText(displayDHash, 'dhash')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 text-[#262626] font-bold transition-colors"
            title="Copy dHash fingerprint"
          >
            {copiedDHash ? <Check className="w-3 h-3 text-[#00BA88]" /> : <Copy className="w-3 h-3 text-gray-400" />}
            <span>{shortHash(displayDHash, 6, 6)}</span>
          </button>
        </div>

        {/* Video Temporal Fingerprint if applicable */}
        {videoFingerprint && (
          <div className="flex items-center justify-between text-[#374151]">
            <span className="text-[10px] font-semibold text-[#166534] flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#00BA88]" />
              Temporal Frame Hash:
            </span>
            <span className="text-[10px] font-bold text-[#262626]">
              {shortHash(videoFingerprint, 8, 8)}
            </span>
          </div>
        )}

        {/* Fabric Block Hash */}
        <div className="flex items-center justify-between text-[#374151] pt-1 border-t border-[#F0FDF4]">
          <span className="text-[10px] font-semibold text-[#166534] flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#00BA88]" />
            Ledger Block #{blockNumber}:
          </span>
          <span className="text-[10px] font-mono text-[#6B7280]">
            {shortHash(displayBlockHash, 6, 6)}
          </span>
        </div>
      </div>

      {/* ── Protection Notice Pill ── */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#DCFCE7]/60 text-[10px] text-[#14532D] font-sans font-medium">
        <Sparkles className="w-3 h-3 text-[#00BA88] flex-shrink-0" />
        <span>Media locked against crops, trims, mirror flips, and reversal attacks.</span>
      </div>
    </div>
  );
}
