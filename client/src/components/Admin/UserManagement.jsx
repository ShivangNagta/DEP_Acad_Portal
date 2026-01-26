import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // Import Portal
import {
    UserPlus, Trash2, Users, Layers, X,
    FlaskConical, Loader2, Check, Search,
    Mail, Hash, GraduationCap, ChevronDown,
    ChevronLeft, ChevronRight, Filter, Download, Upload
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
    const [departments, setDepartments] = useState([]);
    const [stats, setStats] = useState({ total: 0, professors: 0, students: 0 });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [newUser, setNewUser] = useState({ email: '', role: 'student', entry_number: '', name: '', batch: '', department_id: '' });
    const [showBulkModal, setShowBulkModal] = useState(false);

    const token = () => localStorage.getItem('access_token');

    useEffect(() => {
        fetchUsers();
        fetchStats();
        fetchDepartments();
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

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_BASE}/departments`, { headers: { Authorization: `Bearer ${token()}` } });
            if (res.ok) setDepartments(await res.json());
        } catch { console.error('Failed to fetch departments'); }
    };

    const addUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({...newUser, department_id: newUser.department_id || null, batch: newUser.role === 'professor' ? null : newUser.batch})
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage('User added successfully.');
            setNewUser({ email: '', role: 'student', entry_number: '', name: '', batch: '', department_id: '' });
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
            (u.entry_number && u.entry_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
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

                <form onSubmit={addUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3">
                            <AdminInput
                                icon={Mail}
                                label="Email Address"
                                placeholder="user@iitrpr.ac.in"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <AdminInput
                                icon={Users}
                                label="Full Name"
                                placeholder="John Doe"
                                value={newUser.name}
                                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <AdminSelect
                                icon={GraduationCap}
                                label="Role"
                                options={[{ label: 'Student', value: 'student' }, { label: 'Professor', value: 'professor' }]}
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <AdminSelect
                                label="Department"
                                options={[{ label: 'Select...', value: '' }, ...departments.map(d => ({ label: `${d.name} (${d.code})`, value: d.id }))]}
                                value={newUser.department_id}
                                onChange={e => setNewUser({ ...newUser, department_id: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <AdminButton loading={loading} type="submit">
                                <UserPlus size={20} /> Add User
                            </AdminButton>
                        </div>
                    </div>

                    {newUser.role === 'student' && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-[rgb(var(--border))]">
                            <div className="md:col-span-3">
                                <AdminInput
                                    icon={Hash}
                                    label="Entry Number"
                                    placeholder="2026CSB001"
                                    value={newUser.entry_number}
                                    onChange={e => setNewUser({ ...newUser, entry_number: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <AdminInput
                                    label="Batch Year"
                                    type="number"
                                    placeholder="2026"
                                    min="2000"
                                    max={new Date().getFullYear()}
                                    value={newUser.batch}
                                    onChange={e => setNewUser({ ...newUser, batch: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-6"></div>
                        </div>
                    )}
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
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Entry No.</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-[rgb(var(--muted))] font-medium">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-[rgb(var(--bg))] transition-colors animate-in fade-in duration-200">
                                        <td className="px-6 py-4 font-bold text-[rgb(var(--text))]">{u.email}</td>
                                        <td className="px-6 py-4 text-[rgb(var(--text))]">{u.name || '-'}</td>
                                        <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                                        <td className="px-6 py-4 text-[rgb(var(--muted))]">{u.departments?.name ? `${u.departments.name} (${u.departments.code})` : '-'}</td>
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

/* --- BULK UPLOAD MODAL --- */

const BulkGeneratorModal = ({ onClose, onSubmit, loading }) => {
    const [step, setStep] = useState('upload');
    const [parsedData, setParsedData] = useState([]);
    const [departments, setDepartments] = useState([]);
    const fileInputRef = useRef(null);
    const token = () => localStorage.getItem('access_token');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await fetch(`${API_BASE}/departments`, { headers: { Authorization: `Bearer ${token()}` } });
                if (res.ok) setDepartments(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchDepts();
    }, []);

    const downloadTemplate = () => {
        const deptMapping = departments.map(d => `${d.id}=${d.name} (${d.code})`).join(', ');
        const headers = ['email', 'entry_number', 'name', 'role', 'batch', 'department_id'];
        const sampleRows = [
            ['student1@iitrpr.ac.in', '2026CSB001', 'John Doe', 'student', '2026', departments[0]?.id || ''],
            ['professor1@iitrpr.ac.in', '', 'Dr. Jane Smith', 'professor', '', departments[0]?.id || ''],
            ['student2@iitrpr.ac.in', '2026CSB002', 'Alice Johnson', 'student', '2026', departments[0]?.id || ''],
        ];
        const csvContent = [
            headers.join(','),
            `# Department ID Mapping: ${deptMapping || 'See admin dashboard for IDs'}`,
            ...sampleRows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'users-bulk-template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = event.target.result.split(/\r\n|\n/).filter(line => line.trim() && !line.startsWith('#'));
            const rows = lines.slice(1).map((line, i) => {
                const [email, entry_number, name, role, batch, department_id] = line.split(',');
                return {
                    email: email?.trim(),
                    entry_number: entry_number?.trim() || null,
                    name: name?.trim(),
                    role: role?.trim(),
                    batch: batch?.trim() || null,
                    department_id: department_id?.trim() || null,
                    id: i
                };
            }).filter(r => r.email && r.role && ['student', 'professor'].includes(r.role));
            setParsedData(rows);
            setStep('preview');
        };
        reader.readAsText(file);
    };

    const handleSubmit = () => {
        onSubmit(parsedData);
    };

    const getDeptName = (id) => {
        const dept = departments.find(d => d.id === id);
        return dept ? `${dept.name} (${dept.code})` : id;
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <AdminCard className="w-[95%] max-w-4xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="text-[rgb(var(--primary))]" /> Bulk User Registration
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-[rgb(var(--muted))]" /></button>
                </div>

                {/* Department Reference */}
                {step === 'upload' && (
                    <div className="mb-6 p-4 rounded-xl bg-[rgb(var(--primary))]/5 border border-[rgb(var(--primary))]/20">
                        <h3 className="font-bold text-sm text-[rgb(var(--primary))] mb-3">Department ID Mapping:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {departments.length === 0 ? (
                                <span className="text-xs text-[rgb(var(--muted))]">No departments available</span>
                            ) : (
                                departments.map(d => (
                                    <div key={d.id} className="text-xs text-[rgb(var(--text))] font-mono bg-[rgb(var(--bg))] p-2 rounded">
                                        <span className="font-bold text-[rgb(var(--primary))]">{d.id}</span> = {d.name} ({d.code})
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {step === 'upload' ? (
                    <div className="space-y-4">
                        <AdminButton onClick={downloadTemplate} variant="secondary" className="w-full">
                            <Download size={20} /> Download CSV Template
                        </AdminButton>

                        <div
                            className="p-12 text-center border-2 border-dashed border-[rgb(var(--border))] rounded-2xl cursor-pointer hover:bg-[rgb(var(--bg))] transition-colors group"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className="w-12 h-12 bg-[rgb(var(--bg))] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[rgb(var(--primary))]/10 transition-colors">
                                <Upload className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--primary))]" />
                            </div>
                            <p className="font-bold text-[rgb(var(--text))]">Click to Upload CSV</p>
                            <p className="text-xs text-[rgb(var(--muted))] mt-1">Required columns: email, entry_number, name, role, batch, department_id</p>
                            <input type="file" hidden ref={fileInputRef} accept=".csv" onChange={handleFileUpload} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-[rgb(var(--primary))]/10 p-3 rounded-lg text-xs text-[rgb(var(--primary))] font-bold text-center border border-[rgb(var(--primary))]/20">
                            Previewing {parsedData.length} users for bulk registration
                        </div>

                        <div className="max-h-96 overflow-x-auto border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg))]">
                            <table className="w-full text-xs">
                                <thead className="bg-[rgb(var(--surface))] sticky top-0 border-b border-[rgb(var(--border))]">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-bold text-[rgb(var(--muted))]">Email</th>
                                        <th className="px-4 py-2 text-left font-bold text-[rgb(var(--muted))]">Name</th>
                                        <th className="px-4 py-2 text-left font-bold text-[rgb(var(--muted))]">Role</th>
                                        <th className="px-4 py-2 text-left font-bold text-[rgb(var(--muted))]">Entry No.</th>
                                        <th className="px-4 py-2 text-left font-bold text-[rgb(var(--muted))]">Batch</th>
                                        <th className="px-4 py-2 text-left font-bold text-[rgb(var(--muted))]">Department</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgb(var(--border))]">
                                    {parsedData.map((row, i) => (
                                        <tr key={i} className="hover:bg-[rgb(var(--surface))]">
                                            <td className="px-4 py-2 text-[rgb(var(--text))]">{row.email}</td>
                                            <td className="px-4 py-2 text-[rgb(var(--text))]">{row.name || '-'}</td>
                                            <td className="px-4 py-2"><span className={`text-xs font-bold px-2 py-1 rounded ${row.role === 'professor' ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]' : 'bg-[rgb(var(--bg))] text-[rgb(var(--muted))]'}`}>{row.role}</span></td>
                                            <td className="px-4 py-2 font-mono text-[rgb(var(--muted))]">{row.entry_number || '-'}</td>
                                            <td className="px-4 py-2 text-[rgb(var(--muted))]">{row.batch || '-'}</td>
                                            <td className="px-4 py-2 text-[rgb(var(--muted))] text-xs">{row.department_id ? getDeptName(row.department_id) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-[rgb(var(--border))]">
                            <AdminButton variant="secondary" onClick={() => setStep('upload')}>Back</AdminButton>
                            <AdminButton
                                loading={loading}
                                onClick={handleSubmit}
                                disabled={parsedData.length === 0}
                            >
                                Import {parsedData.length} Users
                            </AdminButton>
                        </div>
                    </div>
                )}
            </AdminCard>
        </div>,
        document.body
    );
};
