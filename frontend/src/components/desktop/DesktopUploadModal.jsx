import { useState, useRef } from 'react';
import {
  X, Upload, ShieldCheck, AlertTriangle,
  CheckCircle2, Loader2, ArrowRight, Lock, Sparkles,
  Eye, Video, Copy, Check, Film, Layers
} from 'lucide-react';
import { computeFileSHA256, shortHash } from '../../utils/crypto';
import { computeClientPerceptualHash, computeClientVideoFingerprint } from '../../utils/perceptualHash';
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

const PRESETS = [
  {
    name: 'Exact Photo Repost',
    type: 'image',
    tag: 'Exact Photo',
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80',
    contentHash: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    perceptualHash: '007f007f00ff01ff',
    hint: 'Simulates exact repost of Genesis block #1'
  },
  {
    name: 'Cropped / Flipped Photo',
    type: 'image',
    tag: 'Perceptual Photo',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    perceptualHash: '01800ff01ff83ffc',
    perceptualHashReversed: '3ffc0ff01ff80180',
    hint: 'Simulates cropped/flipped visual variant of Block #2'
  },
  {
    name: 'Video Duplicate Test',
    type: 'video',
    tag: 'Exact Video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-in-movement-44026-large.mp4',
    contentHash: 'bafybeicgq5v4x64h42i7o3l6a24v2q4d3f3f2k4m3l4o2p1q4r3s2t1u4v',
    videoFingerprint: 'VF1:1122334455667788,1122334455667799,11223344556677aa,11223344556677bb|8877665544332211,9977665544332211,aa77665544332211,bb77665544332211',
    hint: 'Simulates duplicate of Genesis Video Reel #4'
  },
  {
    name: 'Trimmed Video Variant',
    type: 'video',
    tag: 'Trim Resistance',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-in-movement-44026-large.mp4',
    videoFingerprint: 'VF1:1122334455667799,11223344556677aa|9977665544332211,aa77665544332211',
    hint: 'Simulates trimmed edges of Video #4 (subsequence match)'
  },
  {
    name: 'Unique Tokyo Photo',
    type: 'image',
    tag: 'Unique Photo',
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=900&auto=format&fit=crop&q=80',
    hint: 'Fresh digital photograph'
  },
  {
    name: 'Unique Drone Video',
    type: 'video',
    tag: 'Unique Video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    hint: 'Fresh generative video reel'
  }
];

export default function DesktopUploadModal({ isOpen, onClose, currentUser, onPostCreated }) {
  const [file,             setFile]             = useState(null);
  const [mediaType,         setMediaType]         = useState('image'); // 'image' | 'video'
  const [preview,          setPreview]          = useState('');
  const [sha256,           setSha256]           = useState('');
  const [pHash,            setPHash]            = useState('');
  const [pHashReversed,    setPHashReversed]    = useState('');
  const [videoFingerprint, setVideoFingerprint] = useState('');
  const [hashing,          setHashing]          = useState(false);
  const [isDuplicate,      setIsDuplicate]      = useState(false);
  const [dupError,         setDupError]         = useState('');
  const [dupDetails,       setDupDetails]       = useState(null);
  const [filter,           setFilter]           = useState(FILTERS[0]);
  const [caption,          setCaption]          = useState('');
  const [stage,            setStage]            = useState(0); // 0 pick, 1 edit, 2 committing
  const [stageMsg,         setStageMsg]         = useState('');
  const [copied,           setCopied]           = useState(false);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setMediaType('image');
    setPreview('');
    setSha256('');
    setPHash('');
    setPHashReversed('');
    setVideoFingerprint('');
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

  async function processMediaFile(f) {
    const isVid = f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(f.name);
    setFile(f);
    setMediaType(isVid ? 'video' : 'image');
    const objUrl = URL.createObjectURL(f);
    setPreview(objUrl);
    setHashing(true);
    setIsDuplicate(false);
    setDupError('');
    setDupDetails(null);
    setStage(1);

    try {
      // 1. Cryptographic SHA-256
      const hash = await computeFileSHA256(f);
      setSha256(hash);

      let clientPHash = '';
      let clientPHashRev = '';
      let vSignature = '';

      if (isVid) {
        try {
          const vFp = await computeClientVideoFingerprint(f);
          vSignature = vFp.signature;
          clientPHash = vFp.pHash;
          clientPHashRev = vFp.pHashReversed;
          setVideoFingerprint(vSignature);
          setPHash(clientPHash);
          setPHashReversed(clientPHashRev);
        } catch (e) {
          console.warn('Browser video frame extraction fallback:', e);
        }
      } else {
        try {
          const pRes = await computeClientPerceptualHash(f);
          clientPHash = pRes.pHash;
          clientPHashRev = pRes.pHashReversed;
          setPHash(clientPHash);
          setPHashReversed(clientPHashRev);
        } catch (e) {
          console.warn('Browser image pHash fallback:', e);
        }
      }

      // 2. Query Fabric ledger global duplicate check
      const check = await api.checkDuplicate({
        contentHash: hash,
        perceptualHash: clientPHash,
        perceptualHashReversed: clientPHashRev,
        mediaType: isVid ? 'video' : 'image',
        videoFingerprint: vSignature
      });

      if (check.isDuplicate) {
        setIsDuplicate(true);
        setDupError(check.error || 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.');
        setDupDetails(check);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setHashing(false);
    }
  }

  async function loadPreset(preset) {
    setHashing(true);
    setMediaType(preset.type || 'image');
    setPreview(preset.url);
    setStage(1);
    setIsDuplicate(false);
    setDupError('');
    setDupDetails(null);

    try {
      const mockSha = preset.contentHash || ('mock_' + Math.random().toString(36).slice(2));
      setSha256(mockSha);
      setPHash(preset.perceptualHash || '');
      setPHashReversed(preset.perceptualHashReversed || '');
      setVideoFingerprint(preset.videoFingerprint || '');

      // Evaluate against chaincode
      const check = await api.checkDuplicate({
        contentHash: preset.contentHash || '',
        perceptualHash: preset.perceptualHash || '',
        perceptualHashReversed: preset.perceptualHashReversed || '',
        mediaType: preset.type || 'image',
        videoFingerprint: preset.videoFingerprint || ''
      });

      if (check.isDuplicate) {
        setIsDuplicate(true);
        setDupError(check.error || 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.');
        setDupDetails(check);
      }
    } catch (e) {
      console.error('Preset error:', e);
    } finally {
      setHashing(false);
    }
  }

  async function submit() {
    if (!currentUser || isDuplicate || hashing) return;
    setStage(2);

    try {
      setStageMsg('1. Computing SHA-256 multihash and temporal video/image fingerprint…');
      await new Promise(r => setTimeout(r, 400));
      setStageMsg('2. Verifying cross-user global uniqueness across Fabric state…');
      await new Promise(r => setTimeout(r, 400));
      setStageMsg('3. Pinning payload to IPFS and requesting endorsement on Org1MSP peer…');
      await new Promise(r => setTimeout(r, 400));
      setStageMsg('4. Mining immutable block on Hyperledger Fabric channel "mychannel"…');

      const fd = new FormData();
      if (file) {
        fd.append('media', file);
      } else {
        fd.append('mediaUrl', preview);
        fd.append('contentHash', sha256 || ('cid_' + Math.random().toString(36).slice(2)));
      }
      fd.append('authorId', currentUser.id);
      fd.append('caption', caption || 'Decentralized media post verified on Hyperledger Fabric ⛓️');
      fd.append('mediaType', mediaType);
      if (pHash) fd.append('perceptualHash', pHash);
      if (pHashReversed) fd.append('perceptualHashReversed', pHashReversed);
      if (videoFingerprint) fd.append('videoFingerprint', videoFingerprint);

      const result = await api.createPost(fd);
      setStageMsg('✅ Block successfully committed! Immutably registered on ledger.');
      await new Promise(r => setTimeout(r, 600));
      onPostCreated(result);
      close();
    } catch (err) {
      console.error('Commit error:', err);
      if (
        err.tamperProofError ||
        err.message?.includes('Tamper-Proof Blockchain Security') ||
        err.message?.includes('Blockchain Security Alert')
      ) {
        setIsDuplicate(true);
        setDupError(err.message || 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.');
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl animate-fade-in p-4 select-none">
      <div className="relative w-full max-w-[620px] bg-[#18181b] border border-white/15 rounded-[28px] shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Native Mac Catalyst / iOS Window Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#141416]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] opacity-80" />
            <span className="ml-2 text-xs font-bold text-white tracking-tight">New Ledger Media Post</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={close}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={(!preview && !file) || hashing || isDuplicate || stage === 2}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all ${
                (preview || file) && !isDuplicate && !hashing && stage !== 2
                  ? 'bg-[#007aff] text-white hover:bg-blue-600 shadow-md shadow-blue-500/20 active:scale-95'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              {stage === 2 ? 'Minting Block…' : 'Share to Ledger'}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 overflow-y-auto no-scrollbar space-y-4 flex-1">
          {/* STAGE 0: Media Picker */}
          {stage === 0 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-8 px-4 border-2 border-dashed border-white/15 rounded-[24px] bg-[#121214] text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#007aff]/15 flex items-center justify-center text-[#007aff]">
                  <Upload className="w-8 h-8 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Select Photo or Video to Notarize</h3>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    Supports high-resolution images and MP4/WebM videos. Perceptual hashing and temporal frame alignment block duplicates globally across all accounts.
                  </p>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processMediaFile(f); }}
                />

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="ios-btn-blue text-xs px-5 py-2.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Choose Photo or Video
                  </button>
                </div>
              </div>

              {/* Duplicate & Tamper-Proofing Test Presets */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Multi-Media Duplicate Test Presets
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">1-Click Verification</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => loadPreset(p)}
                      className="p-3 rounded-[16px] bg-[#141416] border border-white/10 hover:border-[#007aff]/50 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-[#007aff] transition-colors">{p.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                          p.tag.includes('Exact') || p.tag.includes('Perceptual') || p.tag.includes('Trim')
                            ? 'bg-[#ff3b30]/20 text-[#ff3b30]'
                            : 'bg-[#34c759]/20 text-[#34c759]'
                        }`}>
                          {p.tag}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 leading-tight block">{p.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 1: Media Preview & Multi-Media Analysis HUD */}
          {stage === 1 && (
            <div className="space-y-4">
              {/* Media Preview Box */}
              <div className="relative w-full aspect-video rounded-[22px] overflow-hidden border border-white/15 bg-black">
                {mediaType === 'video' ? (
                  <video
                    src={preview}
                    autoPlay
                    loop
                    muted
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="preview"
                    className={`w-full h-full object-cover ${filter.cls}`}
                  />
                )}

                <button
                  onClick={reset}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white backdrop-blur-md active:scale-90 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-gray-300 border border-white/10">
                  Type: {mediaType.toUpperCase()}
                </div>
              </div>

              {/* ── Multi-Media Fingerprinting HUD ── */}
              <div className="p-4 rounded-[20px] bg-[#121214] border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-[#007aff]" /> Blockchain Multi-Media Analysis
                  </div>
                  {hashing ? (
                    <span className="flex items-center gap-1 text-[11px] text-[#007aff] font-mono">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing Frame Signatures…
                    </span>
                  ) : isDuplicate ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#ff3b30] font-bold px-2 py-0.5 rounded-full bg-[#ff3b30]/15 border border-[#ff3b30]/30 font-mono">
                      <AlertTriangle className="w-3 h-3" /> DUPLICATE REJECTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-[#34c759] font-bold px-2 py-0.5 rounded-full bg-[#34c759]/15 border border-[#34c759]/30 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED UNIQUE
                    </span>
                  )}
                </div>

                {/* SHA-256 Digest */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>Cryptographic SHA-256 Multihash:</span>
                    <button onClick={copyHash} className="text-[#007aff] hover:underline flex items-center gap-0.5 text-[10px]">
                      {copied ? <Check className="w-3 h-3 text-[#34c759]" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] p-2 bg-black/60 rounded-[12px] border border-white/10 break-all text-gray-300">
                    {sha256 || 'Generating SHA-256 multihash…'}
                  </div>
                </div>

                {/* Perceptual or Video Frame Fingerprint */}
                {mediaType === 'video' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3 text-[#ff2d55]" /> Video Frame Hashes (Trim/Crop Resilient):
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">Temporal sequence</span>
                    </div>
                    <div className="font-mono text-[11px] p-2 bg-black/60 rounded-[12px] border border-white/10 text-gray-300 truncate">
                      {videoFingerprint || 'Extracting temporal video keyframe sequence…'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-[#007aff]" /> Image Perceptual Hash (pHash):
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">64-bit visual hash</span>
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
                )}

                {/* ⚠ REQUIRED TAMPER-PROOF SECURITY ALERT BANNER */}
                {isDuplicate && (
                  <div className="p-4 rounded-[18px] bg-[#ff3b30]/15 border border-[#ff3b30]/50 text-[#ff3b30] space-y-2 security-alert-glow animate-fade-in">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span>Tamper-Proof Blockchain Ledger Enforcement</span>
                    </div>

                    {/* Exact Required Lockout Message */}
                    <p className="text-[12px] font-bold leading-relaxed text-white bg-black/50 p-3 rounded-[12px] border border-[#ff3b30]/40 font-sans">
                      {dupError || 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.'}
                    </p>

                    {dupDetails && (
                      <div className="text-[10px] font-mono text-gray-300 space-y-1 pt-1.5 border-t border-[#ff3b30]/25">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Match Classification:</span>
                          <span className="font-bold text-[#ff3b30] uppercase">{dupDetails.matchType || 'Duplicate Sequence'}</span>
                        </div>
                        {dupDetails.distance !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Bit Distance:</span>
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
                            <span className="text-gray-400">Registered By:</span>
                            <span className="text-white font-semibold">@{dupDetails.existingPost.authorUsername || dupDetails.existingPost.authorId}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caption & Post */}
              {!isDuplicate && (
                <div className="space-y-3">
                  <textarea
                    rows={2}
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Write a caption… #Hyperledger #InstaLedger #Decentralized"
                    className="w-full text-xs p-3 rounded-[16px] bg-[#121214] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#007aff] resize-none"
                  />
                  <button
                    onClick={submit}
                    className="w-full ios-btn-blue font-bold text-xs py-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
                  >
                    Commit Block to Ledger <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: 4-Stage Fabric Endorsement Animation */}
          {stage === 2 && (
            <div className="flex flex-col items-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#007aff]/20 flex items-center justify-center text-[#007aff]">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Fabric Consensus Endorsement</h4>
                <p className="text-xs font-mono text-gray-400 max-w-sm mt-1 leading-relaxed">{stageMsg}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
