
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, PieChart, Sparkles, CreditCard,
  Menu, X, ChevronLeft, ChevronRight, LogOut, Settings2, Briefcase, Users
} from 'lucide-react';
import { 
  BankAccount, Transaction, Investment, Budget, User, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES
} from './types';
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('f360_user');
    return saved ? JSON.parse(saved) : null;
  });

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

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const fetchRate = useCallback(async () => {
    setIsSyncingRate(true);
    try {
      const service = new FinanceAIService();
      const response = await service.getExchangeRate();
      setExchangeRate(response.rate);
      setRateSourceUrl(response.sourceUrl);
    } catch (error) {
      console.error("Error al sincronizar tasa:", error);
    } finally {
      setIsSyncingRate(false);
    }
  }, []);

  useEffect(() => { 
    if (currentUser) fetchRate(); 
  }, [fetchRate, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const savedData = localStorage.getItem(`f360_data_${currentUser.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setAccounts(parsed.accounts || []);
        setTransactions(parsed.transactions || []);
        setInvestments(parsed.investments || []);
        setBudgets(parsed.budgets || []);
        if (parsed.expenseCategories) setExpenseCategories(parsed.expenseCategories);
        if (parsed.incomeCategories) setIncomeCategories(parsed.incomeCategories);
      } else {
        setAccounts([]);
        setTransactions([]);
        setInvestments([]);
        setBudgets([]);
        setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
        setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
      }
      localStorage.setItem('f360_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const data = { accounts, transactions, investments, budgets, expenseCategories, incomeCategories };
      localStorage.setItem(`f360_data_${currentUser.id}`, JSON.stringify(data));
    }
  }, [accounts, transactions, investments, budgets, expenseCategories, incomeCategories, currentUser]);

  const requestDelete = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const handleAddAccount = (acc: BankAccount) => setAccounts(prev => [...prev, acc]);
  
  const handleDeleteAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    requestDelete(
      '¿Eliminar Cuenta?',
      `Estás a punto de eliminar "${acc?.name}". Esta acción también podría afectar el historial visual de tus saldos.`,
      () => setAccounts(prev => prev.filter(a => a.id !== id))
    );
  };

  const handleAddTransaction = (tData: Omit<Transaction, 'id'>) => {
    const newT: Transaction = { ...tData, id: crypto.randomUUID() };
    const comm = newT.commission || 0;

    setTransactions(prev => [newT, ...prev]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newT.accountId) {
        if (newT.type === 'Gasto') return { ...acc, balance: acc.balance - (newT.amount + comm) };
        if (newT.type === 'Ingreso') return { ...acc, balance: acc.balance + (newT.amount - comm) };
        if (newT.type === 'Transferencia') return { ...acc, balance: acc.balance - newT.amount };
        if (newT.type === 'Ajuste') {
           const change = newT.adjustmentDirection === 'plus' ? newT.amount : -newT.amount;
           return { ...acc, balance: acc.balance + change };
        }
      }
      if (newT.type === 'Transferencia' && acc.id === newT.toAccountId) {
        const arrivalAmount = newT.targetAmount !== undefined ? newT.targetAmount : newT.amount;
        return { ...acc, balance: acc.balance + (arrivalAmount - comm) };
      }
      return acc;
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    const t = transactions.find(item => item.id === id);
    if (!t) return;
    
    requestDelete(
      '¿Eliminar Movimiento?',
      `Se revertirá el impacto de "${t.description}" en los saldos.`,
      () => {
        const comm = t.commission || 0;
        setAccounts(prev => prev.map(acc => {
          if (acc.id === t.accountId) {
            if (t.type === 'Gasto') return { ...acc, balance: acc.balance + (t.amount + comm) };
            if (t.type === 'Ingreso') return { ...acc, balance: acc.balance - (t.amount - comm) };
            if (t.type === 'Transferencia') return { ...acc, balance: acc.balance + t.amount };
            if (t.type === 'Ajuste') {
              const change = t.adjustmentDirection === 'plus' ? -t.amount : t.amount;
              return { ...acc, balance: acc.balance + change };
            }
          }
          if (t.type === 'Transferencia' && acc.id === t.toAccountId) {
            const arrivalAmount = t.targetAmount !== undefined ? t.targetAmount : t.amount;
            return { ...acc, balance: acc.balance - (arrivalAmount - comm) };
          }
          return acc;
        }));
        setTransactions(prev => prev.filter(item => item.id !== id));
      }
    );
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleAddInvestment = (inv: Investment) => setInvestments(prev => [...prev, inv]);
  
  const handleUpdateInvestment = (updatedInv: Investment) => {
    setInvestments(prev => prev.map(i => i.id === updatedInv.id ? updatedInv : i).filter(i => i.quantity > 0));
  };

  const handleDeleteInvestment = (id: string) => {
    const inv = investments.find(i => i.id === id);
    requestDelete(
      '¿Eliminar Inversión?',
      `¿Deseas quitar "${inv?.name}" de tu cartera? No se borrarán los movimientos bancarios asociados.`,
      () => setInvestments(prev => prev.filter(i => i.id !== id))
    );
  };

  const handleAddBudget = (b: Omit<Budget, 'id'>) => {
    setBudgets(prev => {
      const filtered = prev.filter(item => !(item.category === b.category && item.month === selectedMonth));
      return [...filtered, { ...b, id: crypto.randomUUID(), month: selectedMonth }];
    });
  };
  
  const handleDeleteBudget = (id: string) => {
    const b = budgets.find(item => item.id === id);
    requestDelete(
      '¿Eliminar Presupuesto?',
      `El límite para "${b?.category}" en ${selectedMonth} será eliminado.`,
      () => setBudgets(prev => prev.filter(item => item.id !== id))
    );
  };

  const balances = useMemo(() => {
    const usd = accounts.filter(a => a.currency === 'USD').reduce((acc, curr) => acc + (curr.type === 'Tarjeta de Crédito' ? -curr.balance : curr.balance), 0);
    const ves = accounts.filter(a => a.currency === 'VES').reduce((acc, curr) => acc + (curr.type === 'Tarjeta de Crédito' ? -curr.balance : curr.balance), 0);
    return { usd, ves };
  }, [accounts]);

  const changeMonth = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formattedMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1));
  }, [selectedMonth]);

  const handleLogout = () => {
    localStorage.removeItem('f360_user');
    setCurrentUser(null);
    setActiveView('dashboard');
    setIsMobileMenuOpen(false);
  };

  if (!currentUser) {
    return <Auth onSelectUser={setCurrentUser} />;
  }

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
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Sidebar / Menú Lateral */}
      <aside className={`
        fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:block md:w-80 md:min-h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="bg-white border-r h-full flex flex-col p-8 shadow-2xl md:shadow-none">
          <div className="hidden md:flex items-center space-x-3 mb-12">
            <div className="w-11 h-11 bg-slate-900 rounded-[1.2rem] flex items-center justify-center shadow-2xl">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter">Finanza360</span>
          </div>

          {/* Perfil de Usuario */}
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
            
            <NavItem 
              active={activeView === 'ai'} 
              onClick={() => { setActiveView('ai'); setIsMobileMenuOpen(false); }} 
              icon={<Sparkles size={20}/>} 
              label="Análisis Inteligente" 
              isSpecial={true}
            />

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

          <div className="mt-8 space-y-4 pt-6 border-t border-slate-50">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-500"><ChevronLeft size={16}/></button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">{formattedMonth}</span>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-500"><ChevronRight size={16}/></button>
                </div>
             </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors"
            >
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:p-14 view-container">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeView === 'dashboard' && (
            <Dashboard 
              accounts={accounts} 
              transactions={transactions} 
              investments={investments} 
              budgets={budgets} 
              selectedMonth={selectedMonth} 
              exchangeRate={exchangeRate}
              rateSourceUrl={rateSourceUrl}
              onSyncRate={fetchRate} 
              isSyncingRate={isSyncingRate}
            />
          )}
          {activeView === 'accounts' && (
            <AccountsList accounts={accounts} onAdd={handleAddAccount} onDelete={handleDeleteAccount} />
          )}
          {activeView === 'transactions' && (
            <TransactionsLog 
              transactions={transactions} 
              accounts={accounts} 
              onAdd={handleAddTransaction} 
              onDelete={handleDeleteTransaction}
              selectedMonth={selectedMonth}
              exchangeRate={exchangeRate}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
            />
          )}
          {activeView === 'work' && (
            <WorkManagement 
              transactions={transactions}
              onUpdateTransaction={handleUpdateTransaction}
              exchangeRate={exchangeRate}
            />
          )}
          {activeView === 'custody' && (
            <CustodyManagement 
              transactions={transactions}
              exchangeRate={exchangeRate}
            />
          )}
          {activeView === 'ai' && (
            <AIInsights 
              transactions={transactions} 
              budgets={budgets} 
              investments={investments} 
              selectedMonth={selectedMonth} 
            />
          )}
          {activeView === 'portfolio' && (
            <Portfolio 
              investments={investments} 
              accounts={accounts}
              onAdd={handleAddInvestment} 
              onUpdate={handleUpdateInvestment}
              onDelete={handleDeleteInvestment} 
              onAddTransaction={handleAddTransaction}
              exchangeRate={exchangeRate}
            />
          )}
          {activeView === 'budget' && (
            <BudgetView 
              budgets={budgets} 
              transactions={transactions}
              onAdd={handleAddBudget} 
              onDelete={handleDeleteBudget} 
              exchangeRate={exchangeRate}
              selectedMonth={selectedMonth}
              expenseCategories={expenseCategories}
            />
          )}
          {activeView === 'settings' && (
            <CategorySettings 
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onUpdateExpenses={setExpenseCategories}
              onUpdateIncome={setIncomeCategories}
            />
          )}
        </div>
      </main>

      <AIChat transactions={transactions} accounts={accounts} />

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden animate-in fade-in" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, isSpecial }: any) => (
  <button 
    onClick={onClick} 
    className={`
      flex items-center space-x-4 w-full p-4 rounded-2xl transition-all duration-300 group
      ${active 
        ? isSpecial 
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold scale-[1.02]' 
          : 'bg-slate-900 text-white shadow-xl shadow-slate-200 font-bold scale-[1.02]' 
        : isSpecial 
          ? 'text-indigo-500 hover:bg-indigo-50 font-bold' 
          : 'text-slate-500 hover:bg-slate-50 hover:pl-6'}
    `}
  >
    <span className={`${active ? 'scale-110' : 'opacity-70 group-hover:scale-110'} transition-transform`}>{icon}</span>
    <span className="text-sm tracking-tight">{label}</span>
    {isSpecial && !active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_indigo]"></div>}
  </button>
);

export default App;
