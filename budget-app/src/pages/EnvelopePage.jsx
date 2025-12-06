import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Pencil, X, ChevronDown, 
  Utensils, Car, ShoppingCart, Clapperboard, Sparkles, GraduationCap, 
  PiggyBank, Mail, Zap, LayoutGrid, HelpCircle, Trash2, ArrowRight, ChevronRight
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
  'Food': <Utensils />, 'Transportation': <Car />, 'Shopping': <ShoppingCart />, 'Entertainment': <Clapperboard />,
  'Personal Care': <Sparkles />, 'Education': <GraduationCap />, 'Savings': <PiggyBank />, 'Subscription': <Mail />,
  'Misc': <Zap />, 'Fixed': <LayoutGrid />,
};

// 保持你的配色
const COLOR_OPTIONS = [
  { bg: 'bg-[#A0D468]', text: 'text-black', bar: 'bg-white/30', label: 'Green' }, 
  { bg: 'bg-[#F27DDC]', text: 'text-black', bar: 'bg-white/30', label: 'Pink' }, 
  { bg: 'bg-[#FCE873]', text: 'text-black', bar: 'bg-white/40', label: 'Yellow' }, 
  { bg: 'bg-[#E3E6F7]', text: 'text-black', bar: 'bg-white/40', label: 'Blue' }, 
  { bg: 'bg-[#ED8586]', text: 'text-black', bar: 'bg-white/30', label: 'Red' }, 
  { bg: 'bg-[#967ADC]', text: 'text-white', bar: 'bg-white/20', label: 'Purple' },
  { bg: 'bg-[#F6BB67]', text: 'text-black', bar: 'bg-white/30', label: 'Orange' }, 
];

const INITIAL_ENVELOPES = [
  { id: 1, name: 'Food', limit: 300, color: COLOR_OPTIONS[0], iconKey: 'Food', type: 'Flexible' },
  { id: 2, name: 'Subscription', limit: 60, color: COLOR_OPTIONS[1], iconKey: 'Subscription', type: 'Fixed' },
  { id: 3, name: 'Shopping', limit: 60, color: COLOR_OPTIONS[2], iconKey: 'Shopping', type: 'Flexible' },
  { id: 4, name: 'Transportation', limit: 180, color: COLOR_OPTIONS[3], iconKey: 'Transportation', type: 'Flexible' },
  { id: 5, name: 'Personal Care', limit: 60, color: COLOR_OPTIONS[4], iconKey: 'Personal Care', type: 'Flexible' },
  { id: 6, name: 'Entertainment', limit: 100, color: COLOR_OPTIONS[5], iconKey: 'Entertainment', type: 'Flexible' },
  { id: 7, name: 'Tuition Saving', limit: 200, color: COLOR_OPTIONS[6], iconKey: 'Education', type: 'Fixed' },
];

const getMonthName = (date) => date.toLocaleString('en-US', { month: 'short' });

export default function EnvelopePage() {
  const navigate = useNavigate();
  const { openChat } = useChat();
  
  const [envelopes, setEnvelopes] = useState(INITIAL_ENVELOPES);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [editingEnvelope, setEditingEnvelope] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // Nov 2025

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Flexible');
  const [formAmount, setFormAmount] = useState('');
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [formIcon, setFormIcon] = useState('Food');

  useEffect(() => { setTimeout(() => setIsLoaded(true), 100); }, []);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const currentMonthData = useMemo(() => {
    return RAW_DATA.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    });
  }, [currentDate]);

  const spentByCategory = useMemo(() => {
    const summary = {};
    currentMonthData.forEach(t => {
      if (t.category === 'Income') return; 
      const cat = t.category === 'Tuition Saving' ? 'Savings' : t.category;
      if (!summary[cat]) summary[cat] = 0;
      summary[cat] += Math.abs(t.amount);
    });
    return summary;
  }, [currentMonthData]);

  const totalBudget = envelopes.reduce((acc, env) => acc + env.limit, 0);
  const totalSpent = Object.values(spentByCategory).reduce((acc, val) => acc + val, 0);

  // 🔴 核心逻辑：生成像素化网格 (Grid Units)
  const gridCells = useMemo(() => {
      // 定义总共有多少个小方块。
      // 200 个方块 = 4行 x 50列。足够细腻，看起来像连续的条。
      const TOTAL_UNITS = 200; 
      
      let cells = [];
      
      // 1. 生成每个分类的方块
      envelopes.forEach((env) => {
          const spent = spentByCategory[env.name] || 0;
          // 计算该分类占用多少个方块
          const unitsCount = Math.round((spent / totalBudget) * TOTAL_UNITS);
          
          for (let i = 0; i < unitsCount; i++) {
              cells.push({
                  ...env,
                  uniqueId: `${env.id}-${i}`,
                  isStart: i === 0, // 是该分类的第一个方块
                  isEnd: i === unitsCount - 1 // 是该分类的最后一个方块
              });
          }
      });

      // 2. 补充剩余的灰色方块 (Buffer)
      const usedUnits = cells.length;
      const remainingUnits = Math.max(0, TOTAL_UNITS - usedUnits);
      for (let i = 0; i < remainingUnits; i++) {
          cells.push({
              id: 'empty',
              uniqueId: `empty-${i}`,
              color: { bg: 'bg-gray-100' }, // 灰色
              isEmpty: true
          });
      }

      return cells;
  }, [envelopes, spentByCategory, totalBudget]);

  const openNewEnvelopeModal = () => { setEditingEnvelope(null); setStep(1); setShowModal(true); };
  const openEditModal = (env) => { setEditingEnvelope(env); setFormName(env.name); setFormType(env.type); setFormAmount(env.limit.toString()); setFormColor(env.color); setFormIcon(env.iconKey); setStep(1); setShowModal(true); };
  const handleSave = () => {
    const newEnv = { id: editingEnvelope ? editingEnvelope.id : Date.now(), name: formName, type: formType, limit: parseFloat(formAmount) || 0, color: formColor, iconKey: formIcon };
    if (editingEnvelope) setEnvelopes(prev => prev.map(e => e.id === editingEnvelope.id ? newEnv : e));
    else setEnvelopes(prev => [...prev, newEnv]);
    setShowModal(false);
  };

  return (
    <div className="h-full flex bg-[#F9F9F9] overflow-hidden">
      <div onClick={() => navigate('/')} className="w-4 mr-0 bg-gray-200/50 hover:bg-gray-300/50 my-4 ml-0 rounded-r-xl cursor-pointer flex items-center justify-center group shrink-0 transition-colors"><ChevronLeft size={16} className="text-gray-400 group-hover:text-gray-600"/></div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-1">
             <button onClick={() => changeMonth(-1)}><ChevronLeft size={20} className="text-gray-400"/></button>
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
               <span className="text-[#FF5F5F]">{getMonthName(currentDate)}</span> Budget
             </h1>
             <button onClick={() => changeMonth(1)}><ChevronRight size={20} className="text-gray-400"/></button>
          </div>
          <button onClick={openChat} className="h-9 pl-4 pr-0 rounded-full bg-red-100 flex items-center gap-1 text-xs font-bold text-black-500 justify-end overflow-hidden hover:bg-red-200 transition-colors"><span className="mb-[1px]">Ask!</span><img src={rabbit} alt="Ask" className="h-full w-auto object-cover" /></button>
        </div>

        {/* 🔴 Top Visualization: Grid System */}
        <div className="px-6 pt-2 pb-6 bg-white rounded-b-[30px] shadow-sm mb-4 z-10">
           {/* 
              容器:
              - flex-wrap: 关键，让方块自动换行
              - gap-0: 关键，让方块紧密相连，看起来像一条
           */}
           <div className="w-full bg-gray-50 rounded-xl overflow-hidden flex flex-wrap content-start">
              {gridCells.map((cell) => (
                 <div 
                   key={cell.uniqueId}
                   // 宽度固定 2% (因为一行 50 个)，高度 h-8
                   className={cn(
                       "h-8 w-[2%] transition-colors duration-500", 
                       cell.color.bg,
                       // 🔴 智能圆角：只有开头和结尾的方块有圆角
                       cell.isStart && "rounded-l-sm",
                       cell.isEnd && "rounded-r-sm",
                       // 微调：给有颜色的块加一点点白色边框，如果想要完全融合可以去掉这个 border
                       !cell.isEmpty && "border-r-[0.5px] border-white/20" 
                   )}
                 >
                    {/* 🔴 末尾 Icon：只在每段的最后一块显示 */}
                    {cell.isEnd && !cell.isEmpty && (
                        <div className="w-full h-full flex items-center justify-center -ml-1">
                            <div className="text-black/30 scale-50">
                                {React.cloneElement(ICONS_MAP[cell.iconKey] || <Zap/>, { size: 16 })}
                            </div>
                        </div>
                    )}
                 </div>
              ))}
           </div>
           
           <div className="flex justify-end mt-2 text-sm font-bold text-gray-500">
              <span className="text-black text-xl mr-1">${totalSpent.toFixed(0)}</span>
              <span className="self-end mb-0.5 text-gray-400">/ {totalBudget}</span>
           </div>
        </div>

        {/* Envelope Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
           <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-gray-900">Envelope</h2><div className="flex items-center gap-1 text-xs text-gray-400 font-medium cursor-pointer">Recent <ArrowRight size={12} className="rotate-90"/></div></div>

           <div className="grid grid-cols-2 gap-4">
              {envelopes.map(env => {
                 const spent = spentByCategory[env.name] || 0;
                 const percent = Math.min(100, (spent / env.limit) * 100);
                 
                 return (
                   <div key={env.id} className={cn("rounded-[24px] p-4 relative overflow-hidden h-36 flex flex-col justify-between transition-transform active:scale-95 shadow-sm", env.color.bg)}>
                      <div className={cn("absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out z-0", env.color.bar)} style={{ height: isLoaded ? `${percent}%` : '0%' }}></div>

                      <div className="flex justify-between items-start relative z-10">
                         <div className="w-8 h-8 rounded-lg bg-black/10 backdrop-blur-sm flex items-center justify-center text-black/70">
                            {React.cloneElement(ICONS_MAP[env.iconKey] || <Zap/>, { size: 16 })}
                         </div>
                         <button onClick={() => openEditModal(env)} className="text-black/50 hover:text-black"><Pencil size={16} /></button>
                      </div>

                      <div className="relative z-10">
                         <h3 className={cn("font-bold text-sm mb-1", env.color.text)}>{env.name}</h3>
                         <div className={cn("flex items-center justify-end text-xs font-bold", env.color.text)}>
                            <span className="opacity-100">${spent.toFixed(2)}</span>
                            <span className="opacity-60 mx-0.5">/</span>
                            <span className="opacity-60">{env.limit}</span>
                         </div>
                      </div>
                   </div>
                 )
              })}
              <button onClick={openNewEnvelopeModal} className="rounded-[24px] bg-white h-36 flex items-center justify-center text-gray-300 hover:bg-gray-50 border-2 border-dashed border-gray-200"><Plus size={32} strokeWidth={1.5}/></button>
           </div>
        </div>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="absolute inset-0 z-50 bg-[#EFEEF6] flex flex-col animate-slide-up">
           <div className="px-6 pt-12 pb-4 flex justify-between items-center">
              <button onClick={() => {if(step > 1) setStep(step-1); else setShowModal(false);}}><ChevronLeft size={24} className="text-black"/></button>
           </div>
           {/* Placeholder for modal content */}
           <div className="p-6 text-center text-gray-500">Edit Modal Content</div>
        </div>
      )}
    </div>
  );
}