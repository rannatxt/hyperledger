import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Layers,
  ShieldCheck,
  Cpu,
  HardDrive,
  Clock,
  Hash,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../services/api';

export default function LedgerInspectorModal({
  isOpen,
  onClose,
  highlightTx,
  isDark
}) {
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [blocksData, statusData] = await Promise.all([
        api.getLedgerBlocks(),
        api.getLedgerStatus()
      ]);
      setBlocks(blocksData);
      setStatus(statusData);
      if (blocksData.length > 0 && !selectedBlock) {
        setSelectedBlock(blocksData[0]);
      }
    } catch (err) {
      console.error('Failed to load ledger inspector data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredBlocks = blocks.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesBlock = String(b.blockNumber).includes(q) || b.blockHash.toLowerCase().includes(q);
    const matchesTx = b.transactions?.some(t => 
      t.txId.toLowerCase().includes(q) || 
      t.function.toLowerCase().includes(q) ||
      JSON.stringify(t.args).toLowerCase().includes(q)
    );
    return matchesBlock || matchesTx;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden border shadow-2xl flex flex-col transition-colors ${
        isDark ? 'bg-[#121212] border-[#262626] text-white' : 'bg-white border-[#dbdbdb] text-black'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-[#262626]' : 'border-[#dbdbdb]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Hyperledger Fabric Ledger Explorer</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-bold">
                  CHANNEL: mychannel
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Live immutable blocks, transaction hashes, and smart contract state transitions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className={`p-2 rounded-xl border text-gray-400 hover:text-white transition-all ${
                isDark ? 'border-[#262626] hover:bg-[#181818]' : 'border-gray-200 hover:bg-gray-100'
              }`}
              title="Refresh ledger state"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Ribbon */}
        {status && (
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-3 border-b text-xs ${
            isDark ? 'border-[#262626] bg-black/40' : 'border-[#dbdbdb] bg-gray-50'
          }`}>
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-brand-blue" />
              <div>
                <div className="text-gray-500 text-[10px] uppercase font-semibold">Block Height</div>
                <div className="font-bold font-mono">#{status.ledger?.blockHeight || blocks.length}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-pink-500" />
              <div>
                <div className="text-gray-500 text-[10px] uppercase font-semibold">Chaincode Status</div>
                <div className="font-bold font-mono text-emerald-400">instaledger:v1.0 (UP)</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="text-gray-500 text-[10px] uppercase font-semibold">IPFS Storage</div>
                <div className="font-bold font-mono">{status.ipfs?.pinnedCount || 0} Assets Pinned</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="text-gray-500 text-[10px] uppercase font-semibold">Endorsing Org</div>
                <div className="font-bold font-mono">Org1MSP (Peer0)</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-[#262626]/40 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blocks, transaction IDs, function names, or addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs bg-transparent focus:outline-none placeholder-gray-500 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          />
        </div>

        {/* Main 2-Column Explorer View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Blocks List */}
          <div className={`md:col-span-5 border-r overflow-y-auto ${
            isDark ? 'border-[#262626]' : 'border-[#dbdbdb]'
          }`}>
            <div className="p-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Ledger Blocks ({filteredBlocks.length})
            </div>

            <div className="space-y-1.5 p-3 pt-0">
              {filteredBlocks.map((b) => {
                const isSelected = selectedBlock?.blockNumber === b.blockNumber;
                return (
                  <div
                    key={b.blockNumber}
                    onClick={() => setSelectedBlock(b)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-brand-blue bg-brand-blue/10'
                        : isDark ? 'border-[#262626] hover:bg-[#181818]' : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Block #{b.blockNumber}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(b.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-gray-400 truncate mb-1">
                      Hash: <span className="text-gray-300">{b.blockHash.slice(0, 24)}...</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-[#222] px-2 py-0.5 rounded text-gray-300">
                        {b.transactionsCount || b.transactions?.length || 1} Tx
                      </span>
                      {b.transactions?.[0] && (
                        <span className="text-[10px] font-mono text-pink-400 truncate">
                          fn: {b.transactions[0].function}()
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Block & Transaction Details */}
          <div className="md:col-span-7 overflow-y-auto p-6 space-y-6">
            {selectedBlock ? (
              <>
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-brand-blue" />
                    Block #{selectedBlock.blockNumber} Specifications
                  </h4>

                  <div className={`p-4 rounded-xl border text-xs font-mono space-y-2.5 ${
                    isDark ? 'bg-black/50 border-[#262626]' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div>
                      <span className="text-gray-500 block text-[10px]">CURRENT BLOCK HASH</span>
                      <span className="text-emerald-400 break-all">{selectedBlock.blockHash}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px]">PREVIOUS BLOCK HASH</span>
                      <span className="text-gray-300 break-all">{selectedBlock.previousBlockHash}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-gray-500 block text-[10px]">TIMESTAMP</span>
                        <span className="text-gray-300">{selectedBlock.timestamp}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">CHANNEL</span>
                        <span className="text-brand-blue font-bold">{selectedBlock.channelId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transactions in Block */}
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-pink-500" />
                    Transactions in this Block ({selectedBlock.transactions?.length || 0})
                  </h4>

                  <div className="space-y-3">
                    {selectedBlock.transactions?.map((tx) => (
                      <div
                        key={tx.txId}
                        className={`p-4 rounded-xl border font-mono text-xs space-y-3 ${
                          isDark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-brand-blue flex items-center gap-1.5">
                            <span>TxID:</span>
                            <span className="text-white">{tx.txId}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                            {tx.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                          <div>Smart Contract: <span className="text-pink-400">{tx.chaincode}</span></div>
                          <div>Endorser: <span className="text-yellow-400">{tx.creatorMsp}</span></div>
                          <div className="col-span-2">Function: <span className="text-emerald-400 font-bold">{tx.function}({tx.args?.join(', ')})</span></div>
                        </div>

                        {/* Read / Write Set */}
                        {tx.rwSet && (
                          <div className="pt-2 border-t border-[#333]/50 text-[10px] space-y-1">
                            <div className="text-gray-400 font-bold">READ / WRITE SET (RWSET):</div>
                            <div className="text-gray-400">
                              Writes: <span className="text-emerald-400">{tx.rwSet.writes?.length || 0} keys</span> | Reads: <span className="text-brand-blue">{tx.rwSet.reads?.length || 0} keys</span>
                            </div>
                            {tx.rwSet.writes?.map((w, idx) => (
                              <div key={idx} className="bg-black/40 p-1.5 rounded text-gray-300 font-mono truncate">
                                + Write: <span className="text-emerald-300">{w.key}</span> ({w.valueLength} bytes)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                Select a block from the left panel to inspect transactions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
