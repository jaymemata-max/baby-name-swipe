"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMe } from '@/hooks/useMe';
import { SignInScreen } from '@/components/SignInScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { DeckScreen } from '@/components/DeckScreen';
import { MatchesList } from '@/components/MatchesList';
import { SettingsTab } from '@/components/SettingsTab';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { MatchCelebrationModal } from '@/components/MatchCelebrationModal';
import { MatchToast } from '@/components/MatchToast';
import { SwipeResponse } from '@/lib/types';
import { Heart } from 'lucide-react';

export function AppShell() {
  const {
    user,
    profile,
    couple,
    partner,
    stats,
    loading,
    error,
    errorCode,
    refresh,
    updateProfile,
    updateCouple,
    createCouple,
    joinCouple,
    signOut,
  } = useMe();

  const [currentTab, setCurrentTab] = useState<NavTab>('deck');
  const [matchCelebration, setMatchCelebration] = useState<SwipeResponse | null>(null);
  const [matchesBadgeCount, setMatchesBadgeCount] = useState(0);

  // When switching to the 'matches' tab, clear the unread badge
  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'matches') {
      setMatchesBadgeCount(0);
    }
    setCurrentTab(tab);
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#fff7f4] dark:bg-[#191117] text-[#2b1b24] dark:text-[#f5edf2]">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 animate-pulse mb-4">
          <Heart className="w-8 h-8 fill-white stroke-none" />
        </div>
        <h1 className="text-2xl font-serif-name font-bold">Baby Names</h1>
        <p className="text-xs text-[#7e6776] dark:text-[#a895a2] mt-1">
          Loading your shared deck...
        </p>
      </div>
    );
  }

  // A 401 is not a failure, it is the signed-out state handled just below.
  // Anything else means the app could not load and the user needs to know.
  if (error && errorCode !== 'unauthorized' && errorCode !== 'no_couple') {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 px-8 text-center bg-[#fff7f4] dark:bg-[#191117] text-[#2b1b24] dark:text-[#f5edf2]">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
          <Heart className="w-7 h-7 text-rose-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Could not load the app</h1>
          <p className="text-sm text-[#6e5966] dark:text-[#bda9b7] mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold"
        >
          Try again
        </button>
      </div>
    );
  }

  // 1. Signed out -> Sign In Screen
  if (!user) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-[#fff7f4] dark:bg-[#191117] text-[#2b1b24] dark:text-[#f5edf2] overflow-y-auto">
        <SignInScreen onSignedIn={refresh} />
      </div>
    );
  }

  // 2. Signed in but no couple -> Onboarding Screen
  if (!couple) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-[#fff7f4] dark:bg-[#191117] text-[#2b1b24] dark:text-[#f5edf2] overflow-y-auto">
        <OnboardingScreen
          onCoupleReady={refresh}
          onCreateCouple={createCouple}
          onJoinCouple={joinCouple}
        />
      </div>
    );
  }

  // 3. Signed in and couple exists -> Main App Experience
  return (
    <div
      id="app-root"
      className="h-[100dvh] w-full flex flex-col bg-[#fff7f4] dark:bg-[#191117] text-[#2b1b24] dark:text-[#f5edf2] overflow-hidden select-none"
    >
      {/* Active Screen Tab */}
      {currentTab === 'deck' && (
        <DeckScreen
          profile={profile}
          couple={couple}
          partner={partner}
          stats={stats}
          onMatchCelebration={(celebrationData) => setMatchCelebration(celebrationData)}
          onRefreshMe={refresh}
        />
      )}

      {currentTab === 'matches' && (
        <MatchesList onGoToDeck={() => handleSelectTab('deck')} />
      )}

      {currentTab === 'settings' && (
        <SettingsTab
          profile={profile}
          couple={couple}
          partner={partner}
          stats={stats}
          onUpdateProfile={updateProfile}
          onUpdateCouple={updateCouple}
          onSignOut={signOut}
        />
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        matchesBadgeCount={matchesBadgeCount}
      />

      {/* Live Toast for Realtime Match Notifications */}
      <MatchToast
        coupleId={couple.id}
        partnerName={partner?.display_name || 'Your partner'}
        onNavigateToMatches={() => handleSelectTab('matches')}
        onMatchReceived={() => {
          if (currentTab !== 'matches') {
            setMatchesBadgeCount((prev) => prev + 1);
          }
        }}
      />

      {/* Match Celebration Takeover Modal (when matched_now is true) */}
      {matchCelebration && (
        <MatchCelebrationModal
          matchData={matchCelebration}
          myProfile={profile}
          partnerProfile={partner}
          onDismiss={() => setMatchCelebration(null)}
          onViewMatches={() => {
            setMatchCelebration(null);
            handleSelectTab('matches');
          }}
        />
      )}
    </div>
  );
}
