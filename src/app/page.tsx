'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">FlowTrack</h1>
        <p className="text-xl mb-8 text-white/80">Project management, simplified.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => router.push('/login')} className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5">Login</button>
          <button onClick={() => router.push('/register')} className="px-8 py-3 bg-white/20 backdrop-blur rounded-xl font-semibold hover:bg-white/30 transition-all hover:-translate-y-0.5">Register</button>
        </div>
      </div>
    </div>
  );
}
