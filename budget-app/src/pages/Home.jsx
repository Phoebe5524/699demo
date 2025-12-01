import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, ShoppingCart, Plus, X, 
  Filter, Mail, Car, Clapperboard, // 👈 删除了 Home, Calendar, User
  GraduationCap, PiggyBank, Sparkles, Utensils, LayoutGrid, Zap,
  History, ChevronDown, AlignJustify, Columns, Rows, Check, RefreshCcw,
  ArrowRight, ArrowLeft, MoveHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { RAW_DATA } from '../data'; 

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// === 辅助函数 ===
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
};

const getMonthName = (date) => {
  return date.toLocaleString('default', { month: 'long' });
};

// === 配色方案 ===
const CATEGORIES_CONFIG = {
    'Food': { icon: <Utensils />, color: 'bg-[#BADA85]/60', textColor: 'text-[#d48888]', label: 'Food' }, 
    'Transportation': { icon: <Car />, color: 'bg-[#7D85F2]/60', textColor: 'text-[#7abdc5]', label: 'Trans' }, 
    'Shopping': { icon: <ShoppingCart />, color: 'bg-[#fcf373]/60', textColor: 'text-[#a88baec]', label: 'Shop' }, 
    'Entertainment': { icon: <Clapperboard />, color: 'bg-[#7D5CF1]/60', textColor: 'text-[#d6966d]', label: 'Fun' }, 
    'Personal Care': { icon: <Sparkles />, color: 'bg-[#F24F50]/60', textColor: 'text-[#8bcdd6]', label: 'Care' }, 
    'Education': { icon: <GraduationCap />, color: 'bg-[#FCC773]/60', textColor: 'text-[#8e6fa0]', label: 'Edu' }, 
    'Savings': { icon: <PiggyBank />, color: 'bg-[#7DBFF2]/60', textColor: 'text-[#96a37e]', label: 'Save' }, 
    'Subscription': { icon: <Mail />, color: 'bg-[#F27DDC]/60', textColor: 'text-[#c9c568]', label: 'Sub' }, 
    'Misc': { icon: <Zap />, color: 'bg-[#FC7373]/60', textColor: 'text-[#888888]', label: 'Misc' }, 
    'Income': { icon: <Plus />, color: 'bg-gray-800', textColor: 'text-white', label: 'Inc' }, 
  };

const INITIAL_TRANSACTIONS = RAW_DATA.map((item, index) => ({
  id: index, 
  ...item,
  amount: Math.abs(item.amount),
}));

export default function Home() {
  const navigate = useNavigate();

  // === Data State ===
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  
  // === UI View State ===
  const [viewMode, setViewMode] = useState('Month'); 
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); 
  
  // === Filter State ===
  const [spendingType, setSpendingType] = useState('ALL'); 
  const [unit, setUnit] = useState(50);
  const [selectedEnvelopes, setSelectedEnvelopes] = useState([]); 
  const [isFilterOn, setIsFilterOn] = useState(true); 
  const [showEnvelopeModal, setShowEnvelopeModal] = useState(false);
  const [sortType, setSortType] = useState('newest'); 

  // === Modal / Editing State ===
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formDate, setFormDate] = useState('');

  // === Drag Interaction State ===
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragAmount, setDragAmount] = useState(0);
  const [dragPhase, setDragPhase] = useState('start'); 
  const gridRef = useRef(null);

  // === Logic: Date Navigation ===
  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  // === Logic: Filter Data ===
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    // 1. Filter by Month
    const curYear = currentDate.getFullYear();
    const curMonth = currentDate.getMonth() + 1; 
    data = data.filter(t => {
      const [y, m] = t.date.split('-');
      return parseInt(y) === curYear && parseInt(m) === curMonth;
    });

    // 2. Filter by Spending Type
    if (spendingType !== 'ALL') {
      data = data.filter(t => t.type === spendingType);
    } else {
      data = data.filter(t => t.category !== 'Income');
    }

    // 3. Filter by Envelopes
    if (isFilterOn && selectedEnvelopes.length > 0) {
      data = data.filter(t => selectedEnvelopes.includes(t.category));
    }

    // 4. Sort
    data.sort((a, b) => {
      if (sortType === 'newest') return new Date(b.date) - new Date(a.date);
      return new Date(a.date) - new Date(b.date); 
    });

    return data;
  }, [transactions, spendingType, selectedEnvelopes, isFilterOn, sortType, currentDate]);

  const toggleEnvelope = (cat) => {
    if (selectedEnvelopes.includes(cat)) {
      setSelectedEnvelopes(prev => prev.filter(c => c !== cat));
    } else {
      if (selectedEnvelopes.length < 5) {
        setSelectedEnvelopes(prev => [...prev, cat]);
      }
    }
  };

  // === Logic: Unit Toggle ===
  const toggleUnit = () => {
    const options = [50, 100, 200];
    const currentIndex = options.indexOf(unit);
    const nextIndex = (currentIndex + 1) % options.length;
    setUnit(options[nextIndex]);
  };

  // === Logic: Drag to Add ===
  const handleDragStart = (e) => {
    setIsDragging(true);
    setDragPhase('start');
    setDragAmount(0);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartX;
    const pixelsPerUnit = 200; 
    const calculatedAmount = (Math.abs(deltaX) / pixelsPerUnit) * unit;
    
    setDragAmount(calculatedAmount);

    if (deltaX > 10) setDragPhase('adding');
    else if (deltaX < -10) setDragPhase('reducing');
    else setDragPhase('start');
  };

  const handleDragEnd = () => {
    if (isDragging && dragAmount > 0) {
      handleAddClick(parseFloat(dragAmount.toFixed(2)));
    }
    setIsDragging(false);
    setDragPhase('start');
    setDragAmount(0);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragStartX, dragAmount]); 


  // === Modal Handlers ===
  const handleAddClick = (initialAmount = '') => {
    setEditingId(null);
    setAmount(initialAmount || '');
    setMemo('');
    setSelectedCategory(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowEditModal(true);
  };

  const handleEditClick = (transaction) => {
    setEditingId(transaction.id);
    setAmount(transaction.amount);
    setMemo(transaction.merchant);
    setSelectedCategory(transaction.category);
    setFormDate(transaction.date);
    setShowEditModal(true);
  };

  const handleSaveTransaction = () => {
    if (!amount || !selectedCategory || !formDate) return;
    const numAmount = parseFloat(amount);
    const newType = ['Food', 'Shopping', 'Entertainment'].includes(selectedCategory) ? 'Flexible' : 'Fixed'; 

    if (editingId !== null) {
      setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, category: selectedCategory, merchant: memo || selectedCategory, amount: numAmount, date: formDate, type: newType } : t));
    } else {
      setTransactions(prev => [...prev, { id: Date.now(), category: selectedCategory, merchant: memo || selectedCategory, amount: numAmount, date: formDate, type: newType }]);
    }
    setShowEditModal(false);
  };

  // === Grid Calculation ===
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
        if (currentRowFill >= CELLS_PER_ROW - 0.01) currentRowFill = 0;
      }
    });
    return blocks;
  }, [filteredTransactions, unit]);

  const totalRowsNeeded = Math.max(8, Math.ceil(displayBlocks.reduce((acc, b) => acc + b.widthPercent, 0) / 100) + 2);

  return (
    <div className="h-full flex flex-col relative bg-white">
        
        {/* === Header (Z-Index 50) === */}
        <header className="px-6 pt-12 pb-4 bg-white z-50 relative">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)}><ChevronLeft size={20} className="text-gray-400"/></button>
              <div className="flex items-baseline gap-1 cursor-pointer">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {viewMode === 'Weekly' ? <span>Nov <span className="text-red-500">17-30</span></span> : getMonthName(currentDate)}
                </h1>
                <span className="text-sm font-bold text-gray-400">{currentDate.getFullYear()}</span>
              </div>
              <button onClick={() => changeMonth(1)}><ChevronRight size={20} className="text-gray-400"/></button>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => setShowViewMenu(!showViewMenu)}
                 className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
               >
                 <LayoutGrid size={20}/>
               </button>
               <div className="h-10 px-3 rounded-full bg-red-100 flex items-center gap-2 text-sm font-bold text-red-500">
                  Ask! 
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px]">🤖</div>
               </div>
            </div>
          </div>

          {showViewMenu && (
            <div className="absolute right-6 top-24 bg-white rounded-xl p-1 shadow-2xl flex flex-col gap-1 z-50 w-36 animate-slide-up border border-gray-100">
               {['Biweekly', 'Weekly', 'Daily'].map(m => (
                 <button key={m} onClick={() => {setViewMode(m); setShowViewMenu(false)}} className="px-3 py-2.5 text-sm font-medium text-left hover:bg-gray-50 rounded-lg flex justify-between items-center text-gray-700">
                   {m}
                   {m === 'Weekly' && <Rows size={14} className="text-gray-400"/>}
                   {m === 'Daily' && <AlignJustify size={14} className="text-gray-400"/>}
                   {m === 'Biweekly' && <Columns size={14} className="text-gray-400"/>}
                 </button>
               ))}
            </div>
          )}
        </header>

        {/* === Filter / Drag Banner === */}
        <div className="px-6 pb-2 z-30 relative h-14 bg-white">
          {!isDragging ? (
            <div className="flex justify-between items-center animate-slide-up">
              <div className="flex gap-2 flex-1 mr-3">
                {['ALL', 'Fixed', 'Flexible'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setSpendingType(type)}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-1.5",
                      spendingType === type ? "bg-[#333] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    {type === 'ALL' && 'ALL'}
                    {type === 'Fixed' && <LayoutGrid size={16} />}
                    {type === 'Flexible' && <Zap size={16} />}
                    {type !== 'ALL' && type}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={toggleUnit}
                className="bg-[#F2F2F7] px-4 py-3 rounded-2xl text-sm font-bold text-[#543CCB] hover:bg-gray-200 min-w-[70px] flex justify-between items-center"
              >
                {unit} <ChevronDown size={14}/>
              </button>
            </div>
          ) : (
            <div className={cn(
              "absolute inset-x-6 top-0 bottom-2 rounded-2xl flex items-center justify-between px-4 font-bold text-sm shadow-sm transition-colors",
              dragPhase === 'adding' ? "bg-yellow-200 text-yellow-900 border border-yellow-400" :
              dragPhase === 'reducing' ? "bg-blue-100 text-blue-900 border border-blue-300" : "bg-yellow-50 text-yellow-800 border border-yellow-200"
            )}>
               <div className="flex items-center gap-2">
                  {dragPhase === 'start' && <span>Drag to start</span>}
                  {dragPhase === 'adding' && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">Adding</span>}
                  {dragPhase === 'reducing' && <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">Reducing</span>}
                  
                  {dragPhase !== 'start' && <span>Roughly ${dragAmount.toFixed(2)}</span>}
               </div>
               <div className="flex gap-1"><MoveHorizontal size={16}/></div>
            </div>
          )}
        </div>

        {/* ================= Grid ================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative" ref={gridRef}>
          <div className="min-h-full relative pb-24 flex">
            
            {/* 左侧跳页块 */}
            <div 
              onClick={() => navigate('/analysis')}
              className="w-4 mr-4 bg-gray-100/50 hover:bg-gray-200/50 rounded-r-xl my-4 ml-0 cursor-pointer flex items-center justify-center group"
            >
               <ChevronLeft size={16} className="text-gray-300 group-hover:text-gray-500"/>
            </div>

            <div className="flex-1 relative">
                <div 
                  className="absolute inset-0 pointer-events-none z-1 border-r border-[#C7C7CC]"
                  style={{
                    backgroundSize: `20% ${ROW_HEIGHT}px, 5% ${ROW_HEIGHT}px, 100% ${ROW_HEIGHT}px`,
                    backgroundImage: `
                      linear-gradient(to right, #A29FAB 1px, transparent 1px),
                      linear-gradient(to right, #E3E2E8 1px, transparent 0.5px),
                      linear-gradient(to bottom, #A29FAB 1px, transparent 1px)
                    `
                  }}
                ></div>

                <div className="absolute -right-6 top-0 bottom-0 flex flex-col items-center pointer-events-none z-10">
                   {Array.from({ length: totalRowsNeeded }).map((_, i) => (
                     <div key={i} className="flex items-end justify-end pr-1 text-[9px] text-gray-400 font-bold" style={{ height: ROW_HEIGHT }}>
                       {(i + 1) * unit}
                     </div>
                   ))}
                </div>

                <div className="relative flex flex-wrap content-start pt-[1px]">
                  {displayBlocks.map((block) => (
                    <div 
                      key={block.uniqueKey}
                      onClick={() => !isDragging && handleEditClick(block)}
                      className={cn("h-[68px] relative transition-all hover:brightness-105 overflow-hidden cursor-pointer", block.color)}
                      style={{ width: `${block.widthPercent}%` }}
                    >
                      {block.isStart && block.widthPercent > 12 && (
                        <div className="absolute inset-0 z-30 pointer-events-none p-1.5">
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-black leading-none opacity-80">{formatDate(block.date)}</span>
                          <div className="absolute top-1.5 right-1.5 text-black opacity-80">{React.cloneElement(CATEGORIES_CONFIG[block.category].icon, { size: 12 })}</div>
                          <span className="absolute bottom-1.5 left-1.5 text-[11px] font-extrabold text-black leading-none opacity-90">${block.amount}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div 
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    className={cn(
                      "h-[68px] flex flex-col items-center justify-center text-gray-500 text-xs cursor-pointer border border-dashed border-gray-300 transition-colors z-30",
                      isDragging ? "bg-yellow-100 border-yellow-400" : "bg-gray-50 hover:bg-gray-100"
                    )}
                    style={{ width: isDragging ? `${Math.max(20, (dragAmount/unit)*20*5)}%` : '20%', minWidth: '20%' }}
                  >
                    {!isDragging && <Plus size={16} className="mb-1"/>}
                    <span className="text-[10px] font-bold">{isDragging ? 'Insert...' : 'Insert'}</span>
                  </div>
                </div>
            </div>

            {/* 右侧跳页块 */}
            <div 
              onClick={() => navigate('/envelope')}
              className="w-4 ml-8 bg-gray-100/50 hover:bg-gray-200/50 rounded-l-xl my-4 mr-0 cursor-pointer flex items-center justify-center group"
            >
               <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500"/>
            </div>

          </div>

          <div className="sticky bottom-6 float-right right-6 flex flex-col gap-4 z-40 mb-4 mr-6 items-end">
             <div className="bg-gray-100/90 backdrop-blur-md p-1.5 rounded-[20px] flex flex-col items-center gap-4 py-3 shadow-lg border border-white/50 w-14">
                <button onClick={() => setShowEnvelopeModal(true)} className="flex flex-col items-center gap-1 group w-full">
                   <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-700 border border-gray-200"><Mail size={18}/></div>
                   <span className="text-[8px] font-bold text-gray-500">Envelope</span>
                </button>
                <button onClick={() => setIsFilterOn(!isFilterOn)} className="flex flex-col items-center gap-1 group w-full">
                   <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isFilterOn ? "text-[#543CCB] bg-purple-100" : "text-gray-400")}>
                     <Filter size={18} />
                   </div>
                   <span className={cn("text-[8px] font-bold", isFilterOn ? "text-[#543CCB]" : "text-gray-400")}>{isFilterOn ? "On" : "Off"}</span>
                </button>
             </div>
             <button onClick={() => setSortType(prev => prev === 'newest' ? 'oldest' : 'newest')} className="w-14 h-14 bg-gray-800 rounded-[22px] shadow-xl flex flex-col items-center justify-center text-white gap-0.5 hover:bg-gray-900 transition active:scale-95">
                <History size={20} className={sortType === 'oldest' ? "rotate-180" : ""}/>
                <span className="text-[8px] font-medium">Recent</span>
             </button>
          </div>
        </div>

        {/* Envelope Modal */}
        {showEnvelopeModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowEnvelopeModal(false)}></div>
            <div className="bg-white rounded-t-[30px] p-6 animate-slide-up shadow-2xl relative h-[60%] flex flex-col">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h2 className="text-xl font-bold text-gray-900">Filter by Envelope</h2>
                   <p className="text-xs text-gray-400">Subtitle here type it</p>
                 </div>
                 <button onClick={() => setShowEnvelopeModal(false)}><X size={24} className="text-gray-400"/></button>
               </div>
               <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start py-4">
                  {Object.keys(CATEGORIES_CONFIG).filter(k => k !== 'Income').map(cat => {
                    const isSelected = selectedEnvelopes.includes(cat);
                    const config = CATEGORIES_CONFIG[cat];
                    return (
                      <button key={cat} onClick={() => toggleEnvelope(cat)} className={cn("flex items-center justify-between px-4 py-3 rounded-2xl border transition-all", isSelected ? `${config.color} border-transparent` : "bg-white border-gray-100 hover:border-gray-300")}>
                         <div className="flex items-center gap-2">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs", isSelected ? "bg-white/50 text-black" : "bg-gray-100 text-gray-500")}>
                              {React.cloneElement(config.icon, { size: 14 })}
                            </div>
                            <span className={cn("text-sm font-bold", isSelected ? "text-black" : "text-gray-700")}>{cat}</span>
                         </div>
                         {isSelected ? <Check size={16} className="text-black"/> : <Plus size={16} className="text-gray-300"/>}
                      </button>
                    )
                  })}
               </div>
               <div className="pt-4 flex gap-3">
                  <button onClick={() => setSelectedEnvelopes([])} className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"><RefreshCcw size={20} /></button>
                  <button onClick={() => setShowEnvelopeModal(false)} className="flex-1 bg-gray-800 text-white font-bold rounded-2xl text-sm shadow-lg hover:bg-gray-900">{selectedEnvelopes.length}/5 View Results</button>
               </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showEditModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setShowEditModal(false)}></div>
            <div className="bg-[#F4F2F9] h-[85%] rounded-t-[35px] flex flex-col animate-slide-up relative overflow-hidden">
                <header className="px-6 pt-8 pb-4 flex justify-between items-center">
                   <button onClick={() => setShowEditModal(false)}><ChevronDown size={28} className="text-gray-400 rotate-90"/></button>
                   <h2 className="text-lg font-bold text-[#543CCB]">{editingId ? 'Review' : 'Review'}</h2>
                   <div className="px-3 py-1 rounded-full bg-[#543CCB] text-white text-xs font-bold flex items-center gap-1"><Sparkles size={10}/> Ask?</div>
                </header>
                <div className="flex-1 overflow-y-auto px-6">
                   <div className="flex items-center justify-center mb-10 mt-4 relative">
                     <span className="text-4xl font-bold text-gray-400 mr-1">$</span>
                     <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="bg-transparent text-[64px] font-extrabold text-black outline-none w-auto text-center placeholder:text-gray-400 min-w-[120px]" />
                   </div>
                   <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                         <span className="text-sm font-bold text-[#543CCB]">Date</span>
                         <div className="bg-white/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="bg-transparent text-sm font-bold text-[#543CCB] outline-none"/>
                         </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-[#543CCB]/20">
                         <span className="text-sm font-bold text-[#543CCB]">Memo</span>
                         <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What is for?" className="text-right bg-transparent outline-none text-[#543CCB] placeholder:text-[#543CCB]/40 font-medium"/>
                      </div>
                   </div>
                   <div className="mb-4 flex justify-between items-center">
                     <h3 className="font-bold text-lg text-black">Envelope</h3>
                     <div className="flex items-center gap-1 text-xs text-gray-500"><History size={12}/> Recent</div>
                   </div>
                   <div className="grid grid-cols-3 gap-3 mb-24">
                      <button className="aspect-square rounded-2xl bg-white/40 flex flex-col items-center justify-center gap-2 text-gray-500 hover:bg-white/60"><Plus size={24}/><span className="text-xs font-bold">Add</span></button>
                      {Object.keys(CATEGORIES_CONFIG).filter(k => k !== 'Income').map((catKey) => {
                         const config = CATEGORIES_CONFIG[catKey];
                         const isSelected = selectedCategory === catKey;
                         return (
                            <button key={catKey} onClick={() => setSelectedCategory(catKey)} className={cn("aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all relative border-[3px]", isSelected ? `bg-white ${config.textColor.replace('text-', 'border-')} shadow-lg scale-105` : "bg-white/40 border-transparent hover:bg-white/60")}>
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isSelected ? config.color : "bg-white/50 text-gray-400")}>
                                 {React.cloneElement(config.icon, { size: 18, className: isSelected ? "text-black" : "" })}
                              </div>
                              <span className={cn("text-[10px] font-bold", isSelected ? "text-black" : "text-gray-500")}>{config.label}</span>
                            </button>
                         )
                      })}
                   </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#F4F2F9] border-t border-[#543CCB]/10 flex gap-4">
                   <button className="w-14 h-14 rounded-2xl bg-white/50 flex flex-col items-center justify-center text-[10px] font-bold text-gray-500 gap-1 hover:bg-white/70"><div className="w-4 h-4 bg-gray-400 rounded-sm"></div>Save</button>
                   <button onClick={handleSaveTransaction} className="flex-1 bg-[#1C1C1E] text-white font-bold rounded-2xl text-lg shadow-xl hover:bg-black">Looks good!</button>
                </div>
            </div>
          </div>
        )}
    </div>
  );
}