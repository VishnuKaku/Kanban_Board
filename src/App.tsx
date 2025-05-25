import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './store';
import { addTask, moveTask, hydrate, Task } from './kanbanSlice';

// Light/Dark mode state
const getInitialTheme = () => localStorage.getItem('kanban-theme') || 'light';

function App() {
  const tasks = useSelector((state: RootState) => state.kanban.tasks);
  const dispatch = useDispatch();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Light/Dark mode state
  const [theme, setTheme] = useState(getInitialTheme());
  const [history, setHistory] = useState<Task[][]>([]);
  const [future, setFuture] = useState<Task[][]>([]);

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Theme effect
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('kanban-theme', theme);
  }, [theme]);

  // Undo/Redo logic
  useEffect(() => {
    setHistory([tasks]); // Initialize history with the initial state
    setFuture([]);
    // eslint-disable-next-line
  }, []);

  // Only push to history if tasks actually changed (avoid duplicate states)
  useEffect(() => {
    setHistory(prev => {
      if (prev.length === 0 || prev[prev.length - 1] !== tasks) {
        return [...prev, tasks];
      }
      return prev;
    });
    // Clear future on new action
    // Only clear if not triggered by undo/redo
    // We'll handle this by tracking a flag
    // eslint-disable-next-line
  }, [tasks]);

  const handleUndo = () => {
    if (history.length > 1) {
      const prev = history[history.length - 2];
      setHistory(h => h.slice(0, -1));
      setFuture(f => [history[history.length - 1], ...f]);
      dispatch(hydrate(prev));
    }
  };
  const handleRedo = () => {
    if (future.length > 0) {
      const next = future[0];
      setFuture(f => f.slice(1));
      setHistory(h => [...h, next]);
      dispatch(hydrate(next));
    }
  };

  // Modal handlers
  const openModal = () => {
    setShowModal(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };
  const closeModal = () => {
    setShowModal(false);
    setTitle('');
    setDescription('');
  };
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      dispatch(addTask({ title, description }));
      closeModal();
    }
  };

  // Drag handlers
  const handleDragStart = (id: string) => setDraggedTaskId(id);
  const handleDragEnd = () => setDraggedTaskId(null);
  const handleDrop = (status: Task['status']) => {
    if (draggedTaskId) {
      dispatch(moveTask({ id: draggedTaskId, status }));
      setDraggedTaskId(null);
    }
  };

  // Responsive columns
  const columns: { key: Task['status']; label: string }[] = [
    { key: 'backlog', label: 'Backlog' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
  ];

  return (
    <div className={`App ${theme}`}>
      <h1 style={{ textAlign: 'center', marginBottom: 32, fontWeight: 700, fontSize: '2.2rem', letterSpacing: '0.01em' }}>Mini Kanban Board</h1>
      <div className="kanban-board">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              className="kanban-column"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
              aria-label={col.label + ' column'}
              tabIndex={0}
              role="region"
              aria-labelledby={`column-title-${col.key}`}
            >
              <h2 id={`column-title-${col.key}`}>{col.label}</h2>
              {colTasks.length === 0 ? (
                <div style={{
                  minHeight: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#bbb',
                  fontStyle: 'italic',
                  opacity: 0.8
                }} aria-label={`No tasks in ${col.label}`}
                >
                  <span style={{fontSize: 32, marginBottom: 4}} aria-hidden="true">🗒️</span>
                  <span>No tasks here</span>
                </div>
              ) : (
                colTasks.map(task => (
                  <div
                    key={task.id}
                    className="kanban-task-card"
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    tabIndex={0}
                    aria-grabbed={draggedTaskId === task.id}
                    aria-label={`Task: ${task.title}. ${task.description ? 'Description: ' + task.description : ''}`}
                    role="article"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        // Focus first move button
                        const btn = e.currentTarget.querySelector('button');
                        if (btn) (btn as HTMLButtonElement).focus();
                      }
                    }}
                  >
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {columns.filter(c => c.key !== col.key).map(c => (
                        <button
                          key={c.key}
                          onClick={() => dispatch(moveTask({ id: task.id, status: c.key }))}
                          aria-label={`Move ${task.title} to ${c.label}`}
                        >
                          Move to {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
      <div className="kanban-controls">
        <button onClick={openModal} aria-label="Add Task">Add Task</button>
        <button onClick={handleUndo} disabled={history.length <= 1} aria-label="Undo">Undo</button>
        <button onClick={handleRedo} disabled={future.length === 0} aria-label="Redo">Redo</button>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      {/* Modal for adding task */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="kanban-modal-bg"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closeModal}
          tabIndex={-1}
          onKeyDown={e => {
            if (e.key === 'Escape') closeModal();
          }}
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleAddTask}
            className="kanban-modal-form"
            style={{
              background: theme === 'dark' ? '#23272f' : '#fff',
              color: theme === 'dark' ? '#fff' : '#222',
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
              transition: 'background 0.3s, color 0.3s',
              animation: 'kanbanPopIn 0.3s',
              position: 'relative',
              top: 0,
              left: 0
            }}
            role="form"
            aria-label="Add new task"
          >
            <h2 style={{marginTop:0}}>Add New Task</h2>
            <label>
              Title
              <input
                ref={titleInputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                aria-label="Task title"
                onKeyDown={e => { if (e.key === 'Escape') closeModal(); }}
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                aria-label="Task description"
                onKeyDown={e => { if (e.key === 'Escape') closeModal(); }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={closeModal} aria-label="Cancel add task">Cancel</button>
              <button type="submit" aria-label="Add task">Add</button>
            </div>
          </form>
        </div>
      )}
      <style>{`
        .kanban-task-card {
          animation: kanbanFadeIn 0.35s cubic-bezier(.4,2,.6,1) both;
        }
        .kanban-modal-bg {
          animation: kanbanFadeIn 0.3s;
        }
        .kanban-modal-form {
          animation: kanbanPopIn 0.3s;
        }
        @keyframes kanbanFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes kanbanPopIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;
