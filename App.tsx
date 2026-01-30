import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, PieChart, Sparkles, CreditCard,
  LogOut, Settings2, Briefcase, Users, Menu
} from 'lucide-react';
import { 
  BankAccount, Transaction, Investment, Budget, User, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES
} from './types';
import { supabase } from './lib/supabase';

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

  const handleAddTransaction = async (tData: any) => {
    if (!currentUser) return;
    const { error } = await supabase.from('transactions').insert([{ ...tData, user_id: currentUser.id }]);
    if (error) {
        alert("Error al guardar: " + error.message);
    } else {
        alert("✅ Movimiento registrado. Actualizando saldos...");
        loadAppData(currentUser.id);
    }
  };

  const handleAddAccount = async (acc: BankAccount) => {
    if (!currentUser) return;
    const { id, ...cleanData } = acc;
    await supabase.from('accounts').insert([{ ...cleanData, user_id: currentUser.id }]);
    loadAppData(currentUser.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 italic">CARGANDO...</div>;
  if (!currentUser) return <Auth onSelectUser={() => {}} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />
      
      {/* Sidebar y Navegación */}
      <aside className={`fixed inset-0 z-40 md:relative md:translate-x-0 md:w-80 bg-white border-r p-8 flex flex-col transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center space-x-3 mb-10">
          <Sparkles className="text-slate-900 w-8 h-8" />
          <span className="text-2xl font-black tracking-tighter">Finanza360</span>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          <NavItem active={activeView === 'dashboard'} onClick={() => {setActiveView('dashboard'); setIsMobileMenuOpen(false);}} icon={<LayoutDashboard size={20}/>} label="Principal" />
          <NavItem active={activeView === 'ai'} onClick={() => {setActiveView('ai'); setIsMobileMenuOpen(false);}} icon={<Sparkles size={20}/>} label="Análisis IA" isSpecial />
          <div className="h-px bg-slate-100 my-4"></div>
          <NavItem active={activeView === 'accounts'} onClick={() => {setActiveView('accounts'); setIsMobileMenuOpen(false);}} icon={<CreditCard size={20}/>} label="Bancos" />
          <NavItem active={activeView === 'transactions'} onClick={() => {setActiveView('transactions'); setIsMobileMenuOpen(false);}} icon={<Wallet size={20}/>} label="Movimientos" />
          <NavItem active={activeView === 'portfolio'} onClick={() => {setActiveView('portfolio'); setIsMobileMenuOpen(false);}} icon={<TrendingUp size={20}/>} label="Portafolio" />
          <div className="h-px bg-slate-100 my-4"></div>
          <NavItem active={activeView === 'work'} onClick={() => {setActiveView('work'); setIsMobileMenuOpen(false);}} icon={<Briefcase size={20}/>} label="Pote Trabajo" />
          <NavItem active={activeView === 'custody'} onClick={() => {setActiveView('custody'); setIsMobileMenuOpen(false);}} icon={<Users size={20}/>} label="Custodia" />
          <NavItem active={activeView === 'budget'} onClick={() => {setActiveView('budget'); setIsMobileMenuOpen(false);}} icon={<PieChart size={20}/>} label="Límites" />
          <NavItem active={activeView === 'settings'} onClick={() => {setActiveView('settings'); setIsMobileMenuOpen(false);}} icon={<Settings2 size={20}/>} label="Ajustes" />
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center justify-center gap-2 text-slate-300 text-[10px] font-black uppercase hover:text-rose-500">
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {activeView === 'dashboard' && <Dashboard accounts={accounts} transactions={transactions} investments={investments} budgets={budgets} selectedMonth={selectedMonth} exchangeRate={exchangeRate} onSyncRate={() => {}} isSyncingRate={false} />}
          {activeView === 'ai' && <AIInsights transactions={transactions} accounts={accounts} investments={investments} selectedMonth={selectedMonth} exchangeRate={exchangeRate} />}
          {activeView === 'accounts' && <AccountsList accounts={accounts} onAdd={handleAddAccount} onDelete={() => {}} />}
          {activeView === 'transactions' && <TransactionsLog transactions={transactions} accounts={accounts} onAdd={handleAddTransaction} onDelete={() => {}} selectedMonth={selectedMonth} exchangeRate={exchangeRate} expenseCategories={DEFAULT_EXPENSE_CATEGORIES} incomeCategories={DEFAULT_INCOME_CATEGORIES} />}
          {activeView === 'portfolio' && <Portfolio investments={investments} accounts={accounts} onAdd={() => {}} onUpdate={() => {}} onDelete={() => {}} onAddTransaction={handleAddTransaction} exchangeRate={exchangeRate} />}
          {activeView === 'work' && <WorkManagement transactions={transactions} onUpdateTransaction={() => {}} exchangeRate={exchangeRate} />}
          {activeView === 'custody' && <CustodyManagement transactions={transactions} accounts={accounts} onAddTransaction={handleAddTransaction} exchangeRate={exchangeRate} />}
        </div>
      </main>

      <AIChat transactions={transactions} accounts={accounts} />
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, isSpecial }: any) => (
  <button onClick={onClick} className={`flex items-center space-x-4 w-full p-4 rounded-2xl transition-all ${active ? (isSpecial ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-900 text-white shadow-xl') : 'text-slate-500 hover:bg-slate-100'}`}>
    {icon} <span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

export default App;
