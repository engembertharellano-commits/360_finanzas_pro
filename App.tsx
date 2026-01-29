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
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const loadAppData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = { id: session.user.id, name: session.user.user_metadata.name || 'Usuario', email: session.user.email! };
        setCurrentUser(user);
        loadAppData(user.id);
      } else { setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = { id: session.user.id, name: session.user.user_metadata.name || 'Usuario', email: session.user.email! };
        setCurrentUser(user);
        loadAppData(user.id);
      } else { setCurrentUser(null); }
    });
    return () => subscription.unsubscribe();
  }, [loadAppData]);

  // --- FUNCIONES CON ALERTAS DE ERROR ---

  const handleAddAccount = async (acc: BankAccount) => {
    if (!currentUser) return;
    
    // Quitamos el ID que genera la app para que Supabase cree uno nuevo limpio
    const { id, ...cleanData } = acc; 

    const { data, error } = await supabase
      .from('accounts')
      .insert([{ ...cleanData, user_id: currentUser.id }])
      .select()
      .single();

    if (error) {
      alert("❌ Error de Supabase: " + error.message);
      return;
    }

    if (data) setAccounts(prev => [...prev, data]);
  };

  const handleDeleteAccount = async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) alert("❌ No se pudo borrar: " + error.message);
    else setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleAddTransaction = async (tData: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...tData, user_id: currentUser.id }])
      .select()
      .single();

    if (error) {
      alert("❌ Error al guardar movimiento: " + error.message);
      return;
    }
    
    if (data) {
        setTransactions(prev => [data, ...prev]);
        loadAppData(currentUser.id); 
    }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400 italic">CONECTANDO CON LA NUBE...</div>;
  if (!currentUser) return <Auth onSelectUser={() => {}} />;

  const formattedMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(selectedMonth + '-01'));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />

      {/* Header móvil */}
      <div className="md:hidden bg-white border-b px-6 py-5 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="text-white w-5 h-5" /></div>
          <span className="text-xl font-black tracking-tighter">Finanza360</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600"><Menu size={26} /></button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-0 z-50 md:relative md:translate-x-0 md:w-80 bg-white border-r transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="hidden md:flex items-center space-x-3 mb-12">
            <div className="w-11 h-11 bg-slate-900 rounded-[1.2rem] flex items-center justify-center shadow-2xl"><Sparkles className="text-white w-6 h-6" /></div>
            <span className="text-2xl font-black tracking-tighter">Finanza360</span>
          </div>

          <div className="mb-10 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center space-x-4">
             <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
             </div>
             <div className="min-w-0">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase">{currentUser.email}</p>
             </div>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); }} icon={<LayoutDashboard size={18}/>} label="Dashboard" />
            <NavItem active={activeView === 'accounts'} onClick={() => { setActiveView('accounts'); setIsMobileMenuOpen(false); }} icon={<CreditCard size={18}/>} label="Bancos" />
            <NavItem active={activeView === 'transactions'} onClick={() => { setActiveView('transactions'); setIsMobileMenuOpen(false); }} icon={<Wallet size={18}/>} label="Movimientos" />
            <NavItem active={activeView === 'portfolio'} onClick={() => { setActiveView('portfolio'); setIsMobileMenuOpen(false); }} icon={<TrendingUp size={18}/>} label="Portafolio" />
            <NavItem active={activeView === 'budget'} onClick={() => { setActiveView('budget'); setIsMobileMenuOpen(false); }} icon={<PieChart size={18}/>} label="Límites" />
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-50">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors">
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-8 md:p-14">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeView === 'dashboard' && <Dashboard accounts={accounts} transactions={transactions} investments={investments} budgets={budgets} selectedMonth={selectedMonth} exchangeRate={exchangeRate} onSyncRate={() => {}} isSyncingRate={false} />}
          {activeView === 'accounts' && <AccountsList accounts={accounts} onAdd={handleAddAccount} onDelete={handleDeleteAccount} />}
          {activeView === 'transactions' && <TransactionsLog transactions={transactions} accounts={accounts} onAdd={handleAddTransaction} onDelete={() => {}} selectedMonth={selectedMonth} exchangeRate={exchangeRate} expenseCategories={expenseCategories} incomeCategories={incomeCategories} />}
        </div>
      </main>

      <AIChat transactions={transactions} accounts={accounts} />
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center space-x-4 w-full p-4 rounded-xl transition-all ${active ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:bg-slate-100'}`}>
    {icon} <span className="text-sm font-medium">{label}</span>
  </button>
);

export default App;
