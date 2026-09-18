import React from 'react';
import { Star, ChevronRight, MessageSquareOff } from 'lucide-react';

export default function DoctorReviewsTab({ reviewsData }) {
  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.total_reviews || 0;
  const averageRating = reviewsData?.average_rating || 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Opiniones de pacientes</h3>
        {totalReviews > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-amber-600 font-bold text-xs border border-amber-100/50">
            <Star size={12} className="fill-amber-500 text-amber-500" />
            {averageRating} <span className="text-amber-600/60 font-medium ml-1">({totalReviews})</span>
          </div>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {review.patient_initials}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{review.patient_name}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={10} 
                          className={i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {review.comment && (
                <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                  "{review.comment}"
                </p>
              )}
            </div>
          ))}
          {totalReviews > 3 && (
            <button className="w-full py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100 mt-2">
              Cargar más opiniones
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-3">
            <MessageSquareOff size={24} />
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">Aún no hay opiniones</p>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Este profesional no tiene reseñas publicadas todavía.
          </p>
        </div>
      )}
    </div>
  );
}