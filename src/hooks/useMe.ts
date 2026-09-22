"use client";

import { useState, useEffect, useCallback } from 'react';
import { MeResponse } from '@/lib/types';

export function useMe() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await fetch('/api/me');
      if (res.status === 401) {
        setErrorCode('unauthorized');
        setError('Please sign in to continue.');
        setData(null);
        return;
      }
      if (res.status === 409) {
        const json = await res.json().catch(() => ({}));
        setErrorCode(json.code || 'no_couple');
        setError(json.error || 'No couple found yet.');
        setData({
          profile: json.profile || null,
          couple: null,
          partner: null,
          stats: null,
        });
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP error ${res.status}`);
      }
      const json: MeResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const updateProfile = async (display_name?: string, avatar_emoji?: string) => {
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name, avatar_emoji }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update profile');
      }
      const json = await res.json();
      if (json.profile) setData((current) => current ? { ...current, profile: json.profile } : current);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error' };
    }
  };

  const createCouple = async (title?: string) => {
    try {
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create couple');
      }
      await fetchMe();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error' };
    }
  };

  const joinCouple = async (invite_code: string) => {
    try {
      const res = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          code: err.code,
          error: err.error || 'Failed to join couple',
        };
      }
      await fetchMe();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error' };
    }
  };

  const updateCouple = async (title?: string, due_date?: string | null) => {
    try {
      const res = await fetch('/api/couple', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, due_date }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update couple');
      }
      const json = await res.json();
      if (json.couple) setData((current) => current ? { ...current, couple: json.couple } : current);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error' };
    }
  };

  const signOut = async () => {
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Could not sign out.');
      }
      setData(null);
      setErrorCode('unauthorized');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Could not sign out.' };
    }
  };

  return {
    data,
    user: data?.profile || null,
    profile: data?.profile || null,
    couple: data?.couple || null,
    partner: data?.partner || null,
    stats: data?.stats || null,
    loading,
    error,
    errorCode,
    refresh: fetchMe,
    refreshMe: fetchMe,
    updateProfile,
    createCouple,
    joinCouple,
    updateCouple,
    signOut,
  };
}
