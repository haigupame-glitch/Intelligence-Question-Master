import { FileText, LayoutDashboard, Settings, ListPlus, Printer, Users, LogOut, CreditCard } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { logout } from "@/src/lib/firebase";
import { useSubscription } from "@/src/hooks/useSubscription";

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const { subscription } = useSubscription();
  const isPremium = subscription.plan === 'premium';
  const navItems = [
    { id: "generate", label: "Generate Quiz", icon: ListPlus },
    { id: "editor", label: "Quiz Editor", icon: FileText },
    { id: "preview", label: "Preview & PDF", icon: Printer },
    { id: "analytics", label: "Dashboard", icon: LayoutDashboard },
    { id: "access", label: "Classes & Access", icon: Users },
    { id: "pricing", label: "Subscription", icon: CreditCard },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 sticky top-0 print:hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" />
          QuizGenius
        </h1>
        <div className="flex items-center gap-2 mt-2">
           <p className="text-xs text-slate-500 dark:text-slate-400">Smart Assessment Platform</p>
           {isPremium && (
             <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">Pro</span>
           )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
              currentView === item.id
                ? "bg-indigo-600/20 text-indigo-300"
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={() => onChangeView("settings")}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium",
            currentView === "settings" ? "bg-indigo-600/20 text-indigo-300" : ""
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button 
          onClick={logout}
          className="mt-2 flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium text-slate-400 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
