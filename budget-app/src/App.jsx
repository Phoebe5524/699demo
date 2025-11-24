import React, { useState } from 'react';
import { Settings, Coffee, ShoppingCart, Plus, ChevronRight, X, Home, Calendar, User, Filter, Mail } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 工具函数：合并类名
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 模拟初始数据
const INITIAL_DATA = [
  { id: 1, category: 'Grocery', amount: 38.67, date: 'Nov 7', color: 'bg-gray-400', width: 80 },
  { id: 2, category: 'Coffee', amount: 12.50, date: 'Nov 7', color: 'bg-[#ECAE98]', width: 30 },
  { id: 3, category: 'Fixed', amount: 25.00, date: 'Nov 8', color: 'bg-gray-500', width: 50 },
  { id: 4, category: 'Flex', amount: 15.00, date: 'Nov 8', color: 'bg-gray-300', width: 35 },
];

const CATEGORIES = [
  { id: 'coffee', name: 'Coffee', icon: <Coffee size={20} />, color: 'bg-[#ECAE98] text-white' },
  { id: 'grocery', name: 'Grocery', icon: <ShoppingCart size={20} />, color: 'bg-gray-400 text-white' },
  { id: 'fixed', name: 'Fixed', icon: <div className="font-bold text-xs">FIX</div>, color: 'bg-gray-500 text-white' },
];

export default function App() {
  const [transactions, setTransactions] = useState(INITIAL_DATA);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleAddTransaction = () => {
    if (!amount || !selectedCategory) return;
    
    const newTrans = {
      id: Date.now(),
      category: selectedCategory.name,
      amount: parseFloat(amount),
      date: 'Today',
      color: selectedCategory.color.split(' ')[0],
      width: Math.min(parseFloat(amount) * 2, 100) 
    };

    setTransactions([...transactions, newTrans]);
    setShowModal(false);
    setAmount('');
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen flex justify-center bg-gray-200 py-8">
      <div className="w-full max-w-[390px] bg-white h-[844px] rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-gray-100 box-content">
        
        {/* 头部 */}
        <header className="px-6 pt-10 pb-2 flex justify-between items-center">
          <div className="bg-gray-500/80 rounded-full p-1 flex text-sm font-medium text-white w-64">
            <button className="flex-1 py-1.5 rounded-full bg-gray-400/50 text-xs">M</button>
            <button className="flex-1 py-1.5 rounded-full text-xs opacity-70">2W</button>
            <button className="flex-1 py-1.5 rounded-full text-xs opacity-70">W</button>
            <button className="flex-1 py-1.5 rounded-full text-xs opacity-70">D</button>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-red-400 border-2 border-white"></div>
        </header>

        {/* 筛选栏 */}
        <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar items-center mb-2">
          <button className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">All</span>
          </button>
          <button className="px-4 py-2 rounded-full bg-gray-100 text-xs font-medium text-gray-600 shrink-0">Fixed</button>
          <button className="px-4 py-2 rounded-full bg-gray-100 text-xs font-medium text-gray-600 shrink-0">Flex</button>
          <div className="ml-auto bg-gray-100 px-3 py-2 rounded-full text-[10px] font-bold text-gray-500 whitespace-nowrap">
            Unit: 50
          </div>
        </div>

        {/* 主内容区 (Grid) */}
        <div className="flex-1 overflow-y-auto px-4 relative" onClick={() => setShowModal(true)}>
          {/* 装饰背景线 */}
          <div className="absolute inset-0 px-4 grid grid-cols-4 pointer-events-none opacity-10 z-0">
            <div className="border-r border-black h-full"></div>
            <div className="border-r border-black h-full"></div>
            <div className="border-r border-black h-full"></div>
            <div className="border-r border-black h-full"></div>
          </div>

          <div className="flex flex-wrap content-start gap-0.5 pb-24 relative z-10 cursor-pointer min-h-[500px]">
            {transactions.map((t) => (
              <div 
                key={t.id}
                className={cn(
                  "h-16 rounded-md border border-white/50 flex items-center justify-center relative group transition-all hover:brightness-110",
                  t.color
                )}
                style={{ width: `${t.width}px`, flexGrow: t.width > 60 ? 1 : 0 }}
              >
                {t.amount > 20 && (
                  <div className="text-[10px] font-bold text-gray-800/70 flex flex-col items-center leading-tight">
                    <span>{t.date}</span>
                    <span>${t.amount}</span>
                    {t.category === 'Grocery' && <ShoppingCart size={12} />}
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex-grow h-16 rounded-md border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs hover:bg-gray-50">
              Add
            </div>
          </div>

          {/* 悬浮按钮 */}
          <div className="absolute right-4 bottom-4 flex flex-col gap-3 z-20">
             <div className="bg-gray-100/90 backdrop-blur-sm p-1 rounded-[20px] flex flex-col items-center gap-4 py-4 shadow-lg border border-white">
                <button className="flex flex-col items-center gap-1 text-gray-600">
                   <div className="p-2 bg-white rounded-full shadow-sm"><Settings size={16}/></div>
                   <span className="text-[9px] font-medium">Recent</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-blue-500">
                   <Filter size={20}/>
                   <span className="text-[9px] font-medium">Filter on</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-600">
                   <div className="p-2 bg-white rounded-full shadow-sm"><Mail size={16}/></div>
                   <span className="text-[9px] font-medium">Budget</span>
                </button>
             </div>
          </div>
        </div>

        {/* 底部导航 */}
        <div className="bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-end text-[10px] font-medium text-gray-400 h-20 pb-6">
          <button className="flex flex-col items-center gap-1 text-black">
            <Home size={24} fill="black" />
            Home
          </button>
          <button className="flex flex-col items-center gap-1 hover:text-black">
            <Calendar size={24} />
            Nov 10
          </button>
          <button className="flex flex-col items-center gap-1 hover:text-black">
            <User size={24} />
            My
          </button>
        </div>

        {/* 弹窗 Modal */}
        {showModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowModal(false)}></div>
            <div className="bg-[#F2F2F7] rounded-t-[30px] p-6 relative animate-slide-up shadow-2xl h-[85%] z-10 flex flex-col">
              <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 p-1 bg-gray-200 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>

              <h2 className="text-lg font-semibold text-gray-800 mb-6">Your expenses</h2>

              <div className="flex items-center mb-8 border-b border-gray-300/50 pb-2">
                <span className="text-4xl font-bold text-gray-400 mr-2">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-5xl font-bold text-black outline-none w-full placeholder:text-gray-300"
                  autoFocus
                />
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-gray-300/50">
                  <span className="font-semibold text-gray-900">Date</span>
                  <div className="flex items-center gap-2 text-blue-500 text-sm">
                    Nov 14, 2025 <ChevronRight size={16} />
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300/50">
                  <span className="font-semibold text-gray-900">Memo</span>
                  <div className="flex items-center gap-2 text-blue-500 text-sm">
                    What is for? <ChevronRight size={16} />
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Envelope</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <button className="aspect-[3/4] rounded-2xl bg-gray-200/80 flex flex-col items-center justify-center gap-2">
                    <Plus size={24} className="text-gray-500"/>
                    <span className="text-sm font-medium text-gray-500">Add</span>
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-3 transition border-[3px] relative overflow-hidden",
                        selectedCategory?.id === cat.id ? "border-blue-500 bg-white shadow-sm" : "border-transparent bg-gray-300/50"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", selectedCategory?.id === cat.id ? "bg-gray-100" : "bg-white")}>
                         <span className="text-gray-600">{cat.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button 
                  onClick={handleAddTransaction}
                  disabled={!amount || !selectedCategory}
                  className="w-full bg-black text-white font-bold py-4 rounded-2xl text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}