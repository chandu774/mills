import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '@/App';
import { Button } from '@/components/ui/Button';
import { RatingBadge } from '@/components/common/RatingBadge';
import { VariantCard } from '@/components/common/VariantCard';
import { getRankTier, formatVariantName, formatTimeControl, cn } from '@/lib/utils';

describe('Phase 1: Foundation & Utilities', () => {
  it('correctly calculates rank tiers based on ELO rating', () => {
    expect(getRankTier(2150).name).toBe('Grandmaster');
    expect(getRankTier(1850).name).toBe('Master');
    expect(getRankTier(1650).name).toBe('Expert');
    expect(getRankTier(1450).name).toBe('Adept');
    expect(getRankTier(1250).name).toBe('Challenger');
    expect(getRankTier(1000).name).toBe('Novice');
  });

  it('formats variant names and time controls properly', () => {
    expect(formatVariantName('MILLS_3')).toBe('3-Piece Mills');
    expect(formatVariantName('MILLS_6')).toBe('6-Piece Mills');
    expect(formatVariantName('MILLS_9')).toBe("9-Piece Men's Morris");

    expect(formatTimeControl('3_MIN')).toBe('3 min');
    expect(formatTimeControl('UNTIMED')).toBe('Untimed');
  });

  it('merges tailwind class names properly with cn()', () => {
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
  });
});

describe('Phase 1: UI Primitives', () => {
  it('renders Button with primary variant and reacts to clicks', () => {
    let clicked = false;
    render(
      <Button variant="primary" onClick={() => { clicked = true; }}>
        PLAY NOW
      </Button>
    );

    const button = screen.getByRole('button', { name: /PLAY NOW/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(clicked).toBe(true);
  });

  it('renders RatingBadge with rating and rank tier label', () => {
    render(<RatingBadge rating={1516} showTier />);
    expect(screen.getByText('1516')).toBeInTheDocument();
    expect(screen.getByText(/Adept/i)).toBeInTheDocument();
  });

  it('renders VariantCard and notifies on selection', () => {
    let selected = '';
    render(
      <VariantCard
        variant="MILLS_9"
        isSelected={false}
        onSelect={(v) => { selected = v; }}
      />
    );

    const heading = screen.getByText("9-Piece Men's Morris");
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();

    fireEvent.click(heading);
    expect(selected).toBe('MILLS_9');
  });
});

describe('Phase 1: Platform Navigation & Views', () => {
  it('renders Home page by default with key CTA and rating snapshot', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Play Mills Online/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose Your Variant/i)).toBeInTheDocument();
  });

  it('renders Play page with all 3 variants when navigating to /play', () => {
    render(
      <MemoryRouter initialEntries={['/play']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Play Mills')).toBeInTheDocument();
    expect(screen.getByText('3-Piece Mills')).toBeInTheDocument();
    expect(screen.getByText('6-Piece Mills')).toBeInTheDocument();
    expect(screen.getByText("9-Piece Men's Morris")).toBeInTheDocument();
  });

  it('renders Tournaments page with tabs and arena listings', () => {
    render(
      <MemoryRouter initialEntries={['/tournaments']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Tournaments Hub')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('renders Leaderboards with rankings and player avatars', () => {
    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Global Leaderboards')).toBeInTheDocument();
    expect(screen.getAllByText('GrandmasterKai').length).toBeGreaterThan(0);
  });

  it('renders Profile page with player statistics and ratings', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Alex Chen')).toBeInTheDocument();
    expect(screen.getByText('@PlayerOne')).toBeInTheDocument();
    expect(screen.getByText('Match History')).toBeInTheDocument();
  });

  it('renders Rules page with game guide and phase descriptions', () => {
    render(
      <MemoryRouter initialEntries={['/rules']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Rules & How to Play')).toBeInTheDocument();
    expect(screen.getByText(/The Golden Rule: Forming a Mill/i)).toBeInTheDocument();
  });
});
