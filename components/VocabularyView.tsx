
import React, { useState, useEffect } from 'react';
import { fetchDailyWords } from '../services/gemini';
import { WordEntry } from '../types';
import { RefreshCw, Bookmark, BookmarkCheck, Volume2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

const VocabularyView: React.FC = () => {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [savedWords, setSavedWords] = useState<WordEntry[]>([]);
  const [totalInDb, setTotalInDb] = useState(0);

  useEffect(() => {
    loadWords();
    fetchStats();
    const stored = localStorage.getItem('elite_francaise_saved_words');
    if (stored) setSavedWords(JSON.parse(stored));
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/stats');
      const data = await resp.json();
      setTotalInDb(data.vocabulary);
    } catch (e) {
      console.error(e);
    }
  };

  const loadWords = async () => {
    setLoading(true);
    setCurrentIndex(0);
    try {
      const response = await fetch('/api/vocabulary?level=B1&limit=15');
      if (!response.ok) throw new Error('Failed to fetch vocabulary');
      const data = await response.json();
      setWords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const markLearned = () => {
    if (learnedCount < words.length) {
      setLearnedCount(prev => prev + 1);
      nextWord();
    }
  };

  const toggleSave = (word: WordEntry) => {
    let newSaved;
    if (savedWords.some(w => w.word === word.word)) {
      newSaved = savedWords.filter(w => w.word !== word.word);
    } else {
      newSaved = [...savedWords, word];
    }
    setSavedWords(newSaved);
    localStorage.setItem('elite_francaise_saved_words', JSON.stringify(newSaved));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Chargement de vos 15 mots du jour...</p>
      </div>
    );
  }

  const current = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;
  const isSaved = current && savedWords.some(w => w.word === current.word);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Vocabulaire du Jour</h2>
          <div className="flex items-center gap-2">
            <p className="text-slate-500">15 nouveaux mots pour enrichir votre français.</p>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <DatabaseIcon size={10} /> {totalInDb} mots dans la base
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={loadWords}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            title="Changer les mots"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">{currentIndex + 1}</span>
            <span className="text-slate-400"> / 15</span>
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {current && (
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
              {current.type}
            </span>
          </div>

          <div className="text-center mb-8 relative">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h3 className="text-4xl font-serif font-bold text-slate-900">{current.word}</h3>
              <button 
                onClick={() => toggleSave(current)}
                className={`p-2 rounded-xl transition-all ${isSaved ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-blue-500 bg-slate-50'}`}
                title={isSaved ? "Retirer des favoris" : "Enregistrer le mot"}
              >
                {isSaved ? <BookmarkCheck size={28} /> : <Bookmark size={28} />}
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 mb-4">
              <p className="text-2xl text-blue-600 font-bold" dir="rtl">{current.translation}</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Traduction Arabe</span>
            </div>
            <div className="flex justify-center">
              <button className="p-3 bg-slate-100 rounded-full hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-all">
                <Volume2 size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-tight">Définition</p>
              <p className="text-slate-700 leading-relaxed italic">{current.definition}</p>
            </div>
            
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
              <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-tight">Exemple d'utilisation</p>
              <p className="text-slate-800 leading-relaxed font-medium text-lg">« {current.example} »</p>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button 
              onClick={prevWord}
              disabled={currentIndex === 0}
              className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={markLearned}
              className="flex-1 bg-green-600 text-white font-bold rounded-2xl py-4 shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              J'ai appris ce mot
            </button>
            <button 
              onClick={nextWord}
              disabled={currentIndex === words.length - 1}
              className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components for icons not defined in context
const DatabaseIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
);

export default VocabularyView;
