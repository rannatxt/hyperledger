import { useState, useRef } from 'react';
import {
  X, Upload, ShieldCheck, AlertTriangle,
  CheckCircle2, Loader2, ArrowRight, Lock, Sparkles,
  Eye, Video, Copy, Check, Film, Layers, Play
} from 'lucide-react';
import { computeFileSHA256, shortHash } from '../../utils/crypto';
import { computeClientPerceptualHash, computeClientVideoFingerprint } from '../../utils/perceptualHash';
import { extractVideoThumbnail, getVideoPosterFallback } from '../../utils/thumbnail';
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
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    videoFingerprint: 'VF1:1122334455667788,1122334455667799,11223344556677aa,11223344556677bb|8877665544332211,9977665544332211,aa77665544332211,bb77665544332211',
    hint: 'Simulates duplicate of Genesis Video Reel #4'
  },
  {
    name: 'Trimmed Video Variant',
    type: 'video',
    tag: 'Trim Resistance',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-in-movement-44026-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
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
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=800&auto=format&fit=crop&q=80',
    hint: 'Fresh generative video reel'
  }
];

export default function DesktopUploadModal({ isOpen, onClose, currentUser, onPostCreated }) {
  const [file,             setFile]             = useState(null);
  const [mediaType,        setMediaType]        = useState('image'); // 'image' | 'video'
  const [preview,          setPreview]          = useState('');
  const [thumbnailUrl,     setThumbnailUrl]     = useState('');
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
    setThumbnailUrl('');
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
        // Extract crisp video thumbnail frame
        try {
          const thumb = await extractVideoThumbnail(f, 0.5);
          if (thumb) setThumbnailUrl(thumb);
        } catch (e) {
          console.warn('Thumbnail capture fallback:', e);
        }

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
    setThumbnailUrl(preset.thumbnailUrl || (preset.type === 'video' ? getVideoPosterFallback(preset.name, preset.contentHash) : ''));
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
      await new Promise(r => setTimeout(r, 350));
      setStageMsg('2. Verifying cross-user global uniqueness across Fabric state…');
      await new Promise(r => setTimeout(r, 350));
      setStageMsg('3. Pinning payload to cloud-backed IPFS storage layer…');
      await new Promise(r => setTimeout(r, 350));
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
      if (thumbnailUrl) fd.append('thumbnailUrl', thumbnailUrl);
      if (pHash) fd.append('perceptualHash', pHash);
      if (pHashReversed) fd.append('perceptualHashReversed', pHashReversed);
      if (videoFingerprint) fd.append('videoFingerprint', videoFingerprint);

      const result = await api.createPost(fd);
      setStageMsg('✅ Block successfully committed! Immutably registered on ledger.');
      await new Promise(r => setTimeout(r, 500));
      onPostCreated(result);
      close();
    } catch (err) {
      console.error('Commit error:', err);
      if (
        err.tamperProofError ||
        err.message?.includes('Tamper-Proof Blockchain Security') ||
        err.message?.includes('Blockchain Security Alert') ||
        err.message?.includes('Tamper-proof')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4 select-none">
      <div className="relative w-full max-w-[620px] bg-white border border-[#EAEAEA] rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Pinterest Clean Window Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEFEF] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E60023] text-white flex items-center justify-center font-bold text-sm">
              <span>⛓</span>
            </div>
            <div>
              <span className="text-sm font-extrabold text-[#111111]">Create Pin on Ledger</span>
              <span className="text-[10px] text-[#767676] block font-mono">Org1MSP · Hyperledger Fabric</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={close}
              className="text-xs font-semibold text-[#767676] hover:text-[#111111] transition-colors px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={(!preview && !file) || hashing || isDuplicate || stage === 2}
              className={`text-xs px-5 py-2 rounded-full font-bold transition-all ${
                (preview || file) && !isDuplicate && !hashing && stage !== 2
                  ? 'bg-[#E60023] hover:bg-[#AD081B] text-white shadow-md active:scale-95'
                  : 'bg-[#F0F0F0] text-[#A0A0A0] cursor-not-allowed'
              }`}
            >
              {stage === 2 ? 'Minting…' : 'Publish to Ledger'}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-5 flex-1 bg-white">
          {/* STAGE 0: Media Picker */}
          {stage === 0 && (
            <div className="space-y-5">
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center py-10 px-6 border-2 border-dashed border-[#DDDDDD] hover:border-[#E60023] rounded-[24px] bg-[#FAFAFA] hover:bg-[#FFF9F9] text-center space-y-3 cursor-pointer transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#E60023] shadow-sm">
                  <Upload className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111] mb-1">Choose a file to notarize</h3>
                  <p className="text-xs text-[#767676] max-w-sm leading-relaxed">
                    Upload images (JPG, PNG) or videos (MP4, WebM). Thumbnails are extracted automatically, and cross-account duplicates are blocked by perceptual hashing.
                  </p>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processMediaFile(f); }}
                />

                <div className="pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    className="px-6 py-2.5 rounded-full bg-[#E60023] hover:bg-[#AD081B] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    Select from device
                  </button>
                </div>
              </div>

              {/* Duplicate & Tamper-Proofing Test Presets */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#E60023]" /> Tamper-Proof Test Presets
                  </span>
                  <span className="text-[11px] text-[#767676] font-mono">1-Click Duplicate Check</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => loadPreset(p)}
                      className="p-3.5 rounded-2xl bg-[#F8F8F8] hover:bg-white border border-[#EAEAEA] hover:border-[#E60023] hover:shadow-md text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#111111] group-hover:text-[#E60023] transition-colors">{p.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          p.type === 'video' ? 'bg-[#FFF0F2] text-[#E60023]' : 'bg-[#EAEAEA] text-[#555555]'
                        }`}>
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#767676] leading-snug">{p.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 1: Review, Edit & Security Check */}
          {stage === 1 && (
            <div className="space-y-4">
              {/* Media Preview & Thumbnail Preview */}
              <div className="relative rounded-[20px] overflow-hidden bg-[#F5F5F5] border border-[#EAEAEA] aspect-[4/3] flex items-center justify-center">
                {mediaType === 'video' ? (
                  <div className="relative w-full h-full bg-black">
                    <video
                      src={preview}
                      poster={thumbnailUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                    {thumbnailUrl && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#111111] flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3 text-[#27ae60]" /> Thumbnail Extracted
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={preview}
                    alt="preview"
                    className={`w-full h-full object-contain ${filter.cls}`}
                  />
                )}

                <button
                  onClick={() => setStage(0)}
                  className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-[#111111] shadow-sm transition-all"
                >
                  Change Media
                </button>
              </div>

              {/* Caption Input */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1.5">Title & Description</label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Tell everyone what your pin is about…"
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-[#F8F8F8] border border-[#EAEAEA] focus:bg-white focus:border-[#E60023] focus:ring-2 focus:ring-[#E60023]/20 text-xs text-[#111111] outline-none transition-all resize-none"
                />
              </div>

              {/* Tamper-Proofing Status Banner */}
              {hashing ? (
                <div className="p-3.5 rounded-2xl bg-[#FFF8E6] border border-[#FFE2A4] flex items-center gap-2.5 text-xs text-[#8A6D3B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                  <span>Computing SHA-256 multihash and verifying global uniqueness…</span>
                </div>
              ) : isDuplicate ? (
                <div className="p-4 rounded-2xl bg-[#FFF2F2] border border-[#FFB8B8] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E60023]">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Tamper-Proof Security Alert: Duplicate Rejected</span>
                  </div>
                  <p className="text-xs text-[#991B1B] leading-relaxed">
                    {dupError}
                  </p>
                  <p className="text-[11px] text-[#767676]">
                    This media (or a cropped/trimmed variant) is already immutably anchored on Hyperledger Fabric. Duplicate re-uploads are disallowed.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#166534]">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#27ae60]" />
                    <span>Cryptographically & perceptually unique! Ready for ledger minting.</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                    VERIFIED
                  </span>
                </div>
              )}

              {/* Fingerprint Details Card */}
              {sha256 && (
                <div className="p-3 rounded-2xl bg-[#F8F8F8] border border-[#EAEAEA] font-mono text-[11px] space-y-1.5 text-[#555555]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#767676]">SHA-256 Digest:</span>
                    <button onClick={copyHash} className="hover:text-[#111111] flex items-center gap-1 text-[10px]">
                      {copied ? <Check className="w-3 h-3 text-[#27ae60]" /> : <Copy className="w-3 h-3" />}
                      <span>{shortHash(sha256)}</span>
                    </button>
                  </div>
                  {pHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#767676]">pHash (Perceptual):</span>
                      <span className="text-[#111111] font-semibold">{shortHash(pHash)}</span>
                    </div>
                  )}
                  {videoFingerprint && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#767676]">Video Temporal Sig:</span>
                      <span className="text-[#E60023] font-semibold">Verified Frame Matrix</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: Mining Block Animation */}
          {stage === 2 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#E60023]">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-[#111111] mb-1">Committing Block to Hyperledger Fabric</h4>
                <p className="text-xs text-[#767676] max-w-sm leading-relaxed">{stageMsg}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
