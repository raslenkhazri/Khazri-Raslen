
import React, { useState, useRef, useEffect } from 'react';
import { createTutorChat } from '../services/gemini';
import { ChatMessage } from '../types';
import { Send, RefreshCw, User, Bot, Sparkles } from 'lucide-react';

const TutorView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = createTutorChat();
      // Initial greeting
      handleSendMessage("Bonjour Maître Gemini ! Je suis prêt pour ma séance de tutorat.");
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    if (text !== "Bonjour Maître Gemini ! Je suis prêt pour ma séance de tutorat.") {
        setMessages(prev => [...prev, userMsg]);
    }
    
    setInput('');
    setIsTyping(true);

    try {
      const chat = chatRef.current;
      const responseStream = await chat.sendMessageStream({ message: text });
      
      let fullText = "";
      const modelMsg: ChatMessage = { role: 'model', text: "", timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);

      for await (const chunk of responseStream) {
        fullText += chunk.text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...modelMsg, text: fullText };
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Désolé, j'ai rencontré un problème de connexion. Veuillez réessayer.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
            Maître Gemini <Sparkles size={20} className="text-blue-500" />
          </h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Session de tutorat en direct</p>
        </div>
        <button 
          onClick={() => {
            chatRef.current = createTutorChat();
            setMessages([]);
            handleSendMessage("Bonjour Maître Gemini !");
          }}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          title="Réinitialiser la conversation"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-hide">
        {messages.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
            <Bot size={64} className="text-slate-300" />
            <p className="text-slate-500 italic">Dites "Bonjour" pour commencer votre pratique orale et écrite.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-400'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                {msg.text || (isTyping && i === messages.length - 1 ? <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span></span> : '')}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
        className="relative group"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message ici..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-lg shadow-slate-200/50"
          disabled={isTyping}
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:bg-blue-700 active:scale-95"
        >
          {isTyping ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};

export default TutorView;
