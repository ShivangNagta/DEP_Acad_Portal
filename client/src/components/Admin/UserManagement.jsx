import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Import Portal
import {
    UserPlus, Trash2, Users, Layers, X,
    FlaskConical, Loader2, Check, Search,
    Mail, Hash, GraduationCap, ChevronDown,
    ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const API_BASE = `${API_BASE_URL}/api/admin`;
const ITEMS_PER_PAGE = 7;

/* --- UI COMPONENTS --- */

const AdminCard = ({ children, className = "" }) => (
    <div className={`
        w-full bg-[rgb(var(--surface))] 
        border border-[rgb(var(--border))] 
        rounded-2xl p-6 shadow-xl 
        ${className}
    `}>
        {children}
    </div>
);

const AdminInput = ({ icon: Icon, label, className = "", ...props }) => (
    <div className="space-y-1.5 text-left w-full">
        {label && (
            <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider ml-1">
                {label}
            </label>
        )}
        <div className="relative group">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] group-focus-within:text-[rgb(var(--primary))] transition-colors">
                    <Icon size={18} />
                </div>
            )}
            <input
                {...props}
                className={`
                    w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl
                    bg-[rgb(var(--bg))] 
                    border-2 border-[rgb(var(--border))] 
                    text-[rgb(var(--text))] font-medium
                    placeholder:text-[rgb(var(--muted))]/50
                    outline-none 
                    focus:border-[rgb(var(--primary))] 
                    focus:ring-4 focus:ring-[rgb(var(--primary))]/10 
                    transition-all duration-200
                    ${className}
                `}
            />
        </div>
    </div>
);

const AdminSelect = ({ icon: Icon, label, options, value, onChange, className = "" }) => (
    <div className={`space-y-1.5 text-left w-full ${className}`}>
        {label && (
            <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider ml-1">
                {label}
            </label>
        )}
        <div className="relative group">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] group-focus-within:text-[rgb(var(--primary))] transition-colors">
                    <Icon size={18} />
                </div>
            )}
            <select
                value={value}
                onChange={onChange}
                className={`
                    w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 rounded-xl appearance-none
                    bg-[rgb(var(--bg))] 
                    border-2 border-[rgb(var(--border))] 
                    text-[rgb(var(--text))] font-medium
                    outline-none 
                    focus:border-[rgb(var(--primary))] 
                    focus:ring-4 focus:ring-[rgb(var(--primary))]/10 
                    transition-all duration-200 cursor-pointer
                `}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] pointer-events-none">
                <ChevronDown size={16} />
            </div>
        </div>
    </div>
);

const AdminButton = ({ children, loading, onClick, variant = 'primary', disabled, ...props }) => {
    const baseStyle = "cursor-pointer w-full py-3 px-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-md hover:shadow-lg hover:brightness-110",
        secondary: "bg-transparent border-2 border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:border-[rgb(var(--primary))]",
        danger: "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100"
    };

    return (
        <button onClick={onClick} disabled={loading || disabled} className={`${baseStyle} ${variants[variant]}`} {...props}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : children}
        </button>
    );
};

/* --- MAIN COMPONENT --- */

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, professors: 0, students: 0 });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [newUser, setNewUser] = useState({ email: '', role: 'student', entry_number: '' });
    const [showBulkModal, setShowBulkModal] = useState(false);

    const token = () => localStorage.getItem('access_token');

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${token()}` } });
            if (res.ok) setUsers(await res.json());
        } catch { setMessage('Failed to load users'); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/stats`, { headers: { Authorization: `Bearer ${token()}` } });
            if (res.ok) setStats(await res.json());
        } catch { }
    };

    const addUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage('User added successfully.');
            setNewUser({ email: '', role: 'student', entry_number: '' });
            fetchUsers();
            fetchStats();
            setTimeout(() => setMessage(''), 3000);
        } catch (e) { setMessage(e.message); }
        finally { setLoading(false); }
    };

    const handleBulkSubmit = async (studentsList) => {
        setLoading(true);
        try {
            const promises = studentsList.map(u =>
                fetch(`${API_BASE}/users`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...u, role: 'student' })
                })
            );
            await Promise.all(promises);
            fetchUsers();
            fetchStats();
            setShowBulkModal(false);
            setMessage(`Added ${studentsList.length} students.`);
            setTimeout(() => setMessage(''), 3000);
        } catch (e) { setMessage("Some errors occurred."); }
        finally { setLoading(false); }
    };

    const deleteUser = async (id) => {
        if (!confirm("Delete this user?")) return;
        await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
        fetchUsers();
        fetchStats();
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.entry_number && u.entry_number.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-8 animate-fade-in-up pb-12">
            {/* STATS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Users" value={stats.total} icon={Users} />
                <StatCard label="Professors" value={stats.professors} icon={Check} />
                <StatCard label="Students" value={stats.students} icon={UserPlus} />
            </section>

            {/* ADD USER CARD */}
            <AdminCard>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-[rgb(var(--text))]">Add New User</h2>
                        <p className="text-[rgb(var(--muted))] text-sm font-medium">Create a single account or generate in bulk.</p>
                    </div>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="px-4 py-2 rounded-xl bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] font-bold text-sm hover:bg-[rgb(var(--primary))]/20 transition-colors flex items-center gap-2"
                    >
                        <Layers size={18} /> Bulk Generator
                    </button>
                </div>

                <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                        <AdminInput
                            icon={Mail}
                            label="Email Address"
                            placeholder="user@iitrpr.ac.in"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <AdminSelect
                            icon={GraduationCap}
                            label="Role"
                            options={[{ label: 'Student', value: 'student' }, { label: 'Professor', value: 'professor' }]}
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        {newUser.role === 'student' ? (
                            <AdminInput
                                icon={Hash}
                                label="Entry No."
                                placeholder="2026CSB..."
                                value={newUser.entry_number}
                                onChange={e => setNewUser({ ...newUser, entry_number: e.target.value })}
                            />
                        ) : <div className="h-[76px] w-full" />}
                    </div>
                    <div className="md:col-span-2">
                        <AdminButton loading={loading}>
                            <UserPlus size={20} /> Add
                        </AdminButton>
                    </div>
                </form>

                {message && (
                    <div className="mt-6 p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--primary))] text-sm font-bold flex items-center gap-2">
                        <Check size={18} /> {message}
                    </div>
                )}
            </AdminCard>

            {/* USER TABLE CARD */}
            <AdminCard className="overflow-hidden p-0">
                <div className="p-6 border-b border-[rgb(var(--border))] flex flex-col md:flex-row justify-between items-center gap-4 bg-[rgb(var(--bg))]/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[rgb(var(--primary))]/10 rounded-lg text-[rgb(var(--primary))]">
                            <Users size={20} />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">User Directory</h2>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="w-40">
                            <AdminSelect
                                icon={Filter}
                                options={[
                                    { label: 'All Roles', value: 'all' },
                                    { label: 'Students', value: 'student' },
                                    { label: 'Professors', value: 'professor' },
                                    { label: 'Admins', value: 'admin' }
                                ]}
                                value={filterRole}
                                onChange={e => setFilterRole(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                        <div className="w-64">
                            <AdminInput
                                icon={Search}
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="py-3 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border-b border-[rgb(var(--border))] font-bold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Entry No.</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-[rgb(var(--muted))] font-medium">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-[rgb(var(--bg))] transition-colors animate-in fade-in duration-200">
                                        <td className="px-6 py-4 font-bold text-[rgb(var(--text))]">{u.email}</td>
                                        <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                                        <td className="px-6 py-4 font-mono text-[rgb(var(--muted))]">{u.entry_number || '-'}</td>
                                        <td className="px-6 py-4 text-[rgb(var(--muted))]">{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            {u.role !== 'admin' && (
                                                <button onClick={() => deleteUser(u.id)} className="p-2 text-[rgb(var(--muted))] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))]/30 flex justify-between items-center">
                        <span className="text-xs font-bold text-[rgb(var(--muted))] uppercase">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border-2 border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:border-[rgb(var(--primary))] disabled:opacity-30 disabled:hover:border-[rgb(var(--border))] transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border-2 border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:border-[rgb(var(--primary))] disabled:opacity-30 disabled:hover:border-[rgb(var(--border))] transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </AdminCard>

            {/* BULK MODAL */}
            {showBulkModal && (
                <BulkGeneratorModal
                    onClose={() => setShowBulkModal(false)}
                    onSubmit={handleBulkSubmit}
                    loading={loading}
                />
            )}
        </div>
    );
}

/* --- HELPER COMPONENTS --- */

const StatCard = ({ label, value, icon: Icon }) => (
    <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div>
            <p className="text-[rgb(var(--muted))] text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold text-[rgb(var(--text))]">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary))]/10 flex items-center justify-center text-[rgb(var(--primary))]">
            <Icon size={24} />
        </div>
    </div>
);

const RoleBadge = ({ role }) => {
    const styles = {
        admin: "bg-red-100 text-red-700 border-red-200",
        professor: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/20",
        student: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border-[rgb(var(--border))]"
    };
    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${styles[role] || styles.student}`}>
            {role}
        </span>
    );
};

/* --- BULK GENERATOR MODAL --- */

const BulkGeneratorModal = ({ onClose, onSubmit, loading }) => {
    const [form, setForm] = useState({ year: new Date().getFullYear(), dept: 'CSB', start: 1100, end: 1110 });
    const [preview, setPreview] = useState([]);
    const [isTestMode, setIsTestMode] = useState(false);
    const [baseEmail, setBaseEmail] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    useEffect(() => {
        const rows = [];
        const start = parseInt(form.start), end = parseInt(form.end);

        if (!isNaN(start) && !isNaN(end) && end >= start) {
            for (let i = 0; i < Math.min(end - start + 1, 50); i++) {
                const id = `${form.year}${form.dept}${start + i}`;
                let email = '';
                if (isTestMode && baseEmail) {
                    const parts = baseEmail.split('@');
                    email = parts.length === 2 ? `${parts[0]}+${id.toLowerCase()}@${parts[1]}` : 'Invalid Email';
                } else {
                    email = `${id.toLowerCase()}@iitrpr.ac.in`;
                }
                rows.push({ id, email });
            }
        }
        setPreview(rows);
    }, [form, isTestMode, baseEmail]);

    const handleSubmit = () => {
        const list = [];
        for (let i = parseInt(form.start); i <= parseInt(form.end); i++) {
            const id = `${form.year}${form.dept}${i}`;
            let email = '';
            if (isTestMode && baseEmail) {
                const parts = baseEmail.split('@');
                email = `${parts[0]}+${id.toLowerCase()}@${parts[1]}`;
            } else {
                email = `${id.toLowerCase()}@iitrpr.ac.in`;
            }
            list.push({ entry_number: id, email });
        }
        onSubmit(list);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <AdminCard className="w-[95%] max-w-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="text-[rgb(var(--primary))]" /> Bulk Generator
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-[rgb(var(--muted))]" /></button>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                    <AdminInput label="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                    <AdminInput label="Dept" value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value.toUpperCase() })} />
                    <AdminInput label="Start" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} />
                    <AdminInput label="End" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} />
                </div>

                <div className={`mb-6 p-4 rounded-xl border-2 transition-colors ${isTestMode ? 'bg-[rgb(var(--primary))]/5 border-[rgb(var(--primary))]/20' : 'bg-[rgb(var(--bg))] border-[rgb(var(--border))]'}`}>
                    <label className="flex items-center gap-3 cursor-pointer select-none mb-3">
                        <input
                            type="checkbox"
                            checked={isTestMode}
                            onChange={e => setIsTestMode(e.target.checked)}
                            className="w-5 h-5 accent-[rgb(var(--primary))]"
                        />
                        <span className={`font-bold text-sm flex items-center gap-2 ${isTestMode ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--text))]'}`}>
                            <FlaskConical size={18} /> Enable Test Mode (Email Aliasing)
                        </span>
                    </label>

                    {isTestMode && (
                        <div className="animate-in slide-in-from-top-2">
                            <AdminInput
                                label="Base Testing Email"
                                placeholder="e.g. admin@gmail.com"
                                value={baseEmail}
                                onChange={e => setBaseEmail(e.target.value)}
                                autoFocus
                            />
                            <p className="text-xs text-[rgb(var(--muted))] mt-2 font-mono">
                                Example output: <span className="text-[rgb(var(--primary))]">{baseEmail.split('@')[0]}+{form.year}{form.dept}{form.start}@{baseEmail.split('@')[1] || '...'}</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="mb-6 rounded-xl bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] overflow-hidden h-48">
                    <div className="p-3 bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))] flex justify-between items-center">
                        <span className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Preview Output</span>
                        <span className="text-xs font-bold text-[rgb(var(--primary))]">{preview.length} Users</span>
                    </div>
                    <div className="overflow-y-auto h-full p-2 pb-12 space-y-1">
                        {preview.map((p, i) => (
                            <div key={i} className="flex text-xs font-mono p-1 hover:bg-[rgb(var(--surface))] rounded">
                                <span className="w-32 font-bold text-[rgb(var(--text))]">{p.id}</span>
                                <span className="text-[rgb(var(--muted))]">{p.email}</span>
                            </div>
                        ))}
                        {preview.length === 0 && <div className="p-8 text-center text-[rgb(var(--muted))] text-sm">Invalid range configuration.</div>}
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[rgb(var(--border))]">
                    <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
                    <AdminButton
                        loading={loading}
                        onClick={handleSubmit}
                        disabled={preview.length === 0 || (isTestMode && !baseEmail.includes('@'))}
                    >
                        Generate & Add Users
                    </AdminButton>
                </div>
            </AdminCard>
        </div>,
        document.body
    );
};
