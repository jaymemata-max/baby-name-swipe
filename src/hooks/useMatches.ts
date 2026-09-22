"use client";

import { useState, useEffect, useCallback } from 'react';
import { MatchesResponse, MatchWithName } from '@/lib/types';

export function useMatches(genderFilter: 'all' | 'boy' | 'girl' | 'unisex' = 'all', shortlistedOnly = false) {
  const [matches, setMatches] = useState<MatchWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (genderFilter !== 'all') {
        params.append('gender', genderFilter);
      }
      if (shortlistedOnly) {
        params.append('shortlisted', 'true');
      }

      const res = await fetch(`/api/matches?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP error ${res.status}`);
      }
      const data: MatchesResponse = await res.json();
      setMatches(data.matches || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [genderFilter, shortlistedOnly]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const toggleShortlist = async (matchId: string, currentStatus: boolean) => {
    // Optimistic toggle
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, shortlisted: !currentStatus } : m))
    );

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortlisted: !currentStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update shortlist status');
      }
    } catch (err) {
      console.error(err);
      // Rollback
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, shortlisted: currentStatus } : m))
      );
      setError('Could not update shortlist status');
    }
  };

  const updateNote = async (matchId: string, note: string | null) => {
    // Optimistic note update
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, note } : m))
    );

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        throw new Error('Failed to save note');
      }
    } catch (err) {
      console.error(err);
      setError('Could not save note');
    }
  };

  const deleteMatch = async (matchId: string) => {
    // Optimistic removal
    const previous = [...matches];
    setMatches((prev) => prev.filter((m) => m.id !== matchId));

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to rule out match');
      }
      return true;
    } catch (err) {
      console.error(err);
      setMatches(previous);
      setError('Could not rule out name');
      return false;
    }
  };

  return {
    matches,
    loading,
    error,
    refresh: fetchMatches,
    toggleShortlist,
    updateNote,
    deleteMatch,
  };
}
