import { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, CreditCard, X, QrCode } from 'lucide-react';
import { useSubscription, FREE_TIER_LIMITS } from '@/src/hooks/useSubscription';
import QRCode from 'react-qr-code';

export function PricingView() {
  const { subscription, upgradeToPremium } = useSubscription();
  const [upgrading, setUpgrading] = useState<'monthly' | 'annual' | null>(null);
  const [paymentType, setPaymentType] = useState<'monthly' | 'annual' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'qr' | 'utr'>('qr');
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [customQR, setCustomQR] = useState<string | null>(localStorage.getItem('CUSTOM_QR_IMAGE'));
  const [customUpiId, setCustomUpiId] = useState<string | null>(localStorage.getItem('CUSTOM_UPI_ID'));

  // Fallback prices in case not provided in .env
  // @ts-ignore
  const monthlyPrice = import.meta.env.VITE_SUBSCRIPTION_MONTHLY_PRICE || "999";
  // @ts-ignore
  const annualPrice = import.meta.env.VITE_SUBSCRIPTION_ANNUAL_PRICE || "9999";

  const handleUpgradeClick = (type: 'monthly' | 'annual') => {
    setPaymentType(type);
    setPaymentStep('qr');
    setUtrNumber('');
    setUtrError('');
  };

  const processPayment = async () => {
    if (!paymentType) return;
    if (utrNumber.length < 12) {
      setUtrError("Please enter a valid 12-digit UTR/Reference number.");
      return;
    }
    
    setUpgrading(paymentType);
    setPaymentType(null); // Close modal
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    
    await upgradeToPremium(paymentType);
    setUpgrading(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        localStorage.setItem('CUSTOM_QR_IMAGE', dataUrl);
        setCustomQR(dataUrl);
      };
      reader.readAsDataURL(file);

      const upiId = prompt("To make the 'Pay via UPI App' button work, please enter your UPI ID (e.g. yourname@bank):", localStorage.getItem('CUSTOM_UPI_ID') || '');
      if (upiId !== null && upiId.trim() !== '') {
        localStorage.setItem('CUSTOM_UPI_ID', upiId.trim());
        setCustomUpiId(upiId.trim());
      }
    }
  };

  const isPremium = subscription.plan === 'premium';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const currentPrice = paymentType === 'monthly' ? monthlyPrice : annualPrice;
  // Intentionally omitting name to hide it as requested
  const baseUpiId = customUpiId || "merchant@upi";
  const upiLink = paymentType ? `upi://pay?pa=${baseUpiId}&tr=TXN${Date.now()}&am=${currentPrice}&cu=INR` : '';

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-8">
      {/* Payment Modal */}
      {paymentType && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Complete Payment</h3>
              <button 
                onClick={() => setPaymentType(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div className="text-center mb-6">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Amount due</p>
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  ₹{currentPrice} <span className="text-lg text-slate-400 font-medium tracking-normal">/{paymentType === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </div>

              {paymentStep === 'qr' ? (
                <>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6 relative group overflow-hidden">
                     {customQR ? (
                       <img src={customQR} alt="Custom UPI QR Code" className="w-[180px] h-[180px] object-contain" />
                     ) : (
                       <QRCode value={upiLink} size={180} />
                     )}
                     <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl text-white text-sm font-medium text-center p-2">
                       <span>Upload Custom QR</span>
                       <span className="text-xs text-slate-300 mt-1">(Admin)</span>
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                  </div>
                  
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 text-center text-sm">
                    Scan with any UPI app<br /> (GPay, PhonePe, Paytm, etc.)
                  </p>

                  <div className="w-full space-y-3">
                    {isMobile && (
                      <a 
                        href={upiLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl font-semibold transition-colors shadow-sm"
                      >
                        <QrCode className="w-5 h-5" />
                        Pay via UPI App
                      </a>
                    )}
                    
                    <button 
                      onClick={() => setPaymentStep('utr')}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-3.5 px-4 rounded-xl font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      I have completed payment
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Enter 12-digit UTR / Reference No.
                    </label>
                    <input 
                      type="text" 
                      value={utrNumber}
                      onChange={(e) => {
                        setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                        setUtrError('');
                      }}
                      placeholder="e.g. 312345678901"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    {utrError && <p className="text-red-500 text-sm mt-2">{utrError}</p>}
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-3">
                      You can find the UTR/Reference number in your UPI app's transaction history.
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <button 
                      onClick={processPayment}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-semibold transition-colors shadow-sm"
                    >
                      Verify Payment
                    </button>
                    <button 
                      onClick={() => setPaymentStep('qr')}
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-3.5 px-4 rounded-xl font-semibold transition-colors"
                    >
                      Back to QR Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 mt-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Simple, transparent pricing</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Upgrade to Premium for unlimited quiz generation and PDF downloads. Elevate your teaching workflow today.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Free Plan</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">₹0</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">/forever</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              Perfect for getting started and trying out QuizGenius.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Generate up to {FREE_TIER_LIMITS.generations} quizzes</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Download up to {FREE_TIER_LIMITS.downloads} PDFs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Basic quiz formats</span>
              </li>
            </ul>
            <button
              disabled={true}
              className="w-full py-3 px-6 rounded-xl font-medium text-indigo-600 bg-indigo-50 border border-transparent disabled:opacity-80"
            >
              {isPremium ? "Included" : "Current Plan"}
            </button>
          </div>

          {/* Premium Tier */}
          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-800 relative ring-4 ring-indigo-500/20">
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Most Popular
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              Premium <Sparkles className="w-5 h-5 text-indigo-400" />
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-end justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/50 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => subscription.subscriptionType !== 'monthly' && handleUpgradeClick('monthly')}>
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">Monthly</div>
                  <div>
                    <span className="text-2xl font-bold text-white">₹{monthlyPrice}</span>
                    <span className="text-slate-400 text-sm">/mo</span>
                  </div>
                </div>
                {subscription.subscriptionType === 'monthly' ? (
                   <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                ) : (
                  <button 
                    disabled={upgrading !== null}
                    onClick={(e) => { e.stopPropagation(); handleUpgradeClick('monthly'); }}
                    className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 h-10"
                  >
                    {upgrading === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPremium ? "Switch" : "Subscribe")}
                  </button>
                )}
              </div>
              
              <div className="flex items-end justify-between p-4 rounded-xl border border-indigo-500 bg-indigo-500/10 cursor-pointer" onClick={() => subscription.subscriptionType !== 'annual' && handleUpgradeClick('annual')}>
                <div>
                  <div className="text-sm text-indigo-300 font-medium mb-1">Annual (Save 20%)</div>
                  <div>
                    <span className="text-2xl font-bold text-white">₹{annualPrice}</span>
                    <span className="text-slate-400 text-sm">/yr</span>
                  </div>
                </div>
                {subscription.subscriptionType === 'annual' ? (
                   <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                ) : (
                  <button 
                    disabled={upgrading !== null}
                    onClick={(e) => { e.stopPropagation(); handleUpgradeClick('annual'); }}
                    className="text-sm font-medium text-indigo-900 bg-indigo-400 hover:bg-indigo-300 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 h-10"
                  >
                    {upgrading === 'annual' ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPremium ? "Switch" : "Subscribe")}
                  </button>
                )}
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-6 pb-6 border-b border-slate-700">
              Unlock unlimited possibilities for your lesson plans.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-slate-200">Unlimited quiz generations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-slate-200">Unlimited PDF downloads</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-slate-200">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-slate-200">Advanced customization</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

