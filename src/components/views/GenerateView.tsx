import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Loader2, Sparkles, AlertCircle, Image as ImageIcon, X, Clock, Trash2, ArrowRight } from "lucide-react";
import type { Quiz } from "@/src/types";
import { auth, db } from "@/src/lib/firebase";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, orderBy } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useSubscription, FREE_TIER_LIMITS } from "@/src/hooks/useSubscription";

interface GenerateViewProps {
  onQuizGenerated: (quiz: Quiz) => void;
}

interface ImageUpload {
  base64: string;
  mimeType: string;
  url: string;
  name: string;
}

export function GenerateView({ onQuizGenerated }: GenerateViewProps) {
  const { canGenerate, incrementGeneration, generationsLeft, subscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [text, setText] = useState("");
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState("Class Test");
  const [chapterName, setChapterName] = useState("");
  const [totalMarksTarget, setTotalMarksTarget] = useState("");
  const [imageInstruction, setImageInstruction] = useState("");
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "quizzes"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quizzesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Quiz[];
      
      const sorted = quizzesData.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setSavedQuizzes(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "quizzes");
    });
    
    return () => unsubscribe();
  }, []);

  const saveToLocal = async (quiz: Quiz) => {
    try {
      const q = {
        ...quiz,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "quizzes"), q);
      return { ...q, id: docRef.id };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "quizzes");
    }
  };

  const deleteSavedQuiz = async (id: string) => {
    try {
      await deleteDoc(doc(db, "quizzes", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `quizzes/${id}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1024;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64String = compressedUrl.split(',')[1];
            setImages(prev => [...prev, {
              base64: base64String,
              mimeType: 'image/jpeg',
              url: compressedUrl,
              name: file.name
            }]);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateQuiz = async () => {
    if (!canGenerate) {
      setShowUpgradeModal(true);
      return;
    }

    if (!text.trim() && images.length === 0) {
      setError("Please provide some text content or upload images first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const apiKey = localStorage.getItem("quizgenius_api_key") || undefined;

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            text, 
            difficulty,
            classLevel,
            subject,
            examType,
            chapterName,
            totalMarksTarget: totalMarksTarget ? Number(totalMarksTarget) : undefined,
            apiKey,
            imageInstruction,
            images: images.map(img => ({ base64: img.base64, mimeType: img.mimeType }))
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate quiz. Check server logs or API key.";
        try {
          const textData = await response.text();
          try {
            const errorData = JSON.parse(textData);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (jsonErr) {
            errorMessage = `Server Error (${response.status}): ` + textData.substring(0, 150);
          }
        } catch (e) {
          // Fallback
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      await incrementGeneration();

      const savedQuiz = await saveToLocal(data);
      if (savedQuiz) {
        onQuizGenerated(savedQuiz as Quiz);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Generate New Quiz</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Paste your course material, upload scanned documents, or combine them to automatically generate a structured assessment.</p>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-start gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            Source Content Settings
          </div>
          
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Subject (e.g. Science)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-md py-1.5 px-3 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Class Level (e.g. Grade 8)"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-md py-1.5 px-3 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 w-48"
            />
            <select 
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="text-sm border-slate-200 dark:border-slate-700 border rounded-md py-1.5 px-3 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>Class Test</option>
              <option>Terminal Exam</option>
              <option>Practice Quiz</option>
              <option>Assignment</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Chapter / Topic Name"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-md py-1.5 px-3 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 min-w-[200px]"
            />
            <input
              type="number"
              placeholder="Total Marks"
              value={totalMarksTarget}
              onChange={(e) => setTotalMarksTarget(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-md py-1.5 px-3 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 w-32"
            />
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="text-sm border-slate-200 dark:border-slate-700 border rounded-md py-1.5 px-3 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ml-auto"
            >
              <option>Beginner</option>
              <option>Medium</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-col flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste syllabus, textbook excerpts, or lecture notes here..."
            className="flex-1 w-full min-h-[250px] p-6 bg-transparent border-0 focus:ring-0 resize-none outline-none text-slate-700 dark:text-slate-200 leading-relaxed font-sans"
          />
          
          {images.length > 0 && (
            <div className="px-6 pb-4">
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Ask Gemini / Image Instructions
                  </label>
                  <textarea
                    value={imageInstruction}
                    onChange={(e) => setImageInstruction(e.target.value)}
                    placeholder="Instruct Gemini what to do with the uploaded images (e.g., 'Extract only the math problems from these images')..."
                    className="w-full min-h-[80px] p-3 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 outline-none resize-y shadow-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.url} alt={img.name} className="w-24 h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium text-sm px-3 py-2 rounded-md hover:bg-indigo-50 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Add Images/Scans
            </button>
          </div>
          
          <button
            onClick={generateQuiz}
            disabled={loading || (!text.trim() && images.length === 0)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? "Analyzing & Generating..." : "Generate Smart Quiz"}
          </button>
        </div>
      </div>

      {savedQuizzes.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-indigo-500" />
            Previously Generated Quizzes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedQuizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group relative"
                onClick={() => onQuizGenerated(quiz)}
              >
                <div className="flex justify-between items-start mb-2 pr-6">
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {quiz.title}
                  </h4>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); if (quiz.id) deleteSavedQuiz(quiz.id); }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 space-y-1">
                  <p>{quiz.examType} • {quiz.subject}</p>
                  <p>{quiz.questions?.length || 0} Questions {quiz.totalMarks ? `• ${quiz.totalMarks} Marks` : ''}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Live Code: <code className="text-slate-600 dark:text-slate-300 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{quiz.id}</code>
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(quiz.id || ''); }}
                      className="text-slate-400 hover:text-slate-600 dark:text-slate-300 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy Code"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
             <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Limit Reached</h3>
             <p className="text-slate-500 dark:text-slate-400 mb-6">You've used all {FREE_TIER_LIMITS.generations} free generations. Upgrade to Premium for unlimited quiz generation.</p>
             <div className="flex gap-3 justify-center">
               <button onClick={() => setShowUpgradeModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">Maybe Later</button>
               <button onClick={() => { setShowUpgradeModal(false); /* The parent needs to navigate, but we can't easily here without prop. We'll just alert for now, or you can switch view */ alert("Please click Subscription in the sidebar to upgrade!"); }} className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer">Upgrade to Premium</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
