
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Users, ArrowUpRight, ArrowDownLeft, Wallet, History, Plus, Minus, Info, Handshake } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  exchangeRate: number;
}

// Interface for custody pot data to ensure type safety for numeric operations
interface CustodyPot {
  balance: number;
  entries: number;
  exits: number;
}

export const CustodyManagement: React.FC<Props> = ({ transactions, exchangeRate }) => {
  // Transacciones de custodia
  const custodyTransactions = useMemo(() => 
    transactions.filter(t => t.isThirdParty)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [transactions]
  );

  // Agrupar por dueño
  // Explicitly type the useMemo return to fix 'unknown' type inference issues with Object.values/entries
  const pots = useMemo<Record<string, CustodyPot>>(() => {
    const owners: Record<string, CustodyPot> = {};

    custodyTransactions.forEach(t => {
      const owner = t.thirdPartyOwner || 'Desconocido';
      if (!owners[owner]) owners[owner] = { balance: 0, entries: 0, exits: 0 };
      
      const amountUSD = t.currency === 'USD' ? t.amount : t.amount / exchangeRate;
      
      if (t.type === 'Ingreso') {
        owners[owner].balance += amountUSD;
        owners[owner].entries += amountUSD;
      } else if (t.type === 'Gasto') {
        owners[owner].balance -= amountUSD;
        owners[owner].exits += amountUSD;
      }
    });

    return owners;
  }, [custodyTransactions, exchangeRate]);

  // Fix: Explicitly cast to CustodyPot[] to resolve 'unknown' type issue in reduce
  const totalHeldUSD = (Object.values(pots) as CustodyPot[]).reduce((acc, p) => acc + p.balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Dinero de Terceros</h2>
        <p className="text-slate-500 text-sm font-medium">Gestión de capitales bajo tu custodia (No son tuyos)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RESUMEN GLOBAL DE CUSTODIA */}
        <div className="lg:col-span-4 bg-emerald-600 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-[300px]">
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60 mb-2">Total en Custodia (Pasivo)</p>
              {/* Fix: totalHeldUSD is correctly recognized as number, allowing toLocaleString arguments */}
              <h3 className="text-5xl font-black tracking-tighter">${totalHeldUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
           </div>
           
           <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-bold text-emerald-100 leading-tight">
                Este dinero está en tus cuentas físicas, pero pertenece a otras personas. Debes asegurar su disponibilidad para cuando sea solicitado.
              </p>
           </div>
           <Users className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 pointer-events-none" />
        </div>

        {/* LISTADO DE POTES POR PERSONA */}
        <div className="lg:col-span-8 space-y-4">
           {/* Fix: Explicitly cast entries to resolve 'unknown' type issues in map */}
           {(Object.entries(pots) as [string, CustodyPot][]).map(([owner, data]) => (
             <div key={owner} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                      {owner.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900">{owner}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo a devolver</p>
                   </div>
                </div>
                <div className="text-right">
                   {/* Fix: data is correctly typed as CustodyPot */}
                   <p className="text-2xl font-black text-slate-900">${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                   <p className="text-[9px] font-bold text-emerald-500 uppercase">En custodia</p>
                </div>
             </div>
           ))}
           {Object.keys(pots).length === 0 && (
             <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Handshake size={48} className="mb-4 text-slate-200" />
                <p className="italic font-medium">No tienes dinero de terceros registrado.</p>
             </div>
           )}
        </div>
      </div>

      {/* HISTORIAL DE MOVIMIENTOS DE CUSTODIA */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-3">
           <History size={18} className="text-slate-400" />
           <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Bitácora de Custodia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <tbody className="divide-y divide-slate-50">
                {custodyTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            t.type === 'Ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                          }`}>
                            {t.type === 'Ingreso' ? <Plus size={14} /> : <Minus size={14} />}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900">{t.description}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{t.thirdPartyOwner}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                       {t.type === 'Ingreso' ? '+' : '-'}{t.currency === 'USD' ? '$' : 'Bs '}{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex items-start gap-6">
         <div className="p-3 bg-white/10 rounded-2xl text-emerald-400"><Info size={24} /></div>
         <div className="space-y-2">
            <h4 className="font-black text-sm uppercase tracking-widest">¿Por qué este dinero no aparece en mis ingresos?</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
               Porque contablemente **no es tuyo**. Al recibir el dinero de tu hija, tu saldo bancario sube, pero tu patrimonio neto real se mantiene igual porque ahora tienes una "deuda" con ella. 
               Finanza360 lo trata como un **Pasivo de Custodia**, permitiéndote ver cuánto de tus cuentas bancarias realmente te pertenece a ti.
            </p>
         </div>
      </div>
    </div>
  );
};
