import type { Quiz } from "@/src/types";
import { Download, QrCode, X, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useState } from "react";
import QRCode from "react-qr-code";
import { useSubscription, FREE_TIER_LIMITS } from "@/src/hooks/useSubscription";
import { AttemptView } from "./AttemptView";
import { PaywallModal } from "../PaywallModal";

interface PreviewViewProps {
  quiz: Quiz | null;
  onChangeView?: (view: string) => void;
  onShowPaywall?: (reason: 'quiz' | 'pdf') => void;
}

export function PreviewView({ quiz, onChangeView, onShowPaywall }: PreviewViewProps) {
  const { canDownload, incrementDownload, subscription } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAttempting, setIsAttempting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  if (isAttempting) {
    // We render the AttemptView dynamically here if the user wanted to take it
    // Wait, let's actually just import it at the top or render it
    return <AttemptView quiz={quiz} onFinish={() => setIsAttempting(false)} />;
  }

  const handleDownloadQr = () => {
    const qrElement = document.getElementById("qr-code-container");
    if (!qrElement || !quiz?.id) return;
    toPng(qrElement, { cacheBust: true, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `quiz-${quiz.id}-qr.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Error generating QR code image", err);
      });
  };

  const handleShare = async () => {
    if (!quiz?.id) return;
    const url = `${window.location.origin}${window.location.pathname}?quizId=${quiz.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: quiz.title || 'Student Quiz',
          text: 'Join this quiz now!',
          url: url
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    if (!subscription || (subscription.plan !== 'premium' && subscription.downloadsCount >= FREE_TIER_LIMITS.downloads)) {
      onShowPaywall?.('pdf');
      return;
    }

    const isIframe = window !== window.top;
    if (!isIframe) {
      setTimeout(() => {
        incrementDownload();
        window.print();
      }, 100);
      return;
    }

    // In iframe, fallback to generating PDF
    setIsGenerating(true);
    const element = document.getElementById('printable-container');
    if (!element) {
        setIsGenerating(false);
        return;
    }
    
    toPng(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 })
      .then((dataUrl) => {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: 'a4'
        });
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = pdfHeight;
        let position = 0;
        
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`${quiz?.title || 'quiz'}.pdf`);
        setIsGenerating(false);
        incrementDownload();
      })
      .catch((err: any) => {
        console.error("PDF generation failed:", err);
        setIsGenerating(false);
        alert("Unable to generate PDF. Please open the app in a new tab to print.");
      });
  };

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-4">
        <p>No quiz loaded. Generate and edit one first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Non-printing header elements */}
      <header className="mb-8 flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Preview & Print</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Review formatting before exporting to PDF.</p>
        </div>
        <div className="flex items-center gap-3">
          {quiz.id && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-lg shadow-sm">
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Live Code:</span>
              <code className="font-mono font-bold text-lg tracking-wider">{quiz.id}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(quiz.id || '')}
                className="ml-2 text-emerald-600 hover:text-emerald-700 bg-white dark:bg-slate-800 hover:bg-emerald-100 p-1.5 rounded-md transition-colors"
                title="Copy Code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
            </div>
          )}
          <button
            onClick={() => setIsAttempting(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            Take Quiz Online
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Export as QR
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>
          <button 
            onClick={handlePrint}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Save as PDF
              </>
            )}
          </button>
        </div>
      </header>

      {/* Printable Area - styling applied carefully to ensure standard looking output */}
      <div className="print-content-wrapper" id="printable-container">
        <div className="bg-white dark:bg-slate-800 border rounded-xl shadow-lg print:border-none print:shadow-none print:p-0 min-h-[A4] p-12 mx-auto" id="printable-quiz">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">
              {quiz.examType || "Standard Assessment"} {quiz.subject ? `— ${quiz.subject}` : ""}
            </p>
            {quiz.classLevel && (
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Class: {quiz.classLevel}</p>
            )}
            {quiz.chapterName && (
              <p className="text-slate-500 dark:text-slate-400 mt-1">Chapter: {quiz.chapterName}</p>
            )}
          </div>
          <div className="text-right text-sm font-medium text-slate-600 dark:text-slate-300 space-y-2">
            <div>Name: ______________________</div>
            <div>Date: ______________________</div>
            {quiz.totalMarks && <div>Total Marks: {quiz.totalMarks}</div>}
            <div>Score: _____ / {quiz.totalMarks || quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}</div>
          </div>
        </div>

        <div className="space-y-8">
          {quiz.questions.map((q, i) => (
            <div key={q.id || i} className="mt-4 break-inside-avoid">
              <div className="flex gap-4">
                <span className="font-bold text-slate-900 dark:text-white mt-0.5">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-slate-900 dark:text-white leading-relaxed">{q.question}</p>
                  
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="mt-3 space-y-2 pl-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-3 items-start">
                          <span className="w-5 h-5 rounded-full border border-slate-400 shrink-0 mt-0.5"></span>
                          <span className="text-slate-700 dark:text-slate-200">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === 'true_false' && (
                    <div className="mt-3 flex gap-8 pl-2">
                      <div className="flex gap-3 items-center">
                        <span className="w-5 h-5 border border-slate-400 shrink-0"></span>
                        <span className="text-slate-700 dark:text-slate-200">True</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="w-5 h-5 border border-slate-400 shrink-0"></span>
                        <span className="text-slate-700 dark:text-slate-200">False</span>
                      </div>
                    </div>
                  )}
                  {q.type === 'matching' && q.options && q.options.length > 0 && (
                    <div className="mt-4 pl-2">
                      <table className="min-w-[60%] border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800">
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">Column A</th>
                            <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">Column B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.options.map((opt, oIdx) => {
                            // Support '|' or '-' as delimiter, fallback to whole string
                            const separator = opt.includes('|') ? '|' : opt.includes('-') ? '-' : null;
                            const [left, right] = separator ? opt.split(separator, 2) : [opt, ""];
                            return (
                              <tr key={oIdx}>
                                <td className="border border-slate-300 px-4 py-2 text-slate-800 dark:text-slate-100">{left?.trim()}</td>
                                <td className="border border-slate-300 px-4 py-2 text-slate-800 dark:text-slate-100">{right?.trim()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {(q.type === 'short_answer' || q.type === 'word_meaning') && (
                    <div className="mt-6 border-b border-slate-300 w-full mb-6"></div>
                  )}
                </div>
                <div className="w-16 text-right shrink-0">
                  <span className="text-sm border border-slate-300 rounded px-2 py-1 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    [{q.marks} {q.marks === 1 ? 'mark' : 'marks'}]
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Answer key area - starts on a new page when printing */}
      <div className="mt-12 bg-slate-50 dark:bg-slate-900/50 border rounded-xl shadow-inner p-12 print:break-before-page print:bg-white dark:bg-slate-800 print:border-none print:shadow-none print:p-0 mx-auto">
         <h2 className="text-2xl font-bold border-b pb-4 mb-6 text-slate-800 dark:text-slate-100">Answer Key — Strictly Confidential</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {quiz.questions.map((q, i) => (
             <div key={q.id || i} className="flex flex-col gap-1 bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm print:shadow-none print:border-b print:rounded-none">
               <div className="flex gap-3">
                 <span className="font-bold text-slate-500 dark:text-slate-400 w-6 shrink-0">{i + 1}.</span>
                 <span className="font-semibold text-indigo-700">{q.answer}</span>
               </div>
               {q.complexity && (
                 <div className="pl-9 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                   <span className="uppercase tracking-wider">Complexity:</span>
                   <span className="text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{q.complexity}</span>
                 </div>
               )}
             </div>
           ))}
         </div>
      </div>
     </div>

      {/* Share QR Modal */}
      {showQrModal && quiz.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Student Access QR</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
              Scan this QR code with a mobile device to instantly join the quiz.
            </p>
            <div id="qr-code-container" className="bg-white p-4 rounded-xl shadow-sm mb-4">
              <QRCode value={`${window.location.origin}${window.location.pathname}?quizId=${quiz.id}`} size={200} />
            </div>
            <div className="text-center font-mono font-bold text-lg tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-6 py-2 rounded-lg w-full mb-6">
              {quiz.id}
            </div>
            <button
              onClick={handleDownloadQr}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
