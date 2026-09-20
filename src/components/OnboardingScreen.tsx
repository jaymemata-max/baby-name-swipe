"use client";

import React, { useState } from 'react';
import { Copy, Check, Users, ArrowRight } from 'lucide-react';
import { Couple } from '@/lib/supabase/database.types';

interface OnboardingScreenProps {
  onCoupleReady: () => void;
  onCreateCouple: (title?: string) => Promise<{ success: boolean; error?: string }>;
  onJoinCouple: (code: string) => Promise<{ success: boolean; error?: string; code?: string }>;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onCoupleReady,
  onCreateCouple,
  onJoinCouple,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [title, setTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdCouple, setCreatedCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await onCreateCouple(title.trim() || undefined);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create couple list.');
      } else {
        // Fetch couple to show invite code
        const meRes = await fetch('/api/me');
        if (!meRes.ok) {
          setErrorMsg('Could not load your invite code. Please try again.');
          return;
        }
        const json = await meRes.json();
        if (json.couple) {
          setCreatedCouple(json.couple);
        } else {
          setErrorMsg('Could not load your invite code. Please try again.');
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.replace(/\s+/g, '').toUpperCase();
    if (cleanCode.length < 5) {
      setErrorMsg('Please enter a valid 6-character code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await onJoinCouple(cleanCode);
      if (!res.success) {
        if (res.code === 'invalid_invite_code') {
          setErrorMsg('We could not find a list with that invite code. Please double check with your partner.');
        } else if (res.code === 'couple_full') {
          setErrorMsg('This couple list already has two partners connected.');
        } else {
          setErrorMsg(res.error || 'Failed to join couple.');
        }
      } else {
        onCoupleReady();
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrShare = async () => {
    if (!createdCouple?.invite_code) return;
    const text = `Join our baby name shortlist! Our code is: ${createdCouple.invite_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Baby Names Invite',
          text,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(createdCouple.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      id="screen-onboarding"
      className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#fdebed] dark:bg-[#361b25] flex items-center justify-center text-[#e25567] dark:text-[#ff6a80] mb-4 shadow-sm">
        <Users className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
        Welcome to Baby Names
      </h1>
      <p className="text-xs sm:text-sm text-[#6e5966] dark:text-[#bda9b7] mt-1.5 mb-6">
        Designed for two: swipe names together on the sofa or wherever you are.
      </p>

      {/* Error Message */}
      {errorMsg && (
        <div className="w-full p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 mb-4 text-left">
          {errorMsg}
        </div>
      )}

      {/* Post-Creation Success View: Show 6-character code */}
      {createdCouple ? (
        <div className="w-full p-6 rounded-3xl bg-white dark:bg-[#251b22] border border-[#ebdcd4] dark:border-[#382b35] shadow-sm text-center">
          <h2 className="text-xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
            {createdCouple.title || 'Your Baby Name List'} is Ready!
          </h2>

          <p className="text-xs text-[#6e5966] dark:text-[#bda9b7] mt-2 mb-4">
            Share this 6-character code with your partner:
          </p>

          {/* Large Tappable Code */}
          <div
            id="tappable-invite-code"
            onClick={handleCopyOrShare}
            className="p-4 rounded-2xl bg-[#fcf5f2] dark:bg-[#2e222b] border-2 border-dashed border-[#e25567]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#e25567] transition-all mb-4"
          >
            <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-[#2b1b24] dark:text-white">
              {createdCouple.invite_code}
            </div>
            <span className="text-[11px] font-semibold text-[#e25567] dark:text-[#ff6a80] mt-1.5 flex items-center gap-1">
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied to clipboard!' : 'Tap to copy / share'}
            </span>
          </div>

          <p className="text-xs text-[#7d6575] dark:text-[#a895a2] mb-6 leading-relaxed">
            Start swiping now, your partner can join any time and everything you pick still counts.
          </p>

          <button
            type="button"
            id="btn-start-swiping-after-create"
            onClick={onCoupleReady}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>Start Swiping Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Tabs: Start a list OR Join partner */
        <div className="w-full">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#f4e8e1]/70 dark:bg-[#251b22] border border-[#ecd9d0] dark:border-[#3a2d36] mb-5">
            <button
              type="button"
              id="tab-onboarding-create"
              onClick={() => {
                setActiveTab('create');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-[#30232d] text-[#2b1b24] dark:text-[#f5edf2] shadow-xs'
                  : 'text-[#7d6676] dark:text-[#a895a2]'
              }`}
            >
              Start a List
            </button>
            <button
              type="button"
              id="tab-onboarding-join"
              onClick={() => {
                setActiveTab('join');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'join'
                  ? 'bg-white dark:bg-[#30232d] text-[#2b1b24] dark:text-[#f5edf2] shadow-xs'
                  : 'text-[#7d6676] dark:text-[#a895a2]'
              }`}
            >
              Join Partner
            </button>
          </div>

          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-1.5">
                  Couple / List Title (Optional)
                </label>
                <input
                  type="text"
                  id="input-create-couple-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Baby Mata"
                  className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-[#251b22] border border-[#ebdcd4] dark:border-[#382b35] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567] placeholder:text-[#9e8898]"
                />
              </div>

              <p className="text-xs text-[#735e6c] dark:text-[#a895a2] leading-relaxed">
                Creates your shared list and gives you a 6-character code to share with your partner.
              </p>

              <button
                type="submit"
                id="btn-submit-create-couple"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>{loading ? 'Creating...' : 'Create & Get Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-1.5">
                  Enter 6-Character Invite Code
                </label>
                <input
                  type="text"
                  id="input-join-code"
                  required
                  maxLength={10}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Q95N8X"
                  className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-[#251b22] border border-[#ebdcd4] dark:border-[#382b35] text-lg font-mono font-bold tracking-widest text-center text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567] placeholder:text-[#9e8898] uppercase"
                />
              </div>

              <p className="text-xs text-[#735e6c] dark:text-[#a895a2] leading-relaxed">
                Paste the code your partner sent you. Accepts spaces and lowercase.
              </p>

              <button
                type="submit"
                id="btn-submit-join-couple"
                disabled={loading || !joinCode.trim()}
                className="w-full py-3.5 px-4 rounded-xl font-bold bg-[#c05835] hover:bg-[#a84c2d] text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Joining...' : 'Join Partner List'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
