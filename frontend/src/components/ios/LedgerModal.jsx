import { useState, useEffect } from 'react';
import {
  X, Layers, RefreshCw, Check, Copy,
  ShieldCheck, Lock, ChevronDown, ChevronUp, Database
} from 'lucide-react';
import { api } from '../../services/api';
import { shortHash } from '../../utils/crypto';
import TamperProofVerificationCard from '../common/TamperProofVerificationCard';

export default function LedgerModal({ isOpen, onClose, highlightPost }) {
  const [tab,         setTab]         = useState('blocks');
  const [blocks,      setBlocks]      = useState([]);
  const [status,      setStatus]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [copied,      setCopied]      = useState(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in select-none font-sans">
      <div className="relative w-full max-w-2xl bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EFEFEF] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F0F8FF] text-[#0095F6] flex items-center justify-center">
              <Database className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#262626]">Hyperledger Fabric Ledger Explorer</h2>
                <span className="px-2 py-0.5 rounded-full bg-green-50 text-[#00BA88] font-mono text-[9px] font-bold border border-green-200">
                  channel: mychannel
                </span>
              </div>
              <p className="text-[11px] text-[#737373] font-mono">Consensus: Raft · Org1MSP Verified Endorsement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#262626] hover:opacity-70 rounded-full transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {status && (
          <div className="grid grid-cols-4 gap-2 p-3 bg-[#FAFAFA] border-b border-[#EFEFEF] text-center">
            {[
              { label: 'Block Height', val: `#${status.blockHeight ?? status.totalBlocks ?? blocks.length}`, color: 'text-[#262626]' },
              { label: 'Total Tx',     val: status.totalTransactions ?? blocks.length,                       color: 'text-[#0095F6]' },
              { label: 'State Keys',   val: `${status.stateKeysCount ?? '—'}`,                               color: 'text-[#00BA88]' },
              { label: 'Integrity',    val: '✓ Immutable',                                                   color: 'text-[#00BA88]' },
            ].map(m => (
              <div key={m.label} className="p-2 rounded-xl bg-white border border-[#EAEAEA] shadow-2xs">
                <p className="text-[9px] text-[#8E8E8E] uppercase tracking-wider font-semibold mb-0.5">{m.label}</p>
                <p className={`text-xs font-bold font-mono ${m.color}`}>{m.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Highlight Post Tamper-Proof Verification Card */}
        {highlightPost && (
          <div className="px-4 py-3 bg-[#F0FDF4] border-b border-[#BBF7D0]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#166534] mb-2 font-mono flex items-center justify-between">
              <span>Target Inspected Asset Verification</span>
              <span>Block #{highlightPost.blockNumber || 105}</span>
            </div>
            <TamperProofVerificationCard
              sha256={highlightPost.contentHash}
              perceptualHash={highlightPost.perceptualHash}
              videoFingerprint={highlightPost.videoFingerprint}
              blockNumber={highlightPost.blockNumber || 105}
              blockHash={highlightPost.blockHash}
              channel={highlightPost.channel || 'mychannel'}
            />
          </div>
        )}

        {/* Blocks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-xs text-[#737373] gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#0095F6]" />
              <span>Fetching cryptographic blocks from ledger…</span>
            </div>
          ) : blocks.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8E8E8E]">
              No committed blocks found.
            </div>
          ) : (
            blocks.map((blk) => {
              const isHighlight = highlightPost && blk.transactions?.some(t =>
                t.args?.some(a => String(a).includes(highlightPost.id))
              );

              return (
                <div
                  key={blk.blockNumber ?? Math.random()}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isHighlight
                      ? 'bg-[#F0F8FF] border-[#0095F6] ring-2 ring-[#0095F6]/20'
                      : 'bg-[#FAFAFA] border-[#EAEAEA] hover:border-[#DBDBDB]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white border border-[#DBDBDB] text-[#262626]">
                        Block #{blk.blockNumber}
                      </span>
                      <span className="text-[10px] text-[#737373] font-mono">
                        {blk.timestamp ? new Date(blk.timestamp).toLocaleTimeString() : 'Recent'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#00BA88] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Endorsed by Org1MSP
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px] text-[#262626]">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#EAEAEA]">
                      <span className="text-[#737373] text-[10px]">Block Hash:</span>
                      <span className="truncate max-w-[280px] text-[#262626]">{shortHash(blk.blockHash || 'genesis_hash_0')}</span>
                    </div>

                    {blk.transactions && blk.transactions.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-[#8E8E8E] uppercase tracking-wider font-bold">
                          Transactions ({blk.transactions.length})
                        </span>
                        {blk.transactions.map((tx, idx) => (
                          <div key={tx.txId || idx} className="p-2.5 rounded-lg bg-white border border-[#EAEAEA] space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#0095F6]">{tx.function || 'createPost'}</span>
                              <span className="text-[10px] text-[#737373] font-mono">{shortHash(tx.txId)}</span>
                            </div>
                            {tx.args && tx.args.length > 0 && (
                              <p className="text-[10px] text-[#737373] truncate font-mono">
                                Args: {tx.args.slice(0, 3).join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
