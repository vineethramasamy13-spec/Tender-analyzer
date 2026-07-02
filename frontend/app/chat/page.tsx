'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, Bot, User, MessageSquare, Plus, Sparkles,
  FileText, AlertCircle, DollarSign, TrendingUp, Award, History, Trash2,
} from 'lucide-react';
import { MOCK_CHAT_MESSAGES } from '@/lib/mockData';
import type { ChatMessage } from '@/lib/mockData';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'next/navigation';
import { chat, chatWithAnalysis, getTender } from '@/lib/api';

const suggestedQuestions = [
  { icon: FileText, text: 'Can I apply for this tender?', color: '#3B82F6' },
  { icon: AlertCircle, text: 'What certifications am I missing?', color: '#F59E0B' },
  { icon: DollarSign, text: 'How much will this project cost?', color: '#10B981' },
  { icon: TrendingUp, text: 'What are my biggest risks?', color: '#EF4444' },
  { icon: Award, text: 'Which government schemes can help me?', color: '#8B5CF6' },
  { icon: History, text: 'Show me similar tenders I\'ve won before', color: '#06B6D4' },
];

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  tenderId?: string | null;
  date: string;
}

// Simple markdown renderer that doesn't need the package
function MessageContent({ content, role }: { content: string; role: string }) {
  if (role === 'user') {
    return <p className="text-sm leading-relaxed">{content}</p>;
  }

  // For assistant, render basic markdown-like formatting
  const lines = content.split('\n');
  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-bold" style={{ color: '#F1F5F9' }}>{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('• ')) {
          return <p key={i} className="pl-2">{line}</p>;
        }
        if (line === '') {
          return <div key={i} className="h-2" />;
        }
        // Handle inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} style={{ color: '#F1F5F9' }}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const tenderId = searchParams.get('tender');

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTender, setActiveTender] = useState<any>(null);
  const [loadingTender, setLoadingTender] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sessions from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
    }
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tender_ai_chats');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ChatSession[];
          if (parsed.length > 0) {
            setSessions(parsed);
            
            const tenderParam = new URLSearchParams(window.location.search).get('tender');
            if (tenderParam) {
              const matched = parsed.find(s => s.tenderId === tenderParam);
              if (matched) {
                setCurrentSessionId(matched.id);
                setMessages(matched.messages);
              }
            } else {
              setCurrentSessionId(parsed[0].id);
              setMessages(parsed[0].messages);
            }
            return;
          }
        } catch (e) {
          console.error("Error parsing saved chats:", e);
        }
      }
      
      // Default initial session if none saved
      const defaultSession: ChatSession = {
        id: 'c1',
        title: 'NIC e-Governance Analysis',
        messages: MOCK_CHAT_MESSAGES,
        date: 'Today'
      };
      setSessions([defaultSession]);
      setCurrentSessionId('c1');
      setMessages(MOCK_CHAT_MESSAGES);
      localStorage.setItem('tender_ai_chats', JSON.stringify([defaultSession]));
    }
  }, []);

  // Load tender context on mount or param change
  useEffect(() => {
    if (tenderId && sessions.length > 0) {
      const existing = sessions.find(s => s.tenderId === tenderId);
      if (existing) {
        setCurrentSessionId(existing.id);
        setMessages(existing.messages);
        return;
      }

      const loadTender = async () => {
        setLoadingTender(true);
        try {
          const tender = await getTender(tenderId);
          if (tender) {
            setActiveTender(tender);
            const welcomeMsg: ChatMessage = {
              id: 'welcome',
              role: 'assistant',
              content: `Hello! I see you want to discuss the tender: **"${tender.title}"** by *${tender.department}*.\n\nI can help you review its scope, understand requirements, or guide you on how to prepare your proposal. What would you like to know about it?`,
              timestamp: new Date().toISOString()
            };
            const newSession: ChatSession = {
              id: `chat-${Date.now()}`,
              title: `${tender.title.slice(0, 30)}...`,
              messages: [welcomeMsg],
              tenderId: tenderId,
              date: 'Just now'
            };
            const updated = [newSession, ...sessions];
            setSessions(updated);
            setCurrentSessionId(newSession.id);
            setMessages(newSession.messages);
            localStorage.setItem('tender_ai_chats', JSON.stringify(updated));
          }
        } catch (e) {
          console.error("Error loading tender for chat:", e);
        } finally {
          setLoadingTender(false);
        }
      };
      loadTender();
    } else {
      setActiveTender(null);
    }
  }, [tenderId, sessions.length]);

  const updateSessionMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === currentSessionId) {
          let title = s.title;
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          if (firstUserMsg && (s.title === 'New Chat' || s.title === 'General Chat')) {
            title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          }
          return {
            ...s,
            title,
            messages: newMessages,
            date: 'Today'
          };
        }
        return s;
      });
      localStorage.setItem('tender_ai_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    updateSessionMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      let responseData;
      const apiHistory = nextMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const activeSession = sessions.find(s => s.id === currentSessionId);
      const activeTenderId = activeSession?.tenderId || tenderId;

      if (activeTenderId) {
        responseData = await chatWithAnalysis(activeTenderId, {
          message: message,
          history: apiHistory
        });
      } else {
        responseData = await chat({
          message: message,
          history: apiHistory
        });
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: responseData.response || responseData.text || "I'm sorry, I couldn't get a response.",
        timestamp: new Date().toISOString()
      };
      updateSessionMessages([...nextMessages, assistantMsg]);
    } catch (err) {
      console.error("Chat API error:", err);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Sorry, there was an issue communicating with the backend chat service. Based on my general knowledge regarding your question "${message}": please verify your backend server is active.`,
        timestamp: new Date().toISOString()
      };
      updateSessionMessages([...nextMessages, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your TenderAI assistant. Ask me anything about tenders, MSME benefits, or bid criteria.",
      timestamp: new Date().toISOString()
    };
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [welcomeMsg],
      date: 'Today'
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setActiveTender(null);
    localStorage.setItem('tender_ai_chats', JSON.stringify(updated));
    if (window.location.search) {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const handleSwitchSession = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;

    setCurrentSessionId(session.id);
    setMessages(session.messages);

    if (session.tenderId) {
      setLoadingTender(true);
      try {
        const tender = await getTender(session.tenderId);
        setActiveTender(tender);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTender(false);
      }
    } else {
      setActiveTender(null);
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('tender_ai_chats', JSON.stringify(updated));

    if (currentSessionId === id) {
      if (updated.length > 0) {
        handleSwitchSession(updated[0].id);
      } else {
        const welcomeMsg: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I am your TenderAI assistant. Ask me anything about tenders, MSME benefits, or bid criteria.",
          timestamp: new Date().toISOString()
        };
        const newSession: ChatSession = {
          id: `chat-${Date.now()}`,
          title: 'General Chat',
          messages: [welcomeMsg],
          date: 'Today'
        };
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
        setMessages(newSession.messages);
        setActiveTender(null);
        localStorage.setItem('tender_ai_chats', JSON.stringify([newSession]));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  if (!mounted) return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} />;


  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', height: '100vh', paddingTop: 64, display: 'flex', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <div
        className="hidden md:flex flex-col w-64 flex-shrink-0 border-r"
        style={{
          background: 'rgba(13,21,38,0.9)',
          borderColor: 'rgba(255,255,255,0.06)',
          padding: '16px',
          gap: '12px',
          overflowY: 'auto',
        }}
      >
        {/* New Chat */}
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #22C55E, #10B981)',
            color: 'white',
            fontFamily: 'Fira Sans, sans-serif',
          }}
        >
          <Plus size={16} />
          New Chat
        </button>

        {/* Context Badge */}
        {activeTender ? (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs animate-pulse"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#4ADE80',
            }}
          >
            <FileText size={12} className="flex-shrink-0" />
            <span className="truncate">Discussing: {activeTender.title}</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#64748B',
            }}
          >
            <MessageSquare size={12} className="flex-shrink-0" />
            <span className="truncate">General Chat Context</span>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-bold mb-2 px-1 text-slate-500" style={{ fontFamily: 'Fira Sans, sans-serif' }}>
            RECENT CHATS
          </p>
          {sessions.map((session) => (
            <div
              key={session.id}
              className="group relative flex items-center justify-between rounded-xl mb-1 hover:bg-white/[0.02] transition-colors"
              style={{
                background: currentSessionId === session.id ? 'rgba(34,197,94,0.12)' : 'transparent',
                border: `1px solid ${currentSessionId === session.id ? 'rgba(34,197,94,0.2)' : 'transparent'}`,
              }}
            >
              <button
                onClick={() => handleSwitchSession(session.id)}
                className="flex-1 text-left px-3 py-3 rounded-xl transition-all block overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} style={{ color: currentSessionId === session.id ? '#22C55E' : '#64748B', flexShrink: 0 }} />
                  <div className="overflow-hidden pr-6">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: currentSessionId === session.id ? '#F1F5F9' : '#94A3B8' }}
                    >
                      {session.title}
                    </p>
                    <p className="text-[10px]" style={{ color: '#64748B' }}>{session.date}</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.id);
                }}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-500 transition-all"
                title="Delete Chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* RAG Badge */}
        <div className="mt-auto">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              color: '#22C55E',
            }}
          >
            <Sparkles size={12} />
            RAG-powered — uses your tender data
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'rgba(10,15,30,0.9)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                TenderAI Assistant
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-xs truncate max-w-xs sm:max-w-md" style={{ color: '#10B981' }}>
                  {activeTender ? `Discussing: ${activeTender.title}` : 'Online · RAG Active'}
                </span>
              </div>
            </div>
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <Sparkles size={12} />
            Groq Llama 3.3 + Gemini 2.5
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {messages.length === 1 && (
            // Suggested questions grid
            <div className="my-4">
              <p className="text-sm mb-4 text-center" style={{ color: '#64748B' }}>
                Ask anything about your tenders, eligibility, or schemes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {suggestedQuestions.map((q) => {
                  const Icon = q.icon;
                  return (
                    <motion.button
                      key={q.text}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend(q.text)}
                      className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${q.color}18`, border: `1px solid ${q.color}25` }}
                      >
                        <Icon size={15} style={{ color: q.color }} />
                      </div>
                      <span className="text-sm" style={{ color: '#94A3B8' }}>{q.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                style={{
                  background: msg.role === 'assistant'
                    ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                    : 'rgba(255,255,255,0.1)',
                  border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.12)' : 'none',
                }}
              >
                {msg.role === 'assistant' ? (
                  <Bot size={16} className="text-white" />
                ) : (
                  <User size={16} style={{ color: '#94A3B8' }} />
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                <MessageContent content={msg.content} role={msg.role} />
                <p className="text-xs mt-2 opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
                >
                  <Bot size={16} className="text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl flex items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: '#3B82F6',
                        animation: `pulseSlow 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="border-t px-4 sm:px-6 py-4 flex-shrink-0"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'rgba(10,15,30,0.95)',
          }}
        >
          <div
            className="flex items-end gap-3 p-3 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <textarea
              ref={textareaRef}
              placeholder="Ask about tender eligibility, costs, risks, or schemes..."
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm"
              style={{
                color: '#F1F5F9',
                lineHeight: 1.6,
                minHeight: 24,
                maxHeight: 120,
              }}
            />

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ color: '#64748B', background: 'rgba(255,255,255,0.06)' }}
                title="Voice input"
              >
                <Mic size={16} />
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: input.trim() ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : 'rgba(255,255,255,0.06)',
                  color: input.trim() ? 'white' : '#64748B',
                }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2">
            <Sparkles size={11} style={{ color: '#64748B' }} />
            <p className="text-xs text-center" style={{ color: '#64748B' }}>
              RAG-powered · Answers grounded in your tender documents
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
