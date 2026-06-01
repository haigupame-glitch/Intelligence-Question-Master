import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, CreditCard, X, QrCode } from 'lucide-react';
import { useSubscription, FREE_TIER_LIMITS } from '@/src/hooks/useSubscription';
import QRCode from 'react-qr-code';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function PricingView() {
  const { subscription, upgradeToPremium, submitTransaction } = useSubscription();
  const [upgrading, setUpgrading] = useState<'monthly' | 'annual' | null>(null);

  const [paymentType, setPaymentType] = useState<'monthly' | 'annual' | null>('monthly');
  const [paymentStep, setPaymentStep] = useState<'none' | 'qr' | 'utr'>('none');
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

  const [monthlyPrice, setMonthlyPrice] = useState("499");
  const [annualPrice, setAnnualPrice] = useState("4999");
  const [merchantUpiId, setMerchantUpiId] = useState("merchant@upi");
  const [verificationLink, setVerificationLink] = useState("");

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const docRef = doc(db, "settings", "pricing");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.monthlyPrice) setMonthlyPrice(data.monthlyPrice);
          if (data.annualPrice) setAnnualPrice(data.annualPrice);
          if (data.merchantUpiId) setMerchantUpiId(data.merchantUpiId);
          if (data.verificationLink) setVerificationLink(data.verificationLink);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchPricing();
  }, []);

  const handleUpgradeClick = (type: 'monthly' | 'annual') => {
    setPaymentType(type);
    setPaymentStep('qr');
    setUtrNumber('');
    setUtrError('');
  };

  const processPayment = async () => {
    if (!paymentType) return;
    if (utrNumber.length !== 12) {
      setUtrError("Please enter a valid 12-digit UTR/Reference number.");
      return;
    }
    
    setUpgrading(paymentType);
    
    try {
      const currentPrice = paymentType === 'monthly' ? monthlyPrice : annualPrice;
      await submitTransaction(paymentType, currentPrice, utrNumber);
    } catch (err) {
      setUtrError("Payment verification failed. Please try again or contact support.");
    } finally {
      setUpgrading(null);
      setPaymentStep('none');
    }
  };

  const isPremium = subscription.plan === 'premium';
  const isCurrentPlan = isPremium && subscription.subscriptionType === paymentType;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const currentPrice = paymentType === 'monthly' ? monthlyPrice : annualPrice;
  // Generate UPI deep linking string as requested
  const baseUpiId = merchantUpiId || "merchant@upi";
  const upiLink = paymentType ? `upi://pay?pa=${baseUpiId}&pn=QuizGenius&am=${currentPrice}&cu=INR&tn=Premium+Subscription` : '';

  return (
    <div className="p-6 max-w-4xl mx-auto dark:text-white pb-32">
      <header className="text-center mb-16 mt-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Simple, transparent pricing</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Upgrade to Premium for unlimited quiz generation and PDF downloads. Elevate your teaching workflow today.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan Card */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm bg-white dark:bg-slate-800 relative">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Free Plan</h2>
          <div className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
            ₹0 <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/forever</span>
          </div>
          <ul className="space-y-4 mb-8 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <span>Generate up to {FREE_TIER_LIMITS.generations} quizzes (Used: {subscription.generationsCount}/{FREE_TIER_LIMITS.generations})</span>
            </li>
            <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <span>Download up to {FREE_TIER_LIMITS.downloads} PDFs (Used: {subscription.downloadsCount}/{FREE_TIER_LIMITS.downloads})</span>
            </li>
            <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <span>Basic quiz formats</span>
            </li>
          </ul>
          <button disabled className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl font-medium cursor-not-allowed">
            {!isPremium ? "Current Plan" : "Included"}
          </button>
        </div>

        {/* Premium Plan Card */}
        <div className="border-2 border-indigo-600 rounded-2xl p-8 shadow-lg bg-white dark:bg-slate-900 relative ring-4 ring-indigo-500/10">
          <span className="absolute top-0 right-8 transform -translate-y-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Most Popular
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            Premium <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <div className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
            ₹{paymentType === 'monthly' ? monthlyPrice : annualPrice} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/{paymentType === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setPaymentType('monthly')}
              className={`flex-1 py-2 text-sm rounded-lg border ${paymentType === 'monthly' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 transition-colors'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setPaymentType('annual')}
              className={`flex-1 py-2 text-sm rounded-lg border ${paymentType === 'annual' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 transition-colors'}`}
            >
              Annual (Save 20%)
            </button>
          </div>

          <ul className="space-y-4 mb-8 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
               <span>Unlimited quiz generations</span>
            </li>
            <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
               <span>Unlimited PDF downloads</span>
            </li>
            <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
               <span>Priority support</span>
            </li>
          </ul>
          <button 
            disabled={isCurrentPlan || upgrading !== null}
            onClick={() => setPaymentStep('qr')}
            className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${isCurrentPlan ? 'bg-emerald-500 text-white cursor-default opacity-80' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'}`}
          >
            {isCurrentPlan ? "Subscribed" : (isPremium ? `Switch to ${paymentType === 'annual' ? 'Annual' : 'Monthly'}` : "Upgrade Now")}
          </button>
        </div>
      </div>

      {/* Strict QR Payment Gateway Modal */}
      {(paymentStep === 'qr' && paymentType) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
             <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Secure UPI QR Payment</h3>
             
             {/* Locked, Read-Only Pricing Parameters */}
             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6 space-y-3 border border-slate-200 dark:border-slate-700 select-none">
               <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                 <span>Subscription Plan:</span>
                 <span className="font-semibold capitalize text-slate-900 dark:text-white">{paymentType} Premium</span>
               </div>
               <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                 <span>Fixed Amount:</span>
                 <span className="text-lg font-bold text-slate-900 dark:text-white">₹{currentPrice}</span>
               </div>
             </div>

             {/* Simulated Uneditable Static QR Element */}
             <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 bg-slate-50/50 dark:bg-slate-900/20">
               <div className="bg-white dark:bg-white p-3 rounded-xl shadow-sm mb-4">
                  <QRCode value={upiLink} size={160} />
               </div>
               <div className="text-center">
                 <div className="font-mono text-xs text-slate-400 mb-1 tracking-widest">[ SECURE UPI QR ]</div>
                 <div className="text-xs text-slate-500 font-sans">Scan via BHIM, GPay, PhonePe, or Paytm</div>
               </div>
             </div>

             <div className="flex gap-3">
               <button 
                 disabled={upgrading !== null}
                 onClick={() => {
                   setPaymentStep('none');
                 }}
                 className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium text-slate-700 dark:text-slate-300"
               >
                 Cancel
               </button>
               <button 
                 disabled={upgrading !== null}
                 onClick={() => setPaymentStep('utr')}
                 className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition text-sm disabled:opacity-80"
               >
                 I have paid
               </button>
             </div>
             
             <div className="mt-4 text-center">
               <a 
                 href={verificationLink || "https://api.whatsapp.com/send"} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-sm font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
               >
                 Link to the actual payment verification
               </a>
             </div>
           </div>
        </div>
      )}

      {/* UTR Verification Modal */}
      {(paymentStep === 'utr' && paymentType) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Verify Payment</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Please enter the 12-digit UTR or Reference Number from your UPI app.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                UTR / Reference Number
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                  setUtrError('');
                }}
                placeholder="e.g. 123456789012"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {utrError && <p className="text-red-500 text-sm mt-2">{utrError}</p>}
            </div>

            <div className="flex gap-3">
              <button 
                disabled={upgrading !== null}
                onClick={() => setPaymentStep('qr')}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Back to QR
              </button>
              <button 
                disabled={upgrading !== null || utrNumber.length !== 12}
                onClick={processPayment}
                className="flex-1 flex justify-center items-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition text-sm disabled:opacity-80"
              >
                {upgrading !== null ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Payment"}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <a 
                href={verificationLink || "https://api.whatsapp.com/send"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                Link to the actual payment verification
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

