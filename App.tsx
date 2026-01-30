import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, PieChart, Sparkles, CreditCard,
  Menu, X, ChevronLeft, ChevronRight, LogOut, Settings2, Briefcase, Users
} from 'lucide-react';
import { 
  BankAccount, Transaction, Investment, Budget, User, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES
} from './types';
import { supabase } from './lib/supabase';

// --- IMPORTACIÓN DE TODOS TUS COMPONENTES ---
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

type View = 'dashboard' | 'accounts' | 'transactions' | 'portfolio' | 'budget' | 'ai' | 'settings' | 'work' | 'custody';

const App: React.FC = () => {
  // --- ESTADOS DE DATOS ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [exchangeRate, setExchangeRate] = useState<number>(45.50);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Modal de confirmación con diseño
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // --- CARGA INTEGRAL DESDE LA NUBE ---
  const loadAppData = useCallback(async (userId: string) => {
    setLoading(true);
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

  // --- MANEJADORES DE ACCIÓN (NUBE + MODAL) ---

  const handleAddAccount = async (acc: BankAccount) => {
    if (!currentUser) return;
    const { id, ...cleanData } = acc;
    const { data, error } = await supabase.from('accounts').insert([{ ...cleanData, user_id: currentUser.id }]).select().single();
    if (error) alert("Error: " + error.message);
    if (data) setAccounts(prev => [...prev, data]);
  };

  const handleDeleteAccount = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar cuenta?',
      message: 'Esta acción borrará permanentemente la cuenta y todos sus movimientos.',
      onConfirm: async () => {
        await supabase.from('accounts').delete().eq('id', id);
        setAccounts(prev => prev.filter(a => a.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddTransaction = async (tData: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    const { data, error } = await supabase.from('transactions').insert([{ ...tData, user_id: currentUser.id }]).select().single();
    if (error) alert("Error en movimiento: " + error.message);
    if (data) {
        setTransactions(prev => [data, ...prev]);
        loadAppData(currentUser.id); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 italic">CARGANDO ECOSISTEMA...</div>;
  if (!currentUser) return <Auth onSelectUser={() => {}} />;

  const formattedMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(selectedMonth + '-01'));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />

      {/* Navegación Lateral Completa */}
      <aside className={`fixed inset-0 z-50 md:relative md:translate-x-0 md:w-80 bg-white border-r transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center space-x-3 mb-10">
            <Sparkles className="text-slate-900 w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter">Finanza360</span>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={20}/>} label="Principal" />
            <NavItem active={activeView === 'ai'} onClick={() => setActiveView('ai')} icon={<Sparkles size={20}/>} label="Análisis IA" isSpecial />
            <div className="h-px bg-slate-100 my-4"></div>
            <NavItem active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} icon={<CreditCard size={20}/>} label="Bancos" />
            <NavItem active={activeView === 'transactions'} onClick={() => setActiveView('transactions')} icon={<Wallet size={20}/>} label="Movimientos" />
            <NavItem active={activeView === 'portfolio'} onClick={() => setActiveView('portfolio')} icon={<TrendingUp size={20}/>} label="Portafolio" />
            <div className="h-px bg-slate-100 my-4"></div>
            <NavItem active={activeView === 'work'} onClick={() => setActiveView('work')} icon={<Briefcase size={20}/>} label="Pote Trabajo" />
            <NavItem active={activeView === 'custody'} onClick={() => setActiveView('custody')} icon={<Users size={20}/>} label="Custodia" />
            <NavItem active={activeView === 'budget'} onClick={() => setActiveView('budget')} icon={<PieChart size={20}/>} label="Límites" />
            <NavItem active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={<Settings2 size={20}/>} label="Ajustes" />
          </nav>

          <button onClick={handleLogout} className="mt-8 flex items-center justify-center gap-2 text-slate-300 text-[10px] font-black uppercase hover:text-rose-500 transition-colors">
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido según Módulo Seleccionado */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {activeView === 'dashboard' && <Dashboard accounts={accounts} transactions={transactions} investments={investments} budgets={budgets} selectedMonth={selectedMonth} exchangeRate={exchangeRate} onSyncRate={() => {}} isSyncingRate={false} />}
          {activeView === 'ai' && <AIInsights transactions={transactions} accounts={accounts} investments={investments} selectedMonth={selectedMonth} exchangeRate={exchangeRate} />}
          {activeView === 'accounts' && <AccountsList accounts={accounts} onAdd={handleAddAccount} onDelete={handleDeleteAccount} />}
          {activeView === 'transactions' && <TransactionsLog transactions={transactions} accounts={accounts} onAdd={handleAddTransaction} onDelete={() => {}} selectedMonth={selectedMonth} exchangeRate={exchangeRate} expenseCategories={DEFAULT_EXPENSE_CATEGORIES} incomeCategories={DEFAULT_INCOME_CATEGORIES} />}
          {activeView === 'portfolio' && <Portfolio investments={investments} accounts={accounts} onAdd={() => {}} onUpdate={() => {}} onDelete={() => {}} onAddTransaction={handleAddTransaction} exchangeRate={exchangeRate} />}
          {activeView === 'work' && <WorkManagement transactions={transactions} onUpdateTransaction={() => {}} exchangeRate={exchangeRate} />}
          {activeView === 'custody' && <CustodyManagement transactions={transactions} accounts={accounts} onAddTransaction={handleAddTransaction} exchangeRate={exchangeRate} />}
          {activeView === 'budget' && <BudgetView budgets={budgets} transactions={transactions} onAdd={() => {}} onDelete={() => {}} exchangeRate={exchangeRate} selectedMonth={selectedMonth} expenseCategories={DEFAULT_EXPENSE_CATEGORIES} />}
          {activeView === 'settings' && <CategorySettings expenseCategories={DEFAULT_EXPENSE_CATEGORIES} incomeCategories={DEFAULT_INCOME_CATEGORIES} onUpdate={() => {}} />}
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
