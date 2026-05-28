import React, { useState, useEffect } from "react";
import type { Quiz, Question } from "@/src/types";
import { GripVertical, Trash2, Plus, ArrowUp, ArrowDown, Save, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "@/src/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/src/lib/firebase";

interface QuizEditorViewProps {
  quiz: Quiz | null;
  setQuiz: React.Dispatch<React.SetStateAction<Quiz | null>>;
}

export function QuizEditorView({ quiz, setQuiz }: QuizEditorViewProps) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quiz || !quiz.id) return;
    const timeout = setTimeout(async () => {
      setSaving(true);
      try {
        const docRef = doc(db, "quizzes", quiz.id!);
        // Ensure we explicitly drop any properties not needed
        await updateDoc(docRef, {
          title: quiz.title,
          questions: quiz.questions,
          totalMarks: quiz.totalMarks,
          duration: quiz.duration,
          chapterName: quiz.chapterName,
          classLevel: quiz.classLevel,
          subject: quiz.subject,
          examType: quiz.examType
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `quizzes/${quiz.id}`);
      } finally {
        setSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [quiz]);
  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-4">
        <p>No quiz loaded. Generate one first.</p>
      </div>
    );
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = { ...quiz };
    updated.questions[index] = { ...updated.questions[index], ...updates };
    setQuiz(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = { ...quiz };
    updated.questions.splice(index, 1);
    setQuiz(updated);
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= quiz.questions.length) return;
    const updated = { ...quiz };
    const temp = updated.questions[index];
    updated.questions[index] = updated.questions[index + direction];
    updated.questions[index + direction] = temp;
    setQuiz(updated);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Quiz Editor</h2>
            {saving && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                <Save className="w-3.5 h-3.5 animate-pulse" />
                Saving...
              </span>
            )}
            {!saving && quiz.id && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            {!saving && quiz.id && (
              <div title="Ask students to enter this code to join live" className="flex items-center gap-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-md shadow-sm ml-2">
                <span className="uppercase tracking-wider font-semibold text-indigo-500">Live Code:</span>
                <code className="font-mono text-sm tracking-wider font-bold">{quiz.id}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(quiz.id || '')}
                  className="ml-1 text-indigo-600 hover:text-indigo-800 bg-white dark:bg-slate-800 hover:bg-indigo-100 p-1 rounded transition-colors"
                  title="Copy Code"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              className="text-slate-500 dark:text-slate-400 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-0 max-w-lg w-full font-medium"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Exam Type"
                value={quiz.examType || ""}
                onChange={(e) => setQuiz({ ...quiz, examType: e.target.value })}
                className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 focus:border-indigo-500 focus:ring-0 w-32"
              />
              <input
                type="text"
                placeholder="Chapter Name"
                value={quiz.chapterName || ""}
                onChange={(e) => setQuiz({ ...quiz, chapterName: e.target.value })}
                className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 focus:border-indigo-500 focus:ring-0 w-48"
              />
              <input
                type="number"
                placeholder="Duration (mins)"
                value={quiz.duration || ""}
                onChange={(e) => setQuiz({ ...quiz, duration: parseInt(e.target.value) || undefined })}
                className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 focus:border-indigo-500 focus:ring-0 w-32"
                min="1"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border shadow-sm flex-wrap justify-end">
          <span>Total Questions: {quiz.questions.length}</span>
          <span className="w-px h-4 bg-slate-300 hidden sm:block"></span>
          <span>Max Score: {quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} {quiz.totalMarks ? `/ ${quiz.totalMarks} target` : ""}</span>
        </div>
      </header>

      <div className="space-y-4 pb-20">
        {quiz.questions.map((q, i) => (
          <div key={q.id || i} className="bg-white dark:bg-slate-800 border rounded-xl shadow-sm p-5 flex gap-4 transition-all hover:shadow-md">
            <div className="flex flex-col items-center gap-1 text-slate-400">
               <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"><ArrowUp className="w-4 h-4"/></button>
               <GripVertical className="w-5 h-5 cursor-move" />
               <button onClick={() => moveQuestion(i, 1)} disabled={i === quiz.questions.length - 1} className="hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"><ArrowDown className="w-4 h-4"/></button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Question {i + 1}</label>
                  <textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(i, { question: e.target.value })}
                    className="w-full text-slate-800 dark:text-slate-100 font-medium bg-slate-50 dark:bg-slate-900/50 border-transparent rounded-md focus:bg-white dark:bg-slate-800 focus:border-indigo-300 focus:ring-indigo-300 transition-colors"
                    rows={2}
                  />
                </div>
                <div className="w-32 shrink-0">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Type</label>
                  <select
                    value={q.type || "short_answer"}
                    onChange={(e) => updateQuestion(i, { type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-transparent rounded-md focus:bg-white dark:bg-slate-800 focus:border-indigo-300 focus:ring-indigo-300 text-sm py-2"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="fill_in_blank">Fill in Blank</option>
                    <option value="matching">Matching</option>
                    <option value="word_meaning">Word Meaning</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
                <div className="w-32 shrink-0">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Complexity</label>
                  <select
                    value={q.complexity || "Understand"}
                    onChange={(e) => updateQuestion(i, { complexity: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-transparent rounded-md focus:bg-white dark:bg-slate-800 focus:border-indigo-300 focus:ring-indigo-300 text-sm py-2"
                  >
                    <option value="Remember">Remember</option>
                    <option value="Understand">Understand</option>
                    <option value="Apply">Apply</option>
                    <option value="Analyze">Analyze</option>
                    <option value="Evaluate">Evaluate</option>
                    <option value="Create">Create</option>
                  </select>
                </div>
                <div className="w-24 shrink-0">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Marks</label>
                  <input
                    type="number"
                    value={q.marks || 1}
                    onChange={(e) => updateQuestion(i, { marks: Number(e.target.value) })}
                    className="w-full text-center bg-slate-50 dark:bg-slate-900/50 border-transparent rounded-md focus:bg-white dark:bg-slate-800 focus:border-indigo-300 focus:ring-indigo-300"
                    min="1"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Answer Key / Correct Value</label>
                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                  className="w-full text-indigo-700 font-medium bg-indigo-50/50 border-transparent rounded-md focus:bg-indigo-50 focus:border-indigo-300 focus:ring-indigo-300"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => removeQuestion(i)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors"
                title="Remove question"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        <button 
          onClick={() => {
            const newQuestion = { 
              id: crypto.randomUUID(), 
              type: "short_answer" as const, 
              question: "", 
              answer: "", 
              marks: 1 
            };
            const updated = { ...quiz, questions: [...quiz.questions, newQuestion] };
            setQuiz(updated);
          }}
          className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 dark:text-slate-400 rounded-xl hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Manual Question
        </button>
      </div>
    </div>
  );
}
