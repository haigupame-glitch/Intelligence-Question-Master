import { useEffect, useState } from "react";
import { loginWithGoogle, auth, db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Sparkles, Loader2, LogIn, GraduationCap, BookOpen, Phone } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function LoginView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  
  const { loginAsTestUser, loading: phoneLoading, error: phoneError } = useAuth();
  const [testPhone, setTestPhone] = useState("");
  const [showPhoneTest, setShowPhoneTest] = useState(false);

  const handleLogin = async (role: 'teacher' | 'student') => {

    setSelectedRole(role);
    setLoading(true);
    setError("");
    try {
      const result = await loginWithGoogle();
      // After successful login, explicitly set the role in Firestore
      if (result.user) {
        const docRef = doc(db, 'users', result.user.uid);
        try {
          await setDoc(docRef, { role: role }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${result.user.uid}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('popup') || err.message?.includes('cross-origin') || err.code === 'auth/popup-closed-by-user') {
        setError("Google Sign-In was blocked by your browser because the app is running in an iframe preview. Please click the 'Open in new tab' button (the arrow icon in the top right of this preview window) to open the app and sign in.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for Google Sign-In yet. Please wait a moment for the new AI Studio domain to propagate, or ensure it's added in the Firebase console.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
      setLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900/50 font-sans p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to QuizGenius</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto">Who's logging in today? Select your portal to continue.</p>
        
        {error && (
          <div className="mb-6 w-full max-w-md mx-auto p-4 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-100 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Teacher Portal */}
          <button 
            onClick={() => handleLogin('teacher')}
            disabled={loading}
            className={`flex flex-col items-center p-8 border-2 rounded-2xl transition-all group ${loading && selectedRole !== 'teacher' ? 'opacity-50' : ''} ${selectedRole === 'teacher' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50'}`}
          >
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
               <GraduationCap className="w-8 h-8 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Teacher Login</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Generate, manage, and assign assessments to students.</p>
            
            <div className={`mt-auto w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors ${selectedRole === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white group-hover:bg-indigo-600'}`}>
              {loading && selectedRole === 'teacher' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading && selectedRole === 'teacher' ? "Signing in..." : "Continue as Teacher"}
            </div>
          </button>

          {/* Student Portal */}
          <button 
            onClick={() => handleLogin('student')}
            disabled={loading}
            className={`flex flex-col items-center p-8 border-2 rounded-2xl transition-all group ${loading && selectedRole !== 'student' ? 'opacity-50' : ''} ${selectedRole === 'student' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50'}`}
          >
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
               <BookOpen className="w-8 h-8 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Student Login</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Take live quizzes and review your assessment scores.</p>
            
            <div className={`mt-auto w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors ${selectedRole === 'student' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white group-hover:bg-emerald-600'}`}>
              {loading && selectedRole === 'student' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading && selectedRole === 'student' ? "Signing in..." : "Continue as Student"}
            </div>
          </button>
        </div>

        {/* Developer Test Login */}
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          {!showPhoneTest ? (
            <button 
              onClick={() => setShowPhoneTest(true)}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              Developer: Login as Test User
            </button>
          ) : (
            <div className="max-w-xs mx-auto">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-left">
                Test Phone Number
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="e.g. 555-0100"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={() => loginAsTestUser(testPhone)}
                  disabled={phoneLoading || !testPhone}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                </button>
              </div>
              {phoneError && <p className="text-red-500 text-xs mt-2 text-left">{phoneError}</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
