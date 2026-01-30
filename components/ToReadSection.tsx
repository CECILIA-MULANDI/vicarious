'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/context/ThemeContext';
import { getCountryName } from '@/lib/countries';

export interface ToReadItem {
  id: string;
  title: string;
  author: string;
  countryCode: string;
  countryName: string;
  source?: string | null;
  createdAt: string;
}

interface ToReadSectionProps {
  refreshTrigger?: number; // increment to refetch
  onAddAsRead?: (item: ToReadItem) => void;
}

export default function ToReadSection({ refreshTrigger, onAddAsRead }: ToReadSectionProps) {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [items, setItems] = useState<ToReadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadItems = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/books/to-read');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error loading to-read list:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [session?.user, loadItems, refreshTrigger]);

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/books/to-read/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Error removing from to-read:', err);
    }
  };

  if (!session?.user) return null;
  if (items.length === 0 && !loading) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center p-3 rounded-lg transition-all"
        style={{
          backgroundColor: theme.colors.cardBg,
          border: `1px solid ${theme.colors.cardBorder}`,
        }}
      >
        <span
          className="font-semibold text-sm"
          style={{ color: theme.colors.textPrimary }}
        >
          📋 To Read ({items.length})
        </span>
        <span style={{ color: theme.colors.textMuted }}>
          {expanded ? '▼' : '▶'}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="text-sm py-2" style={{ color: theme.colors.textMuted }}>
              Loading...
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg flex flex-col gap-2"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  border: `1px solid ${theme.colors.cardBorder}`,
                }}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    {item.author} · {item.countryName}
                  </p>
                </div>
                <div className="flex gap-2">
                  {onAddAsRead && (
                    <button
                      onClick={() => onAddAsRead(item)}
                      className="flex-1 px-2 py-1.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.textOnPrimary,
                      }}
                    >
                      Add as read
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="px-2 py-1.5 rounded text-xs"
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.cardBorder}`,
                      color: theme.colors.textMuted,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
