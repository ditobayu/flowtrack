'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project { id: string; name: string; description: string; createdAt: string; _count?: { boards: number } }

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    if (u) setUser(JSON.parse(u));
    
    Promise.all([
      fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([projData, taskData]) => {
      setProjects(projData.projects || []);
      setTasks(taskData.tasks || []);
      setLoading(false);
    }).catch(() => { router.push('/login'); });
  }, [router]);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, description: desc }) });
    const data = await res.json();
    if (res.ok) { setProjects([data.project, ...projects]); setName(''); setDesc(''); }
  };

  const logout = () => { localStorage.clear(); router.push('/'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg">📋 FlowTrack</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">My Assigned Tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map(t => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:-translate-y-1 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-indigo-500 transition">{t.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${t.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {t.priority}
                    </span>
                  </div>
                  {t.column?.board?.project?.name && (
                    <p className="text-sm text-gray-500 mb-2">Project: {t.column.board.project.name}</p>
                  )}
                  {t.dueDate && (
                    <p className="text-xs text-gray-400">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Projects</h2>
          <p className="text-gray-500 mb-4">{projects.length} projects</p>
        </div>
        <form onSubmit={createProject} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <h2 className="font-semibold mb-4">New Project</h2>
          <div className="flex gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" required className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 rounded-xl font-medium transition">Create</button>
          </div>
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <h3 className="font-semibold text-lg group-hover:text-indigo-500 transition">{p.name}</h3>
              {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>{p._count?.boards || 0} boards</span>
              </div>
            </Link>
          ))}
        </div>
        {projects.length === 0 && <p className="text-center text-gray-400 py-12">No projects yet. Create one above!</p>}
      </div>
    </div>
  );
}
