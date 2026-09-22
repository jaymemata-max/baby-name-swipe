"use client";

import React, { useState } from 'react';
import { Copy, Check, LogOut, Smartphone } from 'lucide-react';
import { Profile, Couple, CoupleStats } from '@/lib/supabase/database.types';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface SettingsTabProps {
  profile: Profile | null;
  couple: Couple | null;
  partner: { id: string; display_name: string; avatar_emoji: string } | null;
  stats: CoupleStats | null;
  onUpdateProfile: (name?: string, emoji?: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateCouple: (title?: string, dueDate?: string | null) => Promise<{ success: boolean; error?: string }>;
  onSignOut: () => Promise<{ success: boolean; error?: string }>;
}

const EMOJI_OPTIONS = ['🤰', '👨', '👩', '👶', '🍼', '🐣', '🧸', '✨', '💛', '🌸', '🌿', '🦁'];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  couple,
  partner,
  stats,
  onUpdateProfile,
  onUpdateCouple,
  onSignOut,
}) => {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatar_emoji || '🤰');
  const [coupleTitle, setCoupleTitle] = useState(couple?.title || '');
  const [dueDate, setDueDate] = useState(couple?.due_date || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedCouple, setSavedCouple] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [coupleError, setCoupleError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCouple, setSavingCouple] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleCopyInvite = async () => {
    if (!couple?.invite_code) return;
    setInviteError(null);
    const textToShare = `Join our baby name shortlist on Baby Names! Our invite code is: ${couple.invite_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Baby Names Invite',
          text: textToShare,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(couple.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setInviteError('Could not copy the code. Please select it manually.');
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setSavedProfile(false);
    try {
      const res = await onUpdateProfile(displayName, avatarEmoji);
      if (!res.success) throw new Error(res.error || 'Could not save profile.');
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCouple = async () => {
    setSavingCouple(true);
    setCoupleError(null);
    setSavedCouple(false);
    try {
      const res = await onUpdateCouple(coupleTitle, dueDate || null);
      if (!res.success) throw new Error(res.error || 'Could not save couple details.');
      setSavedCouple(true);
      setTimeout(() => setSavedCouple(false), 2000);
    } catch (err) {
      setCoupleError(err instanceof Error ? err.message : 'Could not save couple details.');
    } finally {
      setSavingCouple(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      const res = await onSignOut();
      if (!res.success) setSignOutError(res.error || 'Could not sign out.');
    } catch (err) {
      setSignOutError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div id="screen-settings" className="flex-1 flex flex-col w-full max-w-lg mx-auto pb-24 px-4 pt-3 overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
          Settings
        </h1>
        <p className="text-xs text-[#735e6c] dark:text-[#a895a2] mt-0.5">
          Your profile, couple preferences & stats
        </p>
      </div>

      {/* Invite Code & Partner Connection Banner */}
      {couple && (
        <div className={`mb-5 p-5 rounded-2xl border shadow-xs ${
          !partner
            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60'
            : 'bg-white dark:bg-[#251b22] border-[#f0ded7] dark:border-[#382b35]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#735e6c] dark:text-[#a895a2]">
              Partner Status
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              partner
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
            }`}>
              {partner ? 'Connected (2 of 2)' : 'Waiting for partner (1 of 2)'}
            </span>
          </div>

          {!partner ? (
            <p className="text-xs text-rose-800 dark:text-rose-300 mb-3 leading-relaxed">
              Your partner has not joined yet! Share your 6-character code so they can join and swipe with you.
            </p>
          ) : (
            <div className="flex items-center gap-2 mb-3 text-sm text-[#2b1b24] dark:text-[#f5edf2]">
              <span className="text-lg">{partner.avatar_emoji}</span>
              <span className="font-semibold">{partner.display_name}</span>
              <span className="text-xs text-[#735e6c] dark:text-[#a895a2]">is connected</span>
            </div>
          )}

          {/* Large Invite Code Box */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#2c2029] border border-[#ebdcd4] dark:border-[#42313e]">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#8c7483] dark:text-[#9e8b98]">
                Invite Code
              </div>
              <div className="text-2xl font-mono font-extrabold tracking-widest text-[#2b1b24] dark:text-[#f5edf2] select-text">
                {couple.invite_code}
              </div>
            </div>

            <button
              type="button"
              id="btn-copy-invite-code"
              onClick={handleCopyInvite}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#e25567] hover:bg-[#d24255] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Share / Copy</span>
                </>
              )}
            </button>
          </div>
          {inviteError && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{inviteError}</p>}
        </div>
      )}

      {/* Your Profile Section */}
      <div className="mb-5 p-5 rounded-2xl bg-white dark:bg-[#251b22] border border-[#f0ded7] dark:border-[#382b35] shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#735e6c] dark:text-[#a895a2] mb-3">
          Your Profile
        </h3>

        {/* Display Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#735e6c] dark:text-[#beabb8] mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            id="input-settings-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#fcf8f6] dark:bg-[#2b2028] border border-[#ebdcd4] dark:border-[#3d2c38] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567]"
          />
        </div>

        {/* Avatar Emoji */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#735e6c] dark:text-[#beabb8] mb-1.5">
            Choose Avatar Emoji
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatarEmoji(emoji)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                  avatarEmoji === emoji
                    ? 'bg-rose-100 dark:bg-rose-950 border-2 border-rose-400 scale-110 shadow-xs'
                    : 'bg-[#f8ede8] dark:bg-[#2e222b] hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          id="btn-save-profile"
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-xs transition-all"
        >
          {savingProfile ? 'Saving...' : savedProfile ? 'Profile Saved!' : 'Update Profile'}
        </button>
        {profileError && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{profileError}</p>}
      </div>

      {/* Couple Preferences */}
      {couple && (
        <div className="mb-5 p-5 rounded-2xl bg-white dark:bg-[#251b22] border border-[#f0ded7] dark:border-[#382b35] shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#735e6c] dark:text-[#a895a2] mb-3">
            Couple & Baby Details
          </h3>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#735e6c] dark:text-[#beabb8] mb-1.5">
              Couple / Baby Title
            </label>
            <input
              type="text"
              id="input-settings-couple-title"
              value={coupleTitle}
              onChange={(e) => setCoupleTitle(e.target.value)}
              placeholder="e.g. Baby Mata"
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#fcf8f6] dark:bg-[#2b2028] border border-[#ebdcd4] dark:border-[#3d2c38] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#735e6c] dark:text-[#beabb8] mb-1.5">
              Due Date (Optional)
            </label>
            <input
              type="date"
              id="input-settings-due-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#fcf8f6] dark:bg-[#2b2028] border border-[#ebdcd4] dark:border-[#3d2c38] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567]"
            />
          </div>

          <button
            type="button"
            id="btn-save-couple"
            onClick={handleSaveCouple}
            disabled={savingCouple}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#c05835] hover:bg-[#a84c2d] text-white shadow-xs transition-all"
          >
            {savingCouple ? 'Saving...' : savedCouple ? 'Couple Saved!' : 'Save Couple Info'}
          </button>
          {coupleError && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{coupleError}</p>}
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="mb-5 p-5 rounded-2xl bg-white dark:bg-[#251b22] border border-[#f0ded7] dark:border-[#382b35] shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#735e6c] dark:text-[#a895a2] mb-3">
            Stats
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[#fbf5f2] dark:bg-[#2c212a]">
              <div className="text-lg font-bold text-[#2b1b24] dark:text-[#f5edf2]">
                {stats.my_swipes}
              </div>
              <div className="text-[10px] text-[#786171] dark:text-[#a895a2]">My Swipes</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#fbf5f2] dark:bg-[#2c212a]">
              <div className="text-lg font-bold text-[#2b1b24] dark:text-[#f5edf2]">
                {stats.partner_swipes}
              </div>
              <div className="text-[10px] text-[#786171] dark:text-[#a895a2]">Partner Swipes</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60">
              <div className="text-lg font-bold text-[#e25567] dark:text-[#ff6a80]">
                {stats.matches}
              </div>
              <div className="text-[10px] text-[#786171] dark:text-[#a895a2]">Shared Matches</div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Home Screen Install */}
      {!isInstalled && (isInstallable || isIOS) && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-amber-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#2b1b24] dark:text-[#f5edf2]">
                Install to Home Screen
              </div>
              <div className="text-[11px] text-[#786171] dark:text-[#a895a2]">
                Full screen without browser chrome
              </div>
            </div>
          </div>

          {isInstallable && (
            <button
              type="button"
              id="btn-install-pwa"
              onClick={install}
              className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
            >
              Install
            </button>
          )}

          {isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="py-2 px-3 rounded-xl bg-white dark:bg-[#2c202a] text-xs font-bold text-[#2b1b24] dark:text-white border border-[#ddd] dark:border-[#444]"
            >
              iOS Guide
            </button>
          )}
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#251b22] p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-[#2b1b24] dark:text-white">Install on iPhone</h3>
            <p className="mt-2 text-xs text-[#6e5966] dark:text-[#beabb8] text-left leading-relaxed">
              1. Tap the <strong>Share</strong> button in the Safari bottom bar.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Launch directly from your home screen for the full app experience!
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#f4e8e1] dark:bg-[#332530] text-xs font-bold text-[#2b1b24] dark:text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Sign Out Button */}
      <div className="pt-2">
        <button
          type="button"
          id="btn-settings-signout"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
        {signOutError && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{signOutError}</p>}
      </div>
    </div>
  );
};
