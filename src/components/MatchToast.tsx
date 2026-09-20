"use client";

import React, { useEffect, useState } from 'react';
import { Heart, X, ChevronRight } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface MatchToastProps {
  coupleId?: string;
  partnerName?: string;
  onNavigateToMatches: () => void;
  onMatchReceived: () => void;
}

interface ToastPayload {
  nameId: string;
  nameValue: string;
  isLove: boolean;
}

export const MatchToast: React.FC<MatchToastProps> = ({
  coupleId,
  partnerName = 'Your partner',
  onNavigateToMatches,
  onMatchReceived,
}) => {
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);

  // Background tab title notification
  useEffect(() => {
    const originalTitle = document.title;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        document.title = originalTitle;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Subscribe to Supabase Realtime / EventBus on the matches table
  useEffect(() => {
    if (!coupleId) return;

    const supabase = createSupabaseBrowserClient();

    // Helper to fetch the matched name and trigger notification
    const handleNewMatch = async (nameId: string, isLove: boolean) => {
      try {
        const res = await fetch(`/api/matches?shortlisted=false`);
        if (res.ok) {
          const data = await res.json();
          const found = data.matches?.find((m: { name_id: string }) => m.name_id === nameId);
          const nameValue = found?.name?.value || 'A new name';

          setActiveToast({
            nameId,
            nameValue,
            isLove,
          });

          onMatchReceived();

          // If in background, update document.title
          if (document.visibilityState === 'hidden') {
            document.title = `🔔 Match: ${nameValue}! — Baby Names`;
          }

          // Request notification permission after first match as requested in spec
          if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') {
                new Notification(`New match: ${nameValue}!`, {
                  body: `${partnerName} also loved ${nameValue}!`,
                  icon: '/icon.svg',
                });
              }
            });
          } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`New match: ${nameValue}!`, {
              body: `${partnerName} also said yes to ${nameValue}!`,
              icon: '/icon.svg',
            });
          }
        }
      } catch (err) {
        console.error('Failed to resolve realtime match payload', err);
      }
    };

    // Realtime channel
    const channel = supabase
      .channel(`matches:${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const row = payload.new as { name_id?: string; is_love?: boolean };
          if (row?.name_id) {
            handleNewMatch(row.name_id, !!row.is_love);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, partnerName, onMatchReceived]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div
      id="live-match-toast"
      onClick={() => {
        setActiveToast(null);
        onNavigateToMatches();
      }}
      className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-50 p-3.5 rounded-2xl bg-white/95 dark:bg-[#2a1d27]/95 backdrop-blur-md border border-rose-200 dark:border-rose-900/60 shadow-xl flex items-center justify-between cursor-pointer animate-in slide-in-from-top-4 duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#e25567] dark:text-[#ff6a80] uppercase tracking-wider">
              {activeToast.isLove ? 'Double Love!' : 'New Match!'}
            </span>
            <span className="text-[11px] text-[#786171] dark:text-[#a693a0]">
              with {partnerName}
            </span>
          </div>
          <div className="text-base font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
            {activeToast.nameValue}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-[#e25567] dark:text-[#ff6a80] hidden sm:inline">
          View
        </span>
        <ChevronRight className="w-5 h-5 text-[#91798a] dark:text-[#beabb8]" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          className="p-1 text-[#8f7888] hover:text-[#2b1b24] ml-1"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
