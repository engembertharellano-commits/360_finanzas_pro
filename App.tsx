import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, PieChart, Sparkles, CreditCard,
  Menu, X, ChevronLeft, ChevronRight, LogOut, Settings2, Briefcase, Users
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
import { FinanceAIService } from './services/geminiService';

type View = 'dashboard' | 'accounts' | 'transactions' | 'portfolio' | 'budget' | 'ai' | 'settings' | 'work' | 'custody';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [exchangeRate, setExchangeRate] = useState<number>(45.50);
  const [rateSourceUrl, setRateSourceUrl] = useState<string | undefined>(undefined);
  const [isSyncingRate, setIsSyncingRate] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  // CARGAR DATOS DE SUPABASE
  const fetchData = useCallback(async (userId: string) => {
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
        setCurrentUser({ id: session.user.id, name: session.user.user_metadata.name || 'Usuario', email: session.user.email! });
        fetchData(session.user.id);
      } else { setLoading(false); }
    });
  }, [fetchData]);

  // FUNCIONES DE ACCIÓN
  const handleAddTransaction = async (tData: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    const { data } = await supabase.from('transactions').insert([{ ...tData, user_id: currentUser.id }]).select().single();
    if (data) setTransactions(prev => [data, ...prev]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const changeMonth = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!currentUser) return <Auth onSelectUser={() => {}} />;

  const formattedMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(selectedMonth + '-01'));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />

      {/* Menú Móvil */}
      <div className="md:hidden bg-white border-b px-6 py-5 flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center space-x-3">
          <Sparkles className="text-slate-900 w-6 h-6" />
          <span className="font-black">Finanza360</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu /></button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-0 z-50 md:relative md:translate-x-0 md:w-80 bg-white border-r transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="mb-10 p-5 bg-slate-50 rounded-2xl flex items-center space-x-4">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={18}/>} label="Dashboard" />
            <NavItem active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} icon={<CreditCard size={18}/>} label="Bancos" />
            <NavItem active={activeView === 'transactions'} onClick={() => setActiveView('transactions')} icon={<Wallet size={18}/>} label="Movimientos" />
            <NavItem active={activeView === 'portfolio'} onClick={() => setActiveView('portfolio')} icon={<TrendingUp size={18}/>} label="Portafolio" />
            <NavItem active={activeView === 'work'} onClick={() => setActiveView('work')} icon={<Briefcase size={18}/>} label="Trabajo" />
            <NavItem active={activeView === 'budget'} onClick={() => setActiveView('budget')} icon={<PieChart size={18}/>} label="Presupuestos" />
          </nav>

          <button onClick={handleLogout} className="mt-auto flex items-center gap-2 text-slate-400 text-xs font-bold hover:text-red-500">
            <LogOut size={14}/> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeView === 'dashboard' && <Dashboard accounts={accounts} transactions={transactions} investments={investments} budgets={budgets} selectedMonth={selectedMonth} exchangeRate={exchangeRate} onSyncRate={() => {}} isSyncingRate={false} />}
          {activeView === 'accounts' && <AccountsList accounts={accounts} onAdd={() => {}} onDelete={() => {}} />}
          {activeView === 'transactions' && <TransactionsLog transactions={transactions} accounts={accounts} onAdd={handleAddTransaction} onDelete={() => {}} selectedMonth={selectedMonth} exchangeRate={exchangeRate} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />}
          {activeView === 'portfolio' && <Portfolio investments={investments} accounts={accounts} onAdd={() => {}} onUpdate={() => {}} onDelete={() => {}} onAddTransaction={handleAddTransaction} exchangeRate={exchangeRate} />}
          {activeView === 'work' && <WorkManagement transactions={transactions} onUpdateTransaction={() => {}} exchangeRate={exchangeRate} />}
          {activeView === 'budget' && <BudgetView budgets={budgets} transactions={transactions} onAdd={() => {}} onDelete={() => {}} exchangeRate={exchangeRate} selectedMonth={selectedMonth} expenseCategories={expenseCategories} />}
        </div>
      </main>
      <AIChat transactions={transactions} accounts={accounts} />
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default App;
