
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { 
  Home, 
  BookOpen, 
  PenTool, 
  MessageSquare, 
  BrainCircuit,
  Trophy,
  Wifi,
  CloudLightning,
  Settings,
  Menu,
  Heart
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  streak: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, streak }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const navItems = [
    { id: AppView.DASHBOARD, icon: Home, label: 'Dashboard', ar: 'الرئيسية' },
    { id: AppView.DICTATION, icon: PenTool, label: 'Dictation', ar: 'إملاء' },
    { id: AppView.VOCABULARY, icon: BookOpen, label: 'Vocab', ar: 'مفردات' },
    { id: AppView.SENTENCE_BUILDER, icon: BrainCircuit, label: 'Builder', ar: 'تكوين جمل' },
    { id: AppView.TUTOR, icon: MessageSquare, label: 'AI Tutor', ar: 'المعلم الذكي' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFCFE] text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <button className="text-slate-600 hover:text-blue-600 transition-colors">
          <Settings size={24} />
        </button>
        
        <h1 className="font-serif text-2xl font-black tracking-widest text-slate-800 uppercase">
          FRANÇAIS
        </h1>
        
        <button className="text-slate-600 hover:text-blue-600 transition-colors">
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 md:pl-64 container mx-auto px-4 py-6 max-w-4xl">
        {!isOnline && (
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-800">
            <Wifi className="animate-bounce" size={20} />
            <p className="text-sm font-medium">Vous êtes hors ligne. Certaines fonctionnalités d'IA cloud nécessitent une connexion Internet.</p>
          </div>
        )}
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FDFCFE] border-t border-purple-50 flex justify-around py-4 px-6 z-40 md:hidden shadow-[0_-10px_30px_rgba(147,51,234,0.05)]">
        <button
          onClick={() => setActiveView(AppView.VOCABULARY)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeView === AppView.VOCABULARY ? 'text-purple-700 scale-110' : 'text-slate-400'
          }`}
        >
          <BookOpen size={24} fill={activeView === AppView.VOCABULARY ? 'currentColor' : 'none'} strokeWidth={2} />
          <span className="text-xs font-bold">الكلمات</span>
        </button>

        <button
          onClick={() => setActiveView(AppView.DASHBOARD)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeView === AppView.DASHBOARD ? 'text-blue-600 scale-110' : 'text-slate-400'
          }`}
        >
          <Home size={24} fill={activeView === AppView.DASHBOARD ? 'currentColor' : 'none'} strokeWidth={2} />
          <span className="text-xs font-bold">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveView(AppView.SAVED_WORDS)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeView === AppView.SAVED_WORDS ? 'text-red-500 scale-110' : 'text-slate-400'
          }`}
        >
          <Heart size={24} fill={activeView === AppView.SAVED_WORDS ? 'currentColor' : 'none'} strokeWidth={2} />
          <span className="text-xs font-bold">المفضلة</span>
        </button>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r fixed h-full pt-20 px-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={22} />
              <div className="flex flex-col items-start">
                <span className="text-sm">{item.label}</span>
                <span className="text-[10px] opacity-70 font-normal">{item.ar}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-auto mb-10 p-4 bg-slate-100 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <CloudLightning size={14} className="text-blue-600" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cloud Connected</p>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-1">NIVEAU ACTUEL</p>
          <p className="font-bold text-slate-800">Intermédiaire (B1-B2)</p>
        </div>
      </aside>
    </div>
  );
};

export default Layout;
