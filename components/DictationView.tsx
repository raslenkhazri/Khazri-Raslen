
import React, { useState, useRef } from 'react';
import { fetchDictation, checkAnswerWithAI, decodeBase64, decodeAudioData } from '../services/gemini';
import { DictationSession } from '../types';
import { Play, RotateCcw, Send, CheckCircle2, AlertCircle, RefreshCw, Square, Pause } from 'lucide-react';

const DictationView: React.FC = () => {
  const [session, setSession] = useState<DictationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<{ score: number, feedback: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [totalInDb, setTotalInDb] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  React.useEffect(() => {
    fetchStats();
    return () => {
      stopAudio();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/stats');
      const data = await resp.json();
      setTotalInDb(data.dictations);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewDictation = async () => {
    stopAudio();
    setLoading(true);
    setResult(null);
    setUserInput('');
    try {
      // Try to fetch from DB first
      const response = await fetch('/api/dictations?level=B1');
      const dictations = await response.json();
      
      let textToUse;
      if (dictations && dictations.length > 0) {
        // Pick a random one from DB
        const randomDict = dictations[Math.floor(Math.random() * dictations.length)];
        textToUse = randomDict.content;
      }

      const data = await fetchDictation('B1', textToUse);
      setSession(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.resume(); // Ensure it's not suspended if we close it
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const togglePause = async () => {
    if (!audioContextRef.current || !isPlaying) return;

    if (isPaused) {
      await audioContextRef.current.resume();
      setIsPaused(false);
    } else {
      await audioContextRef.current.suspend();
      setIsPaused(true);
    }
  };

  const playAudio = async () => {
    if (!session?.audioData) return;
    
    if (isPlaying) {
      stopAudio();
      return;
    }
    
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const bytes = decodeBase64(session.audioData);
    const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (!isPaused) {
        setIsPlaying(false);
        setIsPaused(false);
      }
    };
    sourceNodeRef.current = source;
    source.start();
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handleSubmit = async () => {
    if (!session || !userInput.trim()) return;
    setChecking(true);
    try {
      const evaluation = await checkAnswerWithAI(session.content, userInput);
      setResult(evaluation);
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">La Dictée</h2>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 italic">Écoutez attentivement et écrivez ce que vous entendez.</p>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <DatabaseIcon size={10} /> {totalInDb} dictées dans la base
            </span>
          </div>
        </div>
        {!session && !loading && (
          <button 
            onClick={startNewDictation}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Commencer
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500">Préparation de votre dictée...</p>
        </div>
      )}

      {session && !loading && !result && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
          <div className="flex flex-col items-center gap-4 py-8 bg-blue-50 rounded-2xl">
            <div className="flex items-center gap-6">
              <button 
                onClick={playAudio}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${isPlaying ? 'bg-red-500' : 'bg-blue-600'}`}
              >
                {isPlaying ? <Square size={32} fill="white" /> : <Play size={32} className="ml-1" fill="white" />}
              </button>
              
              {isPlaying && (
                <button 
                  onClick={togglePause}
                  className="w-16 h-16 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center text-blue-600 shadow-lg hover:bg-blue-50 transition-all"
                >
                  {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                </button>
              )}
            </div>
            <p className="text-blue-700 font-bold">
              {isPlaying ? (isPaused ? 'En pause' : 'Lecture en cours...') : 'Commencer l\'écoute'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Votre texte</label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Écrivez ici..."
              className="w-full h-48 p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-300 focus:ring-0 text-lg leading-relaxed transition-all outline-none"
            />
          </div>

          <div className="flex gap-4">
            <button 
              onClick={startNewDictation}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200"
            >
              <RotateCcw size={20} /> Autre texte
            </button>
            <button 
              onClick={handleSubmit}
              disabled={checking || !userInput}
              className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {checking ? <RefreshCw className="animate-spin" /> : <Send size={20} />}
              Vérifier ma dictée
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 space-y-8">
          <div className="text-center">
            <div className={`inline-block p-4 rounded-full mb-4 ${result.score >= 80 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {result.score >= 80 ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
            </div>
            <h3 className="text-4xl font-serif font-bold text-slate-900 mb-1">Score : {result.score}%</h3>
            <p className="text-slate-500 font-medium">Bon travail ! Voici votre analyse.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Texte Original</h4>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 leading-relaxed font-medium">
                {session?.content}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Votre Version</h4>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed italic">
                {userInput}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> ملاحظات المعلم
            </h4>
            <p className="text-blue-900 leading-relaxed text-right" dir="rtl">{result.feedback}</p>
          </div>

          <button 
            onClick={startNewDictation}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            Nouvelle Dictée
          </button>
        </div>
      )}
    </div>
  );
};

// Helper components for icons not defined in context
const MessageSquare = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

const DatabaseIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
);

export default DictationView;
