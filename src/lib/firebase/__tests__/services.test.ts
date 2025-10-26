import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock firebase/firestore functions used by services
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn(async () => ({ id: 'mockDocId' })),
    updateDoc: vi.fn(async () => ({})),
    collection: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    onSnapshot: vi.fn(() => () => {}),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    Timestamp: {
      now: () => ({ _seconds: 0, _nanoseconds: 0 }),
    },
  };
});

import { chatService } from '../services';
import * as firestore from 'firebase/firestore';

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendMessage should add a message and update conversation', async () => {
    const addDocSpy = vi.spyOn(firestore, 'addDoc');
    const updateDocSpy = vi.spyOn(firestore, 'updateDoc');

    const id = await chatService.sendMessage('conv1', {
      senderId: 'u1',
      senderName: 'User1',
      message: 'Hello',
      isRead: false,
    });

    expect(addDocSpy).toHaveBeenCalled();
    expect(updateDocSpy).toHaveBeenCalled();
    expect(id).toBe('mockDocId');
  });
});
