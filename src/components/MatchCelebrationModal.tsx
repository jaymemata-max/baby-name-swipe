"use client";

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, ArrowRight, X } from 'lucide-react';
import { SwipeResponse } from '@/lib/types';
import { Profile } from '@/lib/supabase/database.types';

interface MatchCelebrationModalProps {
  matchData: SwipeResponse;
  myProfile: Profile | null;
  partnerProfile: { display_name: string; avatar_emoji: string } | null;
  onDismiss: () => void;
  onViewMatches: () => void;
}

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({
  matchData,
  myProfile,
  partnerProfile,
  onDismiss,
  onViewMatches,
}) => {
  const isLoveMatch = matchData.match?.is_love;
  // The API only sends the name when it matched, which is the only case that
  // opens this modal. Bail rather than render "undefined" if that ever changes.
  const matchedName = matchData.name;

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      try {
        confetti({
          particleCount: isLoveMatch ? 90 : 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e25567', '#ff8597', '#fbcfe8', '#ffd166', '#ffffff'],
        });
      } catch {
        // ignore
      }
    }
  }, [isLoveMatch]);

  const myEmoji = myProfile?.avatar_emoji || '🤰';
  const partnerEmoji = partnerProfile?.avatar_emoji || '👨';
  const myName = myProfile?.display_name || 'You';
  const partnerName = partnerProfile?.display_name || 'Partner';

  if (!matchedName) return null;

  return (
    <div
      id="match-celebration-modal"
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
    >
      {/* Celebration Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-[#fff7f4] dark:bg-[#20151e] border-2 border-rose-200/80 dark:border-rose-900/60 p-7 text-center shadow-2xl overflow-hidden cursor-default transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Close icon button */}
        <button
          type="button"
          id="btn-close-celebration"
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/70 dark:bg-[#2c2029] text-[#735e6c] dark:text-[#a895a2] hover:text-[#2b1b24]"
          aria-label="Dismiss match celebration"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Floating Heart / Love Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 mb-4 animate-bounce duration-1000">
          <Heart className="w-10 h-10 fill-white stroke-none" />
        </div>

        {/* Celebration Title */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">{myEmoji}</span>
          <span className="text-sm font-bold uppercase tracking-widest text-[#e25567] dark:text-[#ff6a80]">
            It&apos;s a Match!
          </span>
          <span className="text-2xl">{partnerEmoji}</span>
        </div>

        {/* Dynamic Partner Copy */}
        {isLoveMatch ? (
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-4">
            ❤️ You BOTH loved this one! A strong favorite!
          </p>
        ) : (
          <p className="text-sm text-[#6e5966] dark:text-[#bda9b7] mb-4">
            {myName} and {partnerName} both said yes!
          </p>
        )}

        {/* Hero Name */}
        <div className="my-5 py-4 px-2 rounded-2xl bg-white dark:bg-[#281b25] border border-[#ebdcd4] dark:border-[#3d2b38] shadow-xs">
          <h2 className="text-4xl sm:text-5xl font-serif-name font-extrabold text-[#2b1b24] dark:text-[#f5edf2] tracking-tight">
            {matchedName.value}
          </h2>
          <p className="text-sm text-[#6e5966] dark:text-[#bba7b4] mt-2 italic max-w-[240px] mx-auto">
            &ldquo;{matchedName.meaning}&rdquo;
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            type="button"
            id="btn-celebration-view-matches"
            onClick={onViewMatches}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>See Our Shared List</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="btn-celebration-keep-swiping"
            onClick={onDismiss}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-white dark:bg-[#281b25] border border-[#ebdcd4] dark:border-[#3d2b38] text-[#2b1b24] dark:text-[#f5edf2] hover:bg-[#faede8] dark:hover:bg-[#31232e] shadow-xs transition-all text-sm"
          >
            Keep Swiping
          </button>
        </div>

        <p className="text-[11px] text-[#937b8b] dark:text-[#836e7c] mt-3">
          Tap anywhere outside to continue
        </p>
      </div>
    </div>
  );
};
