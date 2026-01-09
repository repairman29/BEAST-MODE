"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface PluginReviewsProps {
  pluginId: string;
  pluginName: string;
  currentUserId?: string;
  currentUserName?: string;
}

export default function PluginReviews({ 
  pluginId, 
  pluginName,
  currentUserId,
  currentUserName 
}: PluginReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [pluginId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/beast-mode/marketplace/reviews?pluginId=${pluginId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
        setRatingDistribution(data.ratingDistribution || {});
        
        // Check if current user has a review
        if (currentUserId) {
          const existing = data.reviews?.find((r: Review) => r.userId === currentUserId);
          if (existing) {
            setUserReview(existing);
            setUserRating(existing.rating);
            setUserComment(existing.comment);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUserId || userRating === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId: currentUserId,
          userName: currentUserName || 'Anonymous',
          rating: userRating,
          comment: userComment
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserReview(data.review);
        setShowReviewForm(false);
        await fetchReviews(); // Refresh reviews
        
        // Track analytics
        if (typeof window !== 'undefined') {
          const { getAnalytics } = require('@/lib/analytics');
          const analytics = getAnalytics();
          analytics.trackFeatureUse('plugin-review', pluginId);
          analytics.track('event', 'marketplace', 'review-submitted', pluginId, userRating);
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentUserId || !userReview) {
      return;
    }

    try {
      const response = await fetch(
        `/api/beast-mode/marketplace/reviews?pluginId=${pluginId}&userId=${currentUserId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setUserReview(null);
        setUserRating(0);
        setUserComment('');
        await fetchReviews();
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            disabled={!interactive}
            className={`text-2xl ${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            } ${
              star <= rating ? 'text-yellow-400' : 'text-slate-600'
            }`}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-slate-400 text-center">Loading reviews...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-lg">⭐ Reviews & Ratings</CardTitle>
            <CardDescription className="text-slate-400">
              {totalReviews} review{totalReviews !== 1 ? 's' : ''} • Average: {averageRating.toFixed(1)}/5.0
            </CardDescription>
          </div>
          {currentUserId && !userReview && (
            <Button
              onClick={() => setShowReviewForm(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Write Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Distribution */}
        {totalReviews > 0 && (
          <div className="space-y-2">
            <div className="text-white font-semibold text-sm mb-3">Rating Breakdown</div>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="text-slate-400 text-sm w-8">{rating} ⭐</div>
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-slate-400 text-xs w-12 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && currentUserId && !userReview && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
            <div className="text-white font-semibold">Write Your Review</div>
            <div>
              <div className="text-slate-300 text-sm mb-2">Rating</div>
              {renderStars(userRating, true, setUserRating)}
            </div>
            <div>
              <div className="text-slate-300 text-sm mb-2">Comment (optional)</div>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your experience with this plugin..."
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={userRating === 0 || isSubmitting}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button
                onClick={() => {
                  setShowReviewForm(false);
                  setUserRating(0);
                  setUserComment('');
                }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* User's Review */}
        {userReview && currentUserId && (
          <div className="bg-slate-950 p-4 rounded-lg border border-cyan-500/50">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-white font-semibold">Your Review</div>
                <div className="text-slate-400 text-sm">{userReview.userName}</div>
              </div>
              <Button
                onClick={handleDeleteReview}
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20 text-xs"
              >
                Delete
              </Button>
            </div>
            <div className="mb-2">{renderStars(userReview.rating)}</div>
            {userReview.comment && (
              <div className="text-slate-300 text-sm">{userReview.comment}</div>
            )}
            <div className="text-slate-500 text-xs mt-2">
              {new Date(userReview.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold text-sm">All Reviews</div>
              <div className="flex gap-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
                {/* Filter by Rating */}
                <select
                  value={filterRating || ''}
                  onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
            {reviews
              .filter((r) => !userReview || r.id !== userReview.id)
              .filter((r) => filterRating === null || r.rating === filterRating)
              .sort((a, b) => {
                switch (sortBy) {
                  case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  case 'highest':
                    return b.rating - a.rating;
                  case 'lowest':
                    return a.rating - b.rating;
                  default:
                    return 0;
                }
              })
              .map((review) => (
                <div key={review.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-semibold">{review.userName}</div>
                      <div className="text-slate-400 text-xs">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>{renderStars(review.rating)}</div>
                  </div>
                  {review.comment && (
                    <div className="text-slate-300 text-sm mt-2">{review.comment}</div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">⭐</div>
            <div>No reviews yet. Be the first to review {pluginName}!</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

