import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Settings, Bot, User, School, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '您好！我是國小新生入學小幫手。請問有什麼我可以幫忙的嗎？例如：「新生報到需要帶什麼？」或「幾點要到學校？」',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState(
    '這是一所公立國小。\n新生報到時間：每年 5 月的第一個週末，上午 8:00 到 12:00。\n報到地點：學校大禮堂。\n應帶文件：戶口名簿正本及影本、入學通知單、預防接種卡影本。\n制服購買：報到當天可在學校合作社套量及購買，或自行到校外指定服裝行購買。\n開學日：通常為 8 月 30 日。\n上學時間：早上 7:30 到 7:50 之間到校。\n放學時間：低年級（一、二年級）通常為中午 12:00 放學，週二為全天課至下午 4:00。\n課後照顧：學校有提供課後照顧班，可照顧至下午 6:00，需另外收費並於報到時報名。\n午餐：學校有營養午餐，每月收費約 800-1000 元，可自備餐盒。'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contents = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      contents.push({ role: 'user', parts: [{ text: userMessage.text }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: contents,
        config: {
          systemInstruction: `你是一個友善、有耐心的國小新生入學客服機器人。
請根據以下提供的「學校資訊知識庫」來回答家長的問題。
如果家長問的問題在知識庫中找不到答案，請委婉地告訴他們你不太清楚，並建議他們直接打電話到學校教務處詢問。
回答時請保持親切的語氣，可以使用表情符號。

【學校資訊知識庫】
${knowledgeBase}`,
          temperature: 0.3,
        }
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || '抱歉，我現在有點無法思考，請稍後再試。',
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '抱歉，系統發生了一些錯誤，請稍後再試。',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full text-emerald-600">
            <School size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">新生入學 Q&A 機器人</h1>
            <p className="text-emerald-100 text-sm">您的專屬入學小幫手</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-emerald-700 rounded-full transition-colors"
          title="設定知識庫"
        >
          <Settings size={24} />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-none'
                      : 'bg-white border border-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-sm sm:prose-base prose-emerald max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="請輸入您的問題... (例如：幾點要上學？)"
            className="flex-1 resize-none border border-slate-300 rounded-xl p-3 max-h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
            rows={1}
            style={{ minHeight: '52px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 h-[52px] w-[52px] flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="text-emerald-600" />
                  知識庫設定
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 flex gap-3 text-sm">
                  <Info className="flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold mb-1">關於 NotebookLM 整合</p>
                    <p>
                      目前 NotebookLM 尚未提供公開的 API 供外部網頁直接連線查詢。
                      作為替代方案，您可以將 NotebookLM 中的筆記內容（或學校的 Q&A 文件）直接貼在下方的「知識庫」中。
                      機器人將會根據您提供的內容來回答家長的問題。
                    </p>
                  </div>
                </div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  學校資訊知識庫內容
                </label>
                <textarea
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  className="w-full h-64 border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  placeholder="請在此貼上學校的相關資訊、常見問答等..."
                />
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  儲存並關閉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
