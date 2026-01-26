
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Briefcase, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle, Info, Clock, Wallet, History, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onUpdateTransaction: (t: Transaction) => void;
  exchangeRate: number;
}

export const WorkManagement: React.FC<Props> = ({ transactions, onUpdateTransaction, exchangeRate }) => {
  // Solo transacciones pendientes de rendición
  const workTransactions = useMemo(() => 
    transactions.filter(t => t.isWorkRelated && t.workStatus === 'pending')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [transactions]
  );

  // Lógica del Pote: Anticipos (+) - Gastos (-)
  const pote = useMemo(() => {
    let totalAdvances = 0; // Lo que entró de la empresa
    let totalExpenses = 0; // Lo que gasté

    workTransactions.forEach(t => {
      const amountUSD = t.currency === 'USD' ? t.amount : t.amount / exchangeRate;
      if (t.type === 'Ingreso') {
        totalAdvances += amountUSD;
      } else if (t.type === 'Gasto') {
        totalExpenses += amountUSD;
      }
    });

    const balance = totalAdvances - totalExpenses;
    return { 
      balance, 
      totalAdvances, 
      totalExpenses,
      status: balance >= 0 ? 'con_fondo' : 'por_cobrar'
    };
  }, [workTransactions, exchangeRate]);

  const handleSettleAll = () => {
    workTransactions.forEach(t => {
      onUpdateTransaction({ ...t, workStatus: 'settled' });
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Gestión de Trabajo</h2>
          <div className="flex items-center gap-2 mt-1">
             <ShieldCheck size={14} className="text-emerald-500" />
             <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Contabilidad Aislada de Finanzas Personales</p>
          </div>
        </div>
        {workTransactions.length > 0 && (
          <button 
            onClick={handleSettleAll}
            className="hidden md:flex bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all items-center gap-2"
          >
            <CheckCircle2 size={16} /> Cerrar Ciclo y Limpiar Pote
          </button>
        )}
      </div>

      {/* TARJETA PRINCIPAL DEL POTE */}
      <div className={`relative overflow-hidden rounded-[3.5rem] p-10 shadow-2xl transition-all duration-500 ${
        pote.status === 'con_fondo' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Fondo de Empresa Disponible</p>
            <h3 className="text-6xl font-black tracking-tighter mb-2">
              ${Math.abs(pote.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className={`w-2 h-2 rounded-full bg-white animate-pulse`}></div>
              <p className="text-sm font-bold opacity-80">
                {pote.status === 'con_fondo' 
                  ? 'Tienes dinero de la empresa en tu posesión' 
                  : 'Has pagado de tu bolsillo, por cobrar a empresa'}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 flex gap-10 border border-white/10">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Anticipos Recibidos</p>
              <p className="text-xl font-black">${pote.totalAdvances.toLocaleString()}</p>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Gastos Rendidos</p>
              <p className="text-xl font-black">${pote.totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Barra de consumo */}
        {pote.status === 'con_fondo' && pote.totalAdvances > 0 && (
          <div className="mt-10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
               <span>Consumo del Fondo</span>
               <span>{((pote.totalExpenses / pote.totalAdvances) * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-white/10 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000" 
                style={{ width: `${Math.min((pote.totalExpenses / pote.totalAdvances) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        <Briefcase className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center text-slate-400">
             <div className="flex items-center gap-3">
                <History size={18} />
                <h3 className="font-black uppercase text-[10px] tracking-widest">Actividad del Fondo Temporal</h3>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {workTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          t.type === 'Ingreso' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {t.type === 'Ingreso' ? <Plus size={18} /> : <Minus size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{t.description}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-8 py-5 text-right font-black text-sm ${
                      t.type === 'Ingreso' ? 'text-indigo-600' : 'text-rose-600'
                    }`}>
                      {t.type === 'Ingreso' ? '+' : '-'}{t.currency === 'USD' ? '$' : 'Bs '}{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {workTransactions.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-slate-400 font-medium italic">Pote vacío y listo para una nueva misión.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
             <h4 className="font-black text-sm uppercase tracking-widest mb-4">¿Por qué usar el Pote?</h4>
             <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Al separar estos movimientos, tu **Análisis de IA** y **Dashboard** no creerán que eres "más rico" por recibir un anticipo, ni "más pobre" por pagar un gasto de la empresa.
                <br/><br/>
                Es un flujo de capital externo que entra y sale sin afectar tu balance de vida personal.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Plus = ({size}: {size:number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7v14"/></svg>;
const Minus = ({size}: {size:number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>;
