import { configureStore } from '@reduxjs/toolkit';
import kanbanReducer from './kanbanSlice';

// Load initial state from localStorage
const savedTasks = localStorage.getItem('kanban-tasks');
const preloadedState = {
  kanban: {
    tasks: savedTasks ? JSON.parse(savedTasks) : []
  }
};

export const store = configureStore({
  reducer: {
    kanban: kanbanReducer,
  },
  preloadedState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
