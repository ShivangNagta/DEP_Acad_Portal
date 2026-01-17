import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';

export default function CourseFilters({ courses, onFilterChange, showStatusFilter = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        department: '',
        session: '',
        credits: '',
        status: ''
    });

    const options = useMemo(() => {
        const depts = new Set();
        const sessions = new Set();
        const credits = new Set();

        courses.forEach(c => {
            if (c.department) depts.add(c.department);
            if (c.academic_session) sessions.add(c.academic_session);
            if (c.credits) credits.add(c.credits);
        });

        return {
            departments: Array.from(depts).sort(),
            sessions: Array.from(sessions).sort(),
            credits: Array.from(credits).sort((a, b) => a - b)
        };
    }, [courses]);

    useEffect(() => {
        const filtered = courses.filter(course => {
            // Text Search (Title, Code, Instructor)
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
                course.title.toLowerCase().includes(searchLower) ||
                course.course_code.toLowerCase().includes(searchLower) ||
                (course.instructor?.email || '').toLowerCase().includes(searchLower);

            const matchesDept = filters.department ? course.department === filters.department : true;
            const matchesSession = filters.session ? course.academic_session === filters.session : true;
            const matchesCredits = filters.credits ? course.credits.toString() === filters.credits : true;

            const matchesStatus = filters.status
                ? (course.enrollment_status || 'not_enrolled') === filters.status
                : true;

            return matchesSearch && matchesDept && matchesSession && matchesCredits && matchesStatus;
        });

        onFilterChange(filtered);
    }, [filters, courses]);

    const handleChange = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

    const clearFilters = () => {
        setFilters({ search: '', department: '', session: '', credits: '', status: '' });
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm mb-6 space-y-4">
            {/* Search + Toggle */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Title, Code, or Instructor..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                        value={filters.search}
                        onChange={e => handleChange('search', e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-medium transition-all ${isOpen ? 'bg-primarySoft/20 border-primary text-primary' : 'bg-bg border-border text-muted hover:text-text'}`}
                >
                    <SlidersHorizontal size={18} /> Filters
                </button>
            </div>

            {/* Collapsible Advanced Filters */}
            {isOpen && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 animate-in slide-in-from-top-2">
                    <Select
                        label="Department"
                        value={filters.department}
                        onChange={e => handleChange('department', e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>

                    <Select
                        label="Session"
                        value={filters.session}
                        onChange={e => handleChange('session', e.target.value)}
                    >
                        <option value="">All Sessions</option>
                        {options.sessions.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>

                    <Select
                        label="Credits"
                        value={filters.credits}
                        onChange={e => handleChange('credits', e.target.value)}
                    >
                        <option value="">Any Credits</option>
                        {options.credits.map(c => <option key={c} value={c}>{c} Credits</option>)}
                    </Select>

                    {showStatusFilter && (
                        <Select
                            label="My Status"
                            value={filters.status}
                            onChange={e => handleChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="not_enrolled">Not Enrolled</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Enrolled</option>
                            <option value="completed">Completed</option>
                        </Select>
                    )}
                </div>
            )}

            {/* Active Filters Badges */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Active:</span>
                    {Object.entries(filters).map(([key, val]) => {
                        if (!val) return null;
                        return (
                            <span key={key} className="text-xs bg-primarySoft/20 text-primary px-2 py-1 rounded-md flex items-center gap-1 border border-primarySoft/30">
                                {key === 'search' ? `"${val}"` : val}
                                <button onClick={() => handleChange(key, '')} className="hover:text-red-500"><X size={12} /></button>
                            </span>
                        );
                    })}
                    <button onClick={clearFilters} className="text-xs text-muted hover:text-primary underline ml-auto">Clear All</button>
                </div>
            )}
        </div>
    );
}

const Select = ({ label, children, ...props }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">{label}</label>
        <div className="relative">
            <select {...props} className="w-full px-3 py-2 rounded-lg bg-bg border border-border focus:border-primary outline-none text-sm appearance-none cursor-pointer">
                {children}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none opacity-50" />
        </div>
    </div>
);
