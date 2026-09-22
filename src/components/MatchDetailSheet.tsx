"use client";

import type { MatchWithName } from '@/lib/types';

import React, { useEffect, useState } from 'react';
import { X, Heart, Star, Trash2, Check, AlertTriangle, MessageSquare } from 'lucide-react';
import { nameGenderStyles } from '@/lib/nameGenderStyles';

interface MatchDetailSheetProps {
  match: MatchWithName | null;
  onClose: () => void;
  onToggleShortlist: (id: string, current: boolean) => void;
  onSaveNote: (id: string, note: string | null) => void;
  onDeleteMatch: (id: string) => Promise<boolean>;
}

export const MatchDetailSheet: React.FC<MatchDetailSheetProps> = ({
  match,
  onClose,
  onToggleShortlist,
  onSaveNote,
  onDeleteMatch,
}) => {
  // Hooks run before the early return: bailing out above them would render
  // fewer hooks on the closing render and crash React.
  const [note, setNote] = useState(match?.note ?? '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Opening the sheet on a different match must load that match's note.
  useEffect(() => {
    setNote(match?.note ?? '');
    setNoteSaved(false);
    setConfirmDelete(false);
  }, [match?.id, match?.note]);

  if (!match) return null;

  const handleNoteBlur = async () => {
    const trimmed = note.trim() ? note.trim() : null;
    if (trimmed !== match.note) {
      setIsSavingNote(true);
      await onSaveNote(match.id, trimmed);
      setIsSavingNote(false);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const ok = await onDeleteMatch(match.id);
    setIsDeleting(false);
    if (ok) {
      onClose();
    }
  };

  const genderStyle = nameGenderStyles[match.name.gender];

  const dateFormatted = new Date(match.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        id="match-detail-sheet"
        className="relative w-full max-w-lg bg-[#fff7f4] dark:bg-[#1f161d] rounded-t-3xl border-t border-[#ebdbd3] dark:border-[#3b2b36] p-6 shadow-2xl z-10 max-h-[90dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebdcd4] dark:border-[#33242e]">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${genderStyle.badge}`}>
              {genderStyle.label}
            </span>
            {match.is_love && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                <Heart className="w-3 h-3 fill-current" />
                Both Loved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-detail-shortlist"
              onClick={() => onToggleShortlist(match.id, match.shortlisted)}
              aria-label={match.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                match.shortlisted
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
                  : 'bg-white dark:bg-[#2c202a] text-[#7d6575] hover:text-amber-500'
              }`}
            >
              <Star className={`w-5 h-5 ${match.shortlisted ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#2c202a] text-[#735e6c] dark:text-[#beabb8] hover:text-[#2b1b24]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mt-5 text-center">
          <h2 className={`text-4xl font-serif-name font-bold ${genderStyle.name}`}>
            {match.name.value}
          </h2>
          {match.name.meaning && <p className="mt-2 text-base text-[#5c4755] dark:text-[#cfbecc] italic max-w-sm mx-auto">
            &ldquo;{match.name.meaning}&rdquo;
          </p>}
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-[#806978] dark:text-[#a895a2]">
            {match.name.origin && <><span>Origin: {match.name.origin}</span><span>•</span></>}
            <span>Matched on {dateFormatted}</span>
          </div>
        </div>

        {/* Language chips */}
        {match.name.works_in && match.name.works_in.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#261c24] border border-[#ebdcd4] dark:border-[#382b35]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#7e6776] dark:text-[#a895a2] mb-2">
              Pronounceable in
            </div>
            <div className="flex flex-wrap gap-2">
              {match.name.works_in.map((l) => (
                <span
                  key={l}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#f7ebe6] dark:bg-[#33242f] text-[#55404d] dark:text-[#d1c2cc]"
                >
                  {l.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shared Note */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="match-note-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7e6776] dark:text-[#a895a2]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Shared Note
            </label>
            {noteSaved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
          <textarea
            id="match-note-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add thoughts, middle name ideas, or family associations..."
            className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#261c24] border border-[#ebdcd4] dark:border-[#382b35] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567] placeholder:text-[#9e8898]"
          />
        </div>

        {/* Rule Out Name Section */}
        <div className="mt-8 pt-4 border-t border-[#ebdcd4] dark:border-[#33242e]">
          {!confirmDelete ? (
            <button
              type="button"
              id="btn-rule-out-match"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Rule this one out for both of us
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900/80">
              <div className="flex items-start gap-2.5 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                  Are you sure? This will remove <strong>{match.name.value}</strong> from both of your lists and won&apos;t be dealt again.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-confirm-delete-match"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
                >
                  {isDeleting ? 'Ruling out...' : 'Yes, rule out'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white dark:bg-[#2c202a] text-[#4d3a47] dark:text-[#ddd] font-semibold text-xs border border-[#ddd] dark:border-[#444]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
