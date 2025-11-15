'use client';

import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useT } from '@/lib/i18n-helpers';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string;
  revieweeId: string;
  revieweeName: string;
  onSuccess?: () => void;
}

export function RatingModal({ 
  isOpen, 
  onClose, 
  deliveryId, 
  revieweeId, 
  revieweeName,
  onSuccess 
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { chat } = useT();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert(chat('ratingModal.selectRating'));
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          deliveryId,
          revieweeId,
          reviewerId: currentUserId,
          reviewerContact: currentUserContact,
        }),
      });

      if (response.ok) {
        alert(chat('ratingModal.successMessage'));
        setRating(0);
        setComment('');
        onSuccess?.();
        onClose();
      } else {
        const error = await response.json();
        alert(`${chat('ratingModal.errorMessage')}: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(chat('ratingModal.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setHoveredRating(0);
      setComment('');
      onClose();
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return chat('ratingModal.ratingPoor');
      case 2: return chat('ratingModal.ratingFair');
      case 3: return chat('ratingModal.ratingGood');
      case 4: return chat('ratingModal.ratingVeryGood');
      case 5: return chat('ratingModal.ratingExcellent');
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">
            {chat('ratingModal.title')} {revieweeName}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {chat('ratingModal.experienceLabel')}
            </label>
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full p-1"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-orange-500 text-orange-500'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-medium text-gray-600">
                {getRatingText(rating)}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {chat('ratingModal.commentLabel')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={chat('ratingModal.commentPlaceholder')}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/500 {chat('ratingModal.characters')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chat('ratingModal.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? chat('ratingModal.submitting') : chat('ratingModal.submitButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
