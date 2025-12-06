import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronRight, Star } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { RAW_DATA } from '../data'; 
import rabbit from '../assets/rabbit.png'; 

// 🔴 保持你的 API KEY
const GEMINI_API_KEY = "AIzaSyBrZEMTQMHFLF7mHiSC-WOGglXAytf1Iz8"; 

// === 1. 打字机效果组件 ===
const Typewriter = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (displayedText === text) return;
    indexRef.current = 0;
    setDisplayedText('');
    hasCompletedRef.current = false;
    
    const intervalId = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(indexRef.current));
        indexRef.current++;
      } else {
        clearInterval(intervalId);
        if (!hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            onComplete();
        }
      }
    }, 15);
    return () => clearInterval(intervalId);
  }, [text]);

  const parts = displayedText.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => 
        part.startsWith('**') && part.endsWith('**') 
          ? <strong key={i} className="font-bold text-black">{part.slice(2, -2)}</strong> 
          : part
      )}
    </span>
  );
};

// === 2. API 调用逻辑 ===
const callGeminiAPI = async (userText, historyMessages) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('XXXX')) {
    return [{ role: 'assistant', type: 'text', content: "⚠️ API Key 没填！" }];
  }

  const simplifiedData = RAW_DATA.map(({ date, category, amount, merchant, type }) => ({ date, category, amount, merchant, type }));
  
  // 🟢 核心 Prompt 升级
  const systemPromptText = `
    You are "o!k", a budget assistant.
    User Data: ${JSON.stringify(simplifiedData)}
    
    RULES:
    1. KEEP TEXT SHORT (Under 40 words).
    2. IF asked for "Insight", analyze the data and give a text summary. You can append a "compare" card if relevant.
    
    === DYNAMIC UI JSON FORMAT (Append at end using |||) ===
    
    1. FOR SCENARIOS ("save money", "buffer", "goal"):
       Generate 3 scenarios.
       ||| {
         "type": "ui_scenario",
         "content": {
           "title": "Savings Plans",
           "items": [
             {"title": "Impulse Control", "desc": "Reduce shopping at Target/Uniqlo", "saved": "$40", "time": "11mo"},
             {"title": "Dining Out", "desc": "Cook dinner 2 more times/week", "saved": "$60", "time": "9mo"},
             {"title": "Subscription Audit", "desc": "Cancel unused apps", "saved": "$15", "time": "12mo"}
           ]
         }
       }

    2. FOR COMPARISONS ("compare"):
       ||| {
         "type": "ui_compare",
         "content": {
            "title": "Spending Trends",
            "items": [
               {"label": "Food", "val": 150, "max": 200, "budget": 180, "color": "bg-[#F2E88F]", "textColor": "text-[#9C8C18]"},
               {"label": "Shop", "val": 80,  "max": 100, "budget": 50,  "color": "bg-[#F2C078]", "textColor": "text-[#9C6B18]"},
               {"label": "Trans", "val": 120, "max": 150, "budget": 100, "color": "bg-[#F29F9F]", "textColor": "text-[#9E3536]"}
            ]
         }
       }

    3. FOR SUGGESTIONS ("suggestions"):
       Look for specific merchants in data (e.g. Netflix, Starbucks) to cut.
       ||| { 
         "type": "ui_suggestion", 
         "content": {
            "items": [
                {"title": "Cut Fast Food", "desc": "You spent $50 at McDonalds/TacoBell. Try meal prep?"},
                {"title": "Gas Savings", "desc": "Use rewards app at Shell/BP to save 5%."}
            ]
         } 
       }
  `;

  const formattedHistory = historyMessages
    .filter(msg => msg.content && typeof msg.content === 'string')
    .map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }));

  const contents = [
    { role: 'user', parts: [{ text: systemPromptText }] },
    { role: 'model', parts: [{ text: "Understood." }] },
    ...formattedHistory,
    { role: 'user', parts: [{ text: userText }] }
  ];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    });

    const data = await response.json();
    if (data.error) return [{ role: 'assistant', type: 'text', content: `Error: ${data.error.message}` }];

    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "");

    if (aiText.includes('|||')) {
      const [textPart, jsonPart] = aiText.split('|||');
      try {
        const uiData = JSON.parse(jsonPart.trim());
        return [
          { role: 'assistant', type: 'text', content: textPart.trim() },
          { role: 'assistant', type: uiData.type, content: uiData.content }
        ];
      } catch (e) {
        return checkForFallback(textPart.trim());
      }
    } else {
      return checkForFallback(aiText);
    }
  } catch (error) {
    return [{ role: 'assistant', type: 'text', content: "Network error." }];
  }
};

const checkForFallback = (text) => {
    const lower = text.toLowerCase();
    const result = [{ role: 'assistant', type: 'text', content: text }];
    
    // 强制 UI 兜底
    if (lower.includes('compare') || lower.includes('vs')) result.push({ role: 'assistant', type: 'ui_compare', content: null });
    else if (lower.includes('scenario') || lower.includes('buffer')) result.push({ role: 'assistant', type: 'ui_scenario', content: null });
    else if (lower.includes('suggestion') || lower.includes('advice')) result.push({ role: 'assistant', type: 'ui_suggestion', content: null });
    
    // 🔴 修复 Insight 问题：如果只有文本，就直接返回文本，不要 swallow 掉
    return result;
};

// === 3. UI 组件库 (带交互状态) ===

// 🟢 ScenarioCard: 增加滑动监听和样式切换
const ScenarioCard = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    const defaultItems = [
        { title: "Scenario #1", desc: "Buffer to savings", saved: "$40", time: "11 mo" },
        { title: "Scenario #2", desc: "Keep it flexible", saved: "$0", time: "12 mo" },
        { title: "Scenario #3", desc: "Aggressive Saving", saved: "$100", time: "8 mo" }
    ];

    const items = (data && data.items) ? data.items : defaultItems;
    const title = (data && data.title) ? data.title : "Here’s Your Scenario!";

    // 监听滚动计算 activeIndex
    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const cardWidth = 240; // min-w-[240px]
            const index = Math.round(scrollLeft / cardWidth);
            setActiveIndex(index);
        }
    };

    return (
        <div className="w-full overflow-hidden mt-2 animate-fade-in mb-4">
            <div className="bg-[#2D6E90] p-5 rounded-[24px] text-white shadow-lg relative">
                <h3 className="font-bold text-xl mb-4 text-white">{title}</h3>
                
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-6"
                >
                    {items.map((item, idx) => {
                        // 🟢 动态样式：只有当前激活的卡片是白色，其他是透明
                        const isActive = idx === activeIndex;
                        const bgClass = isActive ? 'bg-white text-gray-800' : 'bg-white/10 border border-white/20 text-white backdrop-blur-sm';
                        const titleColor = isActive ? 'text-black' : 'text-white';
                        const descColor = isActive ? 'text-gray-500' : 'text-white/70';
                        
                        return (
                            <div key={idx} className={`min-w-[240px] rounded-[20px] p-5 snap-center shadow-md flex flex-col justify-between h-48 transition-colors duration-300 ${bgClass}`}>
                                <div>
                                    <div className={`font-bold text-base mb-1 ${titleColor}`}>{item.title}</div>
                                    <div className={`text-[11px] mb-4 leading-snug ${descColor}`}>
                                        {item.desc}
                                    </div>
                                </div>
                                
                                <div>
                                    <div className={`flex h-8 rounded-lg overflow-hidden mb-2 ${isActive ? '' : 'bg-white/20'}`}>
                                        <div className={`w-[60%] bg-[#FF5F5F] ${isActive ? '' : 'opacity-50'}`}></div>
                                        {isActive && <div className="w-[15%] bg-[#7D85F2] animate-pulse"></div>}
                                        {isActive && <div className="flex-1 bg-gray-200"></div>}
                                    </div>
                                    
                                    <div className={`flex justify-between text-[10px] font-bold mb-1 ${isActive ? 'text-gray-400' : 'text-white/60'}`}>
                                        <span className="text-[#FF5F5F]">$6219</span>
                                        {item.saved && item.saved !== "$0" && <span className="text-[#7D85F2]">+{item.saved}</span>}
                                        <span>$Goal</span>
                                    </div>

                                    <div className={`text-xs font-medium mt-1 ${isActive ? 'text-gray-600' : 'text-white/60'}`}>
                                        Goal reached in <strong className="text-[#FF5F5F]">{item.time}</strong>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* 🟢 Dots 指示器联动 */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {items.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-colors duration-300 ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CompareCard = ({ data }) => {
    const defaultItems = [
        { label: 'Shopping', min: 20, max: 134, budget: 80, val: 60, color: 'bg-[#F2E88F]', textColor: 'text-[#9C8C18]' },
        { label: 'Care', min: 12, max: 99, budget: 60, val: 40, color: 'bg-[#F29F9F]', textColor: 'text-[#9E3536]' },
        { label: 'Edu', min: 14, max: 80, budget: 35, val: 28, color: 'bg-[#F2C078]', textColor: 'text-[#9C6B18]' },
    ];
    const items = (data && data.items) ? data.items : defaultItems;
    const title = (data && data.title) ? data.title : "Let’s Compare!";

    return (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 w-full mt-2 mb-4 animate-fade-in">
            <h3 className="font-bold text-black text-xl mb-6">{title}</h3>
            <div className="flex justify-between items-end h-48 px-2">
                {items.map((item, i) => {
                    const safeMax = item.max || 100;
                    const safeBudget = item.budget || 50;
                    const safeVal = item.val || 20;
                    const fillHeight = Math.min(100, Math.max(15, (safeVal / safeMax) * 100));
                    const budgetTop = Math.max(0, 100 - (safeBudget / safeMax) * 100);
                    return (
                        <div key={i} className="flex flex-col items-center gap-2 w-[30%] group relative">
                            <span className="text-[10px] font-bold text-black mb-1">Max<br/>${safeMax}</span>
                            <div className={`w-full bg-gray-100 rounded-2xl relative h-32 flex items-end justify-center overflow-visible`}>
                                <div className={`absolute inset-0 rounded-2xl ${item.color}`} style={{ opacity: 0.3 }}></div>
                                <div className="absolute left-0 right-0 border-t-[3px] border-dotted z-10 border-[#B58D50]" style={{ top: `${budgetTop}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-1 rounded bg-[#FFF8E1] text-[#B58D50] whitespace-nowrap shadow-sm z-20">
                                        Budget<br/><span className="text-xs">${safeBudget}</span>
                                    </div>
                                </div>
                                <div className={`w-full rounded-2xl mx-0 ${item.color} z-0`} style={{ height: `${fillHeight}%` }}></div>
                            </div>
                            <span className={`text-[11px] font-bold ${item.textColor} mt-1 truncate w-full text-center`}>{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 🟢 SuggestionCard: 渲染具体的建议内容
const SuggestionCard = ({ data }) => {
    // 默认数据，防止空内容
    const defaultItems = [
        { title: "Weekly Check-in", desc: "I’ll send a short reminder every Friday." },
        { title: "One-Time Transfer", desc: "Move a one-time buffer from different envelope." }
    ];
    
    // 使用 AI 生成的数据
    const items = (data && data.items && data.items.length > 0) ? data.items : defaultItems;

    return (
        <div className="w-full overflow-hidden mt-2 animate-fade-in mb-4">
            <div className="bg-[#4D6A46] p-6 rounded-[24px] text-white shadow-lg relative">
                <h3 className="font-bold text-xl mb-6">Suggestions</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-8">
                    {items.map((item, idx) => (
                        <div key={idx} className="min-w-[220px] bg-white text-black p-5 rounded-[20px] flex flex-col gap-3 snap-center shadow-md">
                            <h4 className="font-bold text-lg">{item.title}</h4>
                            <div className="flex gap-3 items-start">
                                <Star size={16} className="text-[#8FA875] fill-[#8FA875] mt-0.5 shrink-0"/>
                                <p className="text-xs text-gray-600 leading-snug">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// === 4. 气泡组件 ===
const ChatBubble = ({ msg, isLast }) => {
  const isUser = msg.role === 'user';
  const shouldAnimate = !isUser && isLast && msg.type === 'text';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-slide-up">
        <div className="bg-[#324C5B] text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm font-medium max-w-[85%] shadow-md leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-6 animate-slide-up w-full">
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-red-100 mt-1">
        <img src={rabbit} alt="AI" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {msg.type === 'text' && (
          <div className="bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm text-sm font-medium shadow-sm border border-gray-100 leading-relaxed w-fit">
            {shouldAnimate ? <Typewriter text={msg.content} /> : 
             msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => 
               part.startsWith('**') && part.endsWith('**') 
                 ? <strong key={i} className="font-bold text-black">{part.slice(2, -2)}</strong> 
                 : part
             )
            }
          </div>
        )}
        {msg.type === 'ui_scenario' && <ScenarioCard data={msg.content} />}
        {msg.type === 'ui_compare' && <CompareCard data={msg.content} />}
        {msg.type === 'ui_suggestion' && <SuggestionCard data={msg.content} />}
      </div>
    </div>
  );
};

// === 5. 主界面 ===
export default function ChatInterface() {
  const { isOpen, closeChat, messages, addMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { 
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isTyping]);

  const handleSend = async (text = inputText) => {
    if (!text.trim()) return;
    addMessage({ role: 'user', content: text, type: 'text' });
    setInputText('');
    setIsTyping(true);

    const responses = await callGeminiAPI(text, messages); 
    setIsTyping(false);

    let textLength = 0;
    if (responses.length > 0 && responses[0].type === 'text') {
        textLength = responses[0].content.length;
    }

    responses.forEach((res, idx) => {
        // 第一条文本立即发，第二条卡片等待文本打字完成
        const delay = idx === 0 ? 50 : (textLength * 15 + 400); 
        setTimeout(() => addMessage(res), delay);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] bg-[#EAF4F4] flex flex-col animate-slide-up">
      <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-[#EAF4F4]">
         <button onClick={closeChat} className="p-2 -ml-2 rounded-full hover:bg-black/5"><X size={24} className="text-gray-600"/></button>
         <div className="px-3 py-1 bg-white rounded-full shadow-sm text-xs font-bold text-gray-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> o!k
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
         {messages.map((msg, index) => (
            <ChatBubble key={msg.id} msg={msg} isLast={index === messages.length - 1} />
         ))}
         {isTyping && <div className="ml-12 text-xs text-gray-400 animate-pulse">o!k is thinking...</div>}
         <div ref={messagesEndRef} />
      </div>

      <div className="px-6 pb-2 w-full">
         {messages.length > 0 && !isTyping && (
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
               <button onClick={() => handleSend("Tell me about the insight")} className="bg-[#324C5B] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap active:scale-95 transition-transform shrink-0">Insight</button>
               <button onClick={() => handleSend("I want to save money, show scenarios")} className="bg-[#FF5F5F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap active:scale-95 transition-transform shrink-0">Scenario</button>
               <button onClick={() => handleSend("Compare my expenses between months")} className="bg-[#2D6E90] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap active:scale-95 transition-transform shrink-0">Compare</button>
               <button onClick={() => handleSend("Give me some suggestions")} className="bg-[#4D6A46] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap active:scale-95 transition-transform shrink-0">Suggestions</button>
             </div>
         )}
      </div>

      <div className="p-6 bg-white rounded-t-[30px] shadow-2xl">
         <div className="bg-[#F7F7F9] rounded-full px-2 py-2 flex items-center">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." className="flex-1 bg-transparent px-4 text-sm font-medium outline-none text-gray-700 placeholder:text-gray-400"/>
            <button onClick={() => handleSend()} className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"><Send size={18}/></button>
         </div>
         <div className="flex justify-center mt-6"><div className="h-1 w-32 bg-gray-200 rounded-full"></div></div>
      </div>
    </div>
  );
}