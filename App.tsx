import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, PieChart, Sparkles, CreditCard,
  Menu, X, ChevronLeft, ChevronRight, LogOut, Settings2, Briefcase, Users
} from 'lucide-react';
import { 
  BankAccount, Transaction, Investment, Budget, User, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES
} from './types';
import { supabase } from './lib/supabase'; // Importamos la conexión
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<any>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(45.50);

  // 1. Cargar datos desde Supabase al iniciar
  const loadData = useCallback(async (userId: string) => {
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

  // 2. Gestionar la sesión de usuario
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = { id: session.user.id, name: session.user.user_metadata.name || 'Usuario', email: session.user.email! };
        setCurrentUser(user);
        loadData(user.id);
      } else {
        setLoading(false);
      }
    });
  }, [loadData]);

  // 3. Guardar una nueva transacción en Supabase
  const handleAddTransaction = async (tData: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...tData, user_id: currentUser.id }])
      .select()
      .single();

    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
      // Aquí podrías agregar lógica para actualizar el saldo de la cuenta en la DB también
    }
  };

  // --- El resto de tu interfaz visual se mantiene igual ---
  if (loading) return <div className="flex h-screen items-center justify-center">Cargando tus finanzas...</div>;
  if (!currentUser) return <Auth onSelectUser={() => window.location.reload()} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
       {/* Aquí va todo tu código de diseño (Sidebar, Main, etc.) que ya tenías */}
       {/* Por espacio, no pego todo el HTML, pero es el mismo que me pasaste */}
       <p className="p-10">¡Conectado a Supabase! Estás viendo los datos de: {currentUser.email}</p>
    </div>
  );
};

export default App;
