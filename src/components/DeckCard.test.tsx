import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeckCard } from '@/components/DeckCard';
import { makeDeckCard } from '@/test/factories';

describe('DeckCard gender colors', () => {
  it.each([
    ['boy', 'bg-[#eef6ff]', 'bg-[#d8eaff]'],
    ['girl', 'bg-[#fff0f6]', 'bg-[#ffe0ed]'],
    ['unisex', 'bg-[#f5f0ff]', 'bg-[#e9ddff]'],
  ] as const)('%s names have a distinct card and badge', (gender, cardColor, badgeColor) => {
    render(<DeckCard card={makeDeckCard(1, { gender })} isTop stackIndex={0} onSwipe={vi.fn()} />);

    expect(document.getElementById('deck-card-name-1')).toHaveClass(cardColor);
    expect(screen.getByText(gender === 'boy' ? 'Boy' : gender === 'girl' ? 'Girl' : 'Unisex')).toHaveClass(badgeColor);
  });

  it('does not show empty meaning quotes for names without verified metadata', () => {
    render(<DeckCard card={makeDeckCard(1, { meaning: null, origin: null })} isTop stackIndex={0} onSwipe={vi.fn()} />);

    expect(screen.queryByText('Universal')).not.toBeInTheDocument();
    expect(screen.queryByText('“”')).not.toBeInTheDocument();
  });

  it('shows the given name together with the family name', () => {
    render(<DeckCard card={makeDeckCard(1)} isTop stackIndex={0} onSwipe={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Name 1 Mata' })).toBeInTheDocument();
  });
});
