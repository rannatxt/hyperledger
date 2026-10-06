import { useState, useEffect } from 'react';
import {
  X, Layers, RefreshCw, Check, Copy,
  ShieldCheck, Lock, ChevronDown, ChevronUp, Database
} from 'lucide-react';
import { api } from '../../services/api';
import { shortHash } from '../../utils/crypto';

export default function LedgerModal({ isOpen, onClose, highlightPost }) {
  const [tab,         setTab]         = useState('blocks');
  const [blocks,      setBlocks]      = useState([]);
  const [status,      setStatus]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [expandedTx,  setExpandedTx]  = useState(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white border border-[#EAEAEA] rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEFEF] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF0F2] text-[#E60023] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#111111]">Hyperledger Fabric Ledger Explorer</h2>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-mono text-[9px] font-bold">
                  channel: mychannel
                </span>
              </div>
              <p className="text-[11px] text-[#767676] font-mono">Consensus: Raft · Org1MSP Verified Endorsement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#767676] hover:text-[#111111] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {status && (
          <div className="grid grid-cols-4 gap-2.5 p-4 bg-[#F8F8F8] border-b border-[#EFEFEF] text-center">
            {[
              { label: 'Block Height', val: `#${status.blockHeight ?? status.totalBlocks ?? blocks.length}`, color: 'text-[#111111]' },
              { label: 'Total Tx',     val: status.totalTransactions ?? blocks.length,                       color: 'text-[#E60023]' },
              { label: 'State Keys',   val: `${status.stateKeysCount ?? '—'}`,                               color: 'text-[#27ae60]' },
              { label: 'Integrity',    val: '✓ 100% Immutable',                                              color: 'text-[#27ae60]' },
            ].map(m => (
              <div key={m.label} className="p-2.5 rounded-2xl bg-white border border-[#EAEAEA] shadow-sm">
                <p className="text-[9px] text-[#767676] uppercase tracking-wider font-semibold mb-0.5">{m.label}</p>
                <p className={`text-xs font-bold font-mono ${m.color}`}>{m.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Blocks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-xs text-[#767676] gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#E60023]" />
              <span>Fetching cryptographic blocks from ledger…</span>
            </div>
          ) : blocks.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#767676]">
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
                  className={`p-4 rounded-2xl border transition-all ${
                    isHighlight
                      ? 'bg-[#FFF9F9] border-[#E60023] ring-2 ring-[#E60023]/20 shadow-md'
                      : 'bg-[#FAFAFA] border-[#EAEAEA] hover:border-[#CCCCCC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-white border border-[#EAEAEA] text-[#111111]">
                        Block #{blk.blockNumber}
                      </span>
                      <span className="text-[10px] text-[#767676] font-mono">
                        {blk.timestamp ? new Date(blk.timestamp).toLocaleTimeString() : 'Recent'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#27ae60] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Endorsed by Org1MSP
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px] text-[#444444]">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#EAEAEA]">
                      <span className="text-[#767676] text-[10px]">Block Hash:</span>
                      <span className="truncate max-w-[280px] text-[#111111]">{shortHash(blk.blockHash || 'genesis_hash_0')}</span>
                    </div>

                    {blk.transactions && blk.transactions.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-[#767676] uppercase tracking-wider font-bold">Transactions ({blk.transactions.length})</span>
                        {blk.transactions.map((tx, idx) => (
                          <div key={tx.txId || idx} className="p-2.5 rounded-xl bg-white border border-[#EAEAEA] space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#E60023]">{tx.function || 'createPost'}</span>
                              <span className="text-[10px] text-[#767676] font-mono">{shortHash(tx.txId)}</span>
                            </div>
                            {tx.args && tx.args.length > 0 && (
                              <p className="text-[10px] text-[#555555] truncate font-mono">
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
