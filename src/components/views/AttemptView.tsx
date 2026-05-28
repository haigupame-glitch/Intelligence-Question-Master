import React, { useState, useEffect } from 'react';
import type { Quiz } from '@/src/types';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AttemptViewProps {
  quiz: Quiz | null;
  onFinish: () => void;
}

export function AttemptView({ quiz, onFinish }: AttemptViewProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz?.duration ? quiz.duration * 60 : null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft <= 0) {
      submitAttempt();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 h-full">
        <p className="text-slate-500 dark:text-slate-400 text-lg">No assessment selected.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    if (isSubmitted || isSubmitting) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((q, i) => {
      const qId = q.id || i.toString();
      const studentAnswer = answers[qId]?.trim().toLowerCase() || "";
      const correctAnswer = (q.answer || "").trim().toLowerCase();
      
      if (q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'fill_in_blank') {
        if (studentAnswer === correctAnswer) {
          score += (q.marks || 1);
        }
      } else {
        // For short answer, we just do a dumb string check for now
        if (studentAnswer === correctAnswer) {
          score += (q.marks || 1);
        }
      }
    });
    return score;
  };

  const submitAttempt = async () => {
    if (isSubmitted || isSubmitting || !auth.currentUser || !quiz) return;
    setIsSubmitting(true);
    const score = calculateScore();
    const totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    
    // Clean answers to remove any undefined or weird values
    const cleanAnswers: Record<string, string> = {};
    Object.keys(answers).forEach(k => {
      if (answers[k] !== undefined && answers[k] !== null) {
        cleanAnswers[k] = answers[k];
      }
    });
    
    try {
      await addDoc(collection(db, 'attempts'), {
        quizId: quiz.id || 'unknown',
        quizTitle: quiz.title || 'Untitled Assessment',
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || 'Anonymous Student',
        answers: cleanAnswers,
        score,
        totalMarks,
        submittedAt: new Date().toISOString()
      });
      setIsSubmitted(true);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'attempts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900/50 overflow-y-auto pb-20">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Student Attempt Mode</p>
        </div>
        
        {timeLeft !== null && !isSubmitted && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto mt-8">
        {isSubmitted && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-emerald-900 mb-1">Assessment Submitted</h2>
              <p className="text-emerald-700 font-medium mb-3">Your responses have been recorded.</p>
              <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg border border-emerald-100 inline-block shadow-sm">
                <span className="text-emerald-900 font-semibold">Estimated Score: </span>
                <span className="text-emerald-600 font-bold ml-2">
                  {calculateScore()} / {quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">(Short answers may require manual review)</span>
              </div>
            </div>
            <button 
              onClick={onFinish}
              className="ml-auto mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg"
            >
              Exit
            </button>
          </div>
        )}

        <div className="space-y-6">
          {quiz.questions.map((q, i) => {
            const qId = q.id || i.toString();
            return (
              <div key={qId} className={`bg-white dark:bg-slate-800 border rounded-xl shadow-sm p-6 ${isSubmitted ? 'opacity-80 disabled-look' : ''}`}>
                <div className="flex gap-4">
                  <span className="font-bold text-slate-900 dark:text-white text-lg w-6 shrink-0">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-slate-900 dark:text-white text-lg leading-relaxed">{q.question}</p>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {q.marks} {q.marks === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>

                    {q.type === 'multiple_choice' && q.options && (
                      <div className="space-y-3 mt-4">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name={`question-${qId}`}
                              value={opt}
                              checked={answers[qId] === opt}
                              onChange={(e) => handleAnswerChange(qId, e.target.value)}
                              disabled={isSubmitted}
                              className="mt-1 w-4 h-4 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:text-white">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="space-x-8 mt-4">
                        {['True', 'False'].map(opt => (
                           <label key={opt} className="inline-flex items-center gap-2 cursor-pointer group">
                             <input
                               type="radio"
                               name={`question-${qId}`}
                               value={opt}
                               checked={answers[qId] === opt}
                               onChange={(e) => handleAnswerChange(qId, e.target.value)}
                               disabled={isSubmitted}
                               className="w-4 h-4 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 focus:ring-indigo-500"
                             />
                             <span className="text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:text-white">{opt}</span>
                           </label>
                        ))}
                      </div>
                    )}

                    {(q.type === 'short_answer' || q.type === 'word_meaning' || q.type === 'fill_in_blank') && (
                      <div className="mt-4">
                        <textarea
                          placeholder="Type your answer here..."
                          value={answers[qId] || ''}
                          onChange={(e) => handleAnswerChange(qId, e.target.value)}
                          disabled={isSubmitted}
                          rows={2}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:bg-slate-800 transition-all disabled:opacity-50 resize-y"
                        />
                      </div>
                    )}

                    {/* Temporary fallback for matching */}
                    {q.type === 'matching' && q.options && (
                      <div className="mt-4">
                        <textarea
                          placeholder="Type your matching pairs (e.g. A-1, B-2)..."
                          value={answers[qId] || ''}
                          onChange={(e) => handleAnswerChange(qId, e.target.value)}
                          disabled={isSubmitted}
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:bg-slate-800 transition-all disabled:opacity-50"
                        />
                      </div>
                    )}

                    {/* Show answer if submitted */}
                    {isSubmitted && (
                       <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                         <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Correct Answer:</p>
                         <p className="font-medium text-emerald-700">{q.answer}</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isSubmitted && (
          <div className="mt-8 flex flex-col items-end pb-12">
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm w-full md:w-auto">
                Failed to submit: {submitError}
              </div>
            )}
            <button
              onClick={submitAttempt}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
