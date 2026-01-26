
import React, { useState, useMemo } from 'react';
import { Transaction, BankAccount } from '../types';
import { TransactionForm } from './TransactionForm';
import { Search, ArrowUpCircle, ArrowDownCircle, RefreshCcw, Trash2, Briefcase, Users } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  accounts: BankAccount[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
  selectedMonth: string;
  exchangeRate: number;
  expenseCategories: string[];
  incomeCategories: string[];
}

export const TransactionsLog: React.FC<Props> = ({ 
  transactions, accounts, onAdd, onDelete, selectedMonth, exchangeRate, expenseCategories, incomeCategories 
}) => {
  const [filter, setFilter] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);

  // Added fix for monthName missing error
  const monthName = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, month - 1));
  }, [selectedMonth]);

  const filteredTransactions = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .filter(t => t.description.toLowerCase().includes(filter.toLowerCase()) || t.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Bitácora de Movimientos</h2>
          <p className="text-slate-500 text-sm font-medium">Control total de entradas y salidas del periodo</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
            showAdd ? 'bg-white text-slate-600 border-2 border-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {showAdd ? 'Cerrar Panel' : 'Añadir Operación'}
        </button>
      </div>

      {showAdd && (
        <div className="animate-in fade-in slide-in-from-top-6 duration-500">
          <TransactionForm 
            onAdd={(t) => { onAdd(t); setShowAdd(false); }} 
            accounts={accounts}
            globalExchangeRate={exchangeRate}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
          />
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50">
          <div className="relative group">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
              className="w-full pl-16 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-500/5 text-sm font-bold transition-all"
              placeholder="Filtra por nombre, categoría o etiqueta..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/30">
                <th className="px-10 py-6">Fecha</th>
                <th className="px-10 py-6">Detalle de Operación</th>
                <th className="px-10 py-6">Origen</th>
                <th className="px-10 py-6 text-right">Monto</th>
                <th className="px-10 py-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(t => {
                const sourceAcc = accounts.find(a => a.id === t.accountId);
                
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <p className="text-sm font-black text-slate-900">
                        {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                          t.isThirdParty ? 'bg-emerald-50 text-emerald-600' :
                          t.isWorkRelated ? 'bg-indigo-50 text-indigo-600' :
                          t.type === 'Ingreso' ? 'bg-blue-50 text-blue-600' : 
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {t.isThirdParty ? <Users size={20} /> : 
                           t.isWorkRelated ? <Briefcase size={20} /> :
                           t.type === 'Ingreso' ? <ArrowUpCircle size={20} /> : 
                           t.type === 'Gasto' ? <ArrowDownCircle size={20} /> : 
                           <RefreshCcw size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 leading-none mb-2">{t.description}</p>
                          <div className="flex flex-wrap items-center gap-3">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.category}</span>
                             {t.isThirdParty && (
                               <span className="text-[8px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">De: {t.thirdPartyOwner}</span>
                             )}
                             {t.isWorkRelated && (
                               <span className="text-[8px] font-black bg-indigo-500 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">Corporativo</span>
                             )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700">{sourceAcc?.name || '---'}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{sourceAcc?.type}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                        <p className={`text-base font-black ${
                          t.isThirdParty ? 'text-emerald-600' :
                          t.isWorkRelated ? 'text-indigo-600' :
                          t.type === 'Ingreso' ? 'text-blue-600' : 
                          'text-slate-900'
                        }`}>
                          {t.type === 'Gasto' ? '-' : (t.type === 'Ingreso' ? '+' : '')}
                          {t.currency === 'USD' ? '$' : 'Bs '}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <button 
                        onClick={() => onDelete(t.id)} 
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="py-32 text-center bg-slate-50/20">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-5 text-slate-200">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sin resultados para {monthName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
