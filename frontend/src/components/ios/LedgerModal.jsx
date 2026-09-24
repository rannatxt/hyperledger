import { useState, useEffect } from 'react';
import {
  X, Layers, RefreshCw, Check, Copy,
  ShieldCheck, Lock, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../../services/api';
import { shortHash } from '../../utils/crypto';

export default function LedgerModal({ isOpen, onClose, highlightPost }) {
  const [tab,     setTab]     = useState('blocks');
  const [blocks,  setBlocks]  = useState([]);
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTx, setExpandedTx] = useState(null);
  const [copied,  setCopied]  = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([api.getLedger(), api.getBlocks()])
      .then(([s, blk]) => {
        setStatus(s);
        setBlocks(blk?.blocks || blk || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#121212] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-ios-blue/20 text-ios-blue"><Layers className="w-4 h-4" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">Hyperledger Fabric Explorer</h2>
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-mono text-[9px] font-semibold border border-green-500/30">mychannel</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">Consensus: Raft · Org1MSP Verified</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {status && (
          <div className="grid grid-cols-4 gap-2 p-3 bg-black/30 border-b border-white/[0.06] text-center">
            {[
              { label: 'Block Height', val: `#${status.blockHeight ?? status.totalBlocks ?? blocks.length}`, color: 'text-white' },
              { label: 'Total Tx',     val: status.totalTransactions ?? '—',                                   color: 'text-ios-blue' },
              { label: 'State Keys',   val: `${status.stateKeysCount ?? '—'}`,                                 color: 'text-green-400' },
              { label: 'Security',     val: '✓ Immutable',                                                     color: 'text-green-400' },
            ].map(m => (
              <div key={m.label} className="p-2 rounded-xl bg-neutral-900/80 border border-white/[0.06]">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{m.label}</p>
                <p className={`text-[13px] font-bold font-mono ${m.color}`}>{m.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/[0.08] px-4">
          {['blocks', 'tamper'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all capitalize ${tab === t ? 'border-ios-blue text-white' : 'border-transparent text-gray-400'}`}>
              {t === 'blocks' ? `Blocks (${blocks.length})` : 'Tamper-Proof Audit'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ios-gray1">
              <RefreshCw className="w-5 h-5 animate-spin text-ios-blue mr-2" />
              <span className="text-xs">Syncing ledger state...</span>
            </div>
          ) : tab === 'blocks' ? (
            <div className="space-y-3">
              {blocks.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-8">No blocks yet. Mint a post first!</p>
              )}
              {blocks.map((blk, i) => {
                const txList = blk.transactions || [];
                const expanded = expandedTx === (blk.blockNumber ?? i);

                return (
                  <div key={blk.blockHash || i}
                    className="p-3.5 rounded-2xl bg-neutral-900/90 border border-white/[0.08] hover:border-white/20 transition-all space-y-2">
                    <div className="flex items-center justify-between cursor-pointer text-xs"
                      onClick={() => setExpandedTx(expanded ? null : (blk.blockNumber ?? i))}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="font-bold text-white font-sans">Block #{blk.blockNumber ?? i}</span>
                        <span className="text-gray-400 font-mono text-[10px]">{txList.length} tx</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-[10px] font-mono">{new Date(blk.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono space-y-1 text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Block Hash:</span>
                        <div className="flex items-center gap-1 text-ios-blue">
                          <span>{shortHash(blk.blockHash, 12, 8)}</span>
                          <button onClick={() => copy(blk.blockHash, `bh_${i}`)}>
                            {copied === `bh_${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Prev Hash:</span>
                        <span className="text-gray-400">{shortHash(blk.previousBlockHash, 10, 6)}</span>
                      </div>
                    </div>

                    {expanded && txList.map((tx, ti) => (
                      <div key={tx.txId || ti} className="mt-2 p-2.5 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs font-sans">{tx.function}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tx.status === 'REJECTED' ? 'bg-ios-red/20 text-ios-red' : 'bg-green-500/20 text-green-400'}`}>{tx.status}</span>
                        </div>
                        <div className="text-gray-400 truncate">Tx: {tx.txId}</div>
                        {tx.rejectionReason && (
                          <div className="text-ios-red mt-1 font-semibold leading-tight">{tx.rejectionReason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tamper-Proof Audit tab */
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-[20px] bg-neutral-900 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <ShieldCheck className="w-5 h-5 text-[#34c759]" />
                  Global Cryptographic & Perceptual Duplicate Prevention
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Every uploaded image undergoes dual tamper-proof inspection: exact SHA-256 multihashing and 64-bit perceptual visual fingerprinting (dHash/blockhash).
                  The Fabric smart contract records state keys under:
                </p>
                <div className="p-2 rounded-xl bg-black/70 font-mono text-[#007aff] border border-white/10 break-all space-y-1">
                  <div>ContentHash~[sha256_hex]</div>
                  <div className="text-purple-400">PerceptualHash~[phash_hex]</div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  If an exact match OR a perceptually similar variant (including horizontal image reversals, cropping, and compression) is detected across <strong>any user account</strong>, the block endorsement is rejected with:
                </p>
                <div className="p-3 rounded-xl bg-[#ff3b30]/15 border border-[#ff3b30]/40 font-semibold text-[#ff3b30] leading-relaxed">
                  "Blockchain Security Alert: This image (or a heavily similar variant) has already been immutably registered on the ledger by another user."
                </div>
              </div>

              <div className="p-4 rounded-[20px] bg-neutral-900 border border-white/10 space-y-2.5">
                <p className="font-bold text-white">Fabric Security Audit Verification</p>
                {[
                  'Exact SHA-256 computed on raw file binary (WebCrypto API)',
                  '64-bit perceptual visual fingerprinting (dHash / blockhash)',
                  'Horizontal mirror & reversal detection via mirrored pHash',
                  'Hamming distance threshold comparison (distance ≤ 10 / 64 bits)',
                  'Global ledger state rejection across all participant MSPs',
                  'Cryptographic block linking via SHA-256 hash chains',
                  'Zero-knowledge style read/write sets committed per transaction',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-[#34c759] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
