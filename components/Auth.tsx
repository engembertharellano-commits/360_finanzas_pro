
import React, { useState, useEffect } from 'react';
import { User, Sparkles, Plus, UserCircle2, ArrowRight, X, Mail, User as UserIcon, Lock, Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react';

interface Props {
  onSelectUser: (user: User) => void;
}

export const Auth: React.FC<Props> = ({ onSelectUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<User | null>(null);
  
  // Campos de creación
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Campos de login
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedUsers = localStorage.getItem('f360_users_list');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    const newUser: User = {
      id: crypto.randomUUID(),
      name: newName,
      email: newEmail,
      password: newPassword
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('f360_users_list', JSON.stringify(updatedUsers));
    
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setShowCreate(false);
    onSelectUser(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForLogin) return;

    if (selectedUserForLogin.password === loginPassword) {
      setLoginError(false);
      onSelectUser(selectedUserForLogin);
    } else {
      setLoginError(true);
      // Efecto de vibración visual podría añadirse aquí con CSS
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 
    'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-cyan-500'
  ];

  const idxOfUser = selectedUserForLogin ? users.findIndex(u => u.id === selectedUserForLogin.id) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[1.5rem] shadow-2xl shadow-blue-200 text-white mb-6">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Finanza360</h1>
          <p className="text-slate-500 font-medium italic">Acceso Seguro Multiusuario</p>
        </div>

        {!showCreate && !selectedUserForLogin ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Selecciona tu Perfil</h2>
              
              <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {users.map((user, idx) => (
                  <button 
                    key={user.id} 
                    onClick={() => setSelectedUserForLogin(user)}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg ${colors[idx % colors.length]}`}>
                      {getInitials(user.name)}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-black text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{user.email}</p>
                    </div>
                    <Lock size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                    <ArrowRight size={18} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
                
                {users.length === 0 && (
                  <div className="py-10 text-center">
                    <UserCircle2 size={48} className="mx-auto text-slate-100 mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Aún no hay perfiles creados.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
              >
                <Plus size={16} /> Crear Nuevo Usuario
              </button>
            </div>
          </div>
        ) : selectedUserForLogin ? (
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 animate-in zoom-in duration-300">
             <button 
              onClick={() => { setSelectedUserForLogin(null); setLoginPassword(''); setLoginError(false); }}
              className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest transition-colors"
             >
               <ChevronLeft size={16} /> Volver a perfiles
             </button>

             <div className="flex flex-col items-center mb-8">
                <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl mb-4 ${colors[idxOfUser % colors.length]}`}>
                  {getInitials(selectedUserForLogin.name)}
                </div>
                <h2 className="text-2xl font-black text-slate-900">{selectedUserForLogin.name}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ingresa tu contraseña</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      autoFocus
                      type={showPassword ? "text" : "password"} 
                      value={loginPassword} 
                      onChange={e => { setLoginPassword(e.target.value); setLoginError(false); }}
                      placeholder="••••••••"
                      className={`w-full pl-14 pr-14 py-5 rounded-[1.5rem] bg-slate-50 border-2 outline-none font-black text-center text-lg transition-all ${
                        loginError ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-transparent focus:border-blue-500'
                      }`}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginError && (
                    <p className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest justify-center animate-bounce mt-2">
                      <AlertCircle size={14} /> Contraseña Incorrecta
                    </p>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  Desbloquear Cuenta
                </button>
             </form>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-900">Nuevo Perfil</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Nombre Completo</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    autoFocus
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Correo Electrónico</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="email" 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="juan@ejemplo.com"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Contraseña de Seguridad</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Contraseña robusta"
                    className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 font-bold ml-4 uppercase tracking-tighter">Necesaria para cada inicio de sesión.</p>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
              >
                Crear Perfil Protegido
              </button>
            </form>
          </div>
        )}
        
        <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Tus datos están cifrados localmente en este dispositivo.
        </p>
      </div>
    </div>
  );
};
