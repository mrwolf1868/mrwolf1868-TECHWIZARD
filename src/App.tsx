/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Send, 
  LayoutDashboard, 
  Sparkles, 
  History, 
  Menu, 
  X,
  RefreshCw,
  Download,
  Info
} from 'lucide-react';
import { chatWithGemini, generateImageGemini } from './services/geminiService';

type Tab = 'chat' | 'image';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: "Hello! I'm your AI assistant. How can I help you today?", timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Image state
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      const response = await chatWithGemini(userMessage.content, history);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleImageSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!imagePrompt.trim() || isImageLoading) return;

    setIsImageLoading(true);
    try {
      const imageUrl = await generateImageGemini(imagePrompt);
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: imagePrompt,
        timestamp: new Date()
      };
      setGeneratedImages(prev => [newImage, ...prev]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsImageLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-sm border border-gray-200"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="relative h-full bg-white border-r border-gray-200 shadow-xl lg:shadow-none z-40 overflow-hidden"
      >
        <div className="w-[280px] p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-tight">Creative</h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Playground</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <SidebarLink 
              icon={<MessageSquare size={18} />} 
              label="AI Chat" 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
            />
            <SidebarLink 
              icon={<ImageIcon size={18} />} 
              label="Image Studio" 
              active={activeTab === 'image'} 
              onClick={() => setActiveTab('image')} 
            />
            <div className="pt-6 pb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-4">Resources</p>
            </div>
            <SidebarLink icon={<History size={18} />} label="History" active={false} />
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard" active={false} />
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">AI Enthusiast</p>
                <p className="text-[10px] text-gray-500 truncate">Free Plan</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm z-30">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-medium text-lg">
              {activeTab === 'chat' ? 'Conversational AI' : 'Visual Synthesis'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Info size={20} />
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs font-medium text-brand-accent px-2 py-1 bg-brand-accent/10 rounded-md">
              Gemini Flash 3
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full max-w-4xl mx-auto w-full"
              >
                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-brand-accent text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 opacity-50 ${msg.role === 'user' ? 'text-white' : 'text-gray-500'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-5 py-3 flex gap-1">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-6 bg-white">
                  <form onSubmit={handleChatSubmit} className="relative flex items-center">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all text-sm"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="absolute right-3 p-2.5 bg-brand-accent text-white rounded-xl shadow-lg shadow-brand-accent/30 hover:bg-brand-accent/90 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                  <p className="text-center text-[10px] text-gray-400 mt-4">
                    AI can make mistakes. Check important info.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="image"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
                  <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 sticky top-0">
                          <h3 className="font-display font-semibold text-xl mb-2">Generate Image</h3>
                          <p className="text-sm text-gray-500 mb-8">Describe the image you want to create in vivid detail.</p>
                          
                          <form onSubmit={handleImageSubmit} className="space-y-4">
                            <textarea 
                              value={imagePrompt}
                              onChange={(e) => setImagePrompt(e.target.value)}
                              placeholder="A futuristic city with floating neon structures..."
                              className="w-full h-32 bg-white border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all text-sm resize-none"
                            />
                            <button 
                              type="submit"
                              disabled={!imagePrompt.trim() || isImageLoading}
                              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50 group shadow-xl shadow-black/5"
                            >
                              {isImageLoading ? (
                                <RefreshCw size={20} className="animate-spin" />
                              ) : (
                                <>
                                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                                  <span>Generate Masterpiece</span>
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      </div>

                      <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <AnimatePresence>
                          {generatedImages.map((img) => (
                            <motion.div 
                              key={img.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="group relative bg-gray-100 rounded-3xl overflow-hidden aspect-square border border-gray-100 shadow-sm"
                            >
                              <img 
                                src={img.url} 
                                alt={img.prompt} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                <p className="text-white text-xs font-medium line-clamp-2 mb-4 italic">"{img.prompt}"</p>
                                <div className="flex gap-2">
                                  <button className="flex-1 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg text-xs font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-1">
                                    <Download size={14} /> Download
                                  </button>
                                  <button onClick={() => {
                                    setImagePrompt(img.prompt);
                                  }} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-white/30 transition-colors">
                                    <RefreshCw size={14} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {generatedImages.length === 0 && !isImageLoading && (
                          <div className="col-span-2 aspect-[16/9] flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                            <ImageIcon size={48} strokeWidth={1.5} className="mb-4" />
                            <p className="font-medium">No images generated yet</p>
                          </div>
                        )}
                        {isImageLoading && (
                          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-3xl animate-pulse flex items-center justify-center">
                            <RefreshCw size={32} className="text-gray-300 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/30' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-brand-accent'} transition-colors`}>
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-nav"
          className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
        />
      )}
    </button>
  );
}

