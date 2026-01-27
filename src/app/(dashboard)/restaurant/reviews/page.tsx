'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_id: string;
  users?: {
      email: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Join with users table if possible, otherwise just fetch reviews
    // Since we don't have a direct relation setup in the client generator usually, we might need to fetch users separately or rely on view
    // For now, let's try to fetch reviews and then maybe fetch user emails if needed, or assume we can't get emails easily without a proper join query
    
    // Actually, I can use the foreign key relation if Supabase infers it
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users:customer_id(email)') // Try to join on customer_id -> users
      .eq('restaurant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
    } else if (data) {
        setReviews(data as any[]);
        
        if (data.length > 0) {
            const total = data.reduce((acc, review) => acc + review.rating, 0);
            setStats({
                averageRating: total / data.length,
                totalReviews: data.length
            });
        }
    }
    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        className={i < rating ? "text-yellow-400 fill-current" : "text-slate-300"} 
      />
    ));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading reviews...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reviews</h1>
        <p className="text-slate-500 mt-2">See what your customers are saying about you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">Average Rating</p>
                <div className="flex items-center mt-2">
                    <span className="text-4xl font-bold text-slate-900 mr-3">{stats.averageRating.toFixed(1)}</span>
                    <div className="flex space-x-1">
                        {renderStars(Math.round(stats.averageRating))}
                    </div>
                </div>
            </div>
            <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                <Star size={24} className="fill-current" />
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
             <div>
                <p className="text-sm font-medium text-slate-500">Total Reviews</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{stats.totalReviews}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <MessageSquare size={24} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Recent Reviews</h3>
        </div>
        <div className="divide-y divide-slate-100">
            {reviews.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    <Star className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                    <p>No reviews yet.</p>
                </div>
            ) : (
                reviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-0.5">
                                    {renderStars(review.rating)}
                                </div>
                                <span className="font-bold text-slate-900 ml-2">{review.rating}.0</span>
                            </div>
                            <span className="text-sm text-slate-500">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-slate-700 my-2">{review.comment}</p>
                        <div className="text-sm text-slate-400 flex items-center mt-3">
                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-xs font-bold">
                                {review.users?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            {review.users?.email || 'Anonymous Customer'}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
