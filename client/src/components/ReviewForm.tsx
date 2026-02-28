"use client";

import { useState, useEffect } from 'react';
import { Star, Loader2, Send, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReviewStore } from '@/store/useReviewStore';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';

interface ReviewFormProps {
    propertyId: string;
    onSuccess?: () => void;
}

export function ReviewForm({ propertyId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const { addReview, isLoading, reviews } = useReviewStore();
    const { currentUser } = useUserStore();

    const existingReview = reviews.find(r =>
        (r.reviewerId === currentUser?.id || r.userId === currentUser?.id) &&
        r.propertyId === propertyId
    );

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment || "");
        }
    }, [existingReview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        try {
            await addReview({
                propertyId,
                rating,
                comment
            } as any);

            toast.success("Review submitted successfully!");
            setRating(0);
            setComment("");
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit review");
        }
    };

    return (
        <Card className="border-primary/20 shadow-sm bg-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    {existingReview ? (
                        <Edit3 className="h-5 w-5 text-primary" />
                    ) : (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    )}
                    {existingReview ? 'Update Your Review' : 'Write a Review'}
                </CardTitle>
                <CardDescription>
                    {existingReview
                        ? 'You have already reviewed this property. You can update your rating and comment below.'
                        : 'Share your experience with this property and help others make better decisions.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-white/50 rounded-xl border border-dashed border-primary/20">
                        <p className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">Your Rating</p>
                        <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 transition-colors ${star <= (hoverRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-xs mt-2 font-bold text-primary animate-in fade-in slide-in-from-top-1">
                                {rating === 5 ? "Excellent!" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Feedback</label>
                        <Textarea
                            placeholder="What did you like or dislike about this property? (Optional)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] bg-white rounded-xl border-border resize-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md"
                        disabled={isLoading || rating === 0}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        {existingReview ? 'Update Review' : 'Submit Review'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
