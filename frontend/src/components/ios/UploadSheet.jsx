import { useState, useRef } from 'react';
import {
  X, Upload, ShieldCheck, AlertTriangle,
  CheckCircle2, Loader2, ArrowRight, Lock, Sparkles,
  Eye, RefreshCw, Copy, Check, Flame
} from 'lucide-react';
import { computeFileSHA256, shortHash } from '../../utils/crypto';
import { computeClientPerceptualHash } from '../../utils/perceptualHash';
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
  {
    name: 'Genesis Duplicate',
    tag: 'Test Exact Match',
    url: '/api/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    hint: 'Simulates exact repost of Genesis block #0'
  },
  {
    name: 'Neural Genesis',
    tag: 'Test Perceptual',
    url: '/api/ipfs/bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
    hint: 'Simulates perceptual visual clone'
  },
  {
    name: 'Cyberpunk Tokyo',
    tag: 'Unique Asset',
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=900&auto=format&fit=crop&q=80',
    hint: 'Fresh digital photograph'
  },
  {
    name: 'Cosmic Nebula',
    tag: 'Unique Asset',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=900&auto=format&fit=crop&q=80',
    hint: 'Generative cosmic render'
  }
];

export default function UploadSheet({ isOpen, onClose, currentUser, onPostCreated }) {
  const [file,          setFile]          = useState(null);
  const [preview,       setPreview]       = useState('');
  const [sha256,        setSha256]        = useState('');
  const [pHash,         setPHash]         = useState('');
  const [pHashReversed, setPHashReversed] = useState('');
  const [hashing,       setHashing]       = useState(false);
  const [isDuplicate,   setIsDuplicate]   = useState(false);
  const [dupError,      setDupError]      = useState('');
  const [dupDetails,    setDupDetails]    = useState(null);
  const [filter,        setFilter]        = useState(FILTERS[0]);
  const [caption,       setCaption]       = useState('');
  const [stage,         setStage]         = useState(0); // 0 pick, 1 edit, 2 committing
  const [stageMsg,      setStageMsg]      = useState('');
  const [copied,        setCopied]        = useState(false);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const triggerHaptic = (type = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'error') navigator.vibrate([40, 70, 40]);
      else if (type === 'success') navigator.vibrate([15]);
      else navigator.vibrate([8]);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setSha256('');
    setPHash('');
    setPHashReversed('');
    setHashing(false);
    setIsDuplicate(false);
    setDupError('');
    setDupDetails(null);
    setFilter(FILTERS[0]);
    setCaption('');
    setStage(0);
    setStageMsg('');
    setCopied(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  async function processFile(f) {
    setFile(f);
    const objUrl = URL.createObjectURL(f);
    setPreview(objUrl);
    setHashing(true);
    setIsDuplicate(false);
    setDupError('');
    setDupDetails(null);
    setStage(1);
    triggerHaptic('light');

    try {
      // 1. Compute exact cryptographic SHA-256
      const hash = await computeFileSHA256(f);
      setSha256(hash);

      // 2. Compute perceptual dHash + reversed dHash in browser
      let clientPHash = '';
      let clientPHashRev = '';
      try {
        const pRes = await computeClientPerceptualHash(f);
        clientPHash = pRes.pHash;
        clientPHashRev = pRes.pHashReversed;
        setPHash(clientPHash);
        setPHashReversed(clientPHashRev);
      } catch (err) {
        console.warn('Browser perceptual hash fallback:', err);
      }

      // 3. Query Fabric ledger global duplicate check
      const check = await api.checkDuplicate({
        contentHash: hash,
        perceptualHash: clientPHash,
        perceptualHashReversed: clientPHashRev
      });

      if (check.isDuplicate) {
        setIsDuplicate(true);
        setDupError(check.error || 'Blockchain Security Alert: This image (or a heavily similar variant) has already been immutably registered on the ledger by another user.');
        setDupDetails(check);
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
      }
    } catch (e) {
      console.error('Hash error:', e);
    } finally {
      setHashing(false);
    }
  }

  async function loadSample(s) {
    setHashing(true);
    triggerHaptic('light');
    try {
      const res = await fetch(s.url);
      const blob = await res.blob();
      const f = new File([blob], s.name.replace(/\s/g, '_') + '.jpg', { type: blob.type || 'image/jpeg' });
      await processFile(f);
    } catch (e) {
      console.error('Sample load error:', e);
      setHashing(false);
    }
  }

  async function submit() {
    if (!file || !currentUser || isDuplicate) return;
    setStage(2);
    triggerHaptic('light');

    try {
      setStageMsg('1. Computing SHA-256 multihash and perceptual fingerprint...');
      await new Promise(r => setTimeout(r, 450));
      setStageMsg('2. Verifying global cross-user uniqueness across Fabric state...');
      await new Promise(r => setTimeout(r, 450));
      setStageMsg('3. Pinning payload to IPFS and endorsing on Org1MSP peer...');
      await new Promise(r => setTimeout(r, 450));
      setStageMsg('4. Committing immutable block to channel "mychannel"...');

      const fd = new FormData();
      fd.append('media', file);
      fd.append('authorId', currentUser.id);
      fd.append('caption', caption);
      fd.append('filterName', filter.name);
      if (pHash) fd.append('perceptualHash', pHash);
      if (pHashReversed) fd.append('perceptualHashReversed', pHashReversed);

      const result = await api.createPost(fd);
      setStageMsg('✅ Block successfully committed! Immutably registered on ledger.');
      triggerHaptic('success');
      await new Promise(r => setTimeout(r, 650));
      onPostCreated(result);
      close();
    } catch (err) {
      console.error('Commit error:', err);
      triggerHaptic('error');
      if (err.tamperProofError || err.message?.includes('Blockchain Security Alert') || err.message?.includes('Tamper-proof error')) {
        setIsDuplicate(true);
        setDupError(err.message || 'Blockchain Security Alert: This image (or a heavily similar variant) has already been immutably registered on the ledger by another user.');
        setStage(1);
      } else {
        alert('Transaction failed: ' + err.message);
        setStage(1);
      }
    }
  }

  const copyHash = () => {
    if (!sha256) return;
    navigator.clipboard.writeText(sha256);
    setCopied(true);
    triggerHaptic('light');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[470px] bg-[#161618] ios-sheet flex flex-col max-h-[92vh] overflow-hidden animate-sheet-up">

        {/* ── Native iOS Grabber Handle ── */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-white/25 rounded-full" />
        </div>

        {/* ── Native iOS Navigation Bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08]">
          <button
            onClick={close}
            className="text-[15px] text-[#007aff] hover:opacity-80 active:opacity-60 transition-opacity font-normal"
          >
            Cancel
          </button>
          <span className="text-[17px] font-semibold text-white tracking-tight">New Ledger Post</span>
          <button
            onClick={submit}
            disabled={!preview || hashing || isDuplicate || stage === 2}
            className={`text-[15px] font-semibold transition-all ${
              preview && !isDuplicate && !hashing && stage !== 2
                ? 'text-[#007aff] active:opacity-60'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            {stage === 2 ? 'Minting…' : 'Share'}
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-4 overflow-y-auto no-scrollbar space-y-4">

          {/* STAGE 0: Media Picker */}
          {stage === 0 && (
            <div className="flex flex-col items-center py-6 px-4 border border-dashed border-white/15 rounded-[24px] bg-[#121214] text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#007aff]/15 flex items-center justify-center text-[#007aff]">
                <Upload className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Select Photo to Notarize</h3>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  Every image is verified across all user accounts using cryptographic SHA-256 and perceptual visual fingerprinting.
                </p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />

              <button
                onClick={() => fileRef.current?.click()}
                className="ios-btn-blue text-[13px] px-6 py-2.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
              >
                Choose from Device
              </button>

              {/* Sample test presets */}
              <div className="w-full pt-4 border-t border-white/10 mt-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" /> Duplicate Test Presets
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">1-Tap Verification</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLES.map(s => (
                    <button
                      key={s.name}
                      onClick={() => loadSample(s)}
                      className="flex flex-col text-left p-2.5 rounded-[16px] bg-[#1c1c1e] border border-white/10 hover:border-[#007aff]/50 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-white truncate">{s.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          s.tag.includes('Exact') || s.tag.includes('Perceptual')
                            ? 'bg-[#ff3b30]/20 text-[#ff3b30]'
                            : 'bg-[#34c759]/20 text-[#34c759]'
                        }`}>
                          {s.tag}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 leading-tight">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 1: Edit, Dual-Hash HUD & Duplicate Validation */}
          {stage === 1 && (
            <>
              {/* Photo Preview with Applied Filter */}
              <div className="relative w-full aspect-square rounded-[24px] overflow-hidden border border-white/15 bg-black">
                <img
                  src={preview}
                  alt="preview"
                  className={`w-full h-full object-cover ${filter.cls}`}
                />
                <button
                  onClick={reset}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 text-white backdrop-blur-md active:scale-90 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-gray-300 border border-white/10">
                  Filter: {filter.name}
                </div>
              </div>

              {/* ── Dual Cryptographic & Perceptual Hashing HUD ── */}
              <div className="p-3.5 rounded-[22px] bg-[#121214] border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-[#007aff]" /> Ledger Security Analysis
                  </div>
                  {hashing ? (
                    <span className="flex items-center gap-1 text-[11px] text-[#007aff] font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" /> Analyzing…
                    </span>
                  ) : isDuplicate ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#ff3b30] font-bold px-2 py-0.5 rounded-full bg-[#ff3b30]/15 border border-[#ff3b30]/30">
                      <AlertTriangle className="w-3 h-3" /> DUPLICATE REJECTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-[#34c759] font-bold px-2 py-0.5 rounded-full bg-[#34c759]/15 border border-[#34c759]/30">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED UNIQUE
                    </span>
                  )}
                </div>

                {/* 1. Exact Cryptographic Hash */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>SHA-256 Multihash:</span>
                    <button
                      onClick={copyHash}
                      className="text-[#007aff] hover:underline flex items-center gap-0.5 text-[10px]"
                    >
                      {copied ? <Check className="w-3 h-3 text-[#34c759]" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] p-2 bg-black/60 rounded-[12px] border border-white/10 break-all text-gray-300">
                    {sha256 || 'Generating SHA-256 multihash…'}
                  </div>
                </div>

                {/* 2. Perceptual Visual Fingerprint (pHash) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-[#007aff]" /> Perceptual Visual Hash (dHash):
                    </span>
                    <span className="text-[10px] text-gray-400">64-bit fingerprint</span>
                  </div>
                  <div className="font-mono text-[11px] p-2 bg-black/60 rounded-[12px] border border-white/10 flex items-center justify-between text-gray-300">
                    <span>{pHash ? `0x${pHash}` : 'Computing visual fingerprint…'}</span>
                    {pHashReversed && (
                      <span className="text-[9px] text-gray-500 font-mono">
                        Reversed: {shortHash(pHashReversed, 4, 4)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ⚠ REQUIRED OWNERSHIP ENFORCEMENT ALERT BANNER */}
                {isDuplicate && (
                  <div className="p-3.5 rounded-[16px] bg-[#ff3b30]/15 border border-[#ff3b30]/50 text-[#ff3b30] space-y-2 security-alert-glow animate-fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-[13px]">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span>Tamper-Proof Ledger Enforcement</span>
                    </div>
                    {/* Exact Required Message */}
                    <p className="text-[12px] font-bold leading-relaxed text-white bg-black/40 p-2.5 rounded-[10px] border border-[#ff3b30]/40">
                      {dupError || 'Blockchain Security Alert: This image (or a heavily similar variant) has already been immutably registered on the ledger by another user.'}
                    </p>

                    {dupDetails && (
                      <div className="text-[10px] font-mono text-gray-300 space-y-0.5 pt-1 border-t border-[#ff3b30]/25">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Match Classification:</span>
                          <span className="font-bold text-[#ff3b30] uppercase">{dupDetails.matchType || 'Perceptual'}</span>
                        </div>
                        {dupDetails.distance !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Hamming Bit Distance:</span>
                            <span className="text-white">{dupDetails.distance} / 64 bits</span>
                          </div>
                        )}
                        {dupDetails.similarity !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fingerprint Similarity:</span>
                            <span className="text-[#ff3b30] font-bold">{(dupDetails.similarity * 100).toFixed(1)}%</span>
                          </div>
                        )}
                        {dupDetails.existingPost && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Existing Author:</span>
                            <span className="text-white font-semibold">@{dupDetails.existingPost.authorUsername || dupDetails.existingPost.authorId}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* iOS Filters Selector */}
              {!isDuplicate && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">iOS Photo Filters</p>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {FILTERS.map(f => (
                      <button
                        key={f.name}
                        onClick={() => { setFilter(f); triggerHaptic('light'); }}
                        className={`flex flex-col items-center gap-1 p-1 rounded-[16px] border flex-shrink-0 transition-all ${
                          filter.name === f.name ? 'border-[#007aff] bg-[#007aff]/15' : 'border-white/10'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-[12px] overflow-hidden">
                          <img src={preview} alt={f.name} className={`w-full h-full object-cover ${f.cls}`} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-300">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption & Submit */}
              {!isDuplicate && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentUser?.avatarUrl}
                      alt={currentUser?.username}
                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                    />
                    <span className="text-xs font-bold text-white">@{currentUser?.username}</span>
                  </div>
                  <textarea
                    rows={3}
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Write a caption… #Hyperledger #InstaLedger #Decentralized"
                    className="w-full text-xs p-3 rounded-[16px] bg-[#121214] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#007aff] resize-none"
                  />
                  <button
                    onClick={submit}
                    className="w-full ios-btn-blue font-bold text-xs py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
                  >
                    Commit Block to Ledger <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* STAGE 2: Consensus Committing HUD */}
          {stage === 2 && (
            <div className="flex flex-col items-center py-14 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#007aff]/20 flex items-center justify-center text-[#007aff]">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Endorsing Fabric Transaction</h4>
                <p className="text-xs font-mono text-gray-400 max-w-xs mt-1">{stageMsg}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
