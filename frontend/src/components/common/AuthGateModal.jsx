import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, Building2, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export default function AuthGateModal({ isOpen, onClose, onAuthSuccess, currentAccount }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [mspId, setMspId] = useState('Org1MSP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleLogin(e, customUser = null, customPass = null) {
    if (e && e.preventDefault) e.preventDefault();
    const u = (customUser || username).trim();
    const p = customPass || password;

    if (!u || !p) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login(u, p);
      if (res && res.user && res.token) {
        window.localStorage.setItem('instaledger_token', res.token);
        window.localStorage.setItem('instaledger_auth_user', JSON.stringify(res.user));
        onAuthSuccess(res.user, res.token);
        onClose();
      } else {
        throw new Error('Invalid response from ledger');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed on Hyperledger Fabric');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    if (e && e.preventDefault) e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!u || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.signup({
        username: u,
        displayName: displayName.trim() || u,
        password,
        bio: bio.trim(),
        mspId
      });

      if (res && res.user && res.token) {
        window.localStorage.setItem('instaledger_token', res.token);
        window.localStorage.setItem('instaledger_auth_user', JSON.stringify(res.user));
        onAuthSuccess(res.user, res.token);
        onClose();
      } else {
        throw new Error('Could not register account on ledger');
      }
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(user, pass) {
    setUsername(user);
    setPassword(pass);
    handleLogin(null, user, pass);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none font-sans animate-fade-in">
      <div className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="pt-7 pb-4 px-6 text-center border-b border-[#F0F0F0] bg-gradient-to-b from-gray-50/70 to-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF7A00] via-[#FF0069] to-[#D300C5] text-white shadow-md mb-3">
            <Shield className="w-6 h-6 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-[#111111]">
            InstaLedger
          </h1>
          <p className="text-[11px] text-[#737373] mt-0.5 font-medium flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hyperledger Fabric Network · Shared World State
          </p>

          {/* Mode Switcher */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-[#F3F4F6] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ranna, elena, or marcus"
                    autoCapitalize="none"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-[#0095F6] hover:bg-[#1877F2] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Log In to Fabric Ledger</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Demo Accounts for Teacher Testing */}
              <div className="pt-4 border-t border-[#F0F0F0] mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Quick 1-Click Demo Credentials
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => quickLogin('ranna', 'password123')}
                    className="p-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                        alt="ranna"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#111111]">@ranna</div>
                        <div className="text-[10px] text-[#6B7280]">pass: password123</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                      Org1MSP · Validator
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLogin('elena', 'password123')}
                    className="p-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                        alt="elena"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#111111]">@elena</div>
                        <div className="text-[10px] text-[#6B7280]">pass: password123</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                      Org2MSP · Peer
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLogin('marcus', 'password123')}
                    className="p-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                        alt="marcus"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#111111]">@marcus</div>
                        <div className="text-[10px] text-[#6B7280]">pass: password123</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Org3MSP · Storage
                    </span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="e.g. teacher_eva"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Professor Eva"
                  required
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Fabric Organization (MSP Identity)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
                  <select
                    value={mspId}
                    onChange={(e) => setMspId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Org1MSP">Org1MSP · Validator & Ordering Node</option>
                    <option value="Org2MSP">Org2MSP · Smart Contract Peer</option>
                    <option value="Org3MSP">Org3MSP · IPFS Storage Node</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Bio (Optional)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Distributed Systems Researcher ⛓️"
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Immutable Identity</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        {currentAccount && (
          <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#F0F0F0] text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#6B7280] hover:text-[#111111] font-semibold"
            >
              Continue as @{currentAccount.username}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
