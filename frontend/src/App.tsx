import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './stores';
import { AppRouter } from './routers/AppRouter';
import { FloatingAIChatbot } from './components/ai/FloatingAIChatbot';
import { ToastContainer } from './components/common/ToastContainer';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-500 selection:text-white">
          <AppRouter />
          {/* Global Floating AI Chatbot assistant available for immediate resident / guest / manager interaction */}
          <FloatingAIChatbot />
          {/* Global Toast Notification Container */}
          <ToastContainer />
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
