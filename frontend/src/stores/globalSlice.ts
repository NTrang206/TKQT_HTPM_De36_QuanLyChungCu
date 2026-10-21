import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
}

interface GlobalState {
  sidebarOpen: boolean;
  activeBuildingId: number | null; // null = All buildings
  activeQuickSearchModal: boolean;
  activeAICopilotModal: boolean;
  notifications: ToastNotification[];
}

const initialState: GlobalState = {
  sidebarOpen: true,
  activeBuildingId: null,
  activeQuickSearchModal: false,
  activeAICopilotModal: false,
  notifications: [],
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setActiveBuildingId: (state, action: PayloadAction<number | null>) => {
      state.activeBuildingId = action.payload;
    },
    setQuickSearchModal: (state, action: PayloadAction<boolean>) => {
      state.activeQuickSearchModal = action.payload;
    },
    setAICopilotModal: (state, action: PayloadAction<boolean>) => {
      state.activeAICopilotModal = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<ToastNotification, 'id' | 'timestamp'>>) => {
      const newNotif: ToastNotification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      state.notifications.unshift(newNotif);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setActiveBuildingId,
  setQuickSearchModal,
  setAICopilotModal,
  addNotification,
  removeNotification,
} = globalSlice.actions;

export default globalSlice.reducer;
