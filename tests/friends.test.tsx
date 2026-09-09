import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { FriendsPage } from '@/pages/friends/FriendsPage';
import { friendsService } from '@/services/social/friendsService';

describe('Friends Service & Social Logic', () => {
  it('returns empty array when search query is empty or whitespace', async () => {
    const results = await friendsService.searchPlayers('   ', 'user_1');
    expect(results).toEqual([]);
  });

  it('rejects sending friend request to oneself', async () => {
    const result = await friendsService.sendFriendRequest('user_same', 'user_same');
    expect(result.success).toBe(false);
    expect(result.error).toContain('yourself');
  });
});

describe('FriendsPage Component UI/UX', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders search bar, friends section and clean empty state when no friends exist', async () => {
    vi.spyOn(friendsService, 'getFriends').mockResolvedValue([]);
    vi.spyOn(friendsService, 'getPendingRequests').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <FriendsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Search players by username/i)).toBeInTheDocument();
    expect(screen.getByText('Your Friends')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/No friends added yet/i)).toBeInTheDocument();
    });
  });

  it('renders pending requests section only when pending requests exist', async () => {
    vi.spyOn(friendsService, 'getFriends').mockResolvedValue([]);
    vi.spyOn(friendsService, 'getPendingRequests').mockResolvedValue([
      {
        friendshipId: 'req_123',
        senderId: 'user_sender',
        username: 'ChallengerX',
        displayName: 'Challenger X',
        createdAt: 'Today',
      },
    ]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <FriendsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Friend Requests/i)).toBeInTheDocument();
      expect(screen.getByText('@ChallengerX')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
    });
  });

  it('renders friends list with challenge button when friends exist', async () => {
    vi.spyOn(friendsService, 'getFriends').mockResolvedValue([
      {
        id: 'user_f1',
        friendshipId: 'f_1',
        username: 'GrandMasterBob',
        displayName: 'Bob The Great',
        status: 'offline',
        ratings: { mills3: 1350, mills6: 1400, mills9: 1520 },
        createdAt: 'Yesterday',
      },
    ]);
    vi.spyOn(friendsService, 'getPendingRequests').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <FriendsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('@GrandMasterBob')).toBeInTheDocument();
      expect(screen.getByText(/9M: 1520/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Challenge/i })).toBeInTheDocument();
    });
  });
});
