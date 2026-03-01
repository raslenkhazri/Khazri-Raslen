
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import VocabularyView from './components/VocabularyView';
import DictationView from './components/DictationView';
import SentenceBuilderView from './components/SentenceBuilderView';
import TutorView from './components/TutorView';
import SavedWordsView from './components/SavedWordsView';
import { AppView } from './types';
import { Sparkles, Calendar, Zap, Star, LayoutDashboard, CloudSync, Bookmark, BookOpen, PenTool, BrainCircuit, MessageSquare } from 'lucide-react';

const Dashboard: React.FC<{ setActiveView: (v: AppView) => void }> = ({ setActiveView }) => {
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('elite_francaise_saved_words');
    if (stored) {
      setSavedCount(JSON.parse(stored).length);
    }
  }, []);

  const cards = [
    { 
      id: AppView.VOCABULARY, 
      title: 'المفردات', 
      icon: <BookOpen size={64} />, 
      color: 'bg-[#E9C46A]', 
      footerColor: 'bg-[#264653]/10' 
    },
    { 
      id: AppView.DICTATION, 
      title: 'الإملاء', 
      icon: <PenTool size={64} />, 
      color: 'bg-[#264653]', 
      footerColor: 'bg-black/20' 
    },
    { 
      id: AppView.SENTENCE_BUILDER, 
      title: 'تكوين جمل', 
      icon: <BrainCircuit size={64} />, 
      color: 'bg-[#8ECAE6]', 
      footerColor: 'bg-[#264653]/10' 
    },
    { 
      id: AppView.TUTOR, 
      title: 'المعلم الذكي', 
      icon: <MessageSquare size={64} />, 
      color: 'bg-[#F4A261]', 
      footerColor: 'bg-black/10' 
    },
    { 
      id: AppView.SAVED_WORDS, 
      title: 'المفضلة', 
      icon: <Star size={64} />, 
      color: 'bg-[#E76F51]', 
      footerColor: 'bg-black/20' 
    },
    { 
      id: AppView.DASHBOARD, 
      title: 'الإحصائيات', 
      icon: <LayoutDashboard size={64} />, 
      color: 'bg-[#FEFAE0]', 
      footerColor: 'bg-black/5',
      textColor: 'text-slate-800'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {cards.map((card, idx) => (
        <button
          key={idx}
          onClick={() => setActiveView(card.id)}
          className={`${card.color} rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-between group h-60`}
        >
          <div className="flex-1 flex items-center justify-center group-hover:scale-110 transition-transform p-6">
            <div className={card.textColor || 'text-white'}>
              {React.cloneElement(card.icon as React.ReactElement, { size: 64 })}
            </div>
          </div>
          <div className={`${card.footerColor} w-full py-3 text-center backdrop-blur-sm`}>
            <span className={`text-lg font-bold ${card.textColor || 'text-white'} tracking-tight`}>
              {card.title}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [streak, setStreak] = useState(5);

  const renderView = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return <Dashboard setActiveView={setActiveView} />;
      case AppView.VOCABULARY:
        return <VocabularyView />;
      case AppView.DICTATION:
        return <DictationView />;
      case AppView.SENTENCE_BUILDER:
        return <SentenceBuilderView />;
      case AppView.TUTOR:
        return <TutorView />;
      case AppView.SAVED_WORDS:
        return <SavedWordsView onBack={() => setActiveView(AppView.DASHBOARD)} />;
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView} streak={streak}>
      {renderView()}
    </Layout>
  );
};

export default App;
