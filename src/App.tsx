/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { GenerateView } from "./components/views/GenerateView";
import { QuizEditorView } from "./components/views/QuizEditorView";
import { PreviewView } from "./components/views/PreviewView";
import { AnalyticsView } from "./components/views/AnalyticsView";
import { SettingsView } from "./components/views/SettingsView";
import { LoginView } from "./components/views/LoginView";
import { PricingView } from "./components/views/PricingView";
import { StudentDashboard } from "./components/views/StudentDashboard";
import { PaywallModal } from "./components/PaywallModal";
import type { Quiz } from "./types";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useSubscription } from "./hooks/useSubscription";
import { Sparkles, GraduationCap, BookOpen } from "lucide-react";

import { useDarkMode } from "./hooks/useDarkMode";

export default function App() {
  useDarkMode(); // Initialize dark mode globally
  const [currentView, setCurrentView] = useState("generate");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { subscription, loading: subLoading, setRole } = useSubscription();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'quiz' | 'pdf'>('quiz');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qid = params.get('quizId');
    if (qid && user && subscription && !subscription.role && !subLoading) {
      setRole('student');
    }
  }, [user, subscription, subLoading, setRole]);

  const handleQuizGenerated = (newQuiz: Quiz) => {
    setQuiz(newQuiz);
    setCurrentView("editor");
  };

  if (loading || (user && subLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!subscription.role) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900/50 font-sans p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to QuizGenius</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-lg mx-auto">Please select your role to continue. This determines your dashboard experience.</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <button 
              onClick={() => setRole('teacher')}
              className="flex flex-col items-center p-8 border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                 <GraduationCap className="w-8 h-8 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">I am a Teacher</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generate, manage, and assign quizzes to your students.</p>
            </button>

            <button 
              onClick={() => setRole('student')}
              className="flex flex-col items-center p-8 border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                 <BookOpen className="w-8 h-8 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">I am a Student</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Take live quizzes and view your assessment scores.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  if (subscription.role === 'student') {
    return <StudentDashboard />;
  }

  // Teacher Dashboard
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 font-sans print:h-auto print:bg-white dark:bg-slate-800 print:block transition-colors">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto print:overflow-visible print:block">
        <div className="h-full px-8 py-4 print:p-0">
          {currentView === "generate" && <GenerateView 
            onQuizGenerated={handleQuizGenerated} 
            onChangeView={setCurrentView}
            onShowPaywall={(reason) => { setPaywallReason(reason); setIsPaywallOpen(true); }}
          />}
          {currentView === "editor" && <QuizEditorView quiz={quiz} setQuiz={setQuiz} />}
          {currentView === "preview" && <PreviewView 
            quiz={quiz} 
            onChangeView={setCurrentView}
            onShowPaywall={(reason) => { setPaywallReason(reason); setIsPaywallOpen(true); }}
          />}
          {currentView === "analytics" && <AnalyticsView />}
          {currentView === "settings" && <SettingsView />}
          {currentView === "pricing" && <PricingView />}
          {currentView === "access" && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 dark:text-slate-400">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white dark:text-white mb-2">Access Control & LMS Integration</h2>
              <p>Connect Google Classroom or Canvas (Mocked for Preview)</p>
            </div>
          )}
        </div>
      </main>

      <PaywallModal 
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onNavigateToPricing={() => {
          setIsPaywallOpen(false);
          setCurrentView('pricing');
        }}
        reason={paywallReason}
      />
    </div>
  );
}

