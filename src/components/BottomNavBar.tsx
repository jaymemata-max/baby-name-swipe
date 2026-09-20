"use client";

import React from 'react';
import { Layers, Heart, Settings } from 'lucide-react';

export type NavTab = 'deck' | 'matches' | 'settings';

interface BottomNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  matchesBadgeCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  matchesBadgeCount,
}) => {
  return (
    <nav
      id="bottom-nav-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-t border-[#ebdbd3] dark:border-[#382b35] px-4 pb-[env(safe-area-inset-bottom,8px)] pt-2"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Swipe Deck Tab */}
        <button
          type="button"
          id="nav-tab-deck"
          onClick={() => onSelectTab('deck')}
          className={`flex-1 flex flex-col items-center py-1.5 transition-colors ${
            currentTab === 'deck'
              ? 'text-[#e25567] dark:text-[#ff6a80] font-bold'
              : 'text-[#7d6575] dark:text-[#a895a2] hover:text-[#2b1b24]'
          }`}
          aria-label="Swipe baby names"
        >
          <Layers className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium tracking-wide">Swipe</span>
        </button>

        {/* Our List (Matches) Tab */}
        <button
          type="button"
          id="nav-tab-matches"
          onClick={() => onSelectTab('matches')}
          className={`flex-1 flex flex-col items-center py-1.5 relative transition-colors ${
            currentTab === 'matches'
              ? 'text-[#e25567] dark:text-[#ff6a80] font-bold'
              : 'text-[#7d6575] dark:text-[#a895a2] hover:text-[#2b1b24]'
          }`}
          aria-label="View matches list"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 mb-1 ${currentTab === 'matches' ? 'fill-current' : ''}`} />
            {matchesBadgeCount > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#e25567] text-white animate-pulse">
                {matchesBadgeCount > 99 ? '99+' : matchesBadgeCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium tracking-wide">Our list</span>
        </button>

        {/* Settings Tab */}
        <button
          type="button"
          id="nav-tab-settings"
          onClick={() => onSelectTab('settings')}
          className={`flex-1 flex flex-col items-center py-1.5 transition-colors ${
            currentTab === 'settings'
              ? 'text-[#e25567] dark:text-[#ff6a80] font-bold'
              : 'text-[#7d6575] dark:text-[#a895a2] hover:text-[#2b1b24]'
          }`}
          aria-label="Settings and profile"
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium tracking-wide">Settings</span>
        </button>
      </div>
    </nav>
  );
};
