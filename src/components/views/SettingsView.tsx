import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, Moon, Sun, Shield } from "lucide-react";
import { useDarkMode } from "../../hooks/useDarkMode";
import { db, handleFirestoreError, OperationType, auth } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function SettingsView() {
  const [apiKey, setApiKey] = useState("");
  const [savedStatus, setSavedStatus] = useState("");
  const { isDark, setIsDark } = useDarkMode();
  
  // Admin fields
  const [monthlyPrice, setMonthlyPrice] = useState("999");
  const [annualPrice, setAnnualPrice] = useState("9999");
  const [merchantUpiId, setMerchantUpiId] = useState("merchant@upi");

  useEffect(() => {
    const saved = localStorage.getItem("quizgenius_api_key");
    if (saved) setApiKey(saved);
    
    // Fetch pricing settings
    const fetchPricing = async () => {
      try {
        const docRef = doc(db, "settings", "pricing");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.monthlyPrice) setMonthlyPrice(data.monthlyPrice);
          if (data.annualPrice) setAnnualPrice(data.annualPrice);
          if (data.merchantUpiId) setMerchantUpiId(data.merchantUpiId);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchPricing();
  }, []);

  const handleSave = async () => {
    localStorage.setItem("quizgenius_api_key", apiKey);
    
    // Save pricing settings
    try {
      const docRef = doc(db, "settings", "pricing");
      await setDoc(docRef, { monthlyPrice, annualPrice, merchantUpiId }, { merge: true });
      setSavedStatus("Settings saved successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/pricing");
      setSavedStatus("Error saving settings.");
    }
    
    setTimeout(() => setSavedStatus(""), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-slate-700 dark:text-slate-300" />
          Settings
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your application preferences and integrations.</p>
      </header>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Appearance</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Toggle dark mode interface.</p>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDark ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Integrations</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gemini API Key (Optional Override)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Leave blank to use the server's default configuration.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Controls</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Configure global application settings such as subscription pricing.</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monthly Subscription Fee
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400">₹</span>
                <input
                  type="text"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="9.99"
                  className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 pl-7 pr-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Annual Subscription Fee
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400">₹</span>
                <input
                  type="text"
                  value={annualPrice}
                  onChange={(e) => setAnnualPrice(e.target.value)}
                  placeholder="99.99"
                  className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 pl-7 pr-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Merchant UPI ID
              </label>
              <input
                type="text"
                value={merchantUpiId}
                onChange={(e) => setMerchantUpiId(e.target.value)}
                placeholder="merchant@upi"
                className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-6 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-500">Note about printing</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                If printing to PDF is yielding a blank page or not working, ensure you click the specific "Print / Save to PDF" button in the Preview mode, and that your browser allows popups and print dialogs for this site.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
          
          {savedStatus && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-md">
              {savedStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
