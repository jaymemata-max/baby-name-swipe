"use client";

import React, { useState } from 'react';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { useDeck } from '@/hooks/useDeck';
import { Profile, Couple, CoupleStats } from '@/lib/supabase/database.types';
import { SwipeResponse } from '@/lib/types';
import { DeckCard } from '@/components/DeckCard';
import { DeckControls } from '@/components/DeckControls';
import { DeckFiltersSheet } from '@/components/DeckFiltersSheet';
import { DeckEmptyState } from '@/components/DeckEmptyState';
import { AddNameSheet } from '@/components/AddNameSheet';

interface DeckScreenProps {
  profile: Profile | null;
  couple: Couple | null;
  partner: { id: string; display_name: string; avatar_emoji: string } | null;
  stats: CoupleStats | null;
  onMatchCelebration: (matchData: SwipeResponse) => void;
  onRefreshMe: () => void;
}

export const DeckScreen: React.FC<DeckScreenProps> = ({
  profile,
  couple,
  partner,
  stats,
  onMatchCelebration,
  onRefreshMe,
}) => {
  const {
    cards,
    topCard,
    loading,
    error,
    filters,
    canUndo,
    swipe,
    undo,
    updateFilters,
    reloadDeck,
  } = useDeck(onMatchCelebration);

  const [showFilters, setShowFilters] = useState(false);
  const [showAddName, setShowAddName] = useState(false);
  const [mySwipedSessionCount, setMySwipedSessionCount] = useState(0);

  // Shown above the deck so a failed load or a rolled-back swipe is visible
  // rather than leaving the user staring at a stale card.
  const errorBanner = error ? (
    <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 flex items-center justify-between gap-3">
      <span className="text-xs text-rose-800 dark:text-rose-200">{error}</span>
      <button
        type="button"
        onClick={() => reloadDeck()}
        className="text-xs font-bold text-rose-700 dark:text-rose-300 underline shrink-0"
      >
        Retry
      </button>
    </div>
  ) : null;

  const handleSwipeAction = async (dir: 'like' | 'pass' | 'love') => {
    if (await swipe(dir)) setMySwipedSessionCount((prev) => prev + 1);
  };

  const handleShowAllNames = () => {
    if (filters.gender === 'all' && filters.languages.length === 0) {
      void reloadDeck();
      return;
    }

    updateFilters({ gender: 'all', languages: [] });
  };

  return (
    <div
      id="screen-deck"
      className="flex-1 flex flex-col w-full max-w-md mx-auto h-full px-4 pt-2 pb-20 justify-between overflow-hidden relative"
    >
      {/* Top Bar */}
      <header className="flex items-center justify-between w-full h-12 shrink-0 z-30">
        {/* Partner / Couple Status */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white dark:bg-[#251d23] border border-[#ebdcd4] dark:border-[#382b35] flex items-center justify-center text-lg shadow-xs">
              {partner?.avatar_emoji || '👨'}
            </div>
            {/* Active presence dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#fff7f4] dark:border-[#191117]"
              title={partner ? `${partner.display_name} is online` : 'Waiting for partner'}
            />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-[#2b1b24] dark:text-[#f5edf2] leading-tight">
              {couple?.title || 'Baby Names'}
            </span>
            <span className="text-[11px] text-[#7a6473] dark:text-[#a895a2] leading-tight">
              {partner ? `with ${partner.display_name}` : 'Waiting for partner'}
            </span>
          </div>
        </div>

        {/* Right controls: Add name + Filters */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="btn-open-add-name"
            onClick={() => setShowAddName(true)}
            aria-label="Add your own name"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#251d23] border border-[#ebdcd4] dark:border-[#382b35] text-[#735e6c] dark:text-[#beabb8] hover:text-[#e25567] shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            type="button"
            id="btn-open-filters"
            onClick={() => setShowFilters(true)}
            aria-label="Deck filters"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#251d23] border border-[#ebdcd4] dark:border-[#382b35] text-[#735e6c] dark:text-[#beabb8] hover:text-[#c05835] shadow-xs active:scale-95 transition-all relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(filters.gender !== 'all' || filters.languages.length > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#c05835]" />
            )}
          </button>
        </div>
      </header>

      {errorBanner}

      {/* Main Deck Container */}
      <main className="flex-1 w-full relative my-2 min-h-[380px] max-h-[520px] flex items-center justify-center">
        {loading && cards.length === 0 ? (
          /* Loading Card Skeleton */
          <div className="w-full h-full rounded-3xl bg-white dark:bg-[#231b21] border border-[#f0ded7] dark:border-[#382b35] p-6 flex flex-col justify-between animate-pulse shadow-sm">
            <div className="flex justify-between">
              <div className="w-16 h-6 rounded-full bg-[#f4e8e1] dark:bg-[#342731]" />
              <div className="w-20 h-6 rounded-full bg-[#f4e8e1] dark:bg-[#342731]" />
            </div>
            <div className="text-center space-y-3">
              <div className="w-44 h-12 rounded-xl bg-[#f4e8e1] dark:bg-[#342731] mx-auto" />
              <div className="w-56 h-5 rounded-md bg-[#f4e8e1] dark:bg-[#342731] mx-auto" />
            </div>
            <div className="w-full h-8 rounded-lg bg-[#f4e8e1] dark:bg-[#342731]" />
          </div>
        ) : cards.length === 0 ? (
          /* Genuine End of Deck */
          <DeckEmptyState
            stats={stats}
            mySwipesCount={mySwipedSessionCount}
            onOpenAddName={() => setShowAddName(true)}
            onShowAllNames={handleShowAllNames}
          />
        ) : (
          /* Swipable Card Stack: render top 2 cards */
          cards.slice(0, 2).map((card, index) => (
            <DeckCard
              key={card.id}
              card={card}
              isTop={index === 0}
              stackIndex={index}
              onSwipe={handleSwipeAction}
            />
          ))
        )}
      </main>

      {/* Bottom Controls: Undo, Pass, Love, Like */}
      <footer className="w-full shrink-0 z-30">
        <DeckControls
          onSwipe={handleSwipeAction}
          onUndo={undo}
          canUndo={canUndo}
          disabled={loading || cards.length === 0}
        />
      </footer>

      {/* Filters Sheet */}
      <DeckFiltersSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onUpdateFilters={updateFilters}
      />

      {/* Add Custom Name Sheet */}
      <AddNameSheet
        isOpen={showAddName}
        onClose={() => setShowAddName(false)}
        onNameAdded={() => {
          reloadDeck();
          onRefreshMe();
        }}
      />
    </div>
  );
};
