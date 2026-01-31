import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, PieChart, Sparkles, CreditCard,
  LogOut, Settings2, Briefcase, Users, Menu
} from 'lucide-react';
import { 
  BankAccount, Transaction, Investment, Budget, User, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES
} from './types';
import { supabase } from './lib/supabase';

// Componentes
import { Dashboard } from './components/Dashboard';
import { AccountsList } from './components/AccountsList';
import { TransactionsLog } from './components/TransactionsLog';
import { AIInsights } from './components/AIInsights';
import { Portfolio } from './components/Portfolio';
import { BudgetView } from './components/BudgetView';
import { AIChat } from './components/AIChat';
import { CategorySettings } from './components/CategorySettings';
import { ConfirmationModal } from './components/ConfirmationModal';
import { WorkManagement } from './components/WorkManagement'; 
import { CustodyManagement } from './components/CustodyManagement';
import { Auth } from './components/Auth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'accounts' | 'transactions' | 'portfolio' | 'budget' | 'ai' | 'settings' | 'work' | 'custody'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [exchangeRate] = useState<number>(45.50);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const loadAppData = useCallback(async (userId: string) => {
    const [accs, trans, invs, buds] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('investments').select('*').eq('user_id', userId),
      supabase.from('budgets').select('*').eq('user_id', userId)
    ]);
    if (accs.data) setAccounts(accs.data);
    if (trans.data) setTransactions(trans.data);
    if (invs.data) setInvestments(invs.data);
    if (buds.data) setBudgets(buds.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = { id: session.user.id, name: session.user.user_metadata.name || 'Usuario', email: session.user.email! };
        setCurrentUser(user);
        loadAppData(user.id);
      } else { setLoading(false); }
    });
  }, [loadAppData]);

  // FUNCIONES DE GUARDADO
  const handleAddTransaction = async (tData: any) => {
    if (!currentUser) return;
    const cleanPayload = {
      ...tData,
      user_id: currentUser.id,
      amount: Number(tData.amount) || 0,
      commission: Number(tData.commission) || 0,
      targetAmount: Number(tData.targetAmount) || 0,
      adjustmentDirection: (tData.type === 'adjustment' || tData.type === 'ajuste') ? (tData.adjustmentDirection || 'down') : null
    };
    const { error } = await supabase.from('transactions').insert([cleanPayload]);
    if (error) alert("Error: " + error.message);
    else loadAppData(currentUser.id);
  };

  const handleAddInvestment = async (invData: any) => {
    if (!currentUser) return;
    const safeInvestment = {
      ...invData,
      user_id: currentUser.id,
      buyPrice: Number(invData.buyPrice) || 0,
      buyCommission: Number(invData.buyCommission) || 0,
      currentPrice: Number(invData.currentPrice) || 0,
      quantity: Number(invData.quantity) || 0,
      buy_price: Number(invData.buyPrice) || 0,
      buy_commission: Number(invData.buyCommission) || 0,
      current_price: Number(invData.currentPrice) || 0,
    };
    const { error } = await supabase.from('investments').insert([safeInvestment]);
    if (error) alert("⚠️ Error: " + error.message);
    else { alert("✅ Activo guardado correctamente"); loadAppData(currentUser.id); }
  };

  const handleAddAccount = async (acc: BankAccount) => {
    if (!currentUser) return;
    const { id, ...cleanData } = acc;
    await supabase.from('accounts').insert([{ ...cleanData, user_id: currentUser.id }]);
    loadAppData(currentUser.id);
  };

  // FUNCIONES DE ELIMINADO Y ACTUALIZACIÓN
  const refreshData = () => {
    if (currentUser) loadAppData(currentUser.id);
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmModal({
      isOpen: true, title: '¿Eliminar registro?', message: 'El saldo se revertirá automáticamente.',
      onConfirm: async () => { await supabase.from('transactions').delete().eq('id', id); refreshData(); setConfirmModal(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const handleDeleteInvestment = (id: string) => {
    setConfirmModal({
      isOpen: true, title: '¿Eliminar inversión?', message: 'Se quitará del portafolio.',
      onConfirm: async () => { await supabase.from('investments').delete().eq('id', id); refreshData(); setConfirmModal(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const handleDeleteAccount = (id: string) => {
    setConfirmModal({
      isOpen: true, title: '¿Eliminar cuenta?', message: 'Se borrará todo el historial.',
      onConfirm: async () => { await supabase.from('accounts').delete().eq('id', id); refreshData(); setConfirmModal(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 italic tracking-widest uppercase">Finanza360...</div>;
  if (!currentUser) return <Auth onSelectUser={() => {}} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />

      <aside className={`fixed inset-0 z-40 md:relative md:translate-x-0 md:w-80 bg-white border-r p-8 flex flex-col transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center space-x-3 mb-10 text-2xl font-black uppercase italic tracking-tighter">
          <Sparkles className="w-8 h-8" /> <span>Finanza360</span>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          <NavItem active={activeView === 'dashboard'} onClick={() => {setActiveView('dashboard'); setIsMobileMenuOpen(false);}} icon={<LayoutDashboard size={20}/>} label="Principal" />
          <NavItem active={activeView === 'ai'} onClick={() => {setActiveView('ai'); setIsMobileMenuOpen(false);}} icon={<Sparkles size={20}/>} label="Análisis IA" isSpecial />
          <div className="h-px bg-slate-100 my-4"></div>
          <NavItem active={activeView === 'accounts'} onClick={() => {setActiveView('accounts'); setIsMobileMenuOpen(false);}} icon={<CreditCard size={20}/>} label="Bancos" />
          <NavItem active={activeView === 'transactions'} onClick={() => {setActiveView('transactions'); setIsMobileMenuOpen(false);}} icon={<Wallet size={20}/>} label="Movimientos" />
          <NavItem active={activeView === 'portfolio'} onClick={() => {setActiveView('portfolio'); setIsMobileMenuOpen(false);}} icon={<TrendingUp size={20}/>} label="Portafolio" />
          <div className="h-px bg-slate-100 my-4"></div>
          <NavItem active={activeView === 'work'} onClick={() => {setActiveView('work'); setIsMobileMenuOpen(false);}} icon={<Briefcase size={20}/>} label="Pote Trabajo" />
          <NavItem active={activeView === 'custody'} onClick={() => {setActiveView('custody'); setIsMobileMenuOpen(false);}} icon={<Users size={20}/>} label="Custodia" />
          {/* AQUÍ ESTÁ EL CAMBIO DE NOMBRE */}
          <NavItem active={activeView === 'budget'} onClick={() => {setActiveView('budget'); setIsMobileMenuOpen(false);}} icon={<PieChart size={20}/>} label="Presupuesto" />
          <NavItem active={activeView === 'settings'} onClick={() => {setActiveView('settings'); setIsMobileMenuOpen(false);}} icon={<Settings2 size={20}/>} label="Ajustes" />
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center justify-center gap-2 text-slate-300 text-[10px] font-black uppercase hover:text-rose-500 transition-colors">
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {activeView === 'dashboard' && <Dashboard accounts={accounts} transactions={transactions} investments={investments} budgets={budgets} selectedMonth={selectedMonth} exchangeRate={exchangeRate} onSyncRate={() => {}} isSyncingRate={false} />}
          {activeView === 'ai' && <AIInsights transactions={transactions} accounts={accounts} investments={investments} selectedMonth={selectedMonth} exchangeRate={exchangeRate} />}
          {activeView === 'accounts' && <AccountsList accounts={accounts} onAdd={handleAddAccount} onDelete={handleDeleteAccount} />}
          {activeView === 'transactions' && <TransactionsLog transactions={transactions} accounts={accounts} onAdd={handleAddTransaction} onDelete={handleDeleteTransaction} selectedMonth={selectedMonth} exchangeRate={exchangeRate} expenseCategories={DEFAULT_EXPENSE_CATEGORIES} incomeCategories={DEFAULT_INCOME_CATEGORIES} />}
          {activeView === 'portfolio' && <Portfolio investments={investments} accounts={accounts} onAdd={handleAddInvestment} onUpdate={() => {}} onDelete={handleDeleteInvestment} onAddTransaction={handleAddTransaction} exchangeRate={exchangeRate} />}
          {activeView === 'work' && <WorkManagement transactions={transactions} onUpdateTransaction={() => {}} onDeleteTransaction={handleDeleteTransaction} exchangeRate={exchangeRate} />}
          {activeView === 'custody' && <CustodyManagement transactions={transactions} accounts={accounts} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} exchangeRate={exchangeRate} />}
          {/* AQUÍ ESTÁ LA MAGIA PARA QUE NO SALTE: onAdd llama a refreshData */}
          {activeView === 'budget' && <BudgetView budgets={budgets} transactions={transactions} onAdd={refreshData} onDelete={refreshData} exchangeRate={exchangeRate} selectedMonth={selectedMonth} expenseCategories={DEFAULT_EXPENSE_CATEGORIES} />}
          {activeView === 'settings' && <CategorySettings expenseCategories={DEFAULT_EXPENSE_CATEGORIES} incomeCategories={DEFAULT_INCOME_CATEGORIES} onUpdate={() => {}} />}
        </div>
      </main>
      <AIChat transactions={transactions} accounts={accounts} />
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, isSpecial }: any) => (
  <button onClick={onClick} className={`flex items-center space-x-4 w-full p-4 rounded-2xl transition-all ${active ? (isSpecial ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-900 text-white shadow-xl') : 'text-slate-500 hover:bg-slate-100'}`}>
    {icon} <span className="text-sm font-bold">{label}</span>
  </button>
);

export default App;
