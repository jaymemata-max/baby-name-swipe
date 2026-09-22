"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { BabyName, NameGender } from '@/lib/supabase/database.types';
import { nameGenderStyles } from '@/lib/nameGenderStyles';

interface AddNameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNameAdded?: () => void;
}

export const AddNameSheet: React.FC<AddNameSheetProps> = ({
  isOpen,
  onClose,
  onNameAdded,
}) => {
  const [value, setValue] = useState('');
  const [gender, setGender] = useState<NameGender>('unisex');
  const [origin, setOrigin] = useState('');
  const [meaning, setMeaning] = useState('');
  const [customNames, setCustomNames] = useState<BabyName[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCustomNames = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/names?scope=custom');
      if (res.ok) {
        const json = await res.json();
        setCustomNames(json.names || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomNames();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: value.trim(),
          gender,
          origin: origin.trim() || undefined,
          meaning: meaning.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || `"${value.trim()}" is already in the catalogue!`);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add name');
      }

      setSuccessMsg(`"${value.trim()}" is added to both of your decks! Remember, you both still need to swipe it.`);
      setValue('');
      setOrigin('');
      setMeaning('');
      await fetchCustomNames();
      if (onNameAdded) onNameAdded();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error adding name');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/names/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomNames((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        id="add-name-sheet"
        className="relative w-full max-w-lg bg-[#fff7f4] dark:bg-[#1f161d] rounded-t-3xl border-t border-[#ebdbd3] dark:border-[#3b2b36] p-6 shadow-2xl z-10 max-h-[90dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebdcd4] dark:border-[#33242e]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-bold text-[#2b1b24] dark:text-[#f5edf2]">Add Your Own Name</h3>
          </div>

          <button
            type="button"
            id="btn-close-add-name"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#2c202a] text-[#735e6c] dark:text-[#beabb8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-1.5">
              Name *
            </label>
            <input
              type="text"
              id="input-add-name-value"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Mateo, Juliette, Rowan..."
              className="w-full py-3 px-4 rounded-xl bg-white dark:bg-[#261c24] border border-[#ebdcd4] dark:border-[#382b35] text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567]"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-1.5">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'boy', label: 'Boy' },
                  { id: 'girl', label: 'Girl' },
                  { id: 'unisex', label: 'Unisex' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  id={`btn-select-gender-${g.id}`}
                  onClick={() => setGender(g.id)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    gender === g.id
                      ? nameGenderStyles[g.id].selected
                      : 'bg-[#f4e8e1]/60 dark:bg-[#251b22] border-transparent text-[#735e6c] dark:text-[#a895a2]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-1.5">
                Origin (Optional)
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Spanish, Dutch..."
                className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#261c24] border border-[#ebdcd4] dark:border-[#382b35] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-1.5">
                Meaning (Optional)
              </label>
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="e.g. Light of the dawn"
                className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#261c24] border border-[#ebdcd4] dark:border-[#382b35] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            id="btn-submit-add-name"
            disabled={submitting || !value.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Adding...' : 'Add to Both Decks'}
          </button>
        </form>

        {/* List of custom names added by this user */}
        <div className="mt-8 pt-5 border-t border-[#ebdcd4] dark:border-[#33242e]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-3">
            Names You Have Added ({customNames.length})
          </h4>

          {loadingList ? (
            <div className="text-xs text-[#8c7483] py-2">Loading your custom names...</div>
          ) : customNames.length === 0 ? (
            <p className="text-xs text-[#8c7483] dark:text-[#9e8b98] italic">
              You haven&apos;t added any custom names yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {customNames.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#261c24] border border-[#ebdcd4] dark:border-[#382b35] text-sm"
                >
                  <div>
                    <span className="font-bold text-[#2b1b24] dark:text-[#f5edf2]">{n.value}</span>
                    <span className={`text-xs font-semibold ml-2 ${nameGenderStyles[n.gender].name}`}>
                      ({nameGenderStyles[n.gender].label})
                    </span>
                  </div>
                  <button
                    type="button"
                    id={`btn-delete-custom-name-${n.id}`}
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    aria-label={`Delete custom name ${n.value}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
