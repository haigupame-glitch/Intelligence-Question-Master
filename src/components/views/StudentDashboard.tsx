import React, { useState, useEffect } from 'react';
import { Play, ClipboardList, Search, LogOut, Loader2, Sparkles } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Quiz } from '@/src/types';
import { AttemptView } from './AttemptView';
import { logout } from '@/src/lib/firebase';

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'join' | 'history'>('join');
  const [quizCode, setQuizCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // For history
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'attempts'),
        where('studentId', '==', auth.currentUser.uid),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttempts(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'attempts');
    }
    setLoadingHistory(false);
  };

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizCode.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const quizRef = doc(db, 'quizzes', quizCode.trim());
      const quizSnap = await getDoc(quizRef);
      
      if (!quizSnap.exists()) {
        setError('Quiz not found. Please check the code and try again.');
        setLoading(false);
        return;
      }
      
      const quizData = quizSnap.data() as Quiz;
      quizData.id = quizSnap.id;
      setActiveQuiz(quizData);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, `quizzes/${quizCode.trim()}`);
    }
    setLoading(false);
  };

  if (activeQuiz) {
    return <AttemptView quiz={activeQuiz} onFinish={() => setActiveQuiz(null)} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900/50 font-sans">
      {/* Sidebar for Student */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2 mb-2">
             <Sparkles className="w-6 h-6 text-emerald-400" />
             <h1 className="text-xl font-bold text-white tracking-tight">QuizGenius</h1>
           </div>
           <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Student Portal</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('join')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'join' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-white dark:bg-slate-800/5 hover:text-slate-200'}`}
          >
            <Play className="w-5 h-5" />
            Join Quiz
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'history' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-white dark:bg-slate-800/5 hover:text-slate-200'}`}
          >
            <ClipboardList className="w-5 h-5" />
            My Scores
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-white dark:bg-slate-800/5 hover:text-slate-200 transition-colors"
           >
             <LogOut className="w-5 h-5" />
             Sign Out
           </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 h-full">
           {activeTab === 'join' && (
             <div className="h-full flex flex-col items-center justify-center">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Join a Live Quiz</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">Enter the assessment code provided by your teacher to begin.</p>
                  
                  <form onSubmit={handleJoinQuiz}>
                    <input 
                      type="text"
                      value={quizCode}
                      onChange={(e) => setQuizCode(e.target.value)}
                      placeholder="e.g. 8x9JkM2"
                      className="w-full text-center text-2xl tracking-widest font-mono bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-800 dark:text-slate-100 uppercase"
                      disabled={loading}
                    />
                    {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}
                    <button 
                      type="submit"
                      disabled={loading || !quizCode.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      Start Assessment
                    </button>
                  </form>
                </div>
             </div>
           )}

           {activeTab === 'history' && (
             <div>
                <header className="mb-8 mt-4">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Scores</h2>
                  <p className="text-slate-500 dark:text-slate-400">View your past assessment results.</p>
                </header>
                
                {loadingHistory ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No history yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">You haven't completed any assessments.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attempts.map(attempt => (
                      <div key={attempt.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between shadow-sm">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{attempt.quizTitle || 'Assessment'}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                            Submitted: {new Date(attempt.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600">
                            {attempt.score} <span className="text-lg text-slate-400">/ {attempt.totalMarks}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
