"use client";

import React, { useCallback, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { DeckCard as DeckCardType, SwipeDirection } from '@/lib/supabase/database.types';
import { Sparkles, Heart, Check, X } from 'lucide-react';

interface DeckCardProps {
  card: DeckCardType;
  isTop: boolean;
  stackIndex: number; // 0 = top, 1 = behind, 2 = bottom
  onSwipe: (dir: SwipeDirection) => void;
}

const SWIPE_THRESHOLD_X = 90;
const SWIPE_THRESHOLD_Y = 85;

export const DeckCard: React.FC<DeckCardProps> = ({ card, isTop, stackIndex, onSwipe }) => {
  // Spring animation state for the card
  const [{ x, y, rot, scale }, api] = useSpring(() => ({
    x: 0,
    y: stackIndex === 0 ? 0 : stackIndex === 1 ? 12 : 24,
    rot: 0,
    scale: stackIndex === 0 ? 1 : stackIndex === 1 ? 0.95 : 0.90,
    config: { friction: 35, tension: 280 },
  }));

  // Update card offset if its stack position changes
  useEffect(() => {
    if (!isTop) {
      api.start({
        x: 0,
        y: stackIndex === 1 ? 12 : 24,
        rot: 0,
        scale: stackIndex === 1 ? 0.95 : 0.90,
      });
    }
  }, [stackIndex, isTop, api]);

  const flyOut = useCallback((dir: SwipeDirection) => {
    let destX = 0;
    let destY = 0;
    let destRot = 0;

    if (dir === 'like') {
      destX = 450;
      destRot = 20;
    } else if (dir === 'pass') {
      destX = -450;
      destRot = -20;
    } else if (dir === 'love') {
      destY = -550;
      destRot = 0;
    }

    api.start({
      x: destX,
      y: destY,
      rot: destRot,
      scale: 1,
      config: { friction: 30, tension: 200 },
      onRest: () => {
        onSwipe(dir);
      },
    });
  }, [api, onSwipe]);

  // Keyboard navigation support for accessibility
  useEffect(() => {
    if (!isTop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if an input or textarea is active
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        flyOut('like');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        flyOut('pass');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        flyOut('love');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTop, flyOut]);


  // Drag gesture setup
  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] }) => {
      if (!isTop) return;

      const triggerLove = my < -SWIPE_THRESHOLD_Y || (my < -40 && vy > 0.5 && dy < 0);
      const triggerLike = mx > SWIPE_THRESHOLD_X || (mx > 40 && vx > 0.5 && dx > 0);
      const triggerPass = mx < -SWIPE_THRESHOLD_X || (mx < -40 && vx > 0.5 && dx < 0);

      if (!down) {
        if (triggerLove && Math.abs(my) > Math.abs(mx)) {
          flyOut('love');
          return;
        }
        if (triggerLike) {
          flyOut('like');
          return;
        }
        if (triggerPass) {
          flyOut('pass');
          return;
        }

        // Snap back
        api.start({ x: 0, y: 0, rot: 0, scale: 1 });
      } else {
        // Dragging
        api.start({
          x: mx,
          y: my,
          rot: mx / 14,
          scale: 1.02,
          immediate: true,
        });
      }
    },
    { enabled: isTop }
  );

  // Gender colors & badges
  const genderBadge = (() => {
    if (card.gender === 'boy') {
      return {
        label: 'Boy',
        bg: 'bg-[#fbf0eb] dark:bg-[#38231a]',
        text: 'text-[#c05835] dark:text-[#ea7a56]',
        border: 'border-[#ebd4c7] dark:border-[#523326]',
      };
    }
    if (card.gender === 'girl') {
      return {
        label: 'Girl',
        bg: 'bg-[#faebf1] dark:bg-[#3a1c27]',
        text: 'text-[#c4436c] dark:text-[#f0618e]',
        border: 'border-[#ebd0db] dark:border-[#542738]',
      };
    }
    return {
      label: 'Unisex',
      bg: 'bg-[#fdf4eb] dark:bg-[#362818]',
      text: 'text-[#b36b28] dark:text-[#e59f48]',
      border: 'border-[#ebdbca] dark:border-[#4d3923]',
    };
  })();

  const languageFlags: Record<string, { label: string; flag: string }> = {
    nl: { label: 'NL', flag: '🇳🇱' },
    en: { label: 'EN', flag: '🇬🇧' },
    es: { label: 'ES', flag: '🇪🇸' },
    fr: { label: 'FR', flag: '🇫🇷' },
  };

  return (
    <animated.div
      {...(isTop ? bind() : {})}
      className={`absolute inset-0 w-full h-full rounded-3xl p-6 flex flex-col justify-between select-none shadow-lg border card-touch ${
        isTop ? 'cursor-grab active:cursor-grabbing z-30' : stackIndex === 1 ? 'z-20 pointer-events-none' : 'z-10 pointer-events-none'
      } bg-white dark:bg-[#231b21] border-[#f0ded7] dark:border-[#382b35]`}
      style={{
        x,
        y,
        scale,
        rotate: rot.to((r) => `${r}deg`),
        boxShadow: isTop
          ? '0 12px 36px -4px rgba(43, 27, 36, 0.12), 0 4px 16px -2px rgba(43, 27, 36, 0.06)'
          : '0 4px 12px rgba(43, 27, 36, 0.05)',
      }}
      id={`deck-card-${card.id}`}
    >
      {/* Dynamic Overlay Badges that fade in with drag distance */}
      {isTop && (
        <>
          {/* LIKE overlay (Right drag) */}
          <animated.div
            style={{
              opacity: x.to((val) => Math.max(0, Math.min(1, val / 65))),
            }}
            className="absolute top-8 right-8 z-40 px-5 py-2 rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 font-bold tracking-wider text-xl uppercase shadow-sm pointer-events-none rotate-12 flex items-center gap-1.5"
          >
            <Check className="w-5 h-5 stroke-[3]" /> YES
          </animated.div>

          {/* PASS overlay (Left drag) */}
          <animated.div
            style={{
              opacity: x.to((val) => Math.max(0, Math.min(1, -val / 65))),
            }}
            className="absolute top-8 left-8 z-40 px-5 py-2 rounded-2xl border-2 border-rose-500 bg-rose-50/90 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 font-bold tracking-wider text-xl uppercase shadow-sm pointer-events-none -rotate-12 flex items-center gap-1.5"
          >
            <X className="w-5 h-5 stroke-[3]" /> NO
          </animated.div>

          {/* LOVE overlay (Up drag) */}
          <animated.div
            style={{
              opacity: y.to((val) => Math.max(0, Math.min(1, -val / 55))),
            }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-6 py-2.5 rounded-2xl border-2 border-pink-500 bg-pink-50/95 dark:bg-pink-950/95 text-pink-600 dark:text-pink-300 font-bold tracking-wider text-xl uppercase shadow-sm pointer-events-none flex items-center gap-2"
          >
            <Heart className="w-6 h-6 fill-current" /> LOVE IT!
          </animated.div>
        </>
      )}

      {/* Card Header: Gender & Custom status */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${genderBadge.bg} ${genderBadge.text} ${genderBadge.border}`}>
            {genderBadge.label}
          </span>
          {card.is_custom && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Custom
            </span>
          )}
        </div>

        {/* Origin Pill */}
        <span className="text-xs font-medium text-[#6e5966] dark:text-[#b9a6b2] bg-[#fbf5f2] dark:bg-[#2c2229] px-3 py-1 rounded-full">
          {card.origin || 'Universal'}
        </span>
      </div>

      {/* Hero Name & Meaning Center */}
      <div className="my-auto text-center px-2 py-4">
        <h2 className="text-5xl sm:text-6xl font-serif-name font-bold tracking-tight text-[#2b1b24] dark:text-[#f5edf2] leading-tight break-words">
          {card.value}
        </h2>

        <div className="mt-4 max-w-[280px] mx-auto">
          <p className="text-lg text-[#55404d] dark:text-[#d3c2cd] font-normal leading-snug italic">
            &ldquo;{card.meaning}&rdquo;
          </p>
        </div>
      </div>

      {/* Card Footer: Works In Language Chips */}
      <div className="w-full pt-4 border-t border-[#f4e6e0] dark:border-[#332630]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[#826a79] dark:text-[#9e8b98]">
            Works naturally in:
          </span>
          <div className="flex items-center gap-1.5">
            {card.works_in && card.works_in.map((lang) => {
              const info = languageFlags[lang] || { label: lang.toUpperCase(), flag: '' };
              return (
                <span
                  key={lang}
                  className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#f7ebe6] dark:bg-[#2d222b] text-[#55404d] dark:text-[#d1c2cc]"
                  title={`Pronounceable in ${info.label}`}
                >
                  {info.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </animated.div>
  );
};
