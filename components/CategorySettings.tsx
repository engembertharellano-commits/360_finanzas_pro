
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Settings2 } from 'lucide-react';

interface CategoryListProps {
  title: string;
  categories: string[];
  type: 'income' | 'expense';
  onUpdate: (newCategories: string[]) => void;
  icon: React.ReactNode;
  colorClass: string;
}

const CategoryList: React.FC<CategoryListProps> = ({ title, categories, onUpdate, icon, colorClass }) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      alert("Esta categoría ya existe.");
      return;
    }
    onUpdate([...categories, newCategory.trim()]);
    setNewCategory('');
  };

  const handleDelete = (index: number) => {
    if (categories.length <= 1) {
      alert("Debes tener al menos una categoría.");
      return;
    }
    onUpdate(categories.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(categories[index]);
  };

  const saveEdit = (index: number) => {
    if (!editValue.trim()) return;
    const next = [...categories];
    next[index] = editValue.trim();
    onUpdate(next);
    setEditingIndex(null);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${colorClass}`}>
            {icon}
          </div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
        </div>
        <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-400 uppercase tracking-widest">
          {categories.length} Total
        </span>
      </div>

      <div className="flex gap-2">
        <input 
          placeholder="Nombre de categoría..."
          className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder:text-slate-300 transition-all"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl group border border-transparent hover:border-slate-100 hover:bg-white transition-all">
            {editingIndex === i ? (
              <div className="flex-1 flex gap-2">
                <input 
                  autoFocus
                  className="flex-1 bg-white px-3 py-1 rounded-lg border border-blue-200 outline-none font-bold"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(i)}
                />
                <button onClick={() => saveEdit(i)} className="p-1 text-emerald-500 hover:scale-110"><Check size={18}/></button>
                <button onClick={() => setEditingIndex(null)} className="p-1 text-rose-500 hover:scale-110"><X size={18}/></button>
              </div>
            ) : (
              <>
                <span className="font-bold text-slate-700">{cat}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(i)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(i)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface Props {
  expenseCategories: string[];
  incomeCategories: string[];
  onUpdateExpenses: (cats: string[]) => void;
  onUpdateIncome: (cats: string[]) => void;
}

export const CategorySettings: React.FC<Props> = ({ 
  expenseCategories, incomeCategories, onUpdateExpenses, onUpdateIncome 
}) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personalización</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Define el vocabulario de tu ecosistema financiero</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-5 py-2.5 rounded-2xl">
          <Settings2 size={16} className="text-slate-500" />
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ajustes del Sistema</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CategoryList 
          title="Fuentes de Egreso" 
          categories={expenseCategories} 
          type="expense"
          onUpdate={onUpdateExpenses}
          icon={<ArrowDownCircle size={24} />}
          colorClass="bg-rose-50 text-rose-500"
        />
        <CategoryList 
          title="Fuentes de Ingreso" 
          categories={incomeCategories} 
          type="income"
          onUpdate={onUpdateIncome}
          icon={<ArrowUpCircle size={24} />}
          colorClass="bg-emerald-50 text-emerald-500"
        />
      </div>
      
      <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="p-5 bg-white/5 text-blue-400 rounded-3xl border border-white/10 relative z-10">
           <ShieldCheck size={32} />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <h4 className="font-black text-white text-xl mb-2">Arquitectura de Privacidad Local</h4>
          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
            Tus datos financieros nunca salen de este dispositivo. Finanza360 utiliza el almacenamiento local de tu navegador para garantizar que solo tú tengas acceso a tu información. La IA de Gemini procesa tus datos de forma efímera para generar reportes, sin guardarlos permanentemente en servidores externos.
          </p>
        </div>
        {/* Decoración sutil */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[80px] -mr-10 -mt-10"></div>
      </div>
    </div>
  );
};
