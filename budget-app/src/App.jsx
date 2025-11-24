import React, { useState, useMemo } from 'react';
import { 
  Settings, ShoppingCart, Plus, ChevronRight, X, 
  Home, Calendar, User, Filter, Mail, Car, Clapperboard, 
  GraduationCap, PiggyBank, Sparkles, Utensils, LayoutGrid, Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { RAW_DATA } from './data'; 

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// === 辅助函数：日期格式化 ===
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
};

// === 配色方案 ===
const CATEGORIES_CONFIG = {
  'Food': { icon: <Utensils size={14} />, color: 'bg-[#f6cccc]', label: 'Food' }, 
  'Transportation': { icon: <Car size={14} />, color: 'bg-[#fffdc0]', label: 'Trans' }, 
  'Shopping': { icon: <ShoppingCart size={14} />, color: 'bg-[#d8ccdd]', label: 'Shop' }, 
  'Entertainment': { icon: <Clapperboard size={14} />, color: 'bg-[#f7c7a6]', label: 'Fun' }, 
  'Personal Care': { icon: <Sparkles size={14} />, color: 'bg-[#d8f7fd]', label: 'Care' }, 
  'Education': { icon: <GraduationCap size={14} />, color: 'bg-[#bba0c6]', label: 'Edu' }, 
  'Savings': { icon: <PiggyBank size={14} />, color: 'bg-[#dbe3cb]', label: 'Save' }, 
  'Subscription': { icon: <Mail size={14} />, color: 'bg-[#bbecf3]', label: 'Sub' }, 
  'Misc': { icon: <Zap size={14} />, color: 'bg-[#babab9]', label: 'Misc' }, 
  'Income': { icon: <Plus size={14} />, color: 'bg-gray-800', label: 'Inc' }, 
};

const INITIAL_TRANSACTIONS = RAW_DATA.map((item, index) => ({
  id: index, 
  ...item,
  amount: Math.abs(item.amount),
}));

export default function App() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [showModal, setShowModal] = useState(false);
  
  // === 表单状态 ===
  const [editingId, setEditingId] = useState(null); 
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formDate, setFormDate] = useState(''); 

  const [activeFilter, setActiveFilter] = useState('All');
  const [unit, setUnit] = useState(20);

  const toggleUnit = () => {
    const options = [20, 50, 100, 200];
    const currentIndex = options.indexOf(unit);
    const nextIndex = (currentIndex + 1) % options.length;
    setUnit(options[nextIndex]);
  };

  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (activeFilter === 'All') {
      return sorted.filter(t => t.category !== 'Income');
    }
    return sorted.filter(t => t.category === activeFilter);
  }, [activeFilter, transactions]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(INITIAL_TRANSACTIONS.map(t => t.category).filter(c => c !== 'Income'));
    return Array.from(cats);
  }, []);

  // === 交互逻辑 ===
  const handleAddClick = () => {
    setEditingId(null); 
    setAmount('');
    setMemo('');
    setSelectedCategory(null);
    setFormDate(new Date().toISOString().split('T')[0]); 
    setShowModal(true);
  };

  const handleEditClick = (transaction) => {
    setEditingId(transaction.id); 
    setAmount(transaction.amount);
    setMemo(transaction.merchant);
    setSelectedCategory(transaction.category);
    setFormDate(transaction.date); 
    setShowModal(true);
  };

  const handleSaveTransaction = () => {
    if (!amount || !selectedCategory || !formDate) return;
    const numAmount = parseFloat(amount);
    
    if (editingId !== null) {
      setTransactions(prev => prev.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            category: selectedCategory,
            merchant: memo || selectedCategory,
            amount: numAmount,
            date: formDate
          };
        }
        return t;
      }));
    } else {
      const newTrans = {
        id: Date.now(),
        category: selectedCategory,
        merchant: memo || selectedCategory,
        amount: numAmount,
        date: formDate,
      };
      setTransactions(prev => [...prev, newTrans]);
    }
    setShowModal(false);
    setEditingId(null);
    setAmount('');
    setMemo('');
    setSelectedCategory(null);
  };

  // === 核心 Grid 逻辑 ===
  const ROW_HEIGHT = 68;
  const CELLS_PER_ROW = 20;

  const displayBlocks = useMemo(() => {
    let blocks = [];
    let currentRowFill = 0;

    filteredTransactions.forEach(t => {
      const valuePerCell = unit / 20;
      let cellsNeeded = t.amount / valuePerCell;

      while (cellsNeeded > 0.01) {
        const spaceInCurrentRow = CELLS_PER_ROW - currentRowFill;
        let cellsToTake = Math.min(cellsNeeded, spaceInCurrentRow);
        
        if (cellsToTake > 0) {
            blocks.push({
                ...t, 
                uniqueKey: `${t.id}-${blocks.length}`, 
                widthPercent: (cellsToTake / CELLS_PER_ROW) * 100,
                isStart: blocks.length === 0 || blocks[blocks.length - 1].id !== t.id,
                color: CATEGORIES_CONFIG[t.category]?.color || 'bg-gray-400'
            });
        }
        cellsNeeded -= cellsToTake;
        currentRowFill += cellsToTake;
        if (currentRowFill >= CELLS_PER_ROW - 0.01) {
          currentRowFill = 0;
        }
      }
    });
    return blocks;
  }, [filteredTransactions, unit]);

  return (
    <div className="min-h-screen flex justify-center bg-gray-200 py-8 font-sans select-none">
      <div className="w-full max-w-[390px] bg-white h-[844px] rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-gray-100 box-content">
        
        {/* Header */}
        <header className="px-6 pt-10 pb-2 flex justify-between items-center bg-white z-30">
          <div className="bg-gray-200 rounded-full p-1 flex text-sm font-bold text-gray-500 w-64">
            <button className="flex-1 py-1.5 rounded-full bg-white text-black shadow-sm text-xs">M</button>
            <button className="flex-1 py-1.5 rounded-full text-xs hover:bg-gray-100/50">2W</button>
            <button className="flex-1 py-1.5 rounded-full text-xs hover:bg-gray-100/50">W</button>
            <button className="flex-1 py-1.5 rounded-full text-xs hover:bg-gray-100/50">D</button>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-red-400 border-2 border-white shadow-sm"></div>
        </header>

        {/* Filter & Unit */}
        <div className="px-6 py-4 flex items-center justify-between bg-white z-30">
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-2 overflow-hidden py-1 pl-1">
              <button onClick={() => setActiveFilter('All')} className={cn("w-9 h-9 rounded-full border-2 border-white flex items-center justify-center relative z-10 transition-transform hover:scale-110", activeFilter === 'All' ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-500")}>
                <LayoutGrid size={16} />
              </button>
              {uniqueCategories.slice(0, 4).map((cat, idx) => (
                <button key={cat} onClick={() => setActiveFilter(cat)} className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:z-20 transition-all" style={{ zIndex: 5 - idx }}>
                  {CATEGORIES_CONFIG[cat].icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
             {activeFilter !== 'All' && (
               <div className={cn("px-4 py-2 rounded-full text-white text-xs font-bold shadow-md flex items-center gap-2 animate-slide-up", CATEGORIES_CONFIG[activeFilter].color)}>
                 <span className="text-black/70">{CATEGORIES_CONFIG[activeFilter].icon}</span>
                 <span className="text-black/80">{activeFilter}</span>
                 <button onClick={() => setActiveFilter('All')} className="bg-black/10 rounded-full p-0.5 ml-1 text-black"><X size={10} /></button>
               </div>
             )}
             <button onClick={toggleUnit} className="bg-[#E5E5EA] px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-300 active:scale-95 transition">
               {unit} <span className="text-gray-400 ml-1">▼</span>
             </button>
          </div>
        </div>

        {/* ================= 核心 Grid 区域 ================= */}
        {/* 
            【修复点 1】：动态控制 overflow
            如果弹窗打开 (showModal 为 true)，则设为 overflow-hidden，彻底禁止背景滚动
        */}
        <div className={cn(
          "flex-1 custom-scrollbar bg-white",
          showModal ? "overflow-hidden" : "overflow-y-auto"
        )}>
          <div className="min-h-full relative">
            
            {/* 网格线层 */}
            <div 
              className="absolute inset-0 pointer-events-none z-20 mx-6"
              style={{
                backgroundSize: `20% ${ROW_HEIGHT}px, 5% ${ROW_HEIGHT}px, 100% ${ROW_HEIGHT}px`,
                backgroundImage: `
                  linear-gradient(to right, #C7C7CC 1px, transparent 1px),
                  linear-gradient(to right, rgb(196, 196, 201) 0.5px, transparent 0.5px),
                  linear-gradient(to bottom, #C7C7CC 1px, transparent 1px)
                `
              }}
            ></div>

            {/* 内容层 */}
            <div className="relative flex flex-wrap content-start px-6 pt-[1px]">
              {displayBlocks.map((block) => (
                <div 
                  key={block.uniqueKey}
                  onClick={() => handleEditClick(block)}
                  className={cn(
                    "h-[68px] relative transition-all hover:brightness-105 overflow-hidden cursor-pointer",
                    block.color 
                  )}
                  style={{ width: `${block.widthPercent}%` }}
                >
                  {block.isStart && block.widthPercent > 12 && (
                    <div className="absolute inset-0 z-30 pointer-events-none p-1.5">
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-black leading-none opacity-80">
                        {formatDate(block.date)}
                      </span>
                      <div className="absolute top-1.5 right-1.5 text-black opacity-80">
                        {React.cloneElement(CATEGORIES_CONFIG[block.category].icon, { size: 12 })}
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 text-[11px] font-extrabold text-black leading-none opacity-90">
                        ${block.amount}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              <div 
                onClick={handleAddClick}
                className="h-[68px] bg-gray-50/50 flex items-center justify-center text-gray-400 text-xs hover:bg-gray-100 cursor-pointer" 
                style={{ width: '20%' }}
              >
                <Plus size={16} className="mr-1"/> 
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Nav */}
        <div className="bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-end text-[10px] font-medium text-gray-400 h-20 pb-6 z-30 relative">
          <button className="flex flex-col items-center gap-1 text-black"><Home size={24} fill="black" />Home</button>
          <button className="flex flex-col items-center gap-1 hover:text-black"><Calendar size={24} />Oct 2025</button>
          <button className="flex flex-col items-center gap-1 hover:text-black"><User size={24} />My</button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="absolute inset-0 z-50">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="absolute bottom-0 left-0 right-0 bg-[#F2F2F7] rounded-t-[30px] p-6 animate-slide-up shadow-2xl h-[90%] flex flex-col">
              <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X size={20} className="text-gray-600" /></button>
              
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                {editingId ? 'Edit Transaction' : 'New Transaction'}
              </h2>

              <div className="flex items-center mb-6 border-b border-gray-300/50 pb-2">
                <span className="text-4xl font-bold text-gray-400 mr-2">$</span>
                {/* 
                   【修复点 2】：移除了 autoFocus 
                   这会阻止浏览器在弹窗打开时尝试滚动页面去定位输入框
                */}
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="bg-transparent text-5xl font-bold text-black outline-none w-full placeholder:text-gray-300" 
                />
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-gray-300/50">
                  <span className="font-semibold text-gray-900">Date</span>
                  <div className="flex items-center gap-2 text-blue-500 text-sm relative">
                    <input 
                      type="date" 
                      value={formDate} 
                      onChange={(e) => setFormDate(e.target.value)}
                      className="bg-transparent outline-none text-right font-medium text-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-300/50">
                  <span className="font-semibold text-gray-900">Merchant</span><input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Where?" className="text-right bg-transparent outline-none text-blue-500 placeholder:text-blue-300" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Category</h3></div>
                <div className="grid grid-cols-4 gap-3">
                  {Object.keys(CATEGORIES_CONFIG).filter(k => k !== 'Income').map((catKey) => {
                     const config = CATEGORIES_CONFIG[catKey];
                     const isSelected = selectedCategory === catKey;
                     return (
                        <button key={catKey} onClick={() => setSelectedCategory(catKey)} className={cn("aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition border-2 relative", isSelected ? "border-blue-500 bg-white shadow-md scale-105" : "border-transparent bg-gray-200/50")}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm", config.color)}>{config.icon}</div>
                          <span className="text-[10px] font-medium text-gray-600 truncate w-full px-1">{config.label}</span>
                        </button>
                     )
                  })}
                </div>
              </div>
              <div className="pt-4 mt-auto">
                <button 
                  onClick={handleSaveTransaction} 
                  disabled={!amount || !selectedCategory || !formDate} 
                  className="w-full bg-black text-white font-bold py-4 rounded-2xl text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
                >
                  {editingId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}