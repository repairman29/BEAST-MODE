import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Plugin Reviews API
 * 
 * Handles plugin reviews and ratings
 */

declare global {
  var pluginReviews: Map<string, any[]> | undefined;
}

const getReviewsStore = () => {
  if (!global.pluginReviews) {
    global.pluginReviews = new Map();
  }
  return global.pluginReviews;
};

/**
 * GET /api/beast-mode/marketplace/reviews
 * Get reviews for a plugin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('pluginId');

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    const reviewsStore = getReviewsStore();
    const reviews = reviewsStore.get(pluginId) || [];

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      pluginId,
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Plugin Reviews API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/beast-mode/marketplace/reviews
 * Submit a review for a plugin
 */
export async function POST(request: NextRequest) {
  try {
    const { pluginId, userId, rating, comment, userName } = await request.json();

    if (!pluginId || !userId || !rating) {
      return NextResponse.json(
        { error: 'Plugin ID, User ID, and Rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const reviewsStore = getReviewsStore();
    if (!reviewsStore.has(pluginId)) {
      reviewsStore.set(pluginId, []);
    }

    const reviews = reviewsStore.get(pluginId)!;

    // Check if user already reviewed this plugin
    const existingReviewIndex = reviews.findIndex(r => r.userId === userId);
    
    const review = {
      id: `review-${Date.now()}-${userId}`,
      pluginId,
      userId,
      userName: userName || 'Anonymous',
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingReviewIndex >= 0) {
      // Update existing review
      reviews[existingReviewIndex] = { ...reviews[existingReviewIndex], ...review };
    } else {
      // Add new review
      reviews.push(review);
    }

    reviewsStore.set(pluginId, reviews);

    // Calculate new average
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return NextResponse.json({
      success: true,
      review,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Submit Review API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/beast-mode/marketplace/reviews
 * Delete a review
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('pluginId');
    const userId = searchParams.get('userId');

    if (!pluginId || !userId) {
      return NextResponse.json(
        { error: 'Plugin ID and User ID are required' },
        { status: 400 }
      );
    }

    const reviewsStore = getReviewsStore();
    const reviews = reviewsStore.get(pluginId) || [];
    
    const filtered = reviews.filter(r => r.userId !== userId);
    reviewsStore.set(pluginId, filtered);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Delete Review API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete review', details: error.message },
      { status: 500 }
    );
  }
}

