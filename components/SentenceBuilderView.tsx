
import React, { useState, useEffect } from 'react';
import { fetchSentenceChallenge, checkAnswerWithAI } from '../services/gemini';
import { SentenceChallenge } from '../types';
import { RefreshCw, CheckCircle2, Trophy, HelpCircle, ArrowRight } from 'lucide-react';

const SentenceBuilderView: React.FC = () => {
  const [challenge, setChallenge] = useState<SentenceChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [result, setResult] = useState<{ score: number, feedback: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [totalInDb, setTotalInDb] = useState(0);

  useEffect(() => {
    loadChallenge();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/stats');
      const data = await resp.json();
      setTotalInDb(data.challenges);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChallenge = async () => {
    setLoading(true);
    setResult(null);
    setSelectedWords([]);
    try {
      // Try to fetch from DB first
      const response = await fetch('/api/challenges?level=B2');
      const challenges = await response.json();
      
      let data;
      if (challenges && challenges.length > 0) {
        data = challenges[Math.floor(Math.random() * challenges.length)];
      } else {
        data = await fetchSentenceChallenge('B2');
      }
      
      setChallenge(data);
      setAvailableWords([...data.scrambledWords].sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectWord = (word: string, index: number) => {
    setSelectedWords([...selectedWords, word]);
    const newAvailable = [...availableWords];
    newAvailable.splice(index, 1);
    setAvailableWords(newAvailable);
  };

  const deselectWord = (word: string, index: number) => {
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
  };

  const handleVerify = async () => {
    if (!challenge) return;
    setChecking(true);
    try {
      const userSentence = selectedWords.join(' ');
      const evaluation = await checkAnswerWithAI(challenge.targetSentence, userSentence);
      setResult(evaluation);
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <RefreshCw className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="text-slate-500 font-medium">Construction du défi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Construction de Phrases</h2>
          <div className="flex items-center gap-2">
            <p className="text-slate-500">Formez des structures complexes et élégantes.</p>
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <DatabaseIcon size={10} /> {totalInDb} défis dans la base
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-8">
        {/* Context Prompt */}
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex gap-4">
          <div className="bg-purple-100 p-2 rounded-xl h-fit">
            <HelpCircle className="text-purple-600" />
          </div>
          <div>
            <h4 className="text-purple-900 font-bold mb-1">المهمة</h4>
            <p className="text-purple-800 text-lg leading-relaxed text-right" dir="rtl">
              {challenge?.context}
            </p>
          </div>
        </div>

        {/* Selection Area */}
        <div className="min-h-[120px] p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-wrap gap-2 items-center">
          {selectedWords.length === 0 && (
            <p className="text-slate-400 w-full text-center italic">Appuyez sur les mots ci-dessous pour construire votre phrase</p>
          )}
          {selectedWords.map((word, idx) => (
            <button
              key={`sel-${idx}`}
              onClick={() => deselectWord(word, idx)}
              className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-slate-700 font-medium hover:bg-slate-50 active:scale-95 transition-all animate-in fade-in zoom-in duration-200"
            >
              {word}
            </button>
          ))}
        </div>

        {/* Available Words */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">MOTS DISPONIBLES</h4>
          <div className="flex flex-wrap justify-center gap-3">
            {availableWords.map((word, idx) => (
              <button
                key={`avail-${idx}`}
                onClick={() => selectWord(word, idx)}
                className="bg-slate-100 px-5 py-3 rounded-xl text-slate-600 font-medium hover:bg-purple-100 hover:text-purple-700 border border-transparent hover:border-purple-200 transition-all active:scale-90"
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {!result && (
          <div className="flex gap-4">
            <button 
              onClick={loadChallenge}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200"
            >
              Passer
            </button>
            <button 
              onClick={handleVerify}
              disabled={selectedWords.length === 0 || checking}
              className="flex-[2] py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-100 hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {checking ? <RefreshCw className="animate-spin" /> : <Trophy size={20} />}
              Vérifier
            </button>
          </div>
        )}

        {/* Result Feedback */}
        {result && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${result.score >= 90 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {result.score >= 90 ? <CheckCircle2 /> : <Trophy />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Résultat : {result.score}/100</h4>
                </div>
              </div>
              <button 
                onClick={loadChallenge}
                className="text-purple-600 font-bold flex items-center gap-1 hover:underline"
              >
                Suivant <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-2xl space-y-3">
              <div className="text-right" dir="rtl">
                <p className="text-slate-500 text-xs font-bold mb-1">التقييم</p>
                <p className="text-slate-800">{result.feedback}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-tighter">CORRECTION</p>
                <p className="text-green-700 font-medium italic">{challenge?.targetSentence}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DatabaseIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
);

export default SentenceBuilderView;
