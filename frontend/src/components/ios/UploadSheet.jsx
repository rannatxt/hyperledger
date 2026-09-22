import { useState, useRef } from 'react';
import {
  X, Upload, ShieldCheck, AlertTriangle,
  CheckCircle2, Loader2, ArrowRight, Lock, Sparkles
} from 'lucide-react';
import { computeFileSHA256 } from '../../utils/crypto';
import { api } from '../../services/api';

const FILTERS = [
  { name: 'Normal',    cls: 'f-normal'    },
  { name: 'Clarendon', cls: 'f-clarendon' },
  { name: 'Gingham',   cls: 'f-gingham'   },
  { name: 'Moon',      cls: 'f-moon'      },
  { name: 'Juno',      cls: 'f-juno'      },
  { name: 'Noir',      cls: 'f-noir'      },
  { name: 'Vivid',     cls: 'f-vivid'     },
];

const SAMPLES = [
  { name: 'Cyberpunk Tokyo',     url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=900&auto=format&fit=crop&q=80' },
  { name: 'Neural Fluid',        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80' },
  { name: 'Cosmic Nebula',       url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=900&auto=format&fit=crop&q=80' },
];

export default function UploadSheet({ isOpen, onClose, currentUser, onPostCreated }) {
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState('');
  const [sha256,     setSha256]     = useState('');
  const [hashing,    setHashing]    = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [dupError,   setDupError]   = useState('');
  const [filter,     setFilter]     = useState(FILTERS[0]);
  const [caption,    setCaption]    = useState('');
  const [stage,      setStage]      = useState(0); // 0 pick, 1 edit, 2 committing
  const [stageMsg,   setStageMsg]   = useState('');
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null); setPreview(''); setSha256(''); setHashing(false);
    setIsDuplicate(false); setDupError(''); setFilter(FILTERS[0]);
    setCaption(''); setStage(0); setStageMsg('');
  };

  const close = () => { reset(); onClose(); };

  async function processFile(f) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setHashing(true);
    setIsDuplicate(false);
    setDupError('');
    setStage(1);

    try {
      const hash = await computeFileSHA256(f);
      setSha256(hash);
      const check = await api.checkDuplicate(hash);
      if (check.isDuplicate) {
        setIsDuplicate(true);
        setDupError(check.error || 'Tamper-proof error: This exact photo has already been immutably recorded on the ledger.');
      }
    } catch (e) {
      console.error('Hash error:', e);
    } finally {
      setHashing(false);
    }
  }

  async function loadSample(s) {
    setHashing(true);
    try {
      const res  = await fetch(s.url);
      const blob = await res.blob();
      const f    = new File([blob], s.name.replace(/\s/g,'_') + '.jpg', { type: 'image/jpeg' });
      await processFile(f);
    } catch (e) {
      console.error('Sample load error:', e);
      setHashing(false);
    }
  }

  async function submit() {
    if (!file || !currentUser || isDuplicate) return;
    setStage(2);

    try {
      setStageMsg('1. Computing SHA-256 and pinning to IPFS node...');
      await new Promise(r => setTimeout(r, 500));
      setStageMsg('2. Endorsing transaction on Org1MSP peer...');
      await new Promise(r => setTimeout(r, 500));
      setStageMsg('3. Committing block to channel "mychannel"...');

      const fd = new FormData();
      fd.append('media', file);
      fd.append('authorId', currentUser.id);
      fd.append('caption', caption);
      fd.append('filterName', filter.name);

      const result = await api.createPost(fd);
      setStageMsg('✅ Block committed! Tamper-proof record immutable.');
      await new Promise(r => setTimeout(r, 800));
      onPostCreated(result);
      close();
    } catch (err) {
      console.error('Commit error:', err);
      if (err.tamperProofError || err.message?.includes('Tamper-proof error')) {
        setIsDuplicate(true);
        setDupError(err.message);
        setStage(1);
      } else {
        alert('Transaction failed: ' + err.message);
        setStage(1);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#141414] ios-sheet border-t border-white/10 shadow-2xl animate-sheet-up flex flex-col max-h-[92vh]">

        {/* Grabber pill */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-600/60 rounded-full" />
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08]">
          <button onClick={close} className="text-xs text-gray-400 hover:text-white px-2 py-1">Cancel</button>
          <span className="text-sm font-bold tracking-tight">New Ledger Post</span>
          <button
            onClick={submit}
            disabled={!preview || hashing || isDuplicate || stage === 2}
            className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${preview && !isDuplicate && !hashing && stage !== 2 ? 'bg-ios-blue text-white active:scale-95' : 'text-gray-600 cursor-not-allowed'}`}
          >
            {stage === 2 ? 'Minting...' : 'Share'}
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto no-scrollbar space-y-4">

          {/* STAGE 0 – Pick */}
          {stage === 0 && (
            <div className="flex flex-col items-center py-8 px-4 border border-dashed border-white/20 rounded-2xl bg-black/40 text-center">
              <div className="w-16 h-16 rounded-full bg-ios-blue/15 flex items-center justify-center text-ios-blue mb-3">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold mb-1">Select a photo to notarize</h3>
              <p className="text-xs text-gray-400 mb-5 max-w-xs leading-relaxed">
                Files are SHA-256 hashed and cross-checked against the immutable Fabric world state to prevent duplicate submissions.
              </p>

              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

              <button
                onClick={() => fileRef.current?.click()}
                className="bg-ios-blue text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-transform mb-6"
              >
                Choose from Device
              </button>

              <div className="w-full pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2.5">
                  <Sparkles className="w-3 h-3 text-yellow-400" /> Curated Web3 Samples
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLES.map(s => (
                    <div key={s.name} onClick={() => loadSample(s)}
                      className="group relative aspect-video rounded-lg overflow-hidden border border-white/15 hover:border-ios-blue cursor-pointer">
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/50 flex items-end p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-white truncate">{s.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 1 – Edit & hash */}
          {stage === 1 && (
            <>
              {/* Preview */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/15">
                <img src={preview} alt="preview" className={`w-full h-full object-cover ${filter.cls}`} />
                <button onClick={reset} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-gray-300 border border-white/10">
                  Filter: {filter.name}
                </div>
              </div>

              {/* SHA-256 HUD */}
              <div className="p-3 rounded-2xl bg-[#0e0e0e] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-ios-blue" /> SHA-256 Content Hash
                  </div>
                  {hashing
                    ? <span className="flex items-center gap-1 text-[10px] text-ios-blue font-mono"><Loader2 className="w-3 h-3 animate-spin" /> Computing...</span>
                    : isDuplicate
                      ? <span className="flex items-center gap-1 text-[10px] text-ios-red font-bold"><AlertTriangle className="w-3 h-3" /> DUPLICATE</span>
                      : sha256
                        ? <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold"><CheckCircle2 className="w-3 h-3" /> UNIQUE</span>
                        : null}
                </div>

                <div className="font-mono text-[11px] p-2 bg-black/60 rounded-xl border border-white/10 break-all text-gray-300">
                  {sha256 || 'Generating cryptographic digest...'}
                </div>

                {/* ⚠ Tamper-proof duplicate error banner */}
                {isDuplicate && (
                  <div className="p-3 rounded-xl bg-ios-red/10 border border-ios-red/40 text-ios-red space-y-1 animate-fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-[13px]">
                      <Lock className="w-4 h-4" /> Tamper-Proof Ledger Rejection
                    </div>
                    <p className="text-xs font-semibold leading-relaxed">{dupError}</p>
                  </div>
                )}
              </div>

              {/* Filters carousel */}
              {!isDuplicate && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">iOS Filter</p>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {FILTERS.map(f => (
                      <button key={f.name} onClick={() => setFilter(f)}
                        className={`flex flex-col items-center gap-1 p-1 rounded-xl border flex-shrink-0 transition-all ${filter.name === f.name ? 'border-ios-blue bg-ios-blue/15' : 'border-white/10'}`}>
                        <div className="w-14 h-14 rounded-lg overflow-hidden">
                          <img src={preview} alt={f.name} className={`w-full h-full object-cover ${f.cls}`} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-300">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption */}
              {!isDuplicate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <img src={currentUser?.avatarUrl} alt={currentUser?.username} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                    <span className="text-xs font-bold">@{currentUser?.username}</span>
                  </div>
                  <textarea rows={3} value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="Write a caption… #Hyperledger #Decentralized"
                    className="w-full text-xs p-3 rounded-xl bg-[#0e0e0e] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-ios-blue resize-none" />
                  <button onClick={submit}
                    className="w-full bg-ios-blue text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform">
                    Publish to Ledger <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* STAGE 2 – Committing */}
          {stage === 2 && (
            <div className="flex flex-col items-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-ios-blue/20 flex items-center justify-center text-ios-blue">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <h4 className="text-sm font-bold">Endorsing Decentralised Transaction</h4>
              <p className="text-xs font-mono text-gray-400 max-w-xs">{stageMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
