import React, { useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, Building2 
} from 'lucide-react';
import { BankAccount, Transaction, Investment, Budget } from '../types';
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title 
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

interface DashboardProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  investments: Investment[]; // <--- Ahora usaremos esto
  budgets: Budget[];
  selectedMonth: string;
  exchangeRate: number;
  onSyncRate: () => void;
  isSyncingRate: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  accounts, transactions, investments, selectedMonth, exchangeRate, onSyncRate, isSyncingRate 
}) => {
  
  // 1. Cálculos Generales
  const totalBalanceUSD = accounts.reduce((acc, curr) => {
    if (curr.currency === 'USD') return acc + curr.balance;
    return acc + (curr.balance / exchangeRate);
  }, 0);

  // 2. Cálculo de Inversiones (Nuevo)
  const totalInvestedUSD = investments.reduce((acc, curr) => {
    // Usamos el precio actual si existe, si no el precio de compra
    const price = Number(curr.currentPrice) || Number(curr.currentMarketPrice) || Number(curr.buyPrice) || 0;
    const qty = Number(curr.quantity) || 0;
    return acc + (price * qty);
  }, 0);

  // 3. Patrimonio Total (Bancos + Inversiones)
  const netWorth = totalBalanceUSD + totalInvestedUSD;

  // 4. Filtrar transacciones del mes
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  
  const income = monthTransactions
    .filter(t => t.type === 'income' || t.type === 'ingreso')
    .reduce((acc, t) => {
      const amount = t.currency === 'VES' ? t.amount / exchangeRate : t.amount;
      return acc + amount;
    }, 0);

  const expenses = monthTransactions
    .filter(t => t.type === 'expense' || t.type === 'gasto')
    .reduce((acc, t) => {
      const amount = t.currency === 'VES' ? t.amount / exchangeRate : t.amount;
      return acc + amount;
    }, 0);

  // 5. Datos para Gráficas
  const doughnutData = {
    labels: ['Efectivo (Bancos)', 'Inversiones (Portafolio)'],
    datasets: [{
      data: [totalBalanceUSD, totalInvestedUSD],
      backgroundColor: ['#3b82f6', '#8b5cf6'],
      borderWidth: 0,
    }],
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER: Tasa de Cambio */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="bg-indigo-50 p-2 rounded-full">
            <TrendingUp className="text-indigo-600 w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tasa BCV / Monitor</p>
            <p className="text-lg font-black text-slate-800">1 USD = {exchangeRate.toFixed(2)} VES</p>
          </div>
        </div>
        <button 
          onClick={onSyncRate} 
          disabled={isSyncingRate}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          {isSyncingRate ? <span className="animate-spin">↻</span> : '↻'} Actualizar Tasa
        </button>
      </div>

      {/* TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Patrimonio Neto */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl col-span-1 md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Patrimonio Neto Total</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex gap-4">
              <div className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <span className="text-xs text-slate-300 block">En Bancos</span>
                <span className="font-bold">${totalBalanceUSD.toLocaleString()}</span>
              </div>
              <div className="bg-indigo-500/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-indigo-500/30">
                <span className="text-xs text-indigo-200 block">En Inversiones</span>
                <span className="font-bold text-indigo-100">${totalInvestedUSD.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ingresos Mes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <ArrowUpRight className="text-emerald-600 w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+ Mes Actual</span>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-4">Ingresos</p>
            <h3 className="text-2xl font-black text-slate-800">${income.toLocaleString()}</h3>
          </div>
        </div>

        {/* Inversiones (NUEVA TARJETA) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-violet-100 p-3 rounded-2xl">
              <TrendingUp className="text-violet-600 w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">Portafolio</span>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase mt-4">Valor Mercado</p>
            <h3 className="text-2xl font-black text-slate-800">${totalInvestedUSD.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS Y DISTRIBUCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Distribución de Activos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-slate-400"/> Composición
          </h3>
          <div className="h-48 flex items-center justify-center">
             {/* Si no hay datos, mostramos mensaje */}
             {netWorth > 0 ? (
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
             ) : (
                <p className="text-slate-400 text-xs italic">Sin datos suficientes</p>
             )}
          </div>
        </div>

        {/* Lista Rápida de Cuentas */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <Building2 size={20} className="text-slate-400"/> Resumen de Cuentas
          </h3>
          <div className="space-y-4">
            {accounts.slice(0, 3).map(acc => (
              <div key={acc.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${acc.currency === 'USD' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                    {acc.currency === 'USD' ? '$' : 'Bs'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{acc.name}</p>
                    <p className="text-xs text-slate-400 uppercase">{acc.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">
                    {acc.currency === 'USD' ? '$' : 'Bs.'} {acc.balance.toLocaleString()}
                  </p>
                  {acc.currency === 'VES' && (
                    <p className="text-xs text-slate-400 font-medium">
                      ≈ ${(acc.balance / exchangeRate).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {accounts.length === 0 && <p className="text-slate-400 italic text-center py-4">No hay cuentas registradas</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
