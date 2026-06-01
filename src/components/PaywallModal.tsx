import React from 'react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPricing: () => void;
  reason: 'quiz' | 'pdf';
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onNavigateToPricing, reason }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative flex flex-col text-center">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">!</div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">You’ve hit your Free Plan limit! 📊</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-auto text-left">
          You’ve successfully utilized your 5 free quizzes/10 PDF downloads for this tier. To keep generating high-quality, smart formats for your students without any interruptions, switch to Premium.
        </p>
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-6 text-left">
          At just ₹99.99/year, it’s less than the price of a cup of coffee per month to elevate your teaching tools for the entire year.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onNavigateToPricing}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition shadow"
          >
            Subscribe Now
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
