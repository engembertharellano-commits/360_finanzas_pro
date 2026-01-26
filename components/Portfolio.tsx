
import React, { useState, useMemo } from 'react';
import { Investment, Currency, BankAccount, Transaction } from '../types';
import { 
  Plus, TrendingUp, Trash2, Search, 
  Loader2, AlertTriangle, ChevronRight, X, BarChart2, ArrowDownCircle, Info, Building2, Coins, HandCoins, Calendar,
  ArrowUpRight, Landmark, DollarSign, RefreshCw, CheckCircle2
} from 'lucide-react';
import { FinanceAIService } from '../services/geminiService';

interface Props {
  investments: Investment[];
  accounts: BankAccount[];
  onAdd: (inv: Investment) => void;
  onUpdate: (inv: Investment) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  exchangeRate: number;
}

type InvestmentCategory = 'Acciones / ETFs' | 'Criptomonedas' | 'Renta Fija / Préstamos' | 'Bienes Raíces' | 'Otros';

export const Portfolio: React.FC<Props> = ({ 
  investments, accounts, onAdd, onUpdate, onDelete, onAddTransaction, exchangeRate 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  
  const [liquidatingInv, setLiquidatingInv] = useState<Investment | null>(null);
  const [recordingYieldInv, setRecordingYieldInv] = useState<Investment | null>(null);
  const [yieldAmount, setYieldAmount] = useState<number>(0);
  
  const [sellUnits, setSellUnits] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [sellCommission, setSellCommission] = useState<number>(0);
  const [targetAccountId, setTargetAccountId] = useState<string>('');

  const [newInv, setNewInv] = useState({
    name: '',
    ticker: '',
    sourceAccountId: '', 
    initialInvestment: 0,
    buyCommission: 0,
    quantity: 1,
    buyPrice: 0,
    currentMarketPrice: 0,
    currency: 'USD' as Currency,
    category: 'Acciones / ETFs' as InvestmentCategory,
    yieldRate: 0,
    yieldPeriod: 'Anual' as 'Mensual' | 'Anual',
    date: new Date().toISOString().split('T')[0]
  });

  const availableSourceAccounts = useMemo(() => 
    accounts.filter(a => a.currency === newInv.currency), 
    [accounts, newInv.currency]
  );

  const handleCalculation = (field: 'capital' | 'price' | 'units', value: number) => {
    setNewInv(prev => {
      const update = { ...prev };
      if (field === 'capital') {
        update.initialInvestment = value;
        if (update.buyPrice > 0) update.quantity = value / update.buyPrice;
        else update.quantity = 1;
      } else if (field === 'price') {
        update.buyPrice = value;
        if (update.initialInvestment > 0) update.quantity = update.initialInvestment / value;
      } else if (field === 'units') {
        update.quantity = value;
        if (update.buyPrice > 0) update.initialInvestment = value * update.buyPrice;
      }
      return update;
    });
  };

  const handleLookup = async () => {
    if (!newInv.ticker) return;
    setIsSearching(true);
    try {
      const service = new FinanceAIService();
      const info = await service.lookupAssetInfo(newInv.ticker);
      if (info) {
        setNewInv(prev => ({
          ...prev,
          name: info.name,
          currentMarketPrice: info.price,
          buyPrice: info.price,
          quantity: prev.initialInvestment > 0 ? prev.initialInvestment / info.price : prev.quantity
        }));
      }
    } catch (error) {
      console.error("Error buscando activo:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateAllPrices = async () => {
    const tickersToUpdate = investments.filter(inv => inv.ticker);
    if (tickersToUpdate.length === 0) return;

    setIsUpdatingPrices(true);
    setUpdateStatus("Iniciando actualización...");
    const service = new FinanceAIService();
    
    let count = 0;
    for (const inv of tickersToUpdate) {
      if (!inv.ticker) continue;
      count++;
      setUpdateStatus(`Actualizando ${inv.ticker} (${count}/${tickersToUpdate.length})...`);
      
      try {
        const info = await service.lookupAssetInfo(inv.ticker);
        if (info) {
          const updatedInv: Investment = {
            ...inv,
            currentMarketPrice: info.price,
            value: inv.quantity * info.price,
            performance: inv.buyPrice > 0 ? ((info.price - inv.buyPrice) / inv.buyPrice) * 100 : 0
          };
          onUpdate(updatedInv);
        }
      } catch (err) {
        console.error(`Error actualizando ${inv.ticker}:`, err);
      }
    }

    setUpdateStatus("¡Portafolio Actualizado!");
    setTimeout(() => {
      setIsUpdatingPrices(false);
      setUpdateStatus(null);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInv.sourceAccountId) {
      alert("⚠️ Error: Debes seleccionar la cuenta de donde sale el dinero.");
      return;
    }

    const sourceAcc = accounts.find(a => a.id === newInv.sourceAccountId);
    const totalCost = (newInv.initialInvestment || 0) + (newInv.buyCommission || 0);

    if (!sourceAcc) return;

    if (sourceAcc.balance < totalCost) {
      alert(`❌ Fondos Insuficientes en ${sourceAcc.name}.\n\nSaldo actual: ${sourceAcc.currency} ${sourceAcc.balance.toLocaleString()}\nCosto total: ${newInv.currency} ${totalCost.toLocaleString()}`);
      return;
    }

    const invId = crypto.randomUUID();

    onAdd({ 
      ...newInv, 
      id: invId, 
      value: newInv.quantity * (newInv.currentMarketPrice || newInv.buyPrice || newInv.initialInvestment),
      performance: 0,
      brokerId: sourceAcc.type === 'Broker' ? sourceAcc.id : undefined,
      category: newInv.category
    });

    onAddTransaction({
      description: `Inversión: ${newInv.name}`,
      amount: newInv.initialInvestment,
      commission: newInv.buyCommission,
      type: 'Transferencia', 
      category: 'Inversiones',
      date: newInv.date,
      currency: newInv.currency,
      accountId: newInv.sourceAccountId,
      relatedInvestmentId: invId
    });
    
    setShowForm(false);
    setNewInv({
      name: '', ticker: '', sourceAccountId: '', initialInvestment: 0, buyCommission: 0,
      quantity: 1, buyPrice: 0, currentMarketPrice: 0, currency: 'USD', category: 'Acciones / ETFs', 
      yieldRate: 0, yieldPeriod: 'Anual', date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSell = () => {
    if (!liquidatingInv || sellUnits <= 0) return;
    const proceeds = sellUnits * sellPrice;
    
    onUpdate({
      ...liquidatingInv,
      quantity: liquidatingInv.quantity - sellUnits,
      value: (liquidatingInv.quantity - sellUnits) * (liquidatingInv.currentMarketPrice || sellPrice),
      initialInvestment: liquidatingInv.initialInvestment - (sellUnits * liquidatingInv.buyPrice)
    });

    if (targetAccountId) {
      onAddTransaction({
        description: `Venta/Liquidación: ${liquidatingInv.name}`,
        amount: proceeds,
        commission: sellCommission,
        type: 'Transferencia',
        category: 'Inversiones',
        date: new Date().toISOString().split('T')[0],
        currency: liquidatingInv.currency,
        toAccountId: targetAccountId,
        accountId: '', 
        relatedInvestmentId: liquidatingInv.id
      });
    }
    setLiquidatingInv(null);
  };

  const handleRecordYield = () => {
    if (!recordingYieldInv || yieldAmount <= 0 || !targetAccountId) return;

    onAddTransaction({
      description: `Rendimiento: ${recordingYieldInv.name}`,
      amount: yieldAmount,
      type: 'Ingreso',
      category: 'Inversiones',
      date: new Date().toISOString().split('T')[0],
      currency: recordingYieldInv.currency,
      accountId: targetAccountId
    });

    setRecordingYieldInv(null);
    setYieldAmount(0);
    setTargetAccountId('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Inversiones</h2>
          <p className="text-slate-500 text-sm font-medium">Gestiona tus activos y tenencia real</p>
        </div>
        {!showForm && (
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleUpdateAllPrices}
              disabled={isUpdatingPrices || investments.filter(i => i.ticker).length === 0}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
                updateStatus ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
                'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600'
              } disabled:opacity-50`}
            >
              {isUpdatingPrices ? <Loader2 size={18} className="animate-spin" /> : (updateStatus ? <CheckCircle2 size={18} /> : <RefreshCw size={18} />)}
              {updateStatus || 'Actualizar Precios'}
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus size={20} /> Nueva Inversión
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
          <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-2xl font-black text-slate-900">Configurar Inversión</h3>
              <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
                {['Acciones / ETFs', 'Criptomonedas', 'Renta Fija / Préstamos', 'Bienes Raíces', 'Otros'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setNewInv({...newInv, category: cat as InvestmentCategory})}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${newInv.category === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cuenta de Origen</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl bg-blue-50 border-2 border-blue-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                  value={newInv.sourceAccountId}
                  onChange={e => setNewInv({...newInv, sourceAccountId: e.target.value})}
                  required
                >
                  <option value="">-- Selecciona cuenta --</option>
                  {availableSourceAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type}) - Saldo: {a.currency} {a.balance.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre de la Inversión</label>
                <input placeholder="Ej. Acciones NVDA, Préstamo Familiar..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold text-slate-900 outline-none border border-slate-100" value={newInv.name} onChange={e => setNewInv({...newInv, name: e.target.value})} required />
              </div>
            </div>

            {(newInv.category === 'Acciones / ETFs' || newInv.category === 'Criptomonedas') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Símbolo (Ticker)</label>
                  <div className="relative">
                    <input placeholder="AAPL, BTC, ETH..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold text-slate-900 outline-none" value={newInv.ticker} onChange={e => setNewInv({...newInv, ticker: e.target.value.toUpperCase()})} />
                    <button type="button" onClick={handleLookup} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Moneda</label>
                   <div className="flex gap-2 p-2 bg-slate-50 rounded-2xl">
                     <button type="button" onClick={() => setNewInv({...newInv, currency: 'USD'})} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${newInv.currency === 'USD' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>USD</button>
                     <button type="button" onClick={() => setNewInv({...newInv, currency: 'VES'})} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${newInv.currency === 'VES' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>VES</button>
                   </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">Capital Invertido</label>
                    <input type="number" step="0.01" className="w-full py-5 text-center rounded-2xl bg-white/5 border border-white/10 font-black text-3xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={newInv.initialInvestment || ''} onChange={e => handleCalculation('capital', parseFloat(e.target.value) || 0)} />
                  </div>
                  
                  {newInv.category === 'Acciones / ETFs' || newInv.category === 'Criptomonedas' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">Precio Compra</label>
                        <input type="number" step="0.01" className="w-full py-5 text-center rounded-2xl bg-white/5 border border-white/10 font-black text-3xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={newInv.buyPrice || ''} onChange={e => handleCalculation('price', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-blue-400 tracking-widest block">Unidades</label>
                        <div className="w-full py-5 text-center rounded-2xl bg-blue-500/10 border border-blue-500/20 font-black text-3xl text-blue-400">
                          {newInv.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block">Rendimiento Estimado (%)</label>
                        <input type="number" step="0.1" className="w-full py-5 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 font-black text-3xl text-emerald-400 outline-none" value={newInv.yieldRate || ''} onChange={e => setNewInv({...newInv, yieldRate: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">Periodo</label>
                        <div className="flex flex-col gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                          <button type="button" onClick={() => setNewInv({...newInv, yieldPeriod: 'Mensual'})} className={`py-2 rounded-xl text-[10px] font-black uppercase ${newInv.yieldPeriod === 'Mensual' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Mensual</button>
                          <button type="button" onClick={() => setNewInv({...newInv, yieldPeriod: 'Anual'})} className={`py-2 rounded-xl text-[10px] font-black uppercase ${newInv.yieldPeriod === 'Anual' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Anual</button>
                        </div>
                      </div>
                    </>
                  )}
               </div>

               <div className="pt-6 mt-8 border-t border-white/5 flex flex-col items-center gap-4">
                  <label className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Gasto/Comisión Inicial</label>
                  <input type="number" step="0.01" className="w-48 py-3 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20 font-black text-xl text-rose-400 outline-none focus:ring-2 focus:ring-rose-500" value={newInv.buyCommission || ''} onChange={e => setNewInv({...newInv, buyCommission: parseFloat(e.target.value) || 0})} />
               </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 rounded-3xl bg-slate-50 text-slate-400 font-black hover:bg-slate-100 transition-all">Cancelar</button>
              <button type="button" onClick={handleSubmit} className="flex-[2] py-5 rounded-3xl bg-blue-600 text-white font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                Transferir a Inversión <ArrowDownCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investments.map(inv => {
            const broker = accounts.find(a => a.id === inv.brokerId);
            return (
              <div key={inv.id} className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-lg ${
                      inv.category === 'Bienes Raíces' ? 'bg-amber-50 text-amber-500' : 
                      inv.category === 'Criptomonedas' ? 'bg-purple-50 text-purple-500' :
                      inv.category === 'Renta Fija / Préstamos' ? 'bg-emerald-50 text-emerald-500' :
                      'bg-blue-50 text-blue-500'
                    }`}>
                       {inv.category === 'Bienes Raíces' ? <Building2 size={28} /> : 
                        inv.category === 'Criptomonedas' ? <Coins size={28} /> :
                        inv.category === 'Renta Fija / Préstamos' ? <HandCoins size={28} /> :
                        <TrendingUp size={28} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-lg leading-none truncate">{inv.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 truncate">
                        {inv.ticker || inv.category} {broker ? `• ${broker.name}` : ''}
                      </p>
                    </div>
                  </div>
                  {inv.yieldRate ? (
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                      {inv.yieldRate}% {inv.yieldPeriod}
                    </span>
                  ) : inv.buyPrice > 0 ? (
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${inv.performance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {inv.performance >= 0 ? '+' : ''}{inv.performance.toFixed(2)}%
                    </span>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-[2rem]">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Costo</p>
                      <p className="text-sm font-black text-slate-700">{inv.currency === 'USD' ? '$' : 'Bs '}{inv.initialInvestment.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valoración</p>
                      <p className="text-lg font-black text-slate-900">{inv.currency === 'USD' ? '$' : 'Bs '}{inv.value.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* CANTIDAD EXPLÍCITA DEL ACTIVO */}
                  <div className="flex items-center justify-between px-6 py-3 bg-blue-50/30 rounded-2xl border border-blue-50">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="text-blue-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenencia Actual</span>
                    </div>
                    <span className="text-sm font-black text-blue-600">
                      {inv.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} {inv.ticker || ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                   <button 
                    onClick={() => { setRecordingYieldInv(inv); setTargetAccountId(inv.brokerId || ''); }}
                    className="flex-1 bg-emerald-500 text-white px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                   >
                     <ArrowUpRight size={14} /> Rendimiento
                   </button>
                   <button 
                    onClick={() => { setLiquidatingInv(inv); setSellUnits(inv.quantity); setSellPrice(inv.currentMarketPrice || inv.buyPrice || inv.initialInvestment); setTargetAccountId(inv.brokerId || ''); }}
                    className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                   >
                     Liquidar
                   </button>
                   <button onClick={() => onDelete(inv.id)} className="p-2.5 text-slate-300 hover:text-rose-500 bg-slate-50 rounded-2xl transition-colors"><Trash2 size={20} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recordingYieldInv && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-4 border-emerald-500/10">
              <div className="p-10 space-y-8">
                 <div className="flex justify-between items-start">
                   <div>
                     <h3 className="text-3xl font-black text-slate-900">Cobrar Rendimiento</h3>
                     <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mt-1">Interés/Dividendo de {recordingYieldInv.name}</p>
                   </div>
                   <button onClick={() => setRecordingYieldInv(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={24}/></button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Monto del Rendimiento ({recordingYieldInv.currency})</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01" 
                          autoFocus
                          className="w-full py-8 text-center rounded-[2.5rem] bg-emerald-50 font-black text-4xl text-emerald-600 outline-none border-2 border-emerald-100 focus:border-emerald-500 transition-all" 
                          value={yieldAmount || ''} 
                          onChange={e => setYieldAmount(parseFloat(e.target.value) || 0)} 
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">Este monto se sumará a tus ingresos del mes.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-4">¿A qué cuenta depositar?</label>
                      <select className="w-full px-8 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-900" value={targetAccountId} onChange={e => setTargetAccountId(e.target.value)}>
                        <option value="">-- Selecciona cuenta receptora --</option>
                        {accounts.filter(a => a.currency === recordingYieldInv.currency).map(a => (<option key={a.id} value={a.id}>{a.name} ({a.type})</option>))}
                      </select>
                    </div>

                    <button 
                      onClick={handleRecordYield}
                      disabled={yieldAmount <= 0 || !targetAccountId}
                      className="w-full py-6 rounded-[2.5rem] font-black text-xl transition-all shadow-xl bg-emerald-500 shadow-emerald-100 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:shadow-none"
                    >
                      Registrar Ingreso <ArrowUpRight size={24} className="inline ml-2" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {liquidatingInv && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-4 border-slate-100">
              <div className="p-10 space-y-8">
                 <div className="flex justify-between items-start">
                   <div><h3 className="text-3xl font-black text-slate-900">Liquidar Capital</h3><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Retornando fondos de {liquidatingInv.name}</p></div>
                   <button onClick={() => setLiquidatingInv(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={24}/></button>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidades</label>
                      <input type="number" step="0.000001" className="w-full py-5 text-center rounded-[2rem] bg-slate-50 font-black text-2xl outline-none border border-transparent focus:border-blue-500" value={sellUnits} onChange={e => setSellUnits(Math.min(parseFloat(e.target.value) || 0, liquidatingInv.quantity))} />
                    </div>
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor Unitario</label>
                      <input type="number" step="0.01" className="w-full py-5 text-center rounded-[2rem] bg-slate-50 font-black text-2xl outline-none border border-transparent focus:border-blue-500" value={sellPrice} onChange={e => setSellPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                 </div>

                 <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto a Reintegrar</p>
                      <p className="text-[9px] text-slate-400 italic font-medium">(No se cuenta como ingreso operativo)</p>
                    </div>
                    <p className="text-3xl font-black">{liquidatingInv.currency === 'USD' ? '$' : 'Bs'}{(sellUnits * sellPrice - sellCommission).toLocaleString()}</p>
                 </div>

                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-4">¿A qué cuenta depositar?</label>
                     <select className="w-full px-8 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-900" value={targetAccountId} onChange={e => setTargetAccountId(e.target.value)}>
                       <option value="">-- Selecciona cuenta receptora --</option>
                       {accounts.filter(a => a.currency === liquidatingInv.currency).map(a => (<option key={a.id} value={a.id}>{a.name} ({a.type})</option>))}
                     </select>
                   </div>
                   <button onClick={handleSell} className="w-full py-6 rounded-[2rem] font-black text-xl transition-all shadow-xl bg-slate-900 text-white hover:bg-slate-800">Finalizar Reintegro <ChevronRight size={24} className="inline ml-2" /></button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
