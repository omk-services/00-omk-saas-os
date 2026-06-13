import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { Task } from '@/lib/types';
import { Check, Calendar, ExternalLink, Filter, Plus } from 'lucide-react';

const SEED_TASKS: ReadonlyArray<Task> = [
  { id: 'T1', title: 'Validate visa application for John Smith', project: 'Immigration', deadline: 'Today', completed: false, sopLink: 'S1' },
  { id: 'T2', title: 'Send Q3 invoice to Maria Garcia', project: 'Finance', deadline: 'Tomorrow', completed: false },
  { id: 'T3', title: 'Follow up missing documents (Ahmed Hassan)', project: 'Compliance', deadline: 'Today', completed: false },
  { id: 'T4', title: 'Translate birth certificate for Chen Wei', project: 'Translation', deadline: 'Oct 18, 2025', completed: true, sopLink: 'S4' },
  { id: 'T5', title: 'Schedule notary appointment (Sarah Miller)', project: 'Notarial', deadline: 'Oct 22, 2025', completed: false }
];

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => [...SEED_TASKS]);

  const toggleTask = (id: string): void => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleAddTask = (): void => {
    const title = window.prompt('Enter quick task title:');
    if (!title) return;
    const newTask: Task = {
      id: 'T' + Date.now(),
      title,
      project: 'Quick Task',
      deadline: 'Today',
      completed: false
    };
    setTasks((prev) => [...prev, newTask]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Day</h1>
          <p className="text-slate-500 text-sm mt-1">Focus on execution. No noise.</p>
        </div>
        <button className="flex items-center space-x-2 text-sm text-slate-600 hover:text-emerald-700 bg-white border border-stone-200 hover:border-emerald-200 px-4 py-2 rounded-lg shadow-sm transition-all">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-5">Task Name</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-3 text-right">Action</div>
        </div>

        <div className="divide-y divide-stone-100">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                task.completed ? 'bg-stone-50/50' : 'hover:bg-emerald-50/30'
              }`}
            >
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'border-stone-300 hover:border-emerald-400 bg-white'
                  }`}
                >
                  {task.completed && <Check className="w-4 h-4" />}
                </button>
              </div>

              <div className="col-span-5">
                <p
                  className={`text-sm font-medium ${
                    task.completed ? 'text-slate-400 line-through decoration-stone-300' : 'text-slate-800'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center mt-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span className={task.deadline === 'Today' ? 'text-amber-600 font-bold' : ''}>{task.deadline}</span>
                </div>
              </div>

              <div className="col-span-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-slate-600 border border-stone-200">
                  {task.project}
                </span>
              </div>

              <div className="col-span-3 flex justify-end">
                {task.sopLink ? (
                  <button className="flex items-center px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Open SOP
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">No SOP linked</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-stone-50 border-t border-stone-100 text-center">
          <button
            onClick={handleAddTask}
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors py-2 w-full border border-dashed border-stone-200 rounded-xl hover:border-emerald-300 hover:bg-white flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add quick task
          </button>
        </div>
      </Card>
    </div>
  );
};

export default TasksView;
