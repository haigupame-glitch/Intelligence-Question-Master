import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, Moon, Sun } from "lucide-react";
import { useDarkMode } from "../../hooks/useDarkMode";

export function SettingsView() {
  const [apiKey, setApiKey] = useState("");
  const [savedStatus, setSavedStatus] = useState("");
  const { isDark, setIsDark } = useDarkMode();

  useEffect(() => {
    const saved = localStorage.getItem("quizgenius_api_key");
    if (saved) setApiKey(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem("quizgenius_api_key", apiKey);
    setSavedStatus("Settings saved successfully.");
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
