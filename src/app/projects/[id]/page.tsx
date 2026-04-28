'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Column { id: string; name: string; order: number; tasks: Task[] }
interface Task { id: string; title: string; description: string; priority: string; order: number; assignee?: { id: string; name: string } | null; labels: { label: { name: string; color: string } }[] }
interface Board { id: string; name: string; columns: Column[] }

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [board, setBoard] = useState<Board | null>(null);
  const [projectName, setProjectName] = useState('');
  const [showNewTask, setShowNewTask] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchBoard = useCallback(() => {
    if (!token) return;
    fetch(`/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setProjectName(d.project.name); setBoard(d.project.boards?.[0] || null); setLoading(false); })
      .catch(() => { router.push('/dashboard'); });
  }, [token, projectId, router]);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchBoard();
  }, [token, router, fetchBoard]);

  const createTask = async (columnId: string) => {
    if (!newTitle.trim()) return;
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: newTitle, columnId, projectId }) });
    setNewTitle('');
    setShowNewTask(null);
    fetchBoard();
  };

  const moveTask = async (taskId: string, columnId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ columnId, projectId }) });
    fetchBoard();
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchBoard();
  };

  const handleDrop = (targetColId: string) => {
    if (dragTask && targetColId !== dragCol) moveTask(dragTask, targetColId);
    setDragTask(null);
    setDragCol(null);
  };

  const priorityColor: Record<string, string> = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-full mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-bold text-lg">📋 FlowTrack</Link>
            <span className="text-gray-400">/</span>
            <span className="font-medium">{projectName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Drag tasks to move</span>
          </div>
        </div>
      </nav>
      <div className="p-4 overflow-x-auto">
        {board ? (
          <div className="flex gap-4 min-h-[calc(100vh-4rem)]">
            {board.columns.map(col => (
              <div key={col.id} className="flex-shrink-0 w-72"
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={() => handleDrop(col.id)}>
                <div className="bg-gray-200/50 dark:bg-gray-900/50 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-sm">{col.name}</h3>
                    <span className="text-xs text-gray-400">{col.tasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {col.tasks.map(task => (
                      <div key={task.id} draggable
                        onDragStart={() => { setDragTask(task.id); setDragCol(col.id); }}
                        className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-800 cursor-grab active:cursor-grabbing hover:shadow-md transition group">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                          </Link>
                          <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition text-xs">✕</button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`w-2 h-2 rounded-full ${priorityColor[task.priority] || 'bg-gray-400'}`} />
                          {task.assignee && <span className="text-xs text-gray-400">{task.assignee.name}</span>}
                          {task.labels?.map((l, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: l.label.color + '20', color: l.label.color }}>{l.label.name}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {showNewTask === col.id ? (
                    <div className="mt-2">
                      <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createTask(col.id)} placeholder="Task title..." autoFocus className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => createTask(col.id)} className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-lg">Add</button>
                        <button onClick={() => { setShowNewTask(null); setNewTitle(''); }} className="text-xs text-gray-500 hover:underline">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowNewTask(col.id)} className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-lg transition">+ Add task</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-12">No board found</p>
        )}
      </div>
    </div>
  );
}
