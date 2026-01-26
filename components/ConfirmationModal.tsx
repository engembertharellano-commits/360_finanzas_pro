
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-3">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex p-4 gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 uppercase tracking-widest text-xs"
          >
            Eliminar permanentemente
          </button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};
