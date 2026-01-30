'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/context/ThemeContext';
import BookFinder from './BookFinder';

export interface BookRecommendation {
  title: string;
  author: string;
  country: string;
  countryCode: string;
  reason: string;
  culturalContext?: string;
  difficulty?: 'easy' | 'medium' | 'challenging';
  estimatedPages?: number;
}

interface RecommendationCardProps {
  recommendation: BookRecommendation;
  onAddToReadList?: () => void;
}

export default function RecommendationCard({ recommendation, onAddToReadList }: RecommendationCardProps) {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [showFinder, setShowFinder] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [recommendationId] = useState(() => `rec_${Date.now()}`);

  const handleViewFinder = () => {
    setShowFinder(true);
    if (session?.user?.id) {
      fetch('/api/opik/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId, action: 'clicked_finder' }),
      }).catch(() => {});
    }
  };

  const handleAddToReadList = async () => {
    if (!session?.user || addingToList || addedToList) return;
    setAddingToList(true);
    try {
      const res = await fetch('/api/books/to-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recommendation.title,
          author: recommendation.author,
          countryCode: recommendation.countryCode,
          countryName: recommendation.country,
          source: 'recommendation',
        }),
      });
      if (res.ok) {
        setAddedToList(true);
        onAddToReadList?.();
        fetch('/api/opik/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendationId, action: 'added_to_list' }),
        }).catch(() => {});
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to add to To Read list');
      }
    } catch (err) {
      console.error('Error adding to list:', err);
      alert('Failed to add to To Read list. Please try again.');
    } finally {
      setAddingToList(false);
    }
  };

  const difficultyColors = {
    easy: '#22c55e',
    medium: '#f59e0b',
    challenging: '#ef4444',
  };

  return (
    <>
      <div
        className="rounded-xl p-4 sm:p-6 mb-4"
        style={{
          backgroundColor: theme.colors.cardBg,
          border: `1px solid ${theme.colors.cardBorder}`,
          boxShadow: theme.effects.shadow,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3
              className="text-lg sm:text-xl font-bold mb-1"
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.fonts.heading,
              }}
            >
              📚 Your Next Read
            </h3>
            <p
              className="text-xs sm:text-sm"
              style={{ color: theme.colors.textMuted }}
            >
              AI Recommendation
            </p>
          </div>
        </div>

        <div className="mb-4">
          <h4
            className="text-base sm:text-lg font-semibold mb-1"
            style={{ color: theme.colors.textPrimary }}
          >
            {recommendation.title}
          </h4>
          <p
            className="text-sm sm:text-base mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            by {recommendation.author}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs sm:text-sm px-2 py-1 rounded"
              style={{
                backgroundColor: theme.colors.primaryLight,
                color: theme.colors.primary,
              }}
            >
              📍 {recommendation.country}
            </span>
            {recommendation.difficulty && (
              <span
                className="text-xs sm:text-sm px-2 py-1 rounded"
                style={{
                  backgroundColor: `${difficultyColors[recommendation.difficulty]}20`,
                  color: difficultyColors[recommendation.difficulty],
                }}
              >
                {recommendation.difficulty === 'easy' ? '📖 Easy' :
                 recommendation.difficulty === 'medium' ? '📚 Medium' :
                 '📕 Challenging'}
              </span>
            )}
            {recommendation.estimatedPages && (
              <span
                className="text-xs sm:text-sm"
                style={{ color: theme.colors.textMuted }}
              >
                ~{recommendation.estimatedPages} pages
              </span>
            )}
          </div>
        </div>

        <div
          className="mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: theme.colors.inputBg,
            border: `1px solid ${theme.colors.cardBorder}`,
          }}
        >
          <p
            className="text-sm sm:text-base leading-relaxed"
            style={{ color: theme.colors.textSecondary }}
          >
            {recommendation.reason}
          </p>
          {recommendation.culturalContext && (
            <p
              className="text-xs sm:text-sm mt-2 italic"
              style={{ color: theme.colors.textMuted }}
            >
              {recommendation.culturalContext}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleViewFinder}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg text-sm sm:text-base"
            style={{
              backgroundColor: theme.colors.accent,
              color: theme.colors.textOnPrimary,
            }}
          >
            🏪 Find Near Me
          </button>
          <button
            onClick={handleAddToReadList}
            disabled={addingToList || addedToList}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base disabled:opacity-50"
            style={{
              backgroundColor: addedToList ? undefined : 'transparent',
              border: `1px solid ${theme.colors.cardBorder}`,
              color: addedToList ? theme.colors.primary : theme.colors.textSecondary,
            }}
          >
            {addedToList ? '✓ Added to To Read' : addingToList ? 'Adding...' : '+ Add to To Read'}
          </button>
        </div>
      </div>

      {showFinder && (
        <BookFinder
          bookTitle={recommendation.title}
          author={recommendation.author}
          country={recommendation.country}
          onClose={() => setShowFinder(false)}
        />
      )}
    </>
  );
}
