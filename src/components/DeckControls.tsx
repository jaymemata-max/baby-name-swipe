"use client";

import React from 'react';
import { X, Heart, Check, RotateCcw } from 'lucide-react';
import { SwipeDirection } from '@/lib/supabase/database.types';

interface DeckControlsProps {
  onSwipe: (dir: SwipeDirection) => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled: boolean;
}

export const DeckControls: React.FC<DeckControlsProps> = ({
  onSwipe,
  onUndo,
  canUndo,
  disabled,
}) => {
  return (
    <div className="w-full flex items-center justify-center gap-4 sm:gap-6 pt-2 pb-2">
      {/* Undo Button */}
      <button
        type="button"
        id="btn-deck-undo"
        onClick={onUndo}
        disabled={disabled || !canUndo}
        aria-label="Undo last swipe"
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
          canUndo && !disabled
            ? 'bg-white dark:bg-[#251d23] border-[#e7d5cd] dark:border-[#453641] text-[#7d6575] hover:text-[#2b1b24] hover:bg-[#faede8] active:scale-95 shadow-sm'
            : 'bg-[#f5eae5]/60 dark:bg-[#251d23]/40 border-transparent text-[#bdaab6] dark:text-[#5c4a55] cursor-not-allowed'
        }`}
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Pass Button (NO) */}
      <button
        type="button"
        id="btn-deck-pass"
        onClick={() => onSwipe('pass')}
        disabled={disabled}
        aria-label="Pass on this name"
        className="w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-[#251d23] border-2 border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 shadow-md transition-all duration-150"
      >
        <X className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Love Button (SUPER LIKE) */}
      <button
        type="button"
        id="btn-deck-love"
        onClick={() => onSwipe('love')}
        disabled={disabled}
        aria-label="Love this name"
        className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 text-white shadow-lg shadow-rose-500/25 hover:brightness-105 active:scale-95 transition-all duration-150"
      >
        <Heart className="w-7 h-7 fill-white stroke-none" />
      </button>

      {/* Like Button (YES) */}
      <button
        type="button"
        id="btn-deck-like"
        onClick={() => onSwipe('like')}
        disabled={disabled}
        aria-label="Like this name"
        className="w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-[#251d23] border-2 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 shadow-md transition-all duration-150"
      >
        <Check className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
};
