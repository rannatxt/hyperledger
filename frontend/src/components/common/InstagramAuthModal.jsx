import React, { useState, useEffect } from 'react';
import {
  X, Check, ChevronRight, ArrowLeft, Eye, EyeOff, Plus,
  Shield, CheckCircle2, AlertCircle, Sparkles, Building2,
  Lock, User, LogOut
} from 'lucide-react';
import { api } from '../../services/api';

// Meta Infinity Logo SVG Component
function MetaLogo({ className = "w-14 h-auto" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <span className="text-[10px] text-[#8E8E8E] font-medium tracking-wide uppercase">from</span>
      <div className="flex items-center gap-1.5 text-[#8E8E8E]">
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.001 7.202c-2.404 0-4.323 1.704-5.26 3.493-1.042-1.89-2.825-3.493-5.228-3.493C.685 7.202 0 8.04 0 9.176c0 3.336 3.125 6.622 6.513 6.622 2.378 0 4.29-1.748 5.488-3.693 1.198 1.945 3.11 3.693 5.487 3.693 3.388 0 6.512-3.286 6.512-6.622 0-1.136-.685-1.974-1.513-1.974-2.403 0-4.186 1.603-5.228 3.493-.937-1.789-2.856-3.493-5.26-3.493zm-5.488 6.596C4.167 13.798 2 11.776 2 9.176c0-.441.288-.674.513-.674 1.71 0 3.166 1.348 4.22 3.167-.074.7-.156 1.129-.22 1.129zm10.975 0c-.064 0-.146-.429-.22-1.129 1.054-1.819 2.51-3.167 4.22-3.167.225 0 .513.233.513.674 0 2.6-2.167 4.622-4.513 4.622z"/>
        </svg>
        <span className="text-xs font-bold tracking-tight text-[#737373]">Meta</span>
      </div>
    </div>
  );
}

// Instagram Script Wordmark Logo SVG Component
function InstagramWordmark({ className = "h-10 w-auto" }) {
  return (
    <div className="flex items-center justify-center">
      <span className="text-3xl font-bold tracking-tight text-[#262626] font-serif italic select-none">
        Instagram
      </span>
    </div>
  );
}

const DUMMY_ACCOUNTS = new Set(['elena_crypto', 'marcus_art']);

export default function InstagramAuthModal({
  isOpen,
  initialView = 'switcher', // 'switcher' (Photo 4) | 'add-account' (Photo 6) | 'login' (Photo 5) | 'signup' (Photo 7)
  currentUser,
  allUsers = [],
  onClose,
  onSwitchUser,
  onAuthSuccess,
  onLogout
}) {
  const [view, setView] = useState(initialView);
  const [accounts, setAccounts] = useState([]);

  // Login form state (Photo 5)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup form state (Photo 7)
  const [signupUsername, setSignupUsername] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMspId, setSignupMspId] = useState('Org1MSP');
  const [signupBio, setSignupBio] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [usernameValid, setUsernameValid] = useState(null); // null | true | false

  // Reset view when opened
  useEffect(() => {
    if (isOpen) {
      setView(initialView || 'switcher');
      setLoginError('');
      setSignupError('');
      loadCachedAccounts();
    }
  }, [isOpen, initialView]);

  // Load cached accounts from localStorage (excluding dummy accounts)
  const loadCachedAccounts = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('instaledger_accounts') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        const cleaned = stored.filter(a => a && a.username && !DUMMY_ACCOUNTS.has(a.username));
        setAccounts(cleaned);
        localStorage.setItem('instaledger_accounts', JSON.stringify(cleaned));
      } else if (allUsers && allUsers.length > 0) {
        // Fallback to initial seeds (excluding dummy accounts)
        const cleaned = allUsers.filter(a => a && a.username && !DUMMY_ACCOUNTS.has(a.username));
        setAccounts(cleaned.slice(0, 4));
      }
    } catch (e) {
      if (allUsers) {
        const cleaned = allUsers.filter(a => a && a.username && !DUMMY_ACCOUNTS.has(a.username));
        setAccounts(cleaned.slice(0, 4));
      }
    }
  };

  // Real-time username format validation for Signup (Photo 7)
  useEffect(() => {
    if (!signupUsername) {
      setUsernameValid(null);
      return;
    }
    const clean = signupUsername.trim().toLowerCase();
    const isValidFormat = /^[a-z0-9_]{3,24}$/.test(clean);
    setUsernameValid(isValidFormat);
  }, [signupUsername]);

  if (!isOpen) return null;

  const triggerHaptic = (type = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'error') navigator.vibrate([30, 50, 30]);
      else if (type === 'success') navigator.vibrate([15]);
      else navigator.vibrate([8]);
    }
  };

  // Handle switching active account (Photo 4)
  const handleSelectAccount = (acc) => {
    triggerHaptic('success');
    // Save as current user
    localStorage.setItem('instaledger_auth_user', JSON.stringify(acc));
    if (acc.token) {
      localStorage.setItem('instaledger_token', acc.token);
    }
    onSwitchUser?.(acc);
    onClose();
  };

  // Handle logout of current account only
  const handleLogout = () => {
    triggerHaptic('light');
    const username = currentUser?.username || 'this account';
    if (!window.confirm(`Log out of @${username}?`)) return;

    let remainingAccounts = [];
    try {
      // Remove from saved accounts list
      const prev = JSON.parse(localStorage.getItem('instaledger_accounts') || '[]');
      remainingAccounts = prev.filter(
        a => a.id !== currentUser?.id && a.username !== currentUser?.username && !DUMMY_ACCOUNTS.has(a.username)
      );
      localStorage.setItem('instaledger_accounts', JSON.stringify(remainingAccounts));
      setAccounts(remainingAccounts);
    } catch (e) {}

    // Clean up current active session state directly
    try {
      localStorage.removeItem('instaledger_auth_user');
      localStorage.removeItem('instaledger_token');
    } catch (e) {}

    if (remainingAccounts.length > 0) {
      // Fall back seamlessly to the remaining logged-in accounts
      const nextUser = remainingAccounts[0];
      try {
        localStorage.setItem('instaledger_auth_user', JSON.stringify(nextUser));
        if (nextUser.token) {
          localStorage.setItem('instaledger_token', nextUser.token);
        } else {
          localStorage.removeItem('instaledger_token');
        }
      } catch (e) {}
      onSwitchUser?.(nextUser);
      onClose();
    } else {
      // If all accounts log out, redirect directly to authentic Instagram Login/Signup landing page
      try {
        localStorage.removeItem('instaledger_accounts');
      } catch (e) {}
      onLogout?.();
      setView('login');
    }
  };

  // Handle Login submission (Photo 5)
  const handleLoginSubmit = async (e, customUser = null, customPass = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const u = (customUser || loginIdentifier).trim();
    const p = customPass || loginPassword;

    if (!u || !p) {
      setLoginError('Please enter username and password');
      triggerHaptic('error');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await api.login(u, p);
      if (res && res.user && res.token) {
        triggerHaptic('success');
        // Update stored session & active accounts
        localStorage.setItem('instaledger_token', res.token);
        localStorage.setItem('instaledger_auth_user', JSON.stringify(res.user));

        // Save to multi-account list
        try {
          const prev = JSON.parse(localStorage.getItem('instaledger_accounts') || '[]');
          const updated = [res.user, ...prev.filter(a => a.id !== res.user.id && a.username !== res.user.username)];
          localStorage.setItem('instaledger_accounts', JSON.stringify(updated.slice(0, 10)));
          setAccounts(updated);
        } catch (e) {}

        onAuthSuccess?.(res.user, res.token);
        onSwitchUser?.(res.user);
        onClose();
      } else {
        throw new Error('Invalid authentication response from ledger');
      }
    } catch (err) {
      triggerHaptic('error');
      setLoginError(err.message || 'Incorrect username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Signup submission (Photo 7)
  const handleSignupSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const u = signupUsername.trim().toLowerCase();

    if (!u || !signupPassword) {
      setSignupError('Username and password are required');
      triggerHaptic('error');
      return;
    }

    if (!usernameValid) {
      setSignupError('Username must be 3-24 characters containing only letters, numbers, and underscores');
      triggerHaptic('error');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      triggerHaptic('error');
      return;
    }

    setSignupLoading(true);
    setSignupError('');

    try {
      const res = await api.signup({
        username: u,
        displayName: signupDisplayName.trim() || u,
        password: signupPassword,
        mspId: signupMspId,
        bio: signupBio.trim()
      });

      if (res && res.user && res.token) {
        triggerHaptic('success');
        localStorage.setItem('instaledger_token', res.token);
        localStorage.setItem('instaledger_auth_user', JSON.stringify(res.user));

        // Save to multi-account list
        try {
          const prev = JSON.parse(localStorage.getItem('instaledger_accounts') || '[]');
          const updated = [res.user, ...prev.filter(a => a.id !== res.user.id && a.username !== res.user.username)];
          localStorage.setItem('instaledger_accounts', JSON.stringify(updated.slice(0, 10)));
          setAccounts(updated);
        } catch (e) {}

        onAuthSuccess?.(res.user, res.token);
        onSwitchUser?.(res.user);
        onClose();
      } else {
        throw new Error('Failed to register account on ledger');
      }
    } catch (err) {
      triggerHaptic('error');
      setSignupError(err.message || 'Registration failed on Hyperledger Fabric');
    } finally {
      setSignupLoading(false);
    }
  };

  // Quick 1-click test filler for evaluation
  const quickFillLogin = (u, p) => {
    setLoginIdentifier(u);
    setLoginPassword(p);
    handleLoginSubmit(null, u, p);
  };

  // Available display accounts (merging cached accounts and default users, excluding dummy accounts)
  const displayAccountsMap = new Map();
  accounts.forEach(a => {
    if (a && a.username && !DUMMY_ACCOUNTS.has(a.username)) {
      displayAccountsMap.set(a.username, a);
    }
  });
  (allUsers || []).forEach(a => {
    if (a && a.username && !DUMMY_ACCOUNTS.has(a.username) && !displayAccountsMap.has(a.username)) {
      displayAccountsMap.set(a.username, a);
    }
  });
  const displayAccounts = Array.from(displayAccountsMap.values());

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm select-none font-sans animate-fade-in">
      {/* Container: Bottom Sheet on Mobile, Centered Modal on Desktop */}
      <div className="relative w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-[#DBDBDB] animate-slide-up sm:animate-scale-in">

        {/* ─────────────────────────────────────────────────────────────
            VIEW 1: ACCOUNT SWITCHER BOTTOM SHEET (Photo 4)
           ───────────────────────────────────────────────────────────── */}
        {view === 'switcher' && (
          <div className="flex flex-col">
            {/* Grab Handle */}
            <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
              <div className="w-10 h-1 bg-[#DBDBDB] rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-2 flex items-center justify-between border-b border-[#EFEFEF]">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-[#262626]">Accounts</span>
                <span className="text-[10px] font-mono text-[#00BA88] font-bold px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200">
                  Fabric World State
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-[#737373] hover:text-[#262626] active:scale-95 transition-transform"
                aria-label="Close"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Active Accounts List */}
            <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
              {displayAccounts.map((acc) => {
                const isActive = currentUser && (currentUser.id === acc.id || currentUser.username === acc.username);
                return (
                  <button
                    key={acc.id || acc.username}
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-[#F9FAFB] border border-[#E5E7EB] shadow-2xs'
                        : 'hover:bg-[#FAFAFA] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-[#E5E5E5]">
                        <img
                          src={acc.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${acc.username}`}
                          alt={acc.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${acc.username}`;
                          }}
                        />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-sm font-bold text-[#262626] truncate flex items-center gap-1">
                          @{acc.username}
                        </div>
                        <div className="text-xs text-[#737373] truncate">
                          {acc.displayName || acc.username}
                        </div>
                        <div className="text-[10px] font-mono text-[#0095F6] font-semibold">
                          {acc.mspId || 'Org1MSP'}
                        </div>
                      </div>
                    </div>

                    {/* Radio Button Checkmark */}
                    <div className="flex items-center justify-center w-6 h-6 ml-2 flex-shrink-0">
                      {isActive ? (
                        <div className="w-5 h-5 rounded-full bg-[#0095F6] flex items-center justify-center text-white shadow-2xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#D1D5DB]" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Add Account Option (Photo 4) */}
              <button
                onClick={() => { triggerHaptic('light'); setView('add-account'); }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#FAFAFA] border border-dashed border-[#D1D5DB] transition-all text-left mt-2 group"
              >
                <div className="w-12 h-12 rounded-full border-2 border-[#D1D5DB] flex items-center justify-center text-[#262626] group-hover:border-[#0095F6] group-hover:text-[#0095F6] transition-colors flex-shrink-0">
                  <Plus className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#262626] group-hover:text-[#0095F6] transition-colors">
                    Add Instagram account
                  </div>
                  <div className="text-xs text-[#737373]">
                    Log in or create a new Hyperledger Fabric identity
                  </div>
                </div>
              </button>
            </div>

            {/* ── Streamlined Logout Option: Current Account Only ── */}
            <div className="px-4 pb-5 pt-1 border-t border-[#EFEFEF]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#ED4956]/30 text-[#ED4956] font-semibold text-sm hover:bg-[#ED4956]/5 active:bg-[#ED4956]/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out @{currentUser?.username || 'account'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            VIEW 2: "ADD ACCOUNT" ACTION SHEET (Photo 6)
           ───────────────────────────────────────────────────────────── */}
        {view === 'add-account' && (
          <div className="flex flex-col">
            {/* Grab Handle */}
            <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-pointer" onClick={() => setView('switcher')}>
              <div className="w-10 h-1 bg-[#DBDBDB] rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-2 flex items-center justify-between border-b border-[#EFEFEF]">
              <button
                onClick={() => setView('switcher')}
                className="p-1 -ml-1 text-[#262626] hover:bg-gray-100 rounded-full"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-[#262626]">Add account</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-[#737373] hover:text-[#262626]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options Body (Photo 6) */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => { triggerHaptic('light'); setView('login'); setLoginError(''); }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#FAFAFA] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all text-left group"
              >
                <div>
                  <div className="text-sm font-bold text-[#262626] group-hover:text-[#0095F6] transition-colors">
                    Log into existing account
                  </div>
                  <div className="text-xs text-[#737373] mt-0.5">
                    Connect using existing username & password
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#0095F6] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => { triggerHaptic('light'); setView('signup'); setSignupError(''); }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#FAFAFA] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all text-left group"
              >
                <div>
                  <div className="text-sm font-bold text-[#262626] group-hover:text-[#00BA88] transition-colors">
                    Create new account
                  </div>
                  <div className="text-xs text-[#737373] mt-0.5">
                    Register a new immutable identity on Fabric
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#00BA88] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            VIEW 3: INSTAGRAM LOGIN SCREEN (Photo 5)
           ───────────────────────────────────────────────────────────── */}
        {view === 'login' && (
          <div className="flex flex-col p-6 overflow-y-auto max-h-[88vh]">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setView('add-account')}
                className="p-1 -ml-2 text-[#262626] hover:bg-gray-100 rounded-full"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="text-xs text-[#737373] font-medium flex items-center gap-1 cursor-pointer">
                <span>English (US)</span>
                <span className="text-[10px]">▼</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 -mr-2 text-[#737373] hover:text-[#262626]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instagram Wordmark Logo */}
            <div className="py-5 text-center">
              <InstagramWordmark />
              <p className="text-[11px] text-[#737373] mt-1 font-mono">
                Decentralized on Hyperledger Fabric
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Username, email or mobile number"
                  autoCapitalize="none"
                  className="w-full px-3.5 py-3 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg text-sm text-[#262626] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] focus:bg-white transition-all"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3.5 py-3 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg text-sm text-[#262626] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8E8E8E] hover:text-[#262626]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading || !loginIdentifier || !loginPassword}
                className="w-full py-3 bg-[#0095F6] hover:bg-[#1877F2] active:scale-[0.99] text-white rounded-lg text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loginLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Log in</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => alert('Default passwords for seed test accounts are: password123')}
                  className="text-xs font-semibold text-[#00376B] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* 1-Click Demo Testing Credentials */}
              <div className="pt-3 border-t border-[#EFEFEF] mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#8E8E8E] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Quick 1-Click Test Logins
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    type="button"
                    onClick={() => quickFillLogin('ranna', 'password123')}
                    className="p-2 rounded-lg bg-[#FAFAFA] hover:bg-blue-50 border border-[#E5E5E5] text-xs font-semibold text-[#262626] transition-colors"
                  >
                    @ranna
                    <span className="block text-[10px] text-[#737373] font-normal font-mono">Org1MSP · Validator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillLogin('teacher_eva', 'profPassword123')}
                    className="p-2 rounded-lg bg-[#FAFAFA] hover:bg-indigo-50 border border-[#E5E5E5] text-xs font-semibold text-[#262626] transition-colors"
                  >
                    @teacher_eva
                    <span className="block text-[10px] text-[#737373] font-normal font-mono">Org1MSP · Instructor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillLogin('megha', 'password123')}
                    className="p-2 rounded-lg bg-[#FAFAFA] hover:bg-purple-50 border border-[#E5E5E5] text-xs font-semibold text-[#262626] transition-colors"
                  >
                    @megha
                    <span className="block text-[10px] text-[#737373] font-normal font-mono">Org1MSP · Peer</span>
                  </button>
                </div>
              </div>

              {/* Create New Account Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => { setView('signup'); setSignupError(''); }}
                  className="w-full py-2.5 rounded-lg border border-[#0095F6] text-[#0095F6] font-bold text-sm hover:bg-blue-50/50 transition-colors"
                >
                  Create new account
                </button>
              </div>
            </form>

            {/* Meta Footer */}
            <div className="mt-8 pt-4 border-t border-[#EFEFEF]">
              <MetaLogo />
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            VIEW 4: "CREATE A USERNAME" SIGNUP WIZARD (Photo 7)
           ───────────────────────────────────────────────────────────── */}
        {view === 'signup' && (
          <div className="flex flex-col p-6 overflow-y-auto max-h-[88vh]">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setView('add-account')}
                className="p-1 -ml-2 text-[#262626] hover:bg-gray-100 rounded-full"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-[#737373]">Account Setup</span>
              <button
                onClick={onClose}
                className="p-1 -mr-2 text-[#737373] hover:text-[#262626]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Header (Photo 7) */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-[#262626] tracking-tight">
                Create a username
              </h1>
              <p className="text-xs text-[#737373] mt-1">
                Choose a username to continue. You can always change it later.
              </p>
            </div>

            {/* Error Message */}
            {signupError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{signupError}</span>
              </div>
            )}

            {/* Signup Wizard Form */}
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              {/* Username Input with Validation Feedback */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="Username"
                    autoCapitalize="none"
                    required
                    className={`w-full px-3.5 py-3 bg-[#FAFAFA] border rounded-lg text-sm text-[#262626] placeholder:text-[#8E8E8E] focus:outline-none focus:bg-white transition-all pr-10 ${
                      usernameValid === true
                        ? 'border-emerald-500 focus:border-emerald-600'
                        : usernameValid === false
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#DBDBDB] focus:border-[#A8A8A8]'
                    }`}
                  />
                  <div className="absolute right-3 top-3.5">
                    {usernameValid === true && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {usernameValid === false && (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
                {usernameValid === false && (
                  <p className="text-[11px] text-red-500 mt-1">
                    3-24 characters (lowercase letters, numbers, and underscores).
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={signupDisplayName}
                  onChange={(e) => setSignupDisplayName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg text-sm text-[#262626] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] focus:bg-white transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Password"
                    minLength={6}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg text-sm text-[#262626] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] focus:bg-white transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#8E8E8E] hover:text-[#262626]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Fabric Organization MSP */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Hyperledger Fabric MSP Organization
                </label>
                <select
                  value={signupMspId}
                  onChange={(e) => setSignupMspId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg text-xs text-[#262626] focus:outline-none focus:border-[#0095F6]"
                >
                  <option value="Org1MSP">Org1MSP · Validator & Orderer Identity</option>
                  <option value="Org2MSP">Org2MSP · Peer Consensus Node</option>
                  <option value="Org3MSP">Org3MSP · IPFS Storage Node</option>
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Bio (Optional)
                </label>
                <input
                  type="text"
                  value={signupBio}
                  onChange={(e) => setSignupBio(e.target.value)}
                  placeholder="e.g. Distributed systems creator ⛓️"
                  className="w-full px-3.5 py-2 bg-[#FAFAFA] border border-[#DBDBDB] rounded-lg text-xs text-[#262626] placeholder:text-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] focus:bg-white transition-all"
                />
              </div>

              {/* Submit Next Button (Photo 7) */}
              <button
                type="submit"
                disabled={signupLoading || !signupUsername || !signupPassword || !usernameValid}
                className="w-full py-3 bg-[#0095F6] hover:bg-[#1877F2] active:scale-[0.99] text-white rounded-lg text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-3"
              >
                {signupLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>

              {/* Already have an account */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setView('login'); setLoginError(''); }}
                  className="text-xs text-[#737373]"
                >
                  Already have an account? <span className="font-semibold text-[#0095F6]">Log in</span>
                </button>
              </div>
            </form>

            {/* Meta Footer */}
            <div className="mt-8 pt-4 border-t border-[#EFEFEF]">
              <MetaLogo />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
