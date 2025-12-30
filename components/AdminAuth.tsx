import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import Button from './Button';

interface AdminAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '12345679') {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 relative" role="dialog" aria-labelledby="auth-title">
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 transition-colors" aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 id="auth-title" className="text-xl font-black text-stone-900 uppercase tracking-tight">Admin Login</h3>
          <p className="text-sm text-stone-500 font-medium">Only Nick should be here.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="sr-only">Password</label>
            <input
              id="admin-password"
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full rounded-xl border-2 ${error ? 'border-rose-500' : 'border-stone-200'} focus:border-indigo-500 focus:ring-indigo-500 p-3.5 text-center tracking-widest text-stone-900 font-bold bg-white`}
              placeholder="••••••••"
            />
            {error && <p className="text-xs text-rose-600 mt-2 text-center font-bold">Incorrect password.</p>}
          </div>
          <Button type="submit" fullWidth className="font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Unlock Dashboard</Button>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;