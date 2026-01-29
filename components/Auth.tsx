import React, { useState } from 'react';
import { Sparkles, X, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Importamos el puente que creamos

interface Props {
  onSelectUser: (user: any) => void;
}

export const Auth: React.FC<Props> = ({ onSelectUser }) => {
  const [isLogin, setIsLogin] = useState(true); // Cambiar entre entrar o crear cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Solo para registros
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // FUNCIÓN PARA ENTRAR (LOGIN)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg("Correo o contraseña incorrectos");
      setLoading(false);
    } else if (data.user) {
      // Si todo sale bien, avisamos a la App principal
      onSelectUser({
        id: data.user.id,
        name: data.user.user_metadata.name || data.user.email,
        email: data.user.email
      });
    }
  };

  // FUNCIÓN PARA CREAR CUENTA (SIGN UP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { name: name } // Guardamos el nombre en los metadatos
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      alert("¡Cuenta creada! Ya puedes iniciar sesión.");
      setIsLogin(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[1.5rem] shadow-2xl text-white mb-6">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Finanza360</h1>
          <p className="text-slate-500 font-medium">{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta gratuita'}</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Correo Electrónico</label>
              <div className="relative">
                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? 'Procesando...' : isLogin ? 'Entrar ahora' : 'Registrarme'}
            </button>
          </form>

          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-6 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Crea una aquí' : 'Ya tengo cuenta, quiero entrar'}
          </button>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Conexión cifrada con Supabase Cloud
        </p>
      </div>
    </div>
  );
};
