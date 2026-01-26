
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Transaction, 
  Category, 
  TransactionType, 
  Currency,
  BankAccount
} from '../types';
import { ArrowRight, RefreshCcw, DollarSign, Settings2, Plus, Minus, Briefcase, Users } from 'lucide-react';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  accounts: BankAccount[];
  globalExchangeRate: number;
  expenseCategories: string[];
  incomeCategories: string[];
}

export const TransactionForm: React.FC<Props> = ({ 
  onAdd, accounts, globalExchangeRate, expenseCategories, incomeCategories 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [commission, setCommission] = useState<string>('0');
  const [type, setType] = useState<TransactionType>('Gasto');
  const [category, setCategory] = useState<Category>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState('');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'plus' | 'minus'>('plus');
  
  // Segmentación de fondos
  const [fundType, setFundType] = useState<'personal' | 'work' | 'thirdParty'>('personal');
  const [thirdPartyOwner, setThirdPartyOwner] = useState('');
  
  const [manualRate, setManualRate] = useState<string>(globalExchangeRate.toString());
  const [targetAmount, setTargetAmount] = useState<string>('');

  const selectedAccount = accounts.find(a => a.id === accountId);
  const targetAccount = accounts.find(a => a.id === toAccountId);

  const isBimonetary = type === 'Transferencia' && 
    selectedAccount && targetAccount && 
    selectedAccount.currency !== targetAccount.currency;

  useEffect(() => {
    if (type === 'Ingreso') setCategory(incomeCategories[0] || '');
    else if (type === 'Gasto') setCategory(expenseCategories[0] || '');
    else if (type === 'Ajuste') setCategory('Conciliación');
    else setCategory('Transferencia');
  }, [type, incomeCategories, expenseCategories]);

  const updateConversion = useCallback((sourceAmt: string, rate: string, fieldChanged: 'amount' | 'rate' | 'target') => {
    if (!isBimonetary) return;
    const amt = parseFloat(sourceAmt) || 0;
    const rt = parseFloat(rate) || 0;
    if (fieldChanged === 'amount' || fieldChanged === 'rate') {
      if (rt > 0) {
        const result = selectedAccount?.currency === 'USD' ? (amt * rt) : (amt / rt);
        setTargetAmount(result.toFixed(2));
      }
    } else if (fieldChanged === 'target') {
      const tgt = parseFloat(targetAmount) || 0;
      if (amt > 0) {
        const calculatedRate = selectedAccount?.currency === 'USD' ? (tgt / amt) : (amt / tgt);
        setManualRate(calculatedRate.toFixed(4));
      }
    }
  }, [isBimonetary, selectedAccount?.currency, targetAmount]);

  useEffect(() => {
    if (isBimonetary) updateConversion(amount, manualRate, 'amount');
  }, [amount, manualRate, isBimonetary, updateConversion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !accountId) return;

    onAdd({
      description,
      amount: parseFloat(amount),
      commission: parseFloat(commission) || 0,
      type,
      category,
      date,
      currency: selectedAccount?.currency || 'USD',
      accountId,
      toAccountId: type === 'Transferencia' ? toAccountId : undefined,
      targetAmount: isBimonetary ? parseFloat(targetAmount) : undefined,
      adjustmentDirection: type === 'Ajuste' ? adjustmentDirection : undefined,
      isWorkRelated: fundType === 'work',
      workStatus: fundType === 'work' ? 'pending' : undefined,
      isThirdParty: fundType === 'thirdParty',
      thirdPartyOwner: fundType === 'thirdParty' ? thirdPartyOwner : undefined
    });

    setDescription('');
    setAmount('');
    setCommission('0');
    setTargetAmount('');
    setThirdPartyOwner('');
    setManualRate(globalExchangeRate.toString());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-xl font-black text-slate-900">Nueva Operación</h3>
        
        {/* Selector de Fondo */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button 
            type="button" 
            onClick={() => setFundType('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              fundType === 'personal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Personal
          </button>
          <button 
            type="button" 
            onClick={() => setFundType('work')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              fundType === 'work' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Briefcase size={12} /> Trabajo
          </button>
          <button 
            type="button" 
            onClick={() => setFundType('thirdParty')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              fundType === 'thirdParty' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={12} /> Custodia
          </button>
        </div>
      </div>

      {fundType === 'thirdParty' && (
        <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4 animate-in slide-in-from-top-2">
           <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><Users size={18}/></div>
           <div className="flex-1">
              <label className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block mb-1">¿De quién es este dinero?</label>
              <input 
                type="text" 
                value={thirdPartyOwner} 
                onChange={e => setThirdPartyOwner(e.target.value)} 
                placeholder="Ej. Mi Hija, Préstamo de Mamá..."
                className="w-full bg-transparent border-b border-emerald-200 outline-none text-sm font-black text-emerald-900 placeholder:text-emerald-300"
                required
              />
           </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          {(['Gasto', 'Ingreso', 'Transferencia', 'Ajuste'] as TransactionType[]).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descripción</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Depósito Mesada, Pago Colegio..." className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cuenta</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold" required>
              <option value="">Selecciona cuenta</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type}) - {acc.currency} {acc.balance.toLocaleString()}</option>)}
            </select>
          </div>
        </div>

        {type === 'Ajuste' && (
           <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between animate-in slide-in-from-left-2">
             <div className="flex items-center gap-2">
               <Settings2 size={16} className="text-amber-500" />
               <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Sentido del Ajuste</span>
             </div>
             <div className="flex bg-white/50 p-1 rounded-xl gap-1">
               <button type="button" onClick={() => setAdjustmentDirection('plus')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${adjustmentDirection === 'plus' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>
                 <Plus size={12}/> SUMAR
               </button>
               <button type="button" onClick={() => setAdjustmentDirection('minus')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${adjustmentDirection === 'minus' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>
                 <Minus size={12}/> RESTAR
               </button>
             </div>
           </div>
        )}

        {type === 'Transferencia' && (
          <div className="flex flex-col gap-1 animate-in slide-in-from-left-2">
            <label className="text-[10px] font-black uppercase text-blue-600 ml-1">Destino</label>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 font-bold text-blue-700" required>
              <option value="">Selecciona destino</option>
              {accounts.filter(a => a.id !== accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>)}
            </select>
          </div>
        )}

        {type !== 'Transferencia' && type !== 'Ajuste' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
              required
            >
              {(type === 'Gasto' ? expenseCategories : incomeCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-black text-lg" required />
          </div>
          {type !== 'Ajuste' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-rose-500 ml-1">Comisión</label>
              <div className="relative">
                <input type="number" step="0.01" value={commission} onChange={(e) => setCommission(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-rose-100 bg-rose-50/30 text-rose-600 font-black" />
                <DollarSign size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-300" />
              </div>
            </div>
          )}
        </div>

        {isBimonetary && (
           <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-amber-600">Tasa de Cambio</label>
                <input type="number" step="0.0001" value={manualRate} onChange={(e) => setManualRate(e.target.value)} className="w-32 px-3 py-1.5 rounded-lg border-none bg-white font-black text-right" />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-amber-600">Llega al Destino ({targetAccount?.currency})</label>
                <input type="number" value={targetAmount} onChange={(e) => { setTargetAmount(e.target.value); updateConversion(amount, manualRate, 'target'); }} className="w-32 px-3 py-1.5 rounded-lg border-none bg-white font-black text-right" />
              </div>
           </div>
        )}

        <button 
          type="submit" 
          className={`w-full font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${
            fundType === 'work' ? 'bg-indigo-600' : fundType === 'thirdParty' ? 'bg-emerald-600' : 'bg-slate-900'
          } text-white`}
        >
          <ArrowRight size={20} />
          {fundType === 'work' ? 'Registrar en Pote Trabajo' : fundType === 'thirdParty' ? `Guardar Dinero de ${thirdPartyOwner || 'Terceros'}` : 'Confirmar Movimiento'}
        </button>
      </div>
    </form>
  );
};
