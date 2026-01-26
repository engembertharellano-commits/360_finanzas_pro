
import React, { useState, useMemo } from 'react';
import { Transaction, BankAccount, Investment, Budget } from '../types';
import { 
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
  RefreshCw, Info, Wallet, 
  ArrowUpRight, Smartphone, Briefcase, Users
} from 'lucide-react';

interface Props {
  accounts: BankAccount[];
  transactions: Transaction[];
  investments: Investment[];
  budgets: Budget[];
  selectedMonth: string;
  exchangeRate: number;
  rateSourceUrl?: string;
  onSyncRate: () => void;
  isSyncingRate: boolean;
}

export const Dashboard: React.FC<Props> = ({ 
  accounts, transactions, investments, budgets, selectedMonth, exchangeRate, rateSourceUrl, onSyncRate, isSyncingRate
}) => {
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'VES'>('USD');

  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  
  const incomeUSD = monthTransactions
    .filter(t => t.type === 'Ingreso' && t.currency === 'USD' && !t.isWorkRelated && !t.isThirdParty)
    .reduce((s, t) => s + t.amount, 0);
  const incomeVES = monthTransactions
    .filter(t => t.type === 'Ingreso' && t.currency === 'VES' && !t.isWorkRelated && !t.isThirdParty)
    .reduce((s, t) => s + t.amount, 0);
  const totalIncomeNormalized = incomeUSD + (incomeVES / exchangeRate);

  const expenseUSD = monthTransactions
    .filter(t => t.type === 'Gasto' && t.currency === 'USD' && !t.isWorkRelated && !t.isThirdParty)
    .reduce((s, t) => s + t.amount, 0);
  const expenseVES = monthTransactions
    .filter(t => t.type === 'Gasto' && t.currency === 'VES' && !t.isWorkRelated && !t.isThirdParty)
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenseNormalized = expenseUSD + (expenseVES / exchangeRate);

  const netResult = totalIncomeNormalized - totalExpenseNormalized;

  const totalThirdPartyUSD = transactions
    .filter(t => t.isThirdParty)
    .reduce((acc, t) => {
      const val = t.currency === 'USD' ? t.amount : t.amount / exchangeRate;
      return acc + (t.type === 'Ingreso' ? val : -val);
    }, 0);

  const totalLiquidUSD = accounts.reduce((acc, curr) => {
    const val = curr.currency === 'USD' ? curr.balance : curr.balance / exchangeRate;
    return acc + (curr.type === 'Tarjeta de Crédito' ? -val : val);
  }, 0);

  const realPersonalNetWorth = totalLiquidUSD - totalThirdPartyUSD + investments.reduce((acc, inv) => {
    return acc + (inv.currency === 'USD' ? inv.value : inv.value / exchangeRate);
  }, 0);

  const chartData = [
    { name: 'MI DINERO', value: Math.max(0, totalLiquidUSD - totalThirdPartyUSD), color: '#3b82f6' },
    { name: 'CUSTODIA', value: Math.max(0, totalThirdPartyUSD), color: '#10b981' }
  ];

  const formatValue = (val: number) => {
    if (displayCurrency === 'USD') return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `Bs. ${(val * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSmallValue = (val: number, curr: 'USD' | 'VES') => {
    return curr === 'USD' ? `$${val.toLocaleString()}` : `Bs. ${val.toLocaleString()}`;
  };

  const monthName = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, month - 1));
  }, [selectedMonth]);

  return (
    <div className="space-y-10">
      {/* Barra de Tasa y Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
        <div className="bg-white px-6 py-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 flex-1">
          <button 
            onClick={onSyncRate}
            disabled={isSyncingRate}
            className={`w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center transition-all ${isSyncingRate ? 'animate-spin opacity-50' : 'hover:scale-110 active:scale-95'}`}
          >
            <RefreshCw size={22} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Tasa Sincronizada (BCV)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black text-slate-900 leading-none">1 USD = {exchangeRate.toFixed(2)} VES</p>
              {isSyncingRate && <span className="text-[10px] font-bold text-blue-500 animate-pulse">ACTUALIZANDO...</span>}
            </div>
          </div>
        </div>

        <div className="bg-slate-200/50 p-1.5 rounded-[1.8rem] flex gap-1 self-center lg:self-auto">
          <button onClick={() => setDisplayCurrency('USD')} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${displayCurrency === 'USD' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500'}`}>Dólares</button>
          <button onClick={() => setDisplayCurrency('VES')} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${displayCurrency === 'VES' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500'}`}>Bolívares</button>
        </div>
      </div>

      {/* Flujo Mensual */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 px-2">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Flujo Neto Personal <ArrowUpRight size={20} className="text-blue-500" />
          </h2>
          <div className="text-left md:text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Balance {monthName}</p>
            <p className={`text-3xl font-black ${netResult >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netResult >= 0 ? '+' : ''}{formatValue(netResult)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-emerald-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-100 group transition-all hover:-translate-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/70 mb-3">Tus Ingresos Reales</p>
            <h3 className="text-5xl md:text-6xl font-black mb-12 tracking-tighter">{formatValue(totalIncomeNormalized)}</h3>
            <div className="flex justify-between items-end border-t border-white/20 pt-8">
              <div><p className="text-[9px] font-black uppercase text-emerald-100/50 mb-1.5">Efectivo USD</p><p className="text-xl font-black">{formatSmallValue(incomeUSD, 'USD')}</p></div>
              <div className="text-right"><p className="text-[9px] font-black uppercase text-emerald-100/50 mb-1.5">Bolívares VES</p><p className="text-xl font-black">{formatSmallValue(incomeVES, 'VES')}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group transition-all hover:-translate-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Tus Gastos Personales</p>
            <h3 className="text-5xl md:text-6xl font-black mb-12 text-slate-900 tracking-tighter">{formatValue(totalExpenseNormalized)}</h3>
            <div className="flex justify-between items-end border-t border-slate-50 pt-8">
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1.5">Débito USD</p><p className="text-xl font-black text-slate-700">{formatSmallValue(expenseUSD, 'USD')}</p></div>
              <div className="text-right"><p className="text-[9px] font-black uppercase text-slate-400 mb-1.5">Consumo VES</p><p className="text-xl font-black text-slate-700">{formatSmallValue(expenseVES, 'VES')}</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Patrimonio y Segmentación */}
      <section className="space-y-6">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 px-2">
          Patrimonio Neto Real <Info size={16} className="text-slate-300" />
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[450px]">
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Activo Neto Propio</p>
              <h3 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">{formatValue(realPersonalNetWorth)}</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-[260px]">
                Valor total de tu riqueza personal descontando pasivos de terceros.
              </p>
            </div>
            <div className="space-y-5 pt-10 border-t border-white/5">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Dinero Ajeno</span><span className="text-xl font-black text-emerald-400">-{formatValue(totalThirdPartyUSD)}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Saldo en Bancos</span><span className="text-xl font-black">{formatValue(totalLiquidUSD)}</span></div>
            </div>
          </div>

          <div className="xl:col-span-8 bg-white rounded-[3.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10">
             <div className="flex-1 min-w-0">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Distribución por Entidad</h4>
               <div className="space-y-5 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between group p-3 hover:bg-slate-50 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          {acc.type === 'Billetera Virtual' ? <Smartphone size={18} /> : <Wallet size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{acc.name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{acc.type}</p>
                        </div>
                      </div>
                      <p className="text-base font-black text-slate-800">{acc.currency === 'USD' ? '$' : 'Bs.'} {acc.balance.toLocaleString()}</p>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="py-10 text-center opacity-30 italic font-medium">No hay cuentas registradas</div>
                  )}
               </div>
             </div>
             <div className="w-full md:w-[280px] flex flex-col items-center justify-center pt-10 md:pt-0 border-t md:border-t-0 md:border-l border-slate-50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Composición de Caja</h4>
                <div className="w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={chartData} innerRadius={75} outerRadius={105} paddingAngle={10} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '15px' }} 
                        itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-5">
                  <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[9px] font-black uppercase text-slate-500">Propio</span></div>
                  <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black uppercase text-slate-500">Custodia</span></div>
                </div>
             </div>
          </div>
        </div>

        {/* Potes Especiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
           <div className="bg-indigo-50/70 border-2 border-indigo-100 p-6 rounded-[2.5rem] flex items-center gap-5 group transition-all hover:bg-indigo-50">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Briefcase size={22} /></div>
             <div>
               <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest leading-none mb-1">Fondo de Trabajo</p>
               <p className="text-xs font-bold text-indigo-400 italic">Anticipos y gastos corporativos aislados.</p>
             </div>
           </div>
           <div className="bg-emerald-50/70 border-2 border-emerald-100 p-6 rounded-[2.5rem] flex items-center gap-5 group transition-all hover:bg-emerald-50">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><Users size={22} /></div>
             <div>
               <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">Gestión de Terceros</p>
               <p className="text-xs font-bold text-emerald-400 italic">Dinero bajo tu cuidado pero de otros dueños.</p>
             </div>
           </div>
        </div>
      </section>
    </div>
  );
};
