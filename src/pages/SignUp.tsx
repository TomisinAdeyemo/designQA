import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { UserPlus, Building2 } from 'lucide-react';

export function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, fullName);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl luxury-shadow-lg p-8 interactive-card">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-2xl shadow-xl">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 bg-clip-text text-transparent mb-2">
              DesignQA
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
            Create Account
          </h2>
          <p className="text-center text-slate-600 mb-8">
            Get started with DesignQA
          </p>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-slate-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all"
                placeholder="Create a strong password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-button w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-xl shadow-green-600/30 hover:shadow-2xl hover:shadow-green-600/50 disabled:shadow-none transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-green-600 hover:text-green-800 text-sm font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all"
            >
              Already have an account? <span className="underline">Sign in</span>
            </a>
          </div>
        </div>

        <p className="text-center text-slate-700 text-sm mt-6 font-medium">
          Powered by AI-driven quality assurance
        </p>
      </div>
    </div>
  );
}
