"use client";

import React from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { DeckFilterPreferences } from '@/lib/types';
import { NameLanguage } from '@/lib/supabase/database.types';

interface DeckFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DeckFilterPreferences;
  onUpdateFilters: (filters: Partial<DeckFilterPreferences>) => void;
}

const LANGUAGES: { id: NameLanguage; name: string; nativeName: string; flag: string }[] = [
  { id: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export const DeckFiltersSheet: React.FC<DeckFiltersSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
}) => {
  if (!isOpen) return null;

  const toggleLanguage = (lang: NameLanguage) => {
    let updated: NameLanguage[];
    if (filters.languages.includes(lang)) {
      // Don't allow unselecting all
      if (filters.languages.length <= 1) return;
      updated = filters.languages.filter((l) => l !== lang);
    } else {
      updated = [...filters.languages, lang];
    }
    onUpdateFilters({ languages: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div
        id="sheet-deck-filters"
        className="relative w-full max-w-lg bg-[#fff7f4] dark:bg-[#1f161d] rounded-t-3xl border-t border-[#ebdbd3] dark:border-[#3b2b36] p-6 shadow-2xl z-10 max-h-[85dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebdcd4] dark:border-[#33242e]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#c05835] dark:text-[#ea7a56]" />
            <h3 className="text-xl font-bold text-[#2b1b24] dark:text-[#f5edf2]">Deck Filters</h3>
          </div>
          <button
            type="button"
            id="btn-close-filters"
            onClick={onClose}
            aria-label="Close filters"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#2c202a] text-[#6d5765] dark:text-[#beabb8] hover:text-[#2b1b24] shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gender Selection */}
        <div className="mt-6">
          <label className="block text-sm font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-3">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'all', label: 'Both' },
                { id: 'boy', label: 'Boys' },
                { id: 'girl', label: 'Girls' },
              ] as const
            ).map((opt) => {
              const active = filters.gender === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  id={`filter-gender-${opt.id}`}
                  onClick={() => onUpdateFilters({ gender: opt.id })}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 border ${
                    active
                      ? 'bg-white dark:bg-[#2c202a] border-[#c05835] dark:border-[#ea7a56] text-[#2b1b24] dark:text-white shadow-xs'
                      : 'bg-[#f4e8e1]/70 dark:bg-[#251b22] border-transparent text-[#6e5966] dark:text-[#a895a2] hover:bg-[#ede0d8]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Languages Selection */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6]">
              Languages
            </label>
            <span className="text-xs text-[#8c7483] dark:text-[#998794]">
              Selected: {filters.languages.length}
            </span>
          </div>
          <p className="text-xs text-[#6e5966] dark:text-[#bda9b7] mb-3">
            Only names we can all pronounce.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {LANGUAGES.map((lang) => {
              const selected = filters.languages.includes(lang.id);
              return (
                <button
                  key={lang.id}
                  type="button"
                  id={`filter-lang-${lang.id}`}
                  onClick={() => toggleLanguage(lang.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-150 ${
                    selected
                      ? 'bg-white dark:bg-[#2c202a] border-[#e25567] dark:border-[#ff6a80] shadow-xs'
                      : 'bg-[#f4e8e1]/60 dark:bg-[#241a21] border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <div>
                      <div className="text-sm font-bold text-[#2b1b24] dark:text-[#f5edf2]">
                        {lang.name}
                      </div>
                      <div className="text-[11px] text-[#735e6c] dark:text-[#a693a0]">
                        {lang.nativeName}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      selected
                        ? 'bg-[#e25567] border-[#e25567] text-white'
                        : 'border-[#c9b7ae] dark:border-[#4d3a48]'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 pt-4 border-t border-[#ebdcd4] dark:border-[#33242e]">
          <button
            type="button"
            id="btn-apply-filters"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-md transition-all active:scale-[0.99]"
          >
            Apply & Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
};
