import { useState, useEffect } from 'react';
import {
    Users, BookOpen, ScrollText, Settings, ArrowRight,
    CheckCircle, Loader2, GraduationCap, Scale,
    Save, ListFilter, RefreshCw, Activity, Trash2,
    Check, X, FileCheck
} from 'lucide-react';

import DashboardLayout from '../components/DashboardLayout';
import UserManagement from '../components/Admin/UserManagement';
import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api`;

const AdminCard = ({ children, className = "" }) => (
    <div className={`w-full bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 shadow-xl ${className}`}>
        {children}
    </div>
);

const AdminButton = ({ children, onClick, disabled, variant = 'primary', className = "" }) => {
    const base = "cursor-pointer px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-md hover:shadow-lg hover:brightness-110",
        secondary: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border-2 border-[rgb(var(--border))] hover:border-[rgb(var(--text))] hover:text-[rgb(var(--text))]",
        danger: "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100",
        ghost: "bg-transparent text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--primary))]"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
            {disabled && variant === 'primary' ? <Loader2 size={16} className="animate-spin" /> : children}
        </button>
    );
};

const AdminBadge = ({ children, variant = 'neutral' }) => {
    const variants = {
        neutral: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border-[rgb(var(--border))]",
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
        danger: "bg-red-50 text-red-700 border-red-200",
        primary: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/20"
    };
    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${variants[variant]}`}>
            {children}
        </span>
    );
};

/* --- MAIN DASHBOARD --- */

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [counts, setCounts] = useState({ courses: 0, grades: 0 });

    const updateCount = (key, val) => {
        setCounts(prev => ({ ...prev, [key]: val }));
    };

    const tabs = [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'courses', label: 'Course Management', icon: BookOpen, badge: counts.courses },
        { id: 'grades', label: 'Publish Grades', icon: GraduationCap, badge: counts.grades },
        { id: 'settings', label: 'Configuration', icon: Settings },
        { id: 'audit', label: 'Audit Logs', icon: ScrollText }
    ];

    return (
        <DashboardLayout
            title="Admin Dashboard"
            sidebar={
                <div className="flex flex-col h-full p-2">
                    <div className="px-4 py-4 text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-widest opacity-70">
                        Menu
                    </div>

                    <nav className="space-y-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group text-sm
                                        ${isActive
                                            ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-md font-bold'
                                            : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--text))] font-medium'
                                        }
                                    `}
                                >
                                    <div className="relative">
                                        <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'group-hover:scale-110 transition-transform'} />
                                        {tab.badge > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold animate-pulse">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="flex-1 text-left">{tab.label}</span>
                                    {isActive && <ArrowRight size={16} />}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            }
        >
            <div className="w-full animate-fade-in-up pb-10">
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'courses' && <CourseManager onCountChange={(n) => updateCount('courses', n)} />}
                {activeTab === 'grades' && <GradeApprovals onCountChange={(n) => updateCount('grades', n)} />}
                {activeTab === 'settings' && <SystemSettings />}
                {activeTab === 'audit' && <AuditLogViewer />}
            </div>
        </DashboardLayout>
    );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT: AUDIT LOG VIEWER                                                */
/* -------------------------------------------------------------------------- */

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('access_token');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/audits`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setLogs(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    return (
        <AdminCard>
            <div className="flex justify-between items-end mb-6 border-b border-[rgb(var(--border))] pb-6">
                <div>
                    <h2 className="text-xl font-bold text-[rgb(var(--text))] flex items-center gap-2">
                        <Activity className="text-[rgb(var(--primary))]" /> System Audit Logs
                    </h2>
                    <p className="text-[rgb(var(--muted))] text-sm mt-1">Track security events and data modifications.</p>
                </div>
                <AdminButton variant="secondary" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                </AdminButton>
            </div>

            <div className="overflow-hidden rounded-xl border border-[rgb(var(--border))]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] font-bold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Actor</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Metadata</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-[rgb(var(--muted))]">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-[rgb(var(--muted))]">No audit logs found.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-[rgb(var(--bg))] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-[rgb(var(--muted))] font-mono text-xs">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[rgb(var(--text))]">{log.actor?.email || 'System'}</div>
                                        {log.actor?.role && <span className="text-xs text-[rgb(var(--muted))] uppercase">{log.actor.role}</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <AdminBadge variant="primary">{log.action}</AdminBadge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs text-[rgb(var(--muted))] font-mono bg-[rgb(var(--bg))] px-2 py-1 rounded block max-w-xs truncate">
                                            {JSON.stringify(log.metadata)}
                                        </code>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminCard>
    );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT: COURSE MANAGER                                                  */
/* -------------------------------------------------------------------------- */

const CourseManager = ({ onCountChange }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('pending');
    const [actionLoading, setActionLoading] = useState(null);
    const CURRENT_SESSION = '2025-2026';
    const token = localStorage.getItem('access_token');

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${API_BASE}/courses`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setCourses(data);
            const pendingCount = data.filter(c => c.status === 'pending').length;
            onCountChange(pendingCount);
            if (pendingCount === 0 && view === 'pending') setView('all');
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleUpdate = async (id, status) => {
        setActionLoading(id);
        try {
            await fetch(`${API_BASE}/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            fetchCourses();
        } catch (e) { alert('Failed'); } finally { setActionLoading(null); }
    };

    const pendingCourses = courses.filter(c => c.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="flex bg-[rgb(var(--surface))] p-1.5 rounded-xl border border-[rgb(var(--border))] w-fit shadow-sm">
                {['pending', 'all'].map(v => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === v
                                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-md'
                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
                            }`}
                    >
                        {v === 'pending' ? `Requests (${pendingCourses.length})` : 'All Courses'}
                    </button>
                ))}
            </div>

            {loading ? <div className="p-12 text-center text-[rgb(var(--muted))]"><Loader2 className="animate-spin mx-auto" /></div> : view === 'pending' ? (
                <div className="space-y-4">
                    {pendingCourses.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg))]/50">
                            <CheckCircle size={48} className="text-green-500/50 mb-4" />
                            <h3 className="text-lg font-bold text-[rgb(var(--text))]">All Caught Up</h3>
                        </div>
                    )}
                    {pendingCourses.map(c => (
                        <AdminCard key={c.id} className="flex justify-between items-center hover:border-[rgb(var(--primary))]/30 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg text-[rgb(var(--text))]">{c.title}</h3>
                                <p className="text-sm text-[rgb(var(--muted))] font-mono mt-1">{c.course_code} • {c.instructor?.email}</p>
                            </div>
                            <div className="flex gap-3">
                                <AdminButton variant="danger" onClick={() => handleUpdate(c.id, 'rejected')} disabled={actionLoading === c.id}>Reject</AdminButton>
                                <AdminButton variant="primary" onClick={() => handleUpdate(c.id, 'approved')} disabled={actionLoading === c.id}>Approve</AdminButton>
                            </div>
                        </AdminCard>
                    ))}
                </div>
            ) : (
                <AdminCard className="overflow-hidden p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] font-bold text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4">Session</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                            {courses.map(c => (
                                <tr key={c.id} className="hover:bg-[rgb(var(--bg))] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[rgb(var(--text))]">{c.title}</div>
                                        <div className="text-xs text-[rgb(var(--muted))]">{c.course_code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-[rgb(var(--muted))]">{c.academic_session}</td>
                                    <td className="px-6 py-4">
                                        <AdminBadge variant={c.status === 'approved' ? 'success' : c.status === 'rejected' ? 'danger' : 'warning'}>
                                            {c.status}
                                        </AdminBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </AdminCard>
            )}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT: SYSTEM SETTINGS                                                 */
/* -------------------------------------------------------------------------- */

const SystemSettings = () => {
    const [policy, setPolicy] = useState('absolute');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => { setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[rgb(var(--primary))]/10 rounded-xl text-[rgb(var(--primary))]">
                    <Scale size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-[rgb(var(--text))]">Grading Configuration</h2>
                    <p className="text-[rgb(var(--muted))] mt-1">Set institute-wide standards for GPA calculation.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <AdminCard>
                    <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="text-[rgb(var(--primary))]" />
                        <h3 className="font-bold text-lg">CGPA Scale</h3>
                    </div>
                    <div className="flex items-center justify-between px-4 py-4 bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] rounded-xl">
                        <span className="font-mono font-bold text-2xl text-[rgb(var(--text))]">10.0</span>
                        <AdminBadge variant="neutral">FIXED STANDARD</AdminBadge>
                    </div>
                </AdminCard>

                <AdminCard>
                    <div className="flex items-center gap-3 mb-4">
                        <ListFilter className="text-[rgb(var(--primary))]" />
                        <h3 className="font-bold text-lg">Grade Precision</h3>
                    </div>
                    <div className="flex items-center justify-between px-4 py-4 bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] rounded-xl">
                        <span className="text-sm font-bold text-[rgb(var(--muted))] uppercase">Decimal Places</span>
                        <span className="font-mono font-bold text-2xl text-[rgb(var(--text))]">2</span>
                    </div>
                </AdminCard>
            </div>

            <AdminCard>
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="text-[rgb(var(--primary))]" />
                    <h3 className="font-bold text-lg">Grading Policy</h3>
                </div>
                <div className="space-y-4">
                    {['absolute', 'relative'].map((type) => (
                        <div
                            key={type}
                            onClick={() => setPolicy(type)}
                            className={`
                                cursor-pointer p-6 rounded-xl border-2 transition-all flex items-start gap-4 group
                                ${policy === type
                                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5 shadow-sm'
                                    : 'border-[rgb(var(--border))] hover:border-[rgb(var(--primary))]/50'
                                }
                            `}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${policy === type ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]' : 'border-[rgb(var(--muted))]'}`}>
                                {policy === type && <div className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--surface))]" />}
                            </div>
                            <div>
                                <span className="font-bold text-[rgb(var(--text))] capitalize block mb-1">
                                    {type} Grading {type === 'absolute' && '(Recommended)'}
                                </span>
                                <p className="text-sm text-[rgb(var(--muted))]">
                                    {type === 'absolute'
                                        ? "Grades assigned based on fixed score ranges (e.g. ≥90 is A)."
                                        : "Grades calculated based on class average and standard deviation (Bell Curve)."
                                    }
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-[rgb(var(--border))] flex justify-between items-center">
                    <span className="text-green-600 font-bold text-sm flex items-center gap-2">
                        {saved && <><CheckCircle size={16} /> Saved Successfully</>}
                    </span>
                    <AdminButton onClick={handleSave} disabled={loading}>
                        <Save size={18} /> Save Changes
                    </AdminButton>
                </div>
            </AdminCard>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT: GRADE APPROVALS                                                  */
/* -------------------------------------------------------------------------- */
const GradeApprovals = ({ onCountChange }) => {
    const [pendingGroups, setPendingGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('access_token');

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const res = await fetch(`${API_BASE}/grades`, { headers: { Authorization: `Bearer ${token}` } });
                const all = await res.json();
                const pending = all.filter(g => g.status === 'submitted');

                const grouped = Object.values(pending.reduce((acc, g) => {
                    if (!acc[g.course_id]) acc[g.course_id] = { ...g, count: 0 };
                    acc[g.course_id].count++;
                    return acc;
                }, {}));

                setPendingGroups(grouped);
                onCountChange(grouped.length);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchGrades();
    }, []);

    const handlePublish = async (courseId) => {
        try {
            await fetch(`${API_BASE}/grades/publish`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ course_id: courseId })
            });
            const updated = pendingGroups.filter(g => g.course_id !== courseId);
            setPendingGroups(updated);
            onCountChange(updated.length);
        } catch { alert("Failed."); }
    };

    if (loading) return <div className="p-12 text-center text-[rgb(var(--muted))]"><Loader2 className="animate-spin mx-auto" /></div>;
    if (pendingGroups.length === 0) return (
        <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg))]/30">
            <FileCheck size={48} className="text-[rgb(var(--primary))] opacity-50 mb-4" />
            <h3 className="text-xl font-bold text-[rgb(var(--text))]">All Clear</h3>
            <p className="text-[rgb(var(--muted))]">No grades pending approval.</p>
        </div>
    );

    return (
        <div className="grid gap-4">
            {pendingGroups.map(group => (
                <AdminCard key={group.course_id} className="flex justify-between items-center hover:border-[rgb(var(--primary))]/30 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[rgb(var(--bg))] rounded-xl border border-[rgb(var(--border))]">
                            <ScrollText size={24} className="text-[rgb(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[rgb(var(--text))]">{group.course?.title || 'Unknown Course'}</h3>
                            <p className="text-sm text-[rgb(var(--muted))] font-mono">
                                {group.course?.course_code} • <span className="text-[rgb(var(--primary))] font-bold">{group.count} Students</span>
                            </p>
                        </div>
                    </div>
                    <AdminButton onClick={() => handlePublish(group.course_id)}>
                        Publish Grades
                    </AdminButton>
                </AdminCard>
            ))}
        </div>
    );
};

export default AdminDashboard;
