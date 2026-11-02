import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MiraiAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MiraiAiChatModal: React.FC<MiraiAiChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am **Mirai AI**, your anime and manga streaming companion. Ask me for personalized recommendations, episode guides, plot summaries without spoilers, or help navigating MIRAI.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverNotice, setServerNotice] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setInput('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation history for API payload
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content,
        }));

      const res = await apiClient.post<{
        configured: boolean;
        reply?: string;
        error?: string;
        suggestions?: string[];
      }>('/api/ai/chat', {
        message: textToSend,
        history: historyPayload,
      });

      if (!res.ok) {
        setErrorMessage(res.error || 'Failed to reach AI assistant service.');
        return;
      }

      const data = res.data;
      if (!data) {
        setErrorMessage('Empty response received from AI server.');
        return;
      }

      if (data.configured === false) {
        setServerNotice(
          data.reply ||
            'AI assistant backend is operational, but GEMINI_API_KEY is not configured on the server. Set GEMINI_API_KEY to activate generative responses.'
        );
      }

      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          'I received your message. Please ensure the server has GEMINI_API_KEY configured for real-time recommendations.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection to AI backend failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Recommend anime similar to Cyberpunk: Edgerunners',
    'What are the highest rated airing shows this week?',
    'Suggest a dark fantasy manga',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mirai-ai-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[620px] h-[640px] max-h-[90vh] rounded-[28px] bg-[#0c0c0e]/95 border border-white/[0.12] shadow-[0_24px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col overflow-hidden text-white select-none animate-in zoom-in-95 duration-200"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[160px] bg-[#8b5cf6]/20 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] p-[1px] flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.4)]">
              <div className="w-full h-full bg-[#0c0c0e] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#c084fc]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="mirai-ai-title" className="font-heading font-black text-sm text-white tracking-tight">
                  MIRAI AI Companion
                </h2>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30 uppercase">
                  Connected
                </span>
              </div>
              <p className="text-[11px] text-white/50">Official streaming & recommendation intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close AI chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server Notice Banner if API key unconfigured */}
        {serverNotice && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{serverNotice}</span>
          </div>
        )}

        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#8b5cf6] text-white shadow-sm'
                      : 'bg-white/10 text-[#c084fc] border border-white/10'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#8b5cf6] text-white rounded-tr-none shadow-[0_4px_16px_rgba(139,92,246,0.3)]'
                      : 'bg-white/[0.05] border border-white/[0.08] text-white/90 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <span
                    className={`block mt-1 text-[9px] ${
                      isUser ? 'text-white/60 text-right' : 'text-white/40'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-white/50 text-xs pl-1">
              <Loader2 className="w-4 h-4 animate-spin text-[#8b5cf6]" />
              <span>Mirai AI is thinking...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts if starting conversation */}
        {messages.length <= 2 && (
          <div className="px-5 pb-3">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Suggested Inquiries</p>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] text-white/70 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{p}</span>
                  <ArrowRight className="w-3 h-3 text-[#c084fc]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Box */}
        <div className="p-4 border-t border-white/[0.08] bg-black/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Mirai AI about anime, manga, or platform features..."
                disabled={isLoading}
                className="w-full h-11 pl-4 pr-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] text-xs text-white placeholder-white/30 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-11 px-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9d6ef8] hover:to-[#8b5cf6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
