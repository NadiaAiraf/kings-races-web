import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { firebaseAuthDeps } from './auth/firebaseAuth';
import { EventListPage } from './pages/EventListPage';
import { HomePage } from './pages/HomePage';
import { LeaguePage } from './pages/LeaguePage';
import { NewSeasonPage } from './pages/NewSeasonPage';
import { NewEventPage } from './pages/NewEventPage';
import { EventPage } from './pages/EventPage';
import { LoginPage } from './pages/LoginPage';

// HashRouter because GitHub Pages cannot serve deep links.
function App() {
  return (
    <AuthProvider deps={firebaseAuthDeps}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rounds" element={<EventListPage />} />
          <Route path="/seasons/new" element={<NewSeasonPage />} />
          <Route path="/seasons/:seasonId/:league" element={<LeaguePage />} />
          <Route path="/seasons/:seasonId/:league/new" element={<NewEventPage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
