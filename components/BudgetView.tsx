import React, { useState, useMemo, useEffect } from 'react';
import { Budget, Currency, Transaction } from '../types';
import { Plus, PieChart, AlertCircle, Trash2, Wallet, TrendingUp, ChevronRight, Pencil, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from './ConfirmationModal';

interface Props {
  budgets: Budget[];
  transactions: Transaction[];
  onAdd: () => void;    // Esta función recarga los datos suavemente
  onDelete: () => void; // Esta también
  exchangeRate: number;
  selectedMonth: string;
  expenseCategories: string[];
}

export const BudgetView: React.FC<Props> = ({ 
  budgets, transactions, onAdd, onDelete, exchangeRate, selectedMonth, expenseCategories 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, title: '', message: '', onConfirm: async () => {} 
  });

  const [newBudget, setNewBudget] = useState({
    category: expenseCategories[0] || '',
    limit: 0,
    currency: 'USD' as Currency
  });

  useEffect(() => {
    if (!editingId && expenseCategories.length > 0 && !expenseCategories.includes(newBudget.category)) {
      setNewBudget(prev => ({ ...prev, category: expenseCategories[0] }));
    }
  }, [expenseCategories, newBudget.category, editingId]);

  const activeBudgets = useMemo(() => {
    const categories = Array.from(new Set(budgets.map(b => b.category)));
    return categories.map(cat => {
      const currentMonthBudget = budgets.find(b => b.category === cat && b.month === selectedMonth);
      if (currentMonthBudget) return currentMonthBudget;
      const pastBudgets = budgets
        .filter(b => b.category === cat && b.month < selectedMonth)
        .sort((a, b) => b.month.localeCompare(a.month));
      return pastBudgets[0];
    }).filter(Boolean) as Budget[];
  }, [budgets, selectedMonth]);

  const budgetsWithSpent = useMemo(() => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth) && (t.type === 'Gasto' || t.type === 'expense'));
    return activeBudgets.map(b => {
      const spent = monthTransactions
        .filter(t => t.category === b.category)
        .reduce((acc, t) => {
          if (t.currency === b.currency) return acc + t.amount;
          return acc + (t.currency === 'USD' ? t.amount * exchangeRate : t.amount / exchangeRate);
        }, 0);
      return { ...b, spent };
    });
  }, [activeBudgets, transactions, selectedMonth, exchangeRate]);

  const globalSummary = useMemo(() => {
    const totalUSD = budgetsWithSpent.filter(b => b.currency === 'USD').reduce((s, b) => s + b.limit, 0);
    const totalVES = budgetsWithSpent.filter(b => b.currency === 'VES').reduce((s, b) => s + b.limit, 0);
    const totalSpentUSD = budgetsWithSpent.filter(b => b.currency === 'USD').reduce((s, b) => s + (b.spent || 0), 0);
    const totalSpentVES = budgetsWithSpent.filter(b => b.currency === 'VES').reduce((s, b) => s + (b.spent || 0), 0);
    return { totalUSD, totalVES, totalSpentUSD, totalSpentVES };
  }, [budgetsWithSpent]);

  // --- ACCIONES ---
  const handleEdit = (budget: Budget) => {
    setNewBudget({
        category: budget.category,
        limit: budget.limit,
        currency: budget.currency
    });
    setEditingId(budget.id);
    setShowForm(true);
    // Scroll suave al formulario
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setNewBudget({ category: expenseCategories[0] || '', limit: 0, currency: 'USD' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let targetMonth = selectedMonth;
    if (editingId) {
        const originalBudget = budgets.find(b => b.id === editingId);
        if (originalBudget) targetMonth = originalBudget.month;
    }

    const payload = {
        category: newBudget.category,
        limit: newBudget.limit,
        month: targetMonth,
        currency: newBudget.currency
    };

    let error;
    if (editingId) {
        // ACTUALIZAR (Requiere el permiso del Paso 1)
        const result = await supabase.from('budgets').update(payload).eq('id', editingId);
        error = result.error;
    } else {
        // CREAR
        const { data: existing } = await supabase.from('budgets')
            .select('id').eq('user_id', user.id).eq('category', newBudget.category).eq('month', targetMonth).single();
        
        if (existing) {
             const result = await supabase.from('budgets').update(payload).eq('id', existing.id);
             error = result.error;
        } else {
             const result = await supabase.from('budgets').insert([{...payload, user_id: user.id}]);
             error = result.error;
        }
    }

    if (error) {
        alert("Error: " + error.message);
    } else {
        handleCancel();
        onAdd(); // Refresca los datos SIN recargar la página
    }
  };

  const requestDelete = (id: string) => {
    setConfirmModal({
        isOpen: true,
        title: '¿Eliminar Presupuesto?',
        message: 'Se eliminará este límite definitivamente.',
        onConfirm: async () => {
            const { error } = await supabase.from('budgets').delete().eq('id', id);
            if (!error) {
                onDelete(); // Refresca los datos SIN recargar la página
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        }
    });
  };

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, month - 1));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                 <PieChart size={24} />
               </div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 leading-none">Presupuesto Global</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Planificación para {monthName}</p>
               </div>
             </div>
             
             <div className="flex flex-wrap gap-8 pt-2">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total en Dólares</p>
                  <p className="text-2xl font-black text-slate-900">${globalSummary.totalUSD.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: `${Math.min((globalSummary.totalSpentUSD / (globalSummary.totalUSD || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 italic">Ejecutado: ${globalSummary.totalSpentUSD.toFixed(0)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total en Bolívares</p>
                  <p className="text-2xl font-black text-slate-900">Bs. {globalSummary.totalVES.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: `${Math.min((globalSummary.totalSpentVES / (globalSummary.totalVES || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 italic">Ejecutado: Bs. {globalSummary.totalSpentVES.toFixed(0)}</span>
                  </div>
                </div>
             </div>
          </div>
          
          <button 
            onClick={() => {
                if(showForm) handleCancel();
                else setShowForm(true);
            }}
            className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {showForm ? <><X size={20}/> Cancelar</> : <><Plus size={20}/> {editingId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</>}
          </button>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <Wallet size={200} />
        </div>
      </section>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-2xl animate-in zoom-in duration-300 relative">
          {editingId && (
              <div className="absolute top-6 right-8 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Modo Edición
              </div>
          )}
          <div className="flex items-center gap-2 mb-6 text-indigo-600">
             <TrendingUp size={18} />
             <h3 className="font-black uppercase text-xs tracking-widest">
                 {editingId ? 'Editar Límite Existente' : `Definir Nuevo Límite - ${monthName}`}
             </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Categoría</label>
              <select 
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                value={newBudget.category}
                onChange={e => setNewBudget({...newBudget, category: e.target.value})}
                disabled={!!editingId}
              >
                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Tope Mensual</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg"
                  placeholder="0.00"
                  value={newBudget.limit || ''}
                  onChange={e => setNewBudget({...newBudget, limit: parseFloat(e.target.value)})}
                  required
                />
                <select 
                  className="px-4 py-4 rounded-2xl bg-slate-50 border-none outline-none font-black text-slate-600"
                  value={newBudget.currency}
                  onChange={e => setNewBudget({...newBudget, currency: e.target.value as Currency})}
                >
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                </select>
              </div>
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
              {editingId ? 'Actualizar' : 'Guardar'} <ChevronRight size={18} />
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetsWithSpent.map(b => {
          const limit = b.limit || 0;
          const spent = b.spent || 0;
          const percentage = Math.min((spent / (limit || 1)) * 100, 100);
          const isOver = spent > limit;
          const isWarning = percentage >= 80 && !isOver;
          
          return (
            <div key={b.id} className={`bg-white p-8 rounded-[2.5rem] border ${isOver ? 'border-rose-100' : 'border-slate-100'} shadow-sm relative overflow-hidden group transition-all hover:shadow-xl`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{b.category}</h3>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Tope: {b.currency === 'USD' ? '$' : 'Bs '}{limit.toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                    {isOver && (
                       <div title="Presupuesto excedido" className="p-2 bg-rose-50 text-rose-500 rounded-xl animate-pulse">
                          <AlertCircle size={18} />
                       </div>
                    )}
                    <button onClick={() => handleEdit(b)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-colors" title="Editar">
                        <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(b.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className={`text-2xl font-black ${isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                      {b.currency === 'USD' ? '$' : 'Bs '}{spent.toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${isOver ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
                
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className={isOver ? 'text-rose-600 animate-pulse' : isWarning ? 'text-amber-500' : 'text-slate-400'}>
                    {isOver ? '¡Excedido!' : isWarning ? 'Cuidado' : 'En orden'}
                  </span>
                  <span className="text-slate-400">
                    Quedan: {b.currency === 'USD' ? '$' : 'Bs '}{Math.max(0, limit - spent).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
