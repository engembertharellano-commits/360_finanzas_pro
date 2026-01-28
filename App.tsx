import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, PieChart, Sparkles, CreditCard,
  Menu, X, ChevronLeft, ChevronRight, LogOut, Settings2, Briefcase, Users
} from 'lucide-react';
import { 
  BankAccount, Transaction, Investment, Budget, User, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES
} from './types';
import { supabase } from './lib/supabase'; // <--- EL PUENTE CON SUPABASE

// Importación de tus componentes (esto se queda igual)
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
  // --- ESTADO Y VARIABLES ---
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

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // --- LÓGICA DE DATOS (CONEXIÓN A SUPABASE) ---

  const fetchData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Pedimos a Supabase toda la información
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
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificar si hay una sesión activa al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email!,
          email: session.user.email!
        });
        fetchData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar si el usuario inicia o cierra sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email!,
          email: session.user.email!
        });
        fetchData(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  // --- FUNCIONES DE ACCIÓN (Añadir, Borrar, etc.) ---
  
  const handleAddTransaction = async (tData: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...tData, user_id: currentUser.id }])
      .select().single();

    if (data) setTransactions(prev => [data, ...prev]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  // --- TODO TU DISEÑO ORIGINAL (JSX) ---

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">Cargando Finanza360...</div>;
  if (!currentUser) return <Auth onSelectUser={() => {}} />;

  const formattedMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(selectedMonth + '-01'));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 animate-in fade-in duration-500 overflow-x-hidden font-sans">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
      />

      {/* Header móvil */}
      <div className="md:hidden bg-white border-b px-6 py-5 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter">Finanza360</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Sidebar / Menú Lateral */}
      <aside className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:block md:w-80 md:min-h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-white border-r h-full flex flex-col p-8 shadow-2xl md:shadow-none">
          <div className="hidden md:flex items-center space-x-3 mb-12">
            <div className="w-11 h-11 bg-slate-900 rounded-[1.2rem] flex items-center justify-center shadow-2xl">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter">Finanza360</span>
          </div>

          <div className="mb-10 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center space-x-4">
             <div className="w-12 h-12 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-black shadow-sm">
                {currentUser.name.charAt(0).toUpperCase()}
             </div>
             <div className="min-w-0">
                <p className="text-sm font-black truncate text-slate-900">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{currentUser.email}</p>
             </div>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            <NavItem active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); }} icon={<LayoutDashboard size={20}/>} label="Dashboard Principal" />
            <NavItem active={activeView === 'ai'} onClick={() => { setActiveView('ai'); setIsMobileMenuOpen(false); }} icon={<Sparkles size={20}/>} label="Análisis Inteligente" isSpecial={true} />
            <div className="h-px bg-slate-100 my-4 mx-2"></div>
            <NavItem active={activeView === 'accounts'} onClick={() => { setActiveView('accounts'); setIsMobileMenuOpen(false); }} icon={<CreditCard size={20}/>} label="Bancos y Efectivo" />
            <NavItem active={activeView === 'transactions'} onClick={() => { setActiveView('transactions'); setIsMobileMenuOpen(false); }} icon={<Wallet size={20}/>} label="Historial Movimientos" />
            <NavItem active={activeView === 'portfolio'} onClick={() => { setActiveView('portfolio'); setIsMobileMenuOpen(false); }} icon={<TrendingUp size={20}/>} label="Mi Portafolio" />
            <div className="h-px bg-slate-100 my-4 mx-2"></div>
            <NavItem active={activeView === 'work'} onClick={() => { setActiveView('work'); setIsMobileMenuOpen(false); }} icon={<Briefcase size={20}/>} label="Pote Trabajo" />
            <NavItem active={activeView === 'custody'} onClick={() => { setActiveView('custody'); setIsMobileMenuOpen(false); }} icon={<Users size={20}/>} label="Custodia Terceros" />
            <NavItem active={activeView === 'budget'} onClick={() => { setActiveView('budget'); setIsMobileMenuOpen(false); }} icon={<PieChart size={20}/>} label="Límites Gastos" />
            <NavItem active={activeView === 'settings'} onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); }} icon={<Settings2 size={20}/>} label="Ajustes" />
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-50">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors">
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-8 md:p-14 view-container">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeView === 'dashboard' && <Dashboard accounts={accounts} transactions={transactions} investments={investments} budgets={budgets} selectedMonth={selectedMonth} exchangeRate={exchangeRate} onSyncRate={() => {}} isSyncingRate={false} />}
          {/* Aquí irían los otros condicionales de vista que tenías, se mantienen igual */}
          {activeView === 'accounts' && <AccountsList accounts={accounts} onAdd={() => {}} onDelete={() => {}} />}
        </div>
      </main>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
};

// Componente NavItem (Auxiliar)
const NavItem = ({ active, onClick, icon, label, isSpecial }: any) => (
  <button onClick={onClick} className={`flex items-center space-x-4 w-full p-4 rounded-2xl transition-all duration-300 group ${active ? (isSpecial ? 'bg-indigo-600 text-white shadow-xl font-bold scale-[1.02]' : 'bg-slate-900 text-white shadow-xl font-bold scale-[1.02]') : (isSpecial ? 'text-indigo-500 hover:bg-indigo-50 font-bold' : 'text-slate-500 hover:bg-slate-50')}`}>
    <span className={`${active ? 'scale-110' : 'opacity-70 group-hover:scale-110'} transition-transform`}>{icon}</span>
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

export default App;
