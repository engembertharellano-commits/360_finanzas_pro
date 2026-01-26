
import React, { useState } from 'react';
import { BankAccount, AccountType, Currency } from '../types';
import { Plus, Trash2, CreditCard, Landmark, Wallet as WalletIcon, Smartphone, BarChart2 } from 'lucide-react';

interface Props {
  accounts: BankAccount[];
  onAdd: (acc: BankAccount) => void;
  onDelete: (id: string) => void;
}

export const AccountsList: React.FC<Props> = ({ accounts, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [newAcc, setNewAcc] = useState({
    name: '',
    type: 'Ahorros' as AccountType,
    balance: 0,
    currency: 'USD' as Currency,
    color: '#3b82f6',
    creditLimit: 0,
    closingDay: 1,
    dueDay: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData: BankAccount = {
      ...newAcc,
      id: crypto.randomUUID(),
      // Asegurar que el balance sea un número válido, incluso si es 0
      balance: Number(newAcc.balance) || 0,
      ...(newAcc.type === 'Tarjeta de Crédito' ? {
        creditLimit: newAcc.creditLimit,
        closingDay: newAcc.closingDay,
        dueDay: newAcc.dueDay
      } : {
        creditLimit: undefined,
        closingDay: undefined,
        dueDay: undefined
      })
    };
    onAdd(accountData);
    setShowForm(false);
    setNewAcc({ name: '', type: 'Ahorros', balance: 0, currency: 'USD', color: '#3b82f6', creditLimit: 0, closingDay: 1, dueDay: 1 });
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'Tarjeta de Crédito': return <CreditCard />;
      case 'Efectivo': return <WalletIcon />;
      case 'Billetera Virtual': return <Smartphone />;
      case 'Broker': return <BarChart2 />;
      default: return <Landmark />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Bancos y Brokers</h2>
          <p className="text-slate-500 text-sm font-medium">Gestiona tu liquidez y tus plataformas de inversión</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> Nueva Cuenta
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-300 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Entidad / Broker</label>
              <input 
                placeholder="Ej. Banesco, Binance, Hapi..." 
                className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={newAcc.name}
                onChange={e => setNewAcc({...newAcc, name: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo de Cuenta</label>
              <select 
                className="px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50"
                value={newAcc.type}
                onChange={e => setNewAcc({...newAcc, type: e.target.value as AccountType})}
              >
                <option value="Ahorros">Ahorros</option>
                <option value="Corriente">Corriente</option>
                <option value="Broker">Broker / Inversiones</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Billetera Virtual">Billetera Virtual</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                {newAcc.type === 'Tarjeta de Crédito' ? 'Deuda Inicial' : 'Saldo Inicial'}
              </label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="px-4 py-3 rounded-xl border border-slate-200 outline-none"
                // IMPORTANTE: Permitir el 0 explícitamente
                value={newAcc.balance}
                onChange={e => setNewAcc({...newAcc, balance: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
              />
              <p className="text-[9px] text-slate-400 mt-1">Puedes dejarlo en 0 y fondearla después mediante transferencias.</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Moneda</label>
              <select 
                className="px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50"
                value={newAcc.currency}
                onChange={e => setNewAcc({...newAcc, currency: e.target.value as Currency})}
              >
                <option value="USD">Dólares (USD)</option>
                <option value="VES">Bolívares (VES)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl"
            >
              Crear Cuenta
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const isCredit = acc.type === 'Tarjeta de Crédito';
          const isBroker = acc.type === 'Broker';
          const available = isCredit && acc.creditLimit ? acc.creditLimit - acc.balance : 0;

          return (
            <div key={acc.id} className={`group relative bg-white p-7 rounded-[2.5rem] border ${isBroker ? 'border-blue-100 bg-blue-50/10' : 'border-slate-100'} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3.5 rounded-2xl`} style={{ backgroundColor: isBroker ? '#3b82f615' : `${acc.color}15`, color: isBroker ? '#3b82f6' : acc.color }}>
                  {getAccountIcon(acc.type)}
                </div>
                <button 
                  onClick={() => onDelete(acc.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-1 mb-4">
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{acc.type}</h3>
                <p className="text-xl font-black text-slate-900 truncate">{acc.name}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">{isCredit ? 'Deuda' : 'Efectivo / Caja'}</p>
                  <p className={`text-3xl font-black ${isCredit && acc.balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {acc.currency === 'USD' ? '$' : 'Bs '}{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                {isBroker && (
                   <div className="pt-4 border-t border-blue-50 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${acc.balance > 0 ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`}></div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Disponible para Invertir</span>
                   </div>
                )}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-[2.5rem]" style={{ backgroundColor: isBroker ? '#3b82f6' : acc.color }}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
