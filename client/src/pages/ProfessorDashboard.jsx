import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../components/DashboardLayout';
import {
    BookOpen, Users, Upload, FileText, Plus, X,
    AlertCircle, CheckCircle2, Loader2, Check,
    Ban, Search, Globe, Archive, Clock, MoreHorizontal,
    ChevronDown, ArrowRight, LayoutDashboard, FolderClock
} from 'lucide-react';

import { API_BASE_URL } from '../config/api';
const API_BASE = `${API_BASE_URL}/api`;
const CURRENT_SESSION = '2025-2026';

/* --- UI COMPONENTS --- */

const PortalCard = ({ children, className = "" }) => (
    <div className={`
        w-full bg-[rgb(var(--surface))] 
        border border-[rgb(var(--border))] 
        rounded-2xl p-6 shadow-xl 
        ${className}
    `}>
        {children}
    </div>
);

const PortalButton = ({ children, loading, onClick, variant = 'primary', disabled, className = "" }) => {
    const base = "cursor-pointer w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-md hover:shadow-lg hover:brightness-110",
        secondary: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border-2 border-[rgb(var(--border))] hover:border-[rgb(var(--text))] hover:text-[rgb(var(--text))]",
        danger: "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100",
        ghost: "bg-transparent text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--text))]"
    };
    return (
        <button onClick={onClick} disabled={loading || disabled} className={`${base} ${variants[variant]} ${className}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : children}
        </button>
    );
};

const PortalInput = ({ icon: Icon, className = "", ...props }) => (
    <div className="relative group w-full">
        {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] group-focus-within:text-[rgb(var(--primary))] transition-colors">
                <Icon size={16} />
            </div>
        )}
        <input
            {...props}
            className={`
                w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 rounded-xl
                bg-[rgb(var(--bg))] 
                border-2 border-[rgb(var(--border))] 
                text-[rgb(var(--text))] text-sm font-medium
                placeholder:text-[rgb(var(--muted))]/50
                outline-none 
                focus:border-[rgb(var(--primary))] 
                focus:ring-4 focus:ring-[rgb(var(--primary))]/10 
                transition-all duration-200
                ${className}
            `}
        />
    </div>
);

const PortalBadge = ({ children, variant = 'neutral' }) => {
    const styles = {
        active: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/20",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        archived: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border-[rgb(var(--border))]",
        neutral: "bg-[rgb(var(--bg))] text-[rgb(var(--text))] border-[rgb(var(--border))]"
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-wide ${styles[variant] || styles.neutral}`}>
            {children}
        </span>
    );
};

/* --- MAIN DASHBOARD --- */

export default function ProfessorDashboard() {
    // View State
    const [viewMode, setViewMode] = useState('manage');
    const [sidebarTab, setSidebarTab] = useState('active');

    // Data State
    const [myCourses, setMyCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);

    // Management State
    const [activeTab, setActiveTab] = useState('enrollments');
    const [enrollments, setEnrollments] = useState([]);
    const [grades, setGrades] = useState([]);

    // UI State
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });
    const [sidebarSearch, setSidebarSearch] = useState('');

    const token = localStorage.getItem('access_token');

    useEffect(() => {
        fetchMyCourses();
    }, []);

    useEffect(() => {
        if (!selectedCourse) return;
        setViewMode('manage');
        fetchEnrollments();
        fetchGrades();
    }, [selectedCourse]);

    const fetchMyCourses = async () => {
        try {
            const res = await fetch(`${API_BASE}/courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyCourses(data);
                if (!selectedCourse && data.length > 0) {
                    const active = data.find(c => c.academic_session === CURRENT_SESSION);
                    setSelectedCourse(active || data[0]);
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchAllCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/courses?view=all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setAllCourses(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchEnrollments = async () => {
        try {
            const res = await fetch(`${API_BASE}/enrollments?course_id=${selectedCourse.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEnrollments(data.filter(e => e.course_id === selectedCourse.id));
            }
        } catch (e) { console.error(e); }
    };

    const fetchGrades = async () => {
        try {
            const res = await fetch(`${API_BASE}/grades?course_id=${selectedCourse.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGrades(data.filter(g => g.course_id === selectedCourse.id));
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateCourse = async (courseData) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(courseData)
            });
            if (!res.ok) throw new Error('Failed');
            showMsg('success', 'Course proposed successfully.');
            setShowCourseModal(false);
            fetchMyCourses();
        } catch (e) { showMsg('error', 'Failed to create course'); }
        finally { setLoading(false); }
    };

    const handleBulkGradeUpload = async (parsedRows) => {
        setLoading(true);
        let successCount = 0;
        let failCount = 0;
        const entryToIdMap = {};

        enrollments.forEach(e => {
            if (e.student?.entry_number) entryToIdMap[e.student.entry_number.trim().toUpperCase()] = e.student_id;
        });

        try {
            await Promise.all(parsedRows.map(async row => {
                const entryNum = row.entry_number?.trim().toUpperCase();
                const studentId = entryToIdMap[entryNum];
                const marks = parseFloat(row.marks);

                if (!studentId || isNaN(marks)) { failCount++; return; }

                try {
                    const res = await fetch(`${API_BASE}/grades`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            course_id: selectedCourse.id,
                            student_id: studentId,
                            marks,
                            semester: 1
                        })
                    });
                    if (res.ok) successCount++; else failCount++;
                } catch (e) { failCount++; }
            }));

            showMsg('success', `Updated ${successCount} grades. ${failCount > 0 ? `${failCount} failed.` : ''}`);
            setShowUploadModal(false);
            fetchGrades();
        } catch (e) { showMsg('error', 'Upload process failed'); }
        finally { setLoading(false); }
    };

    const showMsg = (type, text) => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
    };

    const getStartYear = (session) => {
        if (!session) return 0;
        return parseInt(session.split('-')[0]) || 0;
    };

    const currentStartYear = getStartYear(CURRENT_SESSION);

    // Active
    const activeCourses = myCourses.filter(c => {
        const courseStartYear = getStartYear(c.academic_session);
        return (courseStartYear >= currentStartYear) && c.title.toLowerCase().includes(sidebarSearch.toLowerCase());
    });

    // Archived
    const pastCourses = myCourses.filter(c => {
        const courseStartYear = getStartYear(c.academic_session);
        return (courseStartYear < currentStartYear) && c.title.toLowerCase().includes(sidebarSearch.toLowerCase());
    });

    const displayCourses = sidebarTab === 'active' ? activeCourses : pastCourses;

    return (
        <DashboardLayout
            title="Professor Dashboard"
            sidebar={
                <div className="flex flex-col h-full">

                    {/* Navigation Section */}
                    <div className="p-5 pb-2">
                        <div className="mb-2 text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-widest opacity-70">
                            Navigation
                        </div>
                        <SidebarItem
                            active={viewMode === 'directory'}
                            onClick={() => {
                                setViewMode('directory');
                                setSelectedCourse(null);
                                fetchAllCourses();
                            }}
                        >
                            <Globe size={18} /> Institute Directory
                        </SidebarItem>
                    </div>

                    <div className="h-px bg-[rgb(var(--border))] mx-5 my-2 opacity-50" />

                    {/* Courses Section */}
                    <div className="flex flex-col flex-1 min-h-0 p-5 pt-2">
                        <div className="mb-4">
                            <div className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-widest opacity-70 mb-3">
                                My Courses
                            </div>

                            {/* Segmented Control for Tabs */}
                            <div className="flex p-1 bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] rounded-xl mb-3">
                                <button
                                    onClick={() => setSidebarTab('active')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'active' ? 'bg-[rgb(var(--surface))] shadow-sm text-[rgb(var(--primary))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setSidebarTab('archived')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'archived' ? 'bg-[rgb(var(--surface))] shadow-sm text-[rgb(var(--primary))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'}`}
                                >
                                    Archived
                                </button>
                            </div>

                            {/* Search */}
                            <PortalInput
                                icon={Search}
                                placeholder="Filter list..."
                                value={sidebarSearch}
                                onChange={e => setSidebarSearch(e.target.value)}
                                className="!py-2 !text-xs"
                            />
                        </div>

                        {/* Scrollable Course List */}
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-2">
                            {displayCourses.length === 0 ? (
                                <p className="text-xs text-[rgb(var(--muted))] italic text-center py-4">No {sidebarTab} courses.</p>
                            ) : (
                                displayCourses.map(c => (
                                    <SidebarItem
                                        key={c.id}
                                        active={selectedCourse?.id === c.id && viewMode === 'manage'}
                                        onClick={() => setSelectedCourse(c)}
                                    >
                                        <BookOpen size={18} />
                                        <span className="truncate flex-1">{c.title}</span>
                                        {c.status === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-400" title="Pending Approval" />}
                                    </SidebarItem>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-5 border-t border-[rgb(var(--border))]">
                        <PortalButton onClick={() => setShowCourseModal(true)} variant="secondary" className="w-full">
                            <Plus size={16} /> New Course Proposal
                        </PortalButton>
                    </div>
                </div>
            }
        >
            {feedback.text && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-fade-in-up font-bold text-sm ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-[rgb(var(--surface))] border-[rgb(var(--primary))] text-[rgb(var(--primary))]'}`}>
                    {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    {feedback.text}
                </div>
            )}

            {viewMode === 'directory' ? (
                <DirectoryView courses={allCourses} loading={loading} />
            ) : !selectedCourse ? (
                <EmptyState onAdd={() => setShowCourseModal(true)} />
            ) : (
                <div className="space-y-6 animate-fade-in-up pb-12">
                    <PortalCard className="flex flex-col md:flex-row justify-between items-end gap-4 bg-[rgb(var(--surface))]">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-[rgb(var(--text))]">{selectedCourse.title}</h1>
                                {selectedCourse.status === 'pending' && <PortalBadge variant="pending">Pending Approval</PortalBadge>}
                            </div>
                            <div className="flex gap-4 text-sm text-[rgb(var(--muted))] mt-2 items-center">
                                <span className="font-mono bg-[rgb(var(--bg))] px-2 py-0.5 rounded border border-[rgb(var(--border))] text-xs font-bold">{selectedCourse.course_code}</span>
                                <span className="font-bold tracking-wide text-xs uppercase">{selectedCourse.department}</span>
                                <span className="w-1 h-1 rounded-full bg-[rgb(var(--border))]"></span>
                                <span className="text-[rgb(var(--primary))] font-bold">{selectedCourse.academic_session || 'No Session'}</span>
                            </div>
                        </div>
                        <div className="flex bg-[rgb(var(--bg))] p-1 rounded-xl border border-[rgb(var(--border))]">
                            <TabButton active={activeTab === 'enrollments'} onClick={() => setActiveTab('enrollments')} icon={Users}>Enrollments</TabButton>
                            <TabButton active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} icon={FileText}>Grades</TabButton>
                        </div>
                    </PortalCard>

                    {activeTab === 'enrollments' ? (
                        <EnrollmentManager enrollments={enrollments} token={token} onUpdate={fetchEnrollments} />
                    ) : (
                        <GradeManager
                            grades={grades}
                            enrollments={enrollments}
                            onUpload={() => setShowUploadModal(true)}
                            courseId={selectedCourse.id}
                            token={token}
                            semester={1}
                        />
                    )}
                </div>
            )}

            {showCourseModal && <CourseModal onClose={() => setShowCourseModal(false)} onSubmit={handleCreateCourse} loading={loading} />}
            {showUploadModal && <CSVUploadModal onClose={() => setShowUploadModal(false)} onSubmit={handleBulkGradeUpload} loading={loading} />}
        </DashboardLayout>
    );
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS
/* -------------------------------------------------------------------------- */

const DirectoryView = ({ courses, loading }) => {
    const [filter, setFilter] = useState('');
    const filtered = courses.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()) || c.department.toLowerCase().includes(filter.toLowerCase()));

    if (loading) return <div className="p-10 text-center text-[rgb(var(--muted))]"><Loader2 className="animate-spin mx-auto mb-2" /> Loading Directory...</div>;

    return (
        <PortalCard className="min-h-[500px]">
            <div className="flex justify-between items-end border-b border-[rgb(var(--border))] pb-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--text))] flex items-center gap-2">
                        <Globe className="text-[rgb(var(--primary))]" size={24} /> Course Directory
                    </h1>
                    <p className="text-[rgb(var(--muted))] text-sm mt-1">Viewing all courses across the institute.</p>
                </div>
                <div className="w-64">
                    <PortalInput
                        icon={Search}
                        placeholder="Search directory..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
                <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] font-bold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Instructor</th>
                            <th className="px-6 py-4">Session</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                        {filtered.map(c => (
                            <tr key={c.id} className="hover:bg-[rgb(var(--bg))] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-[rgb(var(--text))]">{c.title}</div>
                                    <div className="text-xs text-[rgb(var(--muted))] font-mono mt-0.5">{c.course_code} • {c.credits} Credits</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-xs uppercase">{c.department}</td>
                                <td className="px-6 py-4 text-[rgb(var(--muted))] text-xs font-mono">{c.instructor?.email}</td>
                                <td className="px-6 py-4"><PortalBadge variant="neutral">{c.academic_session || 'N/A'}</PortalBadge></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="p-12 text-center text-[rgb(var(--muted))]">No courses found matching "{filter}"</div>}
            </div>
        </PortalCard>
    );
};

const GradeManager = ({ grades, enrollments, onUpload, courseId, token }) => {
    const updateSingle = async (student_id, marks) => {
        try {
            await fetch(`${API_BASE}/grades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    course_id: courseId,
                    student_id,
                    marks: parseInt(marks),
                    semester: 1
                })
            });
        } catch (e) { console.error(e); }
    };

    const validStudents = enrollments.filter(e => e.status === 'approved' || e.status === 'completed');

    const tableData = validStudents.map(e => {
        const grade = grades.find(g => g.student_id === e.student_id);
        return {
            student_id: e.student_id,
            entry_number: e.student?.entry_number,
            email: e.student?.email,
            marks: grade ? grade.marks : ''
        };
    });

    return (
        <PortalCard>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-[rgb(var(--text))]">Grade Sheet</h3>
                    <p className="text-sm text-[rgb(var(--muted))]">Enter marks (0-100). Changes save automatically.</p>
                </div>
                <div className="w-auto">
                    <PortalButton onClick={onUpload} variant="secondary">
                        <Upload size={16} /> Import CSV
                    </PortalButton>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
                <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] font-bold border-b border-[rgb(var(--border))] text-left uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Entry Number</th>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4 text-center">Marks</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                        {tableData.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-[rgb(var(--muted))]">No approved students enrolled yet.</td></tr>
                        ) : tableData.map(row => (
                            <tr key={row.student_id} className="hover:bg-[rgb(var(--bg))] transition-colors">
                                <td className="px-6 py-3 font-mono text-[rgb(var(--text))] font-bold">{row.entry_number || '—'}</td>
                                <td className="px-6 py-3 text-[rgb(var(--muted))]">{row.email}</td>
                                <td className="px-6 py-3 text-center">
                                    <input
                                        type="number" min="0" max="100"
                                        defaultValue={row.marks}
                                        onBlur={(e) => updateSingle(row.student_id, e.target.value)}
                                        className="w-20 px-2 py-1.5 bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] rounded-lg focus:border-[rgb(var(--primary))] outline-none text-center font-mono font-bold transition-all focus:ring-4 focus:ring-[rgb(var(--primary))]/10"
                                        placeholder="-"
                                    />
                                </td>
                                <td className="px-6 py-3 text-right text-xs">
                                    {row.marks !== '' ?
                                        <span className="text-green-600 font-bold flex items-center justify-end gap-1"><Check size={12} /> Saved</span> :
                                        <span className="text-[rgb(var(--muted))]/50">Empty</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PortalCard>
    );
};

const EnrollmentManager = ({ enrollments, onUpdate, token }) => {
    const [selected, setSelected] = useState(new Set());
    const [processing, setProcessing] = useState(false);

    const pendingStudents = enrollments.filter(e => e.status === 'pending');

    const handleBulk = async (status) => {
        if (selected.size === 0) return;
        setProcessing(true);
        try {
            const updatePromises = [...selected].map(id =>
                fetch(`${API_BASE}/enrollments/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status })
                })
            );
            await Promise.all(updatePromises);
            setSelected(new Set());
            onUpdate();
        } catch (error) { alert("Failed."); }
        finally { setProcessing(false); }
    };

    const toggleSelect = (id) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const toggleAll = () => {
        if (selected.size === pendingStudents.length) setSelected(new Set());
        else setSelected(new Set(pendingStudents.map(e => e.id)));
    };

    return (
        <PortalCard>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[rgb(var(--text))]">Enrollment Requests</h3>

                <div className="flex gap-2">
                    <PortalButton
                        onClick={() => handleBulk('approved')}
                        disabled={selected.size === 0 || processing}
                        className="!w-auto !py-2 !px-4"
                    >
                        <Check size={16} /> Approve ({selected.size})
                    </PortalButton>

                    <PortalButton
                        onClick={() => handleBulk('rejected')}
                        disabled={selected.size === 0 || processing}
                        variant="danger"
                        className="!w-auto !py-2 !px-4"
                    >
                        <Ban size={16} /> Reject
                    </PortalButton>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
                <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] font-bold text-xs uppercase tracking-wider border-b border-[rgb(var(--border))]">
                        <tr>
                            <th className="px-4 py-4 w-10 text-center">
                                <input
                                    type="checkbox"
                                    onChange={toggleAll}
                                    checked={pendingStudents.length > 0 && selected.size === pendingStudents.length}
                                    disabled={pendingStudents.length === 0}
                                    className="cursor-pointer accent-[rgb(var(--primary))] w-4 h-4"
                                />
                            </th>
                            <th className="px-4 py-4 text-left">Entry Number</th>
                            <th className="px-4 py-4 text-left">Student Email</th>
                            <th className="px-4 py-4 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                        {enrollments.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-[rgb(var(--muted))]">No enrollments yet.</td></tr> : enrollments.map(e => (
                            <tr key={e.id} className={`transition-colors ${selected.has(e.id) ? 'bg-[rgb(var(--primary))]/5' : 'hover:bg-[rgb(var(--bg))]'}`}>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(e.id)}
                                        onChange={() => toggleSelect(e.id)}
                                        disabled={e.status !== 'pending'}
                                        className={`cursor-pointer accent-[rgb(var(--primary))] w-4 h-4 ${e.status !== 'pending' ? 'opacity-20 cursor-not-allowed' : ''}`}
                                    />
                                </td>
                                <td className="px-4 py-3 font-mono text-xs font-bold text-[rgb(var(--text))]">{e.student?.entry_number}</td>
                                <td className="px-4 py-3 font-medium text-[rgb(var(--muted))]">{e.student?.email}</td>
                                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PortalCard>
    );
};

/* --- MODAL COMPONENTS --- */

const CourseModal = ({ onClose, onSubmit, loading }) => {
    const getSessionOptions = () => {
        const currentYear = new Date().getFullYear();
        const options = [];
        for (let i = -1; i < 3; i++) {
            const start = currentYear + i;
            options.push(`${start}-${start + 1}`);
        }
        return options;
    };

    const sessions = getSessionOptions();
    const [form, setForm] = useState({ title: '', course_code: '', department: '', credits: 3, academic_session: sessions[1] });

    return (
        <Modal onClose={onClose} title="Propose New Course">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Title</label>
                        <PortalInput required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Adv Algorithms" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Session</label>
                        <div className="relative">
                            <select
                                className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text))] text-sm font-medium outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer"
                                value={form.academic_session}
                                onChange={e => setForm({ ...form, academic_session: e.target.value })}
                            >
                                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Code</label>
                        <PortalInput required value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} placeholder="CS101" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Dept</label>
                        <PortalInput className="uppercase" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="CSE" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Credits</label>
                        <PortalInput type="number" required min="1" max="10" value={form.credits} onChange={e => setForm({ ...form, credits: +e.target.value })} />
                    </div>
                </div>

                <div className="pt-2">
                    <PortalButton loading={loading}>Submit Proposal</PortalButton>
                </div>
            </form>
        </Modal>
    );
};

const CSVUploadModal = ({ onClose, onSubmit, loading }) => {
    const [step, setStep] = useState('upload');
    const [parsedData, setParsedData] = useState([]);
    const fileInputRef = useRef(null);
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = event.target.result.split(/\r\n|\n/).filter(line => line.trim() !== '');
            const rows = lines.slice(1).map((line, i) => {
                const [entry, marks] = line.split(',');
                return { entry_number: entry?.trim(), marks: marks?.trim(), id: i };
            }).filter(r => r.entry_number);
            setParsedData(rows);
            setStep('preview');
        };
        reader.readAsText(file);
    };

    return (
        <Modal onClose={onClose} title="Import Grades">
            {step === 'upload' ? (
                <div className="p-12 text-center border-2 border-dashed border-[rgb(var(--border))] rounded-2xl cursor-pointer hover:bg-[rgb(var(--bg))] transition-colors group" onClick={() => fileInputRef.current.click()}>
                    <div className="w-12 h-12 bg-[rgb(var(--bg))] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[rgb(var(--primary))]/10 transition-colors">
                        <Upload className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--primary))]" />
                    </div>
                    <p className="font-bold text-[rgb(var(--text))]">Click to Upload CSV</p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-1">Required headers: entry_number, marks</p>
                    <input type="file" hidden ref={fileInputRef} accept=".csv" onChange={handleFile} />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-[rgb(var(--primary))]/10 p-3 rounded-lg text-xs text-[rgb(var(--primary))] font-bold text-center border border-[rgb(var(--primary))]/20">
                        Previewing {parsedData.length} records
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--bg))]">
                        {parsedData.map(r => (
                            <div key={r.id} className="flex justify-between p-3 border-b border-[rgb(var(--border))] text-sm last:border-0 hover:bg-[rgb(var(--surface))]">
                                <span className="font-mono text-[rgb(var(--text))]">{r.entry_number}</span>
                                <span className="font-bold text-[rgb(var(--primary))]">{r.marks}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <PortalButton variant="secondary" onClick={() => setStep('upload')}>Back</PortalButton>
                        <PortalButton disabled={loading || parsedData.length === 0} onClick={() => onSubmit(parsedData)}>
                            {loading ? 'Uploading...' : 'Confirm Import'}
                        </PortalButton>
                    </div>
                </div>
            )}
        </Modal>
    )
};

const Modal = ({ onClose, title, children }) => {
    return createPortal(
        <div className="fixed inset-0 z-[9999] h-screen w-screen flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <PortalCard className="w-full max-w-lg animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[rgb(var(--text))]">{title}</h2>
                    <button onClick={onClose}><X size={20} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]" /></button>
                </div>
                {children}
            </PortalCard>
        </div>,
        document.body
    );
};

/* --- HELPER COMPONENTS --- */

const SidebarItem = ({ children, active, onClick }) => (
    <div
        onClick={onClick}
        className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-1 text-sm
            ${active
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))] font-bold shadow-md'
                : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--primary))]/10 font-medium'
            }
        `}
    >
        {children}
    </div>
);

const TabButton = ({ active, children, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
            ${active
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-sm'
                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface))]'
            }
        `}
    >
        <Icon size={16} /> {children}
    </button>
);

const StatusBadge = ({ status }) => {
    const styles = {
        approved: "bg-green-100 text-green-700 border-green-200",
        rejected: "bg-red-50 text-red-700 border-red-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        completed: "bg-teal-100 text-teal-800 border-teal-200"
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status] || styles.pending}`}>
            {status}
        </span>
    );
};

const EmptyState = ({ onAdd }) => (
    <PortalCard className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))]/30 shadow-none">
        <div className="w-16 h-16 bg-[rgb(var(--bg))] rounded-full flex items-center justify-center mb-4 border border-[rgb(var(--border))]">
            <BookOpen size={32} className="text-[rgb(var(--muted))]" />
        </div>
        <h3 className="text-xl font-bold text-[rgb(var(--text))]">No Course Selected</h3>
        <p className="text-sm text-[rgb(var(--muted))] mb-8 max-w-xs text-center">Select a course from the sidebar to manage enrollments and grades, or propose a new one.</p>
        <PortalButton onClick={onAdd} className="!w-auto">
            <Plus size={18} /> Propose New Course
        </PortalButton>
    </PortalCard>
);
