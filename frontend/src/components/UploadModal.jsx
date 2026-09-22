import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

const FILTERS = [
  { name: 'Normal', class: 'filter-none', style: {} },
  { name: 'Clarendon', class: 'filter-clarendon', style: { filter: 'contrast(1.2) saturate(1.25)' } },
  { name: 'Gingham', class: 'filter-gingham', style: { filter: 'brightness(1.05) hue-rotate(-10deg)' } },
  { name: 'Moon', class: 'filter-moon', style: { filter: 'grayscale(1) contrast(1.1)' } },
  { name: 'Juno', class: 'filter-juno', style: { filter: 'saturate(1.4) contrast(1.15)' } },
  { name: 'Sepia', class: 'filter-sepia', style: { filter: 'sepia(0.7) contrast(0.95)' } },
];

const SAMPLE_IMAGES = [
  {
    name: 'Cyberpunk Tokyo',
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Nebula Genesis',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Abstract Fluid',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  }
];

export default function UploadModal({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
  isDark
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [caption, setCaption] = useState('');
  const [step, setStep] = useState(1); // 1: Pick media, 2: Filter & Caption, 3: Mining/Commit
  const [miningStatus, setMiningStatus] = useState('');
  const [createdTx, setCreatedTx] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setStep(2);
    }
  };

  const handleSelectSample = async (sample) => {
    try {
      // Fetch sample image as blob to treat it like a real uploaded file
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const sampleFile = new File([blob], `${sample.name.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      setFile(sampleFile);
      setPreviewUrl(sample.url);
      setStep(2);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
  };

  const handleSubmit = async () => {
    if (!file || !currentUser) return;

    setStep(3);
    setMiningStatus('1. Generating SHA-256 multihash & pinning to IPFS node...');

    try {
      await new Promise(r => setTimeout(r, 600));
      setMiningStatus('2. Endorsing transaction on Org1MSP peer...');

      const formData = new FormData();
      formData.append('media', file);
      formData.append('authorId', currentUser.id);
      formData.append('caption', caption);

      await new Promise(r => setTimeout(r, 600));
      setMiningStatus('3. Committing block to channel "mychannel"...');

      const newPost = await api.createPost(formData);

      setMiningStatus('Transaction committed and permanently recorded on Fabric ledger!');
      setCreatedTx(newPost);

      setTimeout(() => {
        onPostCreated(newPost);
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to publish post:', err);
      alert('Transaction failed: ' + err.message);
      setStep(2);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl('');
    setSelectedFilter(FILTERS[0]);
    setCaption('');
    setStep(1);
    setCreatedTx(null);
    setMiningStatus('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div className={`relative w-full max-w-2xl rounded-2xl overflow-hidden border shadow-2xl flex flex-col transition-colors ${
        isDark ? 'bg-[#181818] border-[#262626] text-white' : 'bg-white border-[#dbdbdb] text-black'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-[#262626]' : 'border-[#dbdbdb]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Create New Post</span>
            <span className="text-[10px] bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded-full font-semibold">
              Hyperledger Fabric
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={handleSubmit}
                className="text-xs font-bold text-brand-blue hover:text-brand-hover px-2 py-1"
              >
                Share
              </button>
            )}
            <button
              onClick={handleClose}
              className={`p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* STEP 1: Select Media */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-4 text-brand-blue">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold mb-1">Drag photos and videos here</h3>
              <p className="text-xs text-gray-400 mb-6 max-w-xs">
                Media files are content-addressed and pinned to local IPFS, while proof of ownership is stored on the ledger.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-blue hover:bg-brand-hover text-white font-semibold text-xs px-5 py-2.5 rounded-xl mb-6 shadow-lg shadow-blue-500/20"
              >
                Select from computer
              </button>

              {/* Sample Images Palette */}
              <div className="w-full pt-4 border-t border-[#262626]/50">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Or pick a curated web3 photograph
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SAMPLE_IMAGES.map((sample) => (
                    <div
                      key={sample.name}
                      onClick={() => handleSelectSample(sample)}
                      className="cursor-pointer group relative aspect-video rounded-lg overflow-hidden border border-gray-700 hover:border-brand-blue transition-all"
                    >
                      <img src={sample.url} alt={sample.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-medium truncate">{sample.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Filter & Caption */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Media Preview with applied filter */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center border border-[#262626]">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={selectedFilter.style}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono">
                    Filter: {selectedFilter.name}
                  </div>
                </div>

                {/* Filters selection row */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {FILTERS.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedFilter(f)}
                      className={`flex flex-col items-center gap-1 flex-shrink-0 p-1 rounded-lg border transition-all ${
                        selectedFilter.name === f.name
                          ? 'border-brand-blue bg-brand-blue/10'
                          : 'border-transparent hover:border-gray-600'
                      }`}
                    >
                      <div className="w-12 h-12 rounded overflow-hidden">
                        <img src={previewUrl} alt={f.name} style={f.style} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-300">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Author, Caption & IPFS info */}
              <div className="flex flex-col justify-between">
                <div>
                  {/* Current Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src={currentUser?.avatarUrl}
                      alt={currentUser?.username}
                      className="w-8 h-8 rounded-full object-cover border border-brand-blue/40"
                    />
                    <div>
                      <span className="font-bold text-xs">@{currentUser?.username}</span>
                      <div className="text-[10px] text-gray-400">Signing with Org1MSP identity</div>
                    </div>
                  </div>

                  {/* Caption Input */}
                  <textarea
                    rows={4}
                    placeholder="Write a caption... (e.g. #Hyperledger #Web3 #Decentralized)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none ${
                      isDark ? 'bg-[#121212] border-[#262626] text-white' : 'bg-gray-50 border-gray-300 text-black'
                    }`}
                  />

                  {/* Tech Stack Specs */}
                  <div className={`mt-4 p-3 rounded-xl border space-y-2 text-xs ${
                    isDark ? 'bg-[#121212] border-[#262626]' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Storage Layer:</span>
                      <span className="font-mono text-emerald-400 font-semibold">IPFS CIDv1 (SHA-256)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Ledger Channel:</span>
                      <span className="font-mono text-brand-blue font-semibold">mychannel</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Smart Contract:</span>
                      <span className="font-mono text-pink-400 font-semibold">instaledger:v1.0</span>
                    </div>
                  </div>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleSubmit}
                  className="w-full mt-4 bg-brand-blue hover:bg-brand-hover text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <span>Publish to Ledger</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Mining & Ledger Confirmation */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              {createdTx ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue animate-spin">
                  <Loader2 className="w-10 h-10" />
                </div>
              )}

              <h4 className="text-base font-bold">
                {createdTx ? 'Block Committed to Fabric Channel!' : 'Endorsing Decentralized Transaction'}
              </h4>

              <p className="text-xs text-gray-400 max-w-sm font-mono">
                {miningStatus}
              </p>

              {createdTx && (
                <div className="bg-[#121212] border border-[#262626] p-3 rounded-xl text-left text-xs font-mono w-full max-w-md space-y-1">
                  <div className="text-gray-400">Post ID: <span className="text-white">{createdTx.id}</span></div>
                  <div className="text-gray-400 truncate">IPFS CID: <span className="text-pink-400">{createdTx.contentHash}</span></div>
                  <div className="text-gray-400">Author: <span className="text-brand-blue">@{createdTx.authorUsername}</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
