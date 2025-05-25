import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'done';
};

interface KanbanState {
  tasks: Task[];
}

const initialState: KanbanState = {
  tasks: [],
};

const kanbanSlice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<{ title: string; description: string }>) => {
      const newTask: Task = {
        id: Date.now().toString(),
        title: action.payload.title,
        description: action.payload.description,
        status: 'backlog',
      };
      state.tasks.push(newTask);
    },
    moveTask: (state, action: PayloadAction<{ id: string; status: Task['status'] }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.status = action.payload.status;
      }
    },
    hydrate: (state, action: PayloadAction<Task[]>) => {
      return { ...state, tasks: action.payload };
    },
    // You can add more reducers for delete, edit, etc.
  },
});

export const { addTask, moveTask, hydrate } = kanbanSlice.actions;
export default kanbanSlice.reducer;
