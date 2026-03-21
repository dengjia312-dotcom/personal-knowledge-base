import React, { useState, useEffect } from 'react';
import { BrainCircuit, Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { useAppContext, Document } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Page4() {
  const { documents, updateDocument } = useAppContext();
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const [reviewDocs, setReviewDocs] = useState<Document[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Filter and shuffle documents that need review
    const docsToReview = documents.filter(doc => doc.reviewStatus !== 'mastered');
    // Simple Fisher-Yates shuffle
    for (let i = docsToReview.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [docsToReview[i], docsToReview[j]] = [docsToReview[j], docsToReview[i]];
    }
    setReviewDocs(docsToReview);
  }, [documents]);

  const handleNext = (status: 'mastered' | 'review') => {
    if (reviewDocs.length > 0 && currentIndex < reviewDocs.length) {
      if (status === 'mastered') {
        updateDocument(reviewDocs[currentIndex].id, { reviewStatus: 'mastered' });
      }
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300); // Wait for flip animation
    }
  };

  const isComplete = currentIndex >= reviewDocs.length || reviewDocs.length === 0;
  const currentDoc = reviewDocs[currentIndex];
  const progress = reviewDocs.length > 0 ? (currentIndex / reviewDocs.length) * 100 : 100;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest p-10">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-headline font-bold text-on-surface flex items-center gap-3">
            <BrainCircuit className="text-primary" size={32} />
            每日复习
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-on-surface-variant">进度</span>
            <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-outline font-bold">{currentIndex} / {reviewDocs.length}</span>
          </div>
        </div>

        {!isComplete && currentDoc ? (
          <>
            {/* Flashcard */}
            <div 
              className={`relative w-full h-96 bg-white rounded-3xl shadow-xl border border-outline-variant/10 cursor-pointer transition-all duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
              onClick={() => setFlipped(!flipped)}
            >
              {/* Front */}
              <div className={`absolute inset-0 p-10 flex flex-col items-center justify-center backface-hidden ${flipped ? 'hidden' : 'block'}`}>
                <span className="absolute top-6 left-6 text-xs font-bold text-outline uppercase tracking-widest">正面 - 问题</span>
                <span className="absolute top-6 right-6 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {currentDoc.category}
                </span>
                <h2 className="text-2xl font-bold text-center text-on-surface leading-snug">
                  {currentDoc.title}
                </h2>
                <p className="mt-8 text-sm text-outline text-center">点击卡片查看答案</p>
              </div>

              {/* Back */}
              <div className={`absolute inset-0 p-10 flex flex-col items-center justify-center backface-hidden rotate-y-180 ${!flipped ? 'hidden' : 'block'}`}>
                <span className="absolute top-6 left-6 text-xs font-bold text-primary uppercase tracking-widest">背面 - 答案</span>
                <div className="w-full h-full pt-12 overflow-y-auto scrollbar-hide text-center">
                  {currentDoc.summary && currentDoc.summary.length > 0 ? (
                    <ul className="space-y-4 text-lg text-on-surface-variant leading-relaxed inline-block text-left">
                      {currentDoc.summary.map((point, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="font-bold opacity-70">{index + 1}.</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-lg text-on-surface-variant leading-relaxed">
                      {currentDoc.content.substring(0, 200)}...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`mt-12 flex items-center justify-center gap-6 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext('review'); }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <X size={24} />
                </div>
                <span className="text-xs font-medium text-on-surface-variant">忘记了</span>
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext('review'); }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <RotateCcw size={24} />
                </div>
                <span className="text-xs font-medium text-on-surface-variant">模糊</span>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); handleNext('mastered'); }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Check size={24} />
                </div>
                <span className="text-xs font-medium text-on-surface-variant">记得</span>
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white border border-outline-variant/20 rounded-3xl shadow-sm p-16 flex flex-col items-center justify-center text-center mt-10">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <Check size={48} />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">太棒了！</h2>
            <p className="text-on-surface-variant mb-8">你已经完成了今天的复习任务。</p>
            <button 
              onClick={() => navigate('/page2')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              返回知识库
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
