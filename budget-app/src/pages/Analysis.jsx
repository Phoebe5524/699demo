import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, ChevronDown, ChevronUp, Sparkles, 
  LayoutGrid, Zap, ArrowUpDown, GraduationCap, Utensils, Car, ShoppingCart, Clapperboard, PiggyBank, Mail, Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RAW_DATA } from '../data';
import chatBotBubble from '../assets/chatbotbubble.png';
import rabbit from '../assets/rabbit.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// === 图标映射 ===
const ICONS_MAP = {
  'Food': <Utensils size={12}/>,
  'Transportation': <Car size={12}/>,
  'Shopping': <ShoppingCart size={12}/>,
  'Entertainment': <Clapperboard size={12}/>,
  'Personal Care': <Sparkles size={12}/>,
  'Education': <GraduationCap size={12}/>,
  'Savings': <PiggyBank size={12}/>,
  'Subscription': <Mail size={12}/>,
  'Misc': <Zap size={12}/>,
  'Income': <Plus size={12}/>,
};

// === 辅助函数：获取月份名称 ===
const getMonthName = (monthIndex) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex];
};

export default function Analysis() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); 
  const [expandedSection, setExpandedSection] = useState('Flexible');
  
  // 状态：当前选中的月份（默认为 11 月，即索引 10）
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(10); 
  // 状态：Budget 页面选中的分类
  const [selectedCategory, setSelectedCategory] = useState('Food');

  // === 核心数据处理 ===
  
  // 1. 获取所有月份的汇总数据 (按月份分组)
  const monthlyData = useMemo(() => {
    const dataByMonth = {};

    RAW_DATA.forEach(t => {
      const date = new Date(t.date);
      const mIndex = date.getMonth(); // 0-11
      const key = `${date.getFullYear()}-${mIndex}`;

      if (!dataByMonth[key]) {
        dataByMonth[key] = {
          monthIndex: mIndex,
          monthName: getMonthName(mIndex),
          totalIncome: 0,
          totalExpense: 0,
          fixedTotal: 0,
          flexibleTotal: 0,
          fixedItems: {}, // { 'Rent': 1000, 'Sub': 10 }
          flexibleItems: {}, // { 'Food': 200, 'Shop': 50 }
          transactions: []
        };
      }

      const amount = parseFloat(t.amount);
      const absAmount = Math.abs(amount);
      const type = (t.type || 'flexible').toLowerCase(); // 兼容大小写

      dataByMonth[key].transactions.push(t);

      if (t.category === 'Income') {
        dataByMonth[key].totalIncome += absAmount;
      } else {
        // 是支出
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

  // 2. 获取当前选中月份的数据
  const currentMonthData = useMemo(() => {
    const key = `2025-${selectedMonthIndex}`;
    return monthlyData[key] || { 
      totalIncome: 0, totalExpense: 0, fixedTotal: 0, flexibleTotal: 0, 
      fixedItems: {}, flexibleItems: {}, monthName: getMonthName(selectedMonthIndex) 
    };
  }, [monthlyData, selectedMonthIndex]);

  // 3. 计算 Budget 图表数据 (跨月份趋势)
  const categoryTrendData = useMemo(() => {
    // 找出所有月份，计算 selectedCategory 的花费
    const months = [8, 9, 10]; // Aug, Sep, Oct, Nov (Mocking prev months, focusing on 9(Oct) & 10(Nov))
    return months.map(mIdx => {
        const key = `2025-${mIdx}`;
        const mData = monthlyData[key];
        let amount = 0;
        
        // 查找该月该分类的总额
        if (mData) {
            mData.transactions.forEach(t => {
                if (t.category === selectedCategory && t.category !== 'Income') {
                    amount += Math.abs(t.amount);
                }
            });
        }
        
        return {
            month: getMonthName(mIdx).substring(0, 3), // "Nov"
            amount: amount,
            limit: 100 // 假定预算限制
        };
    });
  }, [monthlyData, selectedCategory]);

  // 4. 计算 Savings 历史数据 (收入 - 支出)
  const savingsTrendData = useMemo(() => {
      const months = [9, 10]; // Oct, Nov
      return months.map(mIdx => {
          const key = `2025-${mIdx}`;
          const mData = monthlyData[key];
          const saved = mData ? (mData.totalIncome - mData.totalExpense) : 0;
          return {
              month: getMonthName(mIdx),
              saved: saved,
              color: mIdx % 2 === 0 ? 'bg-purple-100' : 'bg-pink-100',
              icon: saved > 0 ? '😎' : '🥵'
          };
      }).reverse(); // 最新的在上面
  }, [monthlyData]);


  return (
    <div className="h-full flex bg-[#F9F9F9] overflow-hidden">
      
      {/* === Main Content Area === */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Header */}
        <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-white z-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analysis</h1>
          <div className="h-9 pl-4 pr-0 rounded-full bg-red-100 flex items-center gap-1 text-xs font-bold text-black-500 justify-end overflow-hidden">
          {/* 文字部分 */}
          <span className="mb-[1px]">Ask!</span>
          
          {/* 图片部分 */}
          <img 
            src={rabbit} 
            alt="Ask" 
            // h-full 让高度撑满，w-auto 自适应
            // object-cover 可能会更好看，让图片填满右边圆弧
            className="h-full w-auto object-cover" 
          />
        </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pb-6">
           <div className="flex bg-white rounded-xl p-1 gap-1">
              {['all', 'budget', 'savings'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={cn(
                     "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                     activeTab === tab ? "bg-[#FCE873] text-black shadow-sm" : "text-gray-400 hover:bg-gray-50"
                   )}
                 >
                   {tab}
                 </button>
              ))}
           </div>
        </div>

        {/* Content Scroll View */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
           
           {/* ================= TAB 1: ALL (真实数据概览) ================= */}
           {activeTab === 'all' && (
             <div className="animate-slide-up">
                {/* Month Selector (Mock toggle for demo) */}
                <button 
                    onClick={() => setSelectedMonthIndex(prev => prev === 10 ? 9 : 10)} // Toggle Oct/Nov
                    className="flex items-center gap-1 text-sm font-bold text-gray-500 mb-1"
                >
                   {currentMonthData.monthName} <ChevronDown size={14}/>
                </button>
                
                <div className="text-4xl font-extrabold text-black mb-4">
                   ${currentMonthData.totalExpense.toFixed(2)}
                </div>

                {/* Progress Bar (Fixed vs Flexible) */}
                <div className="flex h-3 rounded-full overflow-hidden w-full mb-8 bg-gray-100">
                   <div 
                        className="bg-[#4FC3F7] transition-all duration-1000" 
                        style={{ width: `${(currentMonthData.flexibleTotal / currentMonthData.totalExpense) * 100}%` }}
                   ></div>
                   <div 
                        className="bg-[#AED581] transition-all duration-1000" 
                        style={{ width: `${(currentMonthData.fixedTotal / currentMonthData.totalExpense) * 100}%` }}
                   ></div>
                </div>

                {/* Envelope Accordion List */}
                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Details</h3>
                   </div>

                   {/* Flexible Group */}
                   <div className="mb-4">
                      <button 
                        onClick={() => setExpandedSection(expandedSection === 'Flexible' ? '' : 'Flexible')}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500"><Zap size={18}/></div>
                            <div className="text-left">
                               <div className="font-bold text-sm">Flexible</div>
                               <div className="text-xs text-gray-400">
                                   {((currentMonthData.flexibleTotal / currentMonthData.totalExpense)*100).toFixed(0)}%
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="font-bold text-sm">${currentMonthData.flexibleTotal.toFixed(0)}</span>
                            {expandedSection === 'Flexible' ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                         </div>
                      </button>

                      {/* Flexible Sub Items */}
                      {expandedSection === 'Flexible' && (
                         <div className="pl-16 pr-4 pt-2 space-y-3 animate-slide-down">
                            {Object.entries(currentMonthData.flexibleItems).map(([cat, amt]) => (
                               <div key={cat} className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                        {ICONS_MAP[cat] || <Zap size={10}/>}
                                     </div>
                                     <span className="font-bold text-gray-700">{cat}</span>
                                  </div>
                                  <span className="font-bold text-gray-900">${amt.toFixed(2)}</span>
                               </div>
                            ))}
                            {Object.keys(currentMonthData.flexibleItems).length === 0 && <div className="text-xs text-gray-400">No transactions</div>}
                         </div>
                      )}
                   </div>

                   {/* Fixed Group */}
                   <div>
                       <button 
                            onClick={() => setExpandedSection(expandedSection === 'Fixed' ? '' : 'Fixed')}
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#D4F673] flex items-center justify-center text-[#5A852D]"><LayoutGrid size={18}/></div>
                                <div className="text-left">
                                <div className="font-bold text-sm">Fixed</div>
                                <div className="text-xs text-gray-400">
                                    {((currentMonthData.fixedTotal / currentMonthData.totalExpense)*100).toFixed(0)}%
                                </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-sm">${currentMonthData.fixedTotal.toFixed(0)}</span>
                                {expandedSection === 'Fixed' ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                            </div>
                        </button>

                        {/* Fixed Sub Items */}
                        {expandedSection === 'Fixed' && (
                            <div className="pl-16 pr-4 pt-2 space-y-3 animate-slide-down">
                                {Object.entries(currentMonthData.fixedItems).map(([cat, amt]) => (
                                <div key={cat} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                            {ICONS_MAP[cat] || <LayoutGrid size={10}/>}
                                        </div>
                                        <span className="font-bold text-gray-700">{cat}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">${amt.toFixed(2)}</span>
                                </div>
                                ))}
                                {Object.keys(currentMonthData.fixedItems).length === 0 && <div className="text-xs text-gray-400">No transactions</div>}
                            </div>
                        )}
                   </div>
                </div>

                {/* Static Widget (Preserved) */}
                <div className="mb-8">
                   <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-100 mb-4">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Insight</div>
                      <div className="text-sm font-medium text-gray-800 mb-4">
                         Your <span className="font-bold">Flexible</span> spending is within budget this month!
                      </div>
                      <button className="w-full mt-2 bg-[#1C1C1E] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                         <Sparkles size={12}/> Ask AI for advice
                      </button>
                   </div>
                </div>
             </div>
           )}

           {/* ================= TAB 2: BUDGET (真实数据对比) ================= */}
           {activeTab === 'budget' && (
             <div className="animate-slide-up">
                {/* Category Dropdown Selector */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                    {['Food', 'Transportation', 'Shopping', 'Entertainment'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                                selectedCategory === cat ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Dynamic Chart */}
                <div className="relative h-48 mb-8 mt-12">
                   {/* Budget Line */}
                   <div className="absolute top-[20%] left-0 right-0 border-t-2 border-dashed border-gray-300 flex items-center">
                      <span className="absolute -right-0 -top-8 text-xs font-bold text-gray-400 text-right">
                         <span className="block text-[8px] uppercase">budget</span>$100
                      </span>
                   </div>

                   {/* Bars Container */}
                   <div className="h-full flex items-end justify-around px-4">
                      {categoryTrendData.map((data, index) => {
                         const isCurrent = data.month === getMonthName(selectedMonthIndex).substring(0, 3);
                         // 这里的 120 是假设的最大显示高度刻度，避免爆表
                         const heightPct = Math.min(100, (data.amount / 120) * 100); 
                         const remaining = data.limit - data.amount;

                         return (
                            <div key={index} className="flex flex-col items-center gap-2 relative group w-12">
                               {isCurrent && (
                                  <div className="absolute -top-24 bg-white border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm text-center animate-bounce-slow z-20">
                                     <span className="block text-sm font-bold text-gray-900">${remaining.toFixed(0)} <span className="text-gray-400 font-normal">left</span></span>
                                     <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-blue-100 rotate-45"></div>
                                  </div>
                               )}
                               <div 
                                 className={cn(
                                    "w-full rounded-t-lg transition-all duration-500", 
                                    isCurrent ? "bg-gradient-to-b from-[#4FC3F7] to-[#81D4FA]" : "bg-gray-200"
                                 )}
                                 style={{ height: `${Math.max(5, heightPct)}%` }}
                               ></div>
                               <span className={cn("text-xs font-bold", isCurrent ? "text-black" : "text-gray-400")}>
                                  {data.month}
                               </span>
                            </div>
                         )
                      })}
                   </div>
                </div>

                {/* Breakdown List (Real Items) */}
                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Breakdown ({selectedCategory})</h3>
                   </div>

                   {/* Filter raw transactions for selected month & category */}
                   <div className="space-y-4">
                      {RAW_DATA.filter(t => {
                          const date = new Date(t.date);
                          return date.getMonth() === selectedMonthIndex && t.category === selectedCategory;
                      }).map((t, i) => (
                         <div key={i} className="flex justify-between items-center pl-2 border-b border-gray-50 pb-2">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                                   {ICONS_MAP[t.category] || <Zap size={14}/>}
                               </div>
                               <div>
                                  <div className="text-xs font-bold text-gray-700">{t.merchant}</div>
                                  <div className="text-[10px] text-gray-400">{t.date}</div>
                               </div>
                            </div>
                            <span className="font-bold text-sm text-gray-800">${Math.abs(t.amount)}</span>
                         </div>
                      ))}
                      {RAW_DATA.filter(t => new Date(t.date).getMonth() === selectedMonthIndex && t.category === selectedCategory).length === 0 && (
                          <div className="text-center text-gray-400 text-sm py-4">No transactions found.</div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {/* ================= TAB 3: SAVINGS (真实结余计算) ================= */}
           {activeTab === 'savings' && (
             <div className="animate-slide-up">
                <div className="flex justify-between items-start mb-2">
                   <button className="flex items-center gap-1 text-sm font-bold text-gray-500 uppercase">
                      ALL <ChevronDown size={14}/>
                   </button>
                </div>

                {/* Total Savings (Sum of all months) */}
                <div className="text-4xl font-extrabold text-black mb-4 flex items-baseline gap-2">
                   ${savingsTrendData.reduce((acc, curr) => acc + curr.saved, 0).toFixed(2)} 
                   <span className="text-lg text-gray-400 font-medium">/ Goal</span>
                </div>

                {/* Segmented Progress Bar */}
                <div className="flex gap-1 h-12 mb-8">
                   {savingsTrendData.map((d, i) => (
                       <div key={i} className={cn("rounded-sm h-full", d.color)} style={{ width: `${(d.saved / 2000) * 100}%` }}></div>
                   ))}
                   <div className="flex-1 bg-gray-100 rounded-sm"></div>
                </div>

                {/* Breakdown List */}
                <div className="mb-8">
                   <h3 className="font-bold text-lg mb-4">Breakdown</h3>
                   
                   {savingsTrendData.map((row, i) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                         <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl", row.color)}>{row.icon}</div>
                            <div>
                               <div className="font-bold text-sm">{row.month}</div>
                               <div className="text-xs text-gray-400">Saved from income</div>
                            </div>
                         </div>
                         <span className={cn("font-bold text-sm", row.saved > 0 ? "text-green-600" : "text-red-500")}>
                            {row.saved > 0 ? '+' : ''}${row.saved.toFixed(2)}
                         </span>
                      </div>
                   ))}
                </div>

                {/* Helper Section */}
                <div className="bg-[#F7F7F9] rounded-3xl p-6">
                   <div className="text-[10px] text-gray-400 font-bold uppercase mb-4">Budget helper</div>
                   <div className="font-bold text-lg mb-2">We can help you for making budget plan!</div>
                   <button className="w-full bg-[#1C1C1E] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-4">
                      <Sparkles size={12}/> Start a chat.
                   </button>
                </div>
             </div>
           )}

        </div>

      </div>

      {/* === 右侧翻页条 (Back to Home) === */}
      <div 
        onClick={() => navigate('/')}
        className="w-4 ml-0 bg-gray-200/50 hover:bg-gray-300/50 my-4 mr-0 rounded-l-xl cursor-pointer flex items-center justify-center group shrink-0 transition-colors"
      >
         <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600"/>
      </div>

    </div>
  );
}

// Icon Helper
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
  )
}