import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  // 🔴 修复：添加 ChevronRight
  ChevronRight, ChevronDown, ChevronUp, Sparkles, ArrowRight,
  LayoutGrid, Zap, GraduationCap, Utensils, Car, ShoppingCart, Clapperboard, PiggyBank, Mail, Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RAW_DATA } from '../data';
import rabbit from '../assets/rabbit.png';
import { useChat } from '../context/ChatContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ICONS_MAP = {
  'Food': <Utensils size={12}/>, 'Transportation': <Car size={12}/>, 'Shopping': <ShoppingCart size={12}/>,
  'Entertainment': <Clapperboard size={12}/>, 'Personal Care': <Sparkles size={12}/>, 'Education': <GraduationCap size={12}/>,
  'Savings': <PiggyBank size={12}/>, 'Subscription': <Mail size={12}/>, 'Misc': <Zap size={12}/>, 'Income': <Plus size={12}/>,
};
const getMonthName = (monthIndex) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthIndex];

export default function Analysis() {
  const navigate = useNavigate();
  const { openChat } = useChat();

  const [activeTab, setActiveTab] = useState('all'); 
  const [expandedSection, setExpandedSection] = useState('Flexible');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(10); // Nov
  const [selectedCategory, setSelectedCategory] = useState('Food');

  const monthlyData = useMemo(() => {
    const dataByMonth = {};
    RAW_DATA.forEach(t => {
      const date = new Date(t.date);
      const mIndex = date.getMonth(); 
      const key = `${date.getFullYear()}-${mIndex}`;
      if (!dataByMonth[key]) dataByMonth[key] = { monthIndex: mIndex, monthName: getMonthName(mIndex), totalIncome: 0, totalExpense: 0, fixedTotal: 0, flexibleTotal: 0, fixedItems: {}, flexibleItems: {}, transactions: [] };
      const amount = parseFloat(t.amount);
      const absAmount = Math.abs(amount);
      const type = (t.type || 'flexible').toLowerCase(); 
      dataByMonth[key].transactions.push(t);
      if (t.category === 'Income') dataByMonth[key].totalIncome += absAmount;
      else {
        dataByMonth[key].totalExpense += absAmount;
        if (type === 'fixed') {
          dataByMonth[key].fixedTotal += absAmount;
          dataByMonth[key].fixedItems[t.category] = (dataByMonth[key].fixedItems[t.category] || 0) + absAmount;
        } else {
          dataByMonth[key].flexibleTotal += absAmount;
          dataByMonth[key].flexibleItems[t.category] = (dataByMonth[key].flexibleItems[t.category] || 0) + absAmount;
        }
      }
    });
    return dataByMonth;
  }, []);

  const currentMonthData = useMemo(() => {
    const key = `2025-${selectedMonthIndex}`;
    return monthlyData[key] || { totalIncome: 0, totalExpense: 0, fixedTotal: 0, flexibleTotal: 0, fixedItems: {}, flexibleItems: {}, monthName: getMonthName(selectedMonthIndex) };
  }, [monthlyData, selectedMonthIndex]);

  // 预算计算逻辑
  const budgetComparison = useMemo(() => {
      let spent = 0;
      currentMonthData.transactions?.forEach(t => {
          if (t.category === selectedCategory) spent += Math.abs(t.amount);
      });
      const limit = selectedCategory === 'Transportation' ? 200 : 300; // 演示用动态预算
      const diff = limit - spent;
      const isExceeded = diff < 0;
      return { spent, limit, diff, isExceeded };
  }, [currentMonthData, selectedCategory]);

  return (
    <div className="h-full flex bg-[#F9F9F9] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-white z-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analysis</h1>
          <button onClick={openChat} className="h-9 pl-4 pr-0 rounded-full bg-red-100 flex items-center gap-1 text-xs font-bold text-black-500 justify-end overflow-hidden hover:bg-red-200 transition-colors cursor-pointer"><span className="mb-[1px]">Ask!</span><img src={rabbit} alt="Ask" className="h-full w-auto object-cover" /></button>
        </div>

        <div className="px-6 pb-6">
           <div className="flex bg-white rounded-xl p-1 gap-1">
              {['all', 'budget', 'savings'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all", activeTab === tab ? "bg-[#FCE873] text-black shadow-sm" : "text-gray-400 hover:bg-gray-50")}>{tab}</button>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
           {activeTab === 'all' && (
             <div className="animate-slide-up">
                <button onClick={() => setSelectedMonthIndex(prev => prev === 10 ? 9 : 10)} className="flex items-center gap-1 text-sm font-bold text-gray-500 mb-1">{currentMonthData.monthName} <ChevronDown size={14}/></button>
                <div className="text-6xl font-extrabold text-black mb-6 tracking-tighter">${currentMonthData.totalExpense.toFixed(2)}</div>
                <div className="flex h-6 rounded-lg overflow-hidden w-full mb-8 bg-gray-100">
                   <div className="bg-[#4FC3F7] transition-all duration-1000" style={{ width: `${(currentMonthData.flexibleTotal / currentMonthData.totalExpense) * 100}%` }}></div>
                   <div className="bg-[#AED581] transition-all duration-1000" style={{ width: `${(currentMonthData.fixedTotal / currentMonthData.totalExpense) * 100}%` }}></div>
                </div>

                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Details</h3></div>
                   <div className="mb-4">
                      <button onClick={() => setExpandedSection(expandedSection === 'Flexible' ? '' : 'Flexible')} className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100">
                         <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500"><Zap size={18}/></div><div className="text-left"><div className="font-bold text-sm">Flexible</div><div className="text-xs text-gray-400">{((currentMonthData.flexibleTotal / currentMonthData.totalExpense)*100).toFixed(0)}%</div></div></div>
                         <div className="flex items-center gap-3"><span className="font-bold text-sm">${currentMonthData.flexibleTotal.toFixed(0)}</span>{expandedSection === 'Flexible' ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}</div>
                      </button>
                      {expandedSection === 'Flexible' && (<div className="pl-16 pr-4 pt-2 space-y-3 animate-slide-down">{Object.entries(currentMonthData.flexibleItems).map(([cat, amt]) => (<div key={cat} className="flex justify-between items-center text-xs"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">{ICONS_MAP[cat] || <Zap size={10}/>}</div><span className="font-bold text-gray-700">{cat}</span></div><span className="font-bold text-gray-900">${amt.toFixed(2)}</span></div>))}</div>)}
                   </div>
                   <div>
                       <button onClick={() => setExpandedSection(expandedSection === 'Fixed' ? '' : 'Fixed')} className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#D4F673] flex items-center justify-center text-[#5A852D]"><LayoutGrid size={18}/></div><div className="text-left"><div className="font-bold text-sm">Fixed</div><div className="text-xs text-gray-400">{((currentMonthData.fixedTotal / currentMonthData.totalExpense)*100).toFixed(0)}%</div></div></div>
                            <div className="flex items-center gap-3"><span className="font-bold text-sm">${currentMonthData.fixedTotal.toFixed(0)}</span>{expandedSection === 'Fixed' ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}</div>
                        </button>
                        {expandedSection === 'Fixed' && (<div className="pl-16 pr-4 pt-2 space-y-3 animate-slide-down">{Object.entries(currentMonthData.fixedItems).map(([cat, amt]) => (<div key={cat} className="flex justify-between items-center text-xs"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">{ICONS_MAP[cat] || <LayoutGrid size={10}/>}</div><span className="font-bold text-gray-700">{cat}</span></div><span className="font-bold text-gray-900">${amt.toFixed(2)}</span></div>))}</div>)}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'budget' && (
             <div className="animate-slide-up">
                <div className="mb-2">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-xl font-bold text-gray-800 bg-transparent outline-none cursor-pointer py-2"
                    >
                        {['Food', 'Transportation', 'Shopping', 'Entertainment', 'Personal Care'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Left/Exceed Text */}
                <div className="mb-4">
                    {budgetComparison.isExceeded ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-[#FF5F5F]">${Math.abs(budgetComparison.diff).toFixed(0)}</span>
                            <span className="text-sm font-bold text-gray-400">exceed</span>
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-[#4FC3F7]">${budgetComparison.diff.toFixed(0)}</span>
                            <span className="text-sm font-bold text-gray-400">left</span>
                        </div>
                    )}
                </div>

                {/* Budget Line Chart */}
                <div className="mb-8 relative h-56 flex items-end justify-between px-2 pt-12 pb-6">
                   <div className="absolute left-0 right-0 top-[40%] border-t-2 border-dashed border-gray-300 z-0 flex justify-end">
                       <div className="text-xs font-bold text-gray-500 bg-[#F9F9F9] pl-2 -mt-6">
                           budget <br/>
                           <span className="text-black text-sm">${budgetComparison.limit}</span>
                       </div>
                   </div>

                   {/* Past Months */}
                   {['Aug', 'Sep', 'Oct'].map((m, i) => (
                       <div key={m} className="flex flex-col items-center gap-2 z-10 w-12">
                           <div className="w-12 bg-gray-300 rounded-t-lg" style={{ height: `${30 + i * 10}px` }}></div>
                           <span className="text-xs text-gray-400 font-bold">{m}</span>
                       </div>
                   ))}

                   {/* Current Month */}
                   <div className="flex flex-col items-center gap-2 z-10 w-16 relative">
                       <div className={cn(
                           "absolute -top-12 px-3 py-1.5 rounded-xl border-2 text-sm font-bold shadow-sm whitespace-nowrap animate-bounce-slow bg-white",
                           budgetComparison.isExceeded ? "border-[#FF5F5F] text-[#FF5F5F]" : "border-[#4FC3F7] text-[#4FC3F7]"
                       )}>
                           ${Math.abs(budgetComparison.diff).toFixed(0)} {budgetComparison.isExceeded ? 'exceed' : 'left'}
                           <div className={cn(
                               "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b-2 border-r-2 rotate-45",
                               budgetComparison.isExceeded ? "border-[#FF5F5F]" : "border-[#4FC3F7]"
                           )}></div>
                       </div>

                       <div className={cn(
                           "absolute top-[-10px] bottom-[30px] w-[2px] border-l-2 border-dashed",
                           budgetComparison.isExceeded ? "border-[#FF5F5F]" : "border-[#4FC3F7]"
                       )}></div>

                       <div 
                           className={cn(
                               "w-full rounded-t-xl transition-all duration-1000 relative z-10", 
                               budgetComparison.isExceeded ? "bg-[#FF5F5F]" : "bg-[#4FC3F7]"
                           )}
                           style={{ 
                               height: budgetComparison.isExceeded 
                                 ? `${130 + Math.min(60, (Math.abs(budgetComparison.diff)/budgetComparison.limit)*100)}px` 
                                 : `${(budgetComparison.spent / budgetComparison.limit) * 130}px`
                           }}
                       >
                           <div className="w-full h-full opacity-20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                       </div>
                       <span className="text-xs text-black font-bold border-b-2 border-black pb-0.5">Nov</span>
                   </div>
                </div>

                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Breakdown</h3><div className="text-xs text-gray-400">Latest <ArrowRight size={10} className="inline rotate-90"/></div></div>
                   <div className="space-y-4">
                      {RAW_DATA.filter(t => {const date = new Date(t.date); return date.getMonth() === selectedMonthIndex && t.category === selectedCategory;}).map((t, i) => (
                         <div key={i} className="flex justify-between items-center pl-2 border-b border-gray-50 pb-2">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">{ICONS_MAP[t.category] || <Zap size={14}/>}</div><div><div className="text-xs font-bold text-gray-700">{t.merchant}</div><div className="text-[10px] text-gray-400">{t.date}</div></div></div>
                            <span className="font-bold text-sm text-gray-800">${Math.abs(t.amount)}</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'savings' && (
             <div className="animate-slide-up">
                <div className="flex justify-between items-start mb-2"><button className="flex items-center gap-1 text-sm font-bold text-gray-500 uppercase">ALL <ChevronDown size={14}/></button></div>
                <div className="text-4xl font-extrabold text-black mb-4 flex items-baseline gap-2">$420.00 <span className="text-lg text-gray-400 font-medium">/ Goal</span></div>
                <div className="flex gap-1 h-12 mb-8"><div className="rounded-sm h-full bg-purple-100" style={{ width: '20%' }}></div><div className="flex-1 bg-gray-100 rounded-sm"></div></div>
                <div className="bg-[#F7F7F9] rounded-3xl p-6">
                   <div className="text-[10px] text-gray-400 font-bold uppercase mb-4">Budget helper</div>
                   <div className="font-bold text-lg mb-2">We can help you for making budget plan!</div>
                   <button onClick={openChat} className="w-full bg-[#1C1C1E] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-4 hover:bg-black transition-colors"><Sparkles size={12}/> Start a chat.</button>
                </div>
             </div>
           )}
        </div>
      </div>
      <div onClick={() => navigate('/')} className="w-4 ml-0 bg-gray-200/50 hover:bg-gray-300/50 my-4 mr-0 rounded-l-xl cursor-pointer flex items-center justify-center group shrink-0 transition-colors"><ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600"/></div>
    </div>
  );
}