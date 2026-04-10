import React, { useState, FormEvent } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import loginIcon from '../assets/fit_login_icon.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from '../i18n/TranslationProvider';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('auth.fillAll');
      return;
    }
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={loginIcon} alt="FIT Login Icon" className="w-24 h-24 object-contain" />
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-wider">FIT</h1>
              <p className="text-xs text-blue-300 font-medium">Fish Inventory Tracking</p>
            </div>
          </div>
          <p className="text-center text-blue-200 text-sm">
            {t('auth.welcome')}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
            <Lock size={20} className="text-blue-700" />
            {t('auth.signIn')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.username')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.usernamePlaceholder')}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-shadow disabled:opacity-60"
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300/60 text-xs mt-6">
          {t('auth.footer')}
        </p>
      </div>
    </div>
  );
};
