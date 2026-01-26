import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Loader2, ShieldCheck, GraduationCap, School } from 'lucide-react';
import { API_BASE_URL } from './config/api';

// Pages
import HomePage from './pages/HomePage'; // Import the new page
import OTPLogin from './components/OTPLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No token');

        const res = await fetch(`${API_BASE_URL}/auth/session`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Session invalid');
        const { user } = await res.json();
        setUser(user);

      } catch (e) {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    init();
  }, []);

  const logout = async () => {
    try { await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' }); } catch (e) { }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    setUser(null);
    window.location.href = '/';
  };

  if (loading) return <FullPageLoader />;

  return (
    <Router>
      {user && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <SessionPill user={user} onLogout={logout} />
        </div>
      )}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <HomePage />}
        />

        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <OTPLogin />}
        />

        {/* PROTECTED ROUTES */}
        <Route path="/admin" element={
          <ProtectedRoute user={user} allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/professor" element={
          <ProtectedRoute user={user} allowedRoles={['professor']}>
            <ProfessorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/student" element={
          <ProtectedRoute user={user} allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* ROLE BASED REDIRECTOR */}
        <Route path="/dashboard" element={
          user ? <RoleRedirect role={user.role} /> : <Navigate to="/login" />
        } />

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function RoleRedirect({ role }) {
  if (role === 'admin') return <Navigate to="/admin" />;
  if (role === 'professor') return <Navigate to="/professor" />;
  if (role === 'student') return <Navigate to="/student" />;
  return <Navigate to="/login" />;
}

export default App;

/* ---------------- UI COMPONENTS ---------------- */

const FullPageLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
    <div className="relative">
      <div className="absolute inset-0 rounded-full animate-ping bg-[rgb(var(--primary))]/20"></div>
      <Loader2 size={48} className="animate-spin text-[rgb(var(--primary))]" />
    </div>
    <p className="mt-4 font-semibold text-[rgb(var(--muted))] animate-pulse">
      Initializing...
    </p>
  </div>
);

const SessionPill = ({ user, onLogout }) => {
  const getRoleIcon = (role) => {
    if (role === 'admin') return ShieldCheck;
    if (role === 'professor') return GraduationCap;
    return School;
  };
  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="
      flex items-center gap-3 pl-4 pr-2 py-2 
      bg-[rgb(var(--surface))] 
      border border-[rgb(var(--border))] 
      rounded-full shadow-xl
      hover:scale-[1.02] transition-transform duration-200
    ">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-full bg-[rgb(var(--primary-soft))]/20 text-[rgb(var(--primary))]">
          <RoleIcon size={16} />
        </div>
        <div className="flex flex-col mr-2 text-right">
          <span className="text-xs font-bold text-[rgb(var(--text))] leading-none">
            {user.email.split('@')[0]}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] font-bold leading-tight">
            {user.role}
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-[rgb(var(--border))]" />

      <button
        onClick={onLogout}
        className="
          cursor-pointer
          p-2 rounded-full 
          text-[rgb(var(--muted))] 
          hover:bg-red-50 hover:text-red-600 
          active:scale-95 transition-all
        "
        title="Logout"
      >
        <LogOut size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};
