"use client";

import React from 'react';
import { Plus, RefreshCw, HeartHandshake } from 'lucide-react';
import { CoupleStats } from '@/lib/supabase/database.types';

interface DeckEmptyStateProps {
  stats: CoupleStats | null;
  mySwipesCount: number;
  onOpenAddName: () => void;
  onShowAllNames: () => void;
}

export const DeckEmptyState: React.FC<DeckEmptyStateProps> = ({
  stats,
  mySwipesCount,
  onOpenAddName,
  onShowAllNames,
}) => {
  return (
    <div
      id="deck-empty-state"
      className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[#fdebed] dark:bg-[#361b25] flex items-center justify-center mb-5 text-[#e25567] dark:text-[#ff6a80] shadow-sm">
        <HeartHandshake className="w-10 h-10" />
      </div>

      <h3 className="text-2xl sm:text-3xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
        You&apos;ve reached the end!
      </h3>

      <p className="mt-2 text-sm sm:text-base text-[#6e5966] dark:text-[#beabb8] max-w-xs leading-relaxed">
        You&apos;ve swiped through all available names for your current filters.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs my-6">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251d23] border border-[#ebdcd4] dark:border-[#382b35] shadow-xs text-center">
          <div className="text-2xl font-bold text-[#2b1b24] dark:text-[#f5edf2]">
            {stats?.my_swipes || mySwipesCount}
          </div>
          <div className="text-xs text-[#7e6776] dark:text-[#a895a2] mt-0.5">Names Swiped</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251d23] border border-[#ebdcd4] dark:border-[#382b35] shadow-xs text-center">
          <div className="text-2xl font-bold text-[#e25567] dark:text-[#ff6a80]">
            {stats?.matches || 0}
          </div>
          <div className="text-xs text-[#7e6776] dark:text-[#a895a2] mt-0.5">Shared Matches</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          id="btn-empty-add-name"
          onClick={onOpenAddName}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-md transition-all active:scale-[0.99]"
        >
          <Plus className="w-5 h-5" />
          Add Your Own Name
        </button>

        <button
          type="button"
          id="btn-empty-show-all-names"
          onClick={onShowAllNames}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-semibold bg-white dark:bg-[#251d23] border border-[#ebdcd4] dark:border-[#382b35] text-[#2b1b24] dark:text-[#f5edf2] hover:bg-[#faede8] dark:hover:bg-[#2c222a] shadow-xs transition-all"
        >
          <RefreshCw className="w-4 h-4 text-[#c05835] dark:text-[#ea7a56]" />
          Show All Names
        </button>
      </div>
    </div>
  );
};
