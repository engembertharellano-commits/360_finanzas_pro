
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { FinanceAIService } from '../services/geminiService';
import { Transaction, BankAccount } from '../types';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface Props {
  transactions: Transaction[];
  accounts: BankAccount[];
}

export const AIChat: React.FC<Props> = ({ transactions, accounts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: '¡Hola! Soy tu asistente de Finanza360. ¿En qué puedo ayudarte con tu dinero hoy?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const service = new FinanceAIService();
    const aiResponse = await service.chatWithData(userMsg, { transactions, accounts });

    setMessages(prev => [...prev, { role: 'ai', content: aiResponse || 'No pude procesar eso.' }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="font-bold">Asesor Gemini</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
                  m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pensando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe tu duda financiera..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={isTyping}
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-blue-600'
        }`}
      >
        {isOpen ? <X className="text-white" /> : <MessageSquare className="text-white" />}
        {!isOpen && <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>}
      </button>
    </div>
  );
};
