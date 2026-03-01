
import React, { useState, useEffect } from 'react';
import { WordEntry } from '../types';
import { BookmarkX, Volume2, Trash2, ArrowLeft, BookOpen } from 'lucide-react';

interface SavedWordsViewProps {
  onBack: () => void;
}

const SavedWordsView: React.FC<SavedWordsViewProps> = ({ onBack }) => {
  const [savedWords, setSavedWords] = useState<WordEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('elite_francaise_saved_words');
    if (stored) setSavedWords(JSON.parse(stored));
  }, []);

  const removeWord = (wordStr: string) => {
    const newSaved = savedWords.filter(w => w.word !== wordStr);
    setSavedWords(newSaved);
    localStorage.setItem('elite_francaise_saved_words', JSON.stringify(newSaved));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Mots Enregistrés</h2>
          <p className="text-slate-500 italic">Réviser votre lexique personnel.</p>
        </div>
      </div>

      {savedWords.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
            <BookOpen size={40} />
          </div>
          <p className="text-slate-500 font-medium">Vous n'avez pas encore enregistré de mots.</p>
          <button 
            onClick={onBack}
            className="text-blue-600 font-bold hover:underline"
          >
            Commencer à apprendre
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedWords.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{item.type}</span>
                <button 
                  onClick={() => removeWord(item.word)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  title="Supprimer"
                >
                  <BookmarkX size={20} />
                </button>
              </div>
              
              <h3 className="text-2xl font-serif font-bold text-slate-900">{item.word}</h3>
              <p className="text-slate-500 font-medium mb-4">{item.translation}</p>
              
              <div className="bg-slate-50 p-3 rounded-xl mb-3">
                <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase">Exemple</p>
                <p className="text-slate-700 text-sm italic leading-snug">« {item.example} »</p>
              </div>

              <button className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline">
                <Volume2 size={16} /> Écouter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedWordsView;
