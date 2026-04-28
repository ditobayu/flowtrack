'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to FlowTrack</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="submit" disabled={loading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50">{loading ? 'Loading...' : 'Login'}</button>
        <p className="text-center text-sm text-gray-500 mt-4">Don't have an account? <Link href="/register" className="text-indigo-500 hover:underline">Register</Link></p>
      </form>
    </div>
  );
}
