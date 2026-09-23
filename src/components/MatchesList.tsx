"use client";

import type { MatchWithName } from '@/lib/types';

import React, { useState } from 'react';
import { Star, Heart, MessageSquare, ChevronRight, HeartHandshake } from 'lucide-react';
import { useMatches } from '@/hooks/useMatches';

import { MatchDetailSheet } from '@/components/MatchDetailSheet';
import { formatBabyName } from '@/lib/babyNameDisplay';
import { nameGenderStyles } from '@/lib/nameGenderStyles';

interface MatchesListProps {
  onGoToDeck: () => void;
}

export const MatchesList: React.FC<MatchesListProps> = ({ onGoToDeck }) => {
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl' | 'unisex'>('all');
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithName | null>(null);

  const { matches, loading, error, toggleShortlist, updateNote, deleteMatch } = useMatches(
    genderFilter,
    shortlistedOnly
  );

  return (
    <div id="screen-our-list" className="flex-1 min-h-0 overflow-hidden flex flex-col w-full max-w-lg mx-auto pb-20 px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
            Our Matches
          </h1>
          <p className="text-xs text-[#735e6c] dark:text-[#a895a2] mt-0.5">
            Names you both agreed on
          </p>
        </div>

        {/* Shortlisted Only Toggle Button */}
        <button
          type="button"
          id="btn-filter-shortlisted-toggle"
          onClick={() => setShortlistedOnly(!shortlistedOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            shortlistedOnly
              ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-white dark:bg-[#251b22] border-[#e7d5cd] dark:border-[#382b35] text-[#735e6c] dark:text-[#beabb8]'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${shortlistedOnly ? 'fill-current' : ''}`} />
          <span>Shortlist</span>
        </button>
      </div>

      {/* Segmented Control: All / Boys / Girls / Unisex */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#f4e8e1]/70 dark:bg-[#251b22] border border-[#ecd9d0] dark:border-[#3a2d36] mb-4 shrink-0">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'boy', label: 'Boys' },
            { id: 'girl', label: 'Girls' },
            { id: 'unisex', label: 'Unisex' },
          ] as const
        ).map((tab) => {
          const active = genderFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`segment-match-${tab.id}`}
              onClick={() => setGenderFilter(tab.id)}
              className={`py-2 px-0.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                active
                  ? tab.id === 'all'
                    ? 'bg-white dark:bg-[#30232d] text-[#2b1b24] dark:text-[#f5edf2] shadow-xs'
                    : nameGenderStyles[tab.id].selected
                  : 'text-[#7d6676] dark:text-[#a895a2] hover:text-[#2b1b24]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white dark:bg-[#231b21] border border-[#f0ded7] dark:border-[#362933] animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="w-28 h-6 bg-[#f4e8e1] dark:bg-[#362732] rounded-md" />
                <div className="w-48 h-4 bg-[#f4e8e1] dark:bg-[#362732] rounded-md" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#f4e8e1] dark:bg-[#362732]" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && matches.length === 0 && (
        <div className="my-auto py-12 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-full bg-[#fdebed] dark:bg-[#361b25] flex items-center justify-center text-[#e25567] dark:text-[#ff6a80] mb-4">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
            {shortlistedOnly ? 'No shortlisted names yet' : 'No shared matches yet'}
          </h3>
          <p className="mt-2 text-sm text-[#6e5966] dark:text-[#beabb8] max-w-xs leading-relaxed">
            {shortlistedOnly
              ? 'Star your favorite matches to keep them on your priority shortlist.'
              : 'Sit together, keep swiping! As soon as you both swipe YES or LOVE on the same name, it will appear right here.'}
          </p>
          <button
            type="button"
            onClick={onGoToDeck}
            className="mt-6 py-3 px-6 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white text-sm shadow-md transition-all active:scale-[0.99]"
          >
            Start Swiping
          </button>
        </div>
      )}

      {/* MatchWithName Rows */}
      {!loading && matches.length > 0 && (
        <div
          data-testid="matches-scroll-region"
          className="flex-1 min-h-0 space-y-2.5 overflow-y-auto overscroll-contain pb-4"
        >
          {matches.map((match) => {
            const dateStr = new Date(match.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            const genderStyle = nameGenderStyles[match.name.gender];

            return (
              <div
                key={match.id}
                id={`match-row-${match.id}`}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 rounded-2xl border ${genderStyle.card} transition-all shadow-xs flex items-center justify-between cursor-pointer group`}
              >
                {/* Name & details */}
                <div className="flex-1 pr-3 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full ${genderStyle.dot} shrink-0 mt-2`} />
                    <h3 className="min-w-0 flex-1 text-xl leading-tight font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2] break-words">
                      {formatBabyName(match.name.value)}
                    </h3>

                    {match.is_love && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center gap-1 shrink-0"
                        title="Both of you LOVED this name!"
                      >
                        <Heart className="w-2.5 h-2.5 fill-current" />
                        Loved
                      </span>
                    )}
                  </div>

                  {match.name.meaning && <p className="text-xs text-[#6e5966] dark:text-[#bda9b7] mt-0.5 line-clamp-1 italic">
                    &ldquo;{match.name.meaning}&rdquo;
                  </p>}

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8e7687] dark:text-[#9e8b98]">
                    {match.name.origin && <><span>{match.name.origin}</span><span>•</span></>}
                    <span>Matched {dateStr}</span>
                    {match.note && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#b36b28] dark:text-[#dda050] font-medium">
                          <MessageSquare className="w-3 h-3" /> Note
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Star Button & Arrow */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    id={`btn-star-match-${match.id}`}
                    onClick={() => toggleShortlist(match.id, match.shortlisted)}
                    aria-label={match.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      match.shortlisted
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                        : 'text-[#bda9b7] hover:text-amber-500 hover:bg-[#fcf5f2] dark:hover:bg-[#2e232b]'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${match.shortlisted ? 'fill-current' : ''}`} />
                  </button>

                  <div className="text-[#a893a1] group-hover:text-[#2b1b24] dark:group-hover:text-white transition-colors pl-1">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Sheet Modal */}
      <MatchDetailSheet
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onToggleShortlist={(id, cur) => {
          toggleShortlist(id, cur);
          if (selectedMatch && selectedMatch.id === id) {
            setSelectedMatch({ ...selectedMatch, shortlisted: !cur });
          }
        }}
        onSaveNote={(id, note) => {
          updateNote(id, note);
          if (selectedMatch && selectedMatch.id === id) {
            setSelectedMatch({ ...selectedMatch, note });
          }
        }}
        onDeleteMatch={async (id) => {
          const ok = await deleteMatch(id);
          if (ok && selectedMatch?.id === id) {
            setSelectedMatch(null);
          }
          return ok;
        }}
      />
    </div>
  );
};
