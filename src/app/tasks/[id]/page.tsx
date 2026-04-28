'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Task { id: string; title: string; description: string; priority: string; order: number; assignee?: { id: string; name: string; email: string } | null; reporter?: { id: string; name: string } | null; reporterChatId?: string; reporterName?: string; reporterPlatform?: string; column?: { id: string; name: string; board?: { columns?: { id: string; name: string }[], project?: { memberships?: { user: { id: string; name: string; email: string } }[] } } }; comments: { id: string; content: string; userName: string; createdAt: string }[]; labels: { label: { name: string; color: string } }[]; createdAt: string; updatedAt: string }

export default function TaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchTask = useCallback(() => {
    if (!token) return;
    fetch(`/api/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setTask(d.task); setTitle(d.task.title); setDesc(d.task.description); })
      .catch(() => router.push('/dashboard'));
  }, [token, taskId, router]);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchTask();
  }, [token, router, fetchTask]);

  const addComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/tasks/${taskId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ content: comment }) });
    setComment('');
    fetchTask();
  };

  const saveTask = async () => {
    await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, description: desc }) });
    setEditing(false);
    fetchTask();
  };

  const updateTaskField = async (field: string, value: string | null) => {
    await fetch(`/api/tasks/${taskId}`, { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
      body: JSON.stringify({ [field]: value }) 
    });
    fetchTask();
  };

  const priorityColor: Record<string, string> = { critical: 'text-red-500 bg-red-50', high: 'text-orange-500 bg-orange-50', medium: 'text-yellow-600 bg-yellow-50', low: 'text-green-500 bg-green-50' };

  if (!task) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-lg">📋 FlowTrack</Link>
          <span className="text-gray-400">/</span>
          <Link href="/dashboard" className="text-indigo-500 hover:underline text-sm">Projects</Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm truncate">Task</span>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            {editing ? (
              <div className="flex-1 space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                <div className="flex gap-2">
                  <button onClick={saveTask} className="bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Save</button>
                  <button onClick={() => setEditing(false)} className="text-gray-500 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{task.title}</h1>
                {task.description && <p className="text-gray-500 mt-2 whitespace-pre-wrap">{task.description}</p>}
              </div>
            )}
            {!editing && <button onClick={() => setEditing(true)} className="text-indigo-500 text-sm hover:underline">Edit</button>}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Status:</span>
              <select 
                value={task.column?.id} 
                onChange={(e) => updateTaskField('columnId', e.target.value)}
                className="bg-transparent font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
              >
                {task.column?.board?.columns?.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Priority:</span>
              <select 
                value={task.priority} 
                onChange={(e) => updateTaskField('priority', e.target.value)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 border-none cursor-pointer ${priorityColor[task.priority] || ''}`}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Assignee:</span>
              <select 
                value={task.assignee?.id || ''} 
                onChange={(e) => updateTaskField('assigneeId', e.target.value || null)}
                className="bg-transparent font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
              >
                <option value="">Unassigned</option>
                {task.column?.board?.project?.memberships?.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>

            {task.reporter && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Reporter:</span>
                <span>{task.reporter.name}</span>
              </div>
            )}
            {task.reporterChatId && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">From:</span>
                <span className="text-blue-500">{task.reporterName || task.reporterChatId} ({task.reporterPlatform})</span>
              </div>
            )}
            <div className="text-gray-400 ml-auto">Created {new Date(task.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold mb-4">Comments ({task.comments.length})</h2>
          <div className="space-y-4 mb-4">
            {task.comments.map(c => (
              <div key={c.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.userName}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{c.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Add a comment..." className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={addComment} className="bg-indigo-500 text-white px-4 rounded-xl text-sm font-medium">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
