import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Pencil, X, ChevronDown, 
  Utensils, Car, ShoppingCart, Clapperboard, Sparkles, GraduationCap, 
  PiggyBank, Mail, Zap, LayoutGrid, HelpCircle, Trash2, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RAW_DATA } from '../data'; 

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// === 图标映射 ===
const ICONS_MAP = {
  'Food': <Utensils />,
  'Transportation': <Car />,
  'Shopping': <ShoppingCart />,
  'Entertainment': <Clapperboard />,
  'Personal Care': <Sparkles />,
  'Education': <GraduationCap />,
  'Savings': <PiggyBank />,
  'Subscription': <Mail />,
  'Misc': <Zap />,
  'Fixed': <LayoutGrid />,
};

// === 颜色选项 ===
const COLOR_OPTIONS = [
  { bg: 'bg-[#A0D468]', text: 'text-[#5A852D]', label: 'Green' }, 
  { bg: 'bg-[#F27DDC]', text: 'text-[#9E3589]', label: 'Pink' }, 
  { bg: 'bg-[#FCE873]', text: 'text-[#9C8C18]', label: 'Yellow' }, 
  { bg: 'bg-[#E3E6F7]', text: 'text-[#5C6BC0]', label: 'Blue' }, 
  { bg: 'bg-[#ED8586]', text: 'text-[#9E3536]', label: 'Red' }, 
  { bg: 'bg-[#967ADC]', text: 'text-[#56389C]', label: 'Purple' }, 
  { bg: 'bg-[#F6BB67]', text: 'text-[#9C6B18]', label: 'Orange' }, 
];

// === 初始数据 ===
const INITIAL_ENVELOPES = [
  { id: 1, name: 'Food', limit: 300, color: COLOR_OPTIONS[0], iconKey: 'Food', type: 'Flexible' },
  { id: 2, name: 'Subscription', limit: 60, color: COLOR_OPTIONS[1], iconKey: 'Subscription', type: 'Fixed' },
  { id: 3, name: 'Shopping', limit: 60, color: COLOR_OPTIONS[2], iconKey: 'Shopping', type: 'Flexible' },
  { id: 4, name: 'Transportation', limit: 180, color: COLOR_OPTIONS[3], iconKey: 'Transportation', type: 'Flexible' },
  { id: 5, name: 'Personal Care', limit: 60, color: COLOR_OPTIONS[4], iconKey: 'Personal Care', type: 'Flexible' },
  { id: 6, name: 'Entertainment', limit: 100, color: COLOR_OPTIONS[5], iconKey: 'Entertainment', type: 'Flexible' },
  { id: 7, name: 'Tuition Saving', limit: 200, color: COLOR_OPTIONS[6], iconKey: 'Education', type: 'Fixed' },
];

export default function EnvelopePage() {
  const navigate = useNavigate();
  
  // === State ===
  const [envelopes, setEnvelopes] = useState(INITIAL_ENVELOPES);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [editingEnvelope, setEditingEnvelope] = useState(null);
  
  // 动画状态
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 简单的延迟触发动画
    setTimeout(() => setIsLoaded(true), 100);
  }, []);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Flexible');
  const [formAmount, setFormAmount] = useState('');
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [formIcon, setFormIcon] = useState('Food');

  // === Logic: Data Processing ===
  const currentMonthData = useMemo(() => {
    // 筛选 10 月份数据 (Month Index 9)
    return RAW_DATA.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === 9 && date.getFullYear() === 2025;
    });
  }, []);

  const spentByCategory = useMemo(() => {
    const summary = {};
    currentMonthData.forEach(t => {
      const cat = t.category === 'Tuition Saving' ? 'Savings' : t.category;
      if (!summary[cat]) summary[cat] = 0;
      summary[cat] += Math.abs(t.amount);
    });
    return summary;
  }, [currentMonthData]);

  const totalBudget = envelopes.reduce((acc, env) => acc + env.limit, 0);
  const totalSpent = Object.values(spentByCategory).reduce((acc, val) => acc + val, 0);

  // === Handlers ===
  const openNewEnvelopeModal = () => {
    setEditingEnvelope(null);
    setFormName('');
    setFormType('Flexible');
    setFormAmount('');
    setFormColor(COLOR_OPTIONS[0]);
    setFormIcon('Food');
    setStep(1);
    setShowModal(true);
  };

  const openEditModal = (env) => {
    setEditingEnvelope(env);
    setFormName(env.name);
    setFormType(env.type);
    setFormAmount(env.limit.toString());
    setFormColor(env.color);
    setFormIcon(env.iconKey);
    setStep(1);
    setShowModal(true);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSave();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = () => {
    const newEnv = {
      id: editingEnvelope ? editingEnvelope.id : Date.now(),
      name: formName,
      type: formType,
      limit: parseFloat(formAmount) || 0,
      color: formColor,
      iconKey: formIcon,
    };

    if (editingEnvelope) {
      setEnvelopes(prev => prev.map(e => e.id === editingEnvelope.id ? newEnv : e));
    } else {
      setEnvelopes(prev => [...prev, newEnv]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (editingEnvelope) {
      setEnvelopes(prev => prev.filter(e => e.id !== editingEnvelope.id));
      setShowModal(false);
    }
  };

  return (
    <div className="h-full flex bg-[#F9F9F9] overflow-hidden">
      
      {/* === 1. 左侧翻页条 (Back to Home) === */}
      <div 
        onClick={() => navigate('/')}
        className="w-4 mr-0 bg-gray-200/50 hover:bg-gray-300/50 my-4 ml-0 rounded-r-xl cursor-pointer flex items-center justify-center group shrink-0 transition-colors"
      >
         <ChevronLeft size={16} className="text-gray-400 group-hover:text-gray-600"/>
      </div>

      {/* === Main Content Area === */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-1 cursor-pointer">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              <span className="text-[#FF5F5F]">Oct</span> Budget
            </h1>
            <ChevronDown size={20} className="text-gray-400 mt-1" />
          </div>
          <div className="h-9 px-3 rounded-full bg-red-100 flex items-center gap-2 text-xs font-bold text-red-500">
             Ask! 
             <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px]">🤖</div>
          </div>
        </div>

        {/* === 2. Top Visualization Bar (New Design) === */}
        <div className="px-6 pt-2 pb-6 bg-white rounded-b-[30px] shadow-sm mb-4 z-10">
           
           {/* Bar Container: Flex Wrap for multi-line effect */}
           <div className="w-full flex flex-wrap content-start gap-1 p-1">
              
              {/* Render Transaction Bars */}
              {currentMonthData.map((t, idx) => {
                 const env = envelopes.find(e => e.name === t.category) || envelopes[0];
                 // 宽度逻辑：这里为了模仿截图的“块状感”，我们让宽度稍微大一点，
                 // 并加上 min-width 保证可见性。
                 // 假设 4行填满 = 100% 预算，这里简化为 1行 = 25% 预算
                 const widthPct = (Math.abs(t.amount) / totalBudget) * 100 * 3; // *3 为了视觉上更显眼
                 
                 return (
                   <div 
                     key={idx}
                     // rounded-sm: 小倒圆角
                     className={cn(
                       "h-8 rounded-sm opacity-90 transition-all duration-1000 ease-out", 
                       env.color.bg
                     )}
                     style={{ 
                       width: isLoaded ? `${Math.max(2, widthPct)}%` : '0%', // 动画效果
                       minWidth: '4px' 
                     }} 
                   ></div>
                 )
              })}

              {/* Remaining Budget (Optional: Placeholder gray bars) */}
              <div className="flex-grow h-8 bg-gray-100 rounded-sm min-w-[20px]"></div>
              <div className="w-8 h-8 bg-gray-100 rounded-sm"></div>
              <div className="w-4 h-8 bg-gray-100 rounded-sm"></div>
           </div>

           <div className="flex justify-end mt-2 text-sm font-bold text-gray-500">
              <span className="text-black">${totalSpent.toFixed(0)}</span>
              <span className="mx-1">/</span>
              {totalBudget}
           </div>
        </div>

        {/* === 3. Envelope Grid === */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Envelope</h2>
              <div className="flex items-center gap-1 text-xs text-gray-400 font-medium cursor-pointer">
                 Recent <ArrowRight size={12} className="rotate-90"/>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              {envelopes.map(env => {
                 const spent = spentByCategory[env.name] || 0;
                 const percent = Math.min(100, (spent / env.limit) * 100);
                 const isOverBudget = spent > env.limit;

                 return (
                   <div 
                     key={env.id} 
                     className="rounded-[24px] p-4 relative overflow-hidden h-36 flex flex-col justify-between bg-white transition-transform active:scale-95 shadow-sm"
                   >
                      {/* Progress Bar (Bottom Up) */}
                      <div 
                        className={cn("absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out", env.color.bg)}
                        style={{ height: isLoaded ? `${percent}%` : '0%' }}
                      ></div>

                      {/* Card Content */}
                      <div className="flex justify-between items-start relative z-10">
                         <div className="w-8 h-8 rounded-lg bg-white/60 backdrop-blur-sm border border-black/5 flex items-center justify-center text-gray-700">
                            {React.cloneElement(ICONS_MAP[env.iconKey] || <Zap/>, { size: 16 })}
                         </div>
                         <button onClick={() => openEditModal(env)} className="text-gray-600 hover:text-black">
                            <Pencil size={16} />
                         </button>
                      </div>

                      <div className="relative z-10">
                         <h3 className="font-bold text-sm text-gray-800 mb-1">{env.name}</h3>
                         <div className="flex items-center justify-end text-xs font-bold">
                            {isOverBudget && <HelpCircle size={12} className="text-red-500 mr-1 fill-red-500 stroke-white"/>}
                            <span className="text-black">${spent.toFixed(2)}</span>
                            <span className="text-gray-500/80 mx-0.5">/</span>
                            <span className="text-gray-500/80">{env.limit}</span>
                         </div>
                      </div>
                   </div>
                 )
              })}

              {/* Add New Card */}
              <button 
                onClick={openNewEnvelopeModal}
                className="rounded-[24px] bg-white h-36 flex items-center justify-center text-gray-300 hover:bg-gray-50 border-2 border-dashed border-gray-200"
              >
                 <Plus size={32} strokeWidth={1.5}/>
              </button>
           </div>
        </div>

      </div>

      {/* === 4. Add/Edit Wizard Modal === */}
      {showModal && (
        <div className="absolute inset-0 z-50 bg-[#EFEEF6] flex flex-col animate-slide-up">
           
           <div className="px-6 pt-12 pb-4 flex justify-between items-center">
              <button onClick={() => {
                 if(step > 1) handleBack();
                 else setShowModal(false);
              }}>
                 <ChevronLeft size={24} className="text-black"/>
              </button>
              <div className="px-3 py-1 rounded-full bg-[#D4F673] text-black text-xs font-bold flex items-center gap-1 border border-black/5">
                 Ask! <div className="w-4 h-4 bg-[#FF5F5F] rounded-full"></div>
              </div>
           </div>

           <div className="px-6 mb-8">
              <div className="flex gap-1 h-1 mb-2">
                 <div className={cn("flex-1 rounded-full", step >= 1 ? "bg-black" : "bg-gray-300")}></div>
                 <div className={cn("flex-1 rounded-full", step >= 2 ? "bg-black" : "bg-gray-300")}></div>
                 <div className={cn("flex-1 rounded-full", step >= 3 ? "bg-black" : "bg-gray-300")}></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400">
                 <span>Step {step}</span>
                 <span className="text-red-400">{step} / 3</span>
              </div>
           </div>

           {step === 1 && (
             <div className="flex-1 px-6 flex flex-col">
                <h2 className="text-sm font-medium text-gray-500 mb-1">What's the envelope name?</h2>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="New Envelope"
                  className="text-3xl font-bold bg-transparent outline-none mb-8 placeholder:text-gray-300"
                  autoFocus
                />
                <h2 className="text-sm font-medium text-gray-500 mb-3">What type of envelope is it?</h2>
                <div className="flex gap-3">
                   {['Fixed', 'Flexible'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setFormType(type)}
                        className={cn("px-6 py-3 rounded-xl text-sm font-bold border transition-all", formType === type ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200")}
                      >
                         {type}
                      </button>
                   ))}
                </div>
                <div className="mt-8 bg-white p-6 rounded-3xl flex gap-4 items-center">
                   <div className="text-5xl font-bold text-[#7D85F2]">70%</div>
                   <div className="text-xs text-gray-500 leading-tight">of users marked similar envelopes as <strong>{formType}</strong></div>
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="flex-1 px-6 flex flex-col">
                <h2 className="text-sm font-medium text-gray-500 mb-1">What's your budget?</h2>
                <div className="flex items-center mb-8">
                   <span className="text-4xl font-bold text-gray-400 mr-2">$</span>
                   <input 
                     type="number" 
                     value={formAmount}
                     onChange={(e) => setFormAmount(e.target.value)}
                     placeholder="0.00"
                     className="text-5xl font-bold bg-transparent outline-none w-full placeholder:text-gray-300"
                     autoFocus
                   />
                   <span className="text-xl text-gray-400 mt-4">/1000</span>
                </div>
                <div className="bg-white p-6 rounded-3xl">
                   <h3 className="font-bold mb-4 text-sm">Money Translator</h3>
                   <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-[#7D5CF1]">${(parseFloat(formAmount || 0)/4).toFixed(0)}</div>
                      <div className="text-xs text-gray-500">/ week <br/>That means you can get... <strong>{(parseFloat(formAmount || 0)/15).toFixed(0)} Cups/week</strong></div>
                   </div>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="flex-1 px-6 flex flex-col">
                <h2 className="text-sm font-medium text-gray-500 mb-4">What icon and color would you like to use?</h2>
                <div className="grid grid-cols-6 gap-2 mb-6">
                   {Object.keys(ICONS_MAP).slice(0, 6).map(key => (
                      <button key={key} onClick={() => setFormIcon(key)} className={cn("aspect-square rounded-xl flex items-center justify-center transition-all", formIcon === key ? "bg-[#333] text-white" : "bg-white text-gray-400")}>
                         {React.cloneElement(ICONS_MAP[key], { size: 18 })}
                      </button>
                   ))}
                </div>
                <div className="grid grid-cols-6 gap-2">
                   {COLOR_OPTIONS.map((c, idx) => (
                      <button key={idx} onClick={() => setFormColor(c)} className={cn("aspect-square rounded-xl transition-all", c.bg, formColor.label === c.label ? "ring-2 ring-offset-2 ring-black scale-90" : "")}></button>
                   ))}
                </div>
             </div>
           )}

           <div className="p-6 pb-8">
              <div className="flex gap-4">
                 {editingEnvelope && (
                    <button onClick={handleDelete} className="w-14 h-14 bg-[#FF5F5F] rounded-2xl flex items-center justify-center text-white shadow-lg"><Trash2 size={20} /></button>
                 )}
                 <button onClick={handleNext} className="flex-1 h-14 bg-[#333] text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2">
                    {step === 3 ? (editingEnvelope ? 'Save Changes' : 'Create Envelope') : 'Next'} <ArrowRight size={18}/>
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}