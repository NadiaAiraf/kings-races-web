import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { firebaseAuthDeps } from './auth/firebaseAuth';
import { EventListPage } from './pages/EventListPage';
import { NewEventPage } from './pages/NewEventPage';
import { EventPage } from './pages/EventPage';
import { LoginPage } from './pages/LoginPage';

// HashRouter because GitHub Pages cannot serve deep links.
function App() {
  return (
    <AuthProvider deps={firebaseAuthDeps}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<EventListPage />} />
          <Route path="/events/new" element={<NewEventPage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
