import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  GraduationCap, BookOpen, Loader2, CheckCircle2,
  AlertCircle, Clock, FileText, Check, Search, ArrowRight, XCircle
} from 'lucide-react';
import CourseFilters from '../components/CourseFilters';
import { API_BASE_URL } from '../config/api';
const API_BASE = `${API_BASE_URL}/api`;

/* --- UI COMPONENTS --- */

const PortalCard = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`
      w-full bg-[rgb(var(--surface))] 
      border border-[rgb(var(--border))] 
      rounded-2xl p-6 shadow-sm 
      ${onClick ? 'cursor-pointer hover:border-[rgb(var(--primary))]/50 hover:shadow-md transition-all' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

const PortalButton = ({ children, loading, onClick, variant = 'primary', disabled, className = "" }) => {
  const base = "cursor-pointer w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-md hover:shadow-lg hover:brightness-110",
    secondary: "bg-transparent border-2 border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:border-[rgb(var(--primary))]",
    ghost: "bg-transparent text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/10"
  };

  return (
    <button onClick={onClick} disabled={loading || disabled} className={`${base} ${variants[variant]} ${className}`}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : children}
    </button>
  );
};

const PortalBadge = ({ children, variant = 'neutral' }) => {
  const styles = {
    completed: "bg-teal-100 text-teal-800 border-teal-200",

    approved: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/20",

    pending: "bg-amber-100 text-amber-800 border-amber-200",

    rejected: "bg-red-50 text-red-700 border-red-200",

    neutral: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border-[rgb(var(--border))]"
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-wide ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
};

/* --- MAIN COMPONENT --- */

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const token = localStorage.getItem('access_token');

  const coursesWithStatus = useMemo(() => {
    return courses.map(course => {
      const enrollment = enrollments.find(e => e.course_id === course.id);
      const isGraded = grades.some(g => g.course_id === course.id);

      let status = 'not_enrolled';
      if (enrollment) status = enrollment.status;
      if (status === 'approved' && isGraded) status = 'completed';

      return { ...course, enrollment_status: status };
    });
  }, [courses, enrollments, grades]);

  useEffect(() => {
    setFilteredCourses(coursesWithStatus);
  }, [coursesWithStatus]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [coursesRes, enrollRes, gradesRes] = await Promise.all([
          fetch(`${API_BASE}/courses`, { headers }),
          fetch(`${API_BASE}/enrollments`, { headers }),
          fetch(`${API_BASE}/grades?published=true`, { headers })
        ]);

        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (enrollRes.ok) setEnrollments(await enrollRes.json());
        if (gradesRes.ok) setGrades(await gradesRes.json());
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleEnroll = async (courseId) => {
    setActionLoading(courseId);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');

      setEnrollments([...enrollments, { course_id: courseId, status: 'pending', id: Date.now() }]);
      showFeedback('success', 'Enrollment requested successfully!');
    } catch (e) {
      showFeedback('error', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const cgpa = useMemo(() => {
    if (!grades.length) return 'N/A';
    const total = grades.reduce((acc, curr) => acc + curr.marks, 0);
    return ((total / grades.length) / 10).toFixed(2);
  }, [grades]);

  return (
    <DashboardLayout
      title="Student Portal"
      sidebar={
        <div className="flex flex-col h-full p-2">
          <div className="px-4 py-4 text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-widest opacity-70">
            Menu
          </div>
          <div className="space-y-2">
            <SidebarTab
              active={activeTab === 'catalog'}
              onClick={() => setActiveTab('catalog')}
              icon={BookOpen}
              label="Course Catalog"
            />
            <SidebarTab
              active={activeTab === 'academics'}
              onClick={() => setActiveTab('academics')}
              icon={GraduationCap}
              label="My Academics"
            />
          </div>
        </div>
      }
    >
      {message.text && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-fade-in-up font-bold text-sm ${message.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-[rgb(var(--surface))] border-[rgb(var(--primary))] text-[rgb(var(--primary))]'
          }`}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex h-[400px] items-center justify-center text-[rgb(var(--muted))] gap-2">
          <Loader2 className="animate-spin" /> Loading Portal...
        </div>
      ) : (
        <div className="animate-fade-in-up pb-10 max-w-7xl mx-auto">
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-[rgb(var(--border))] pb-6">
                <div>
                  <h1 className="text-3xl font-bold text-[rgb(var(--text))]">Course Catalog</h1>
                  <p className="text-[rgb(var(--muted))] mt-1">Browse and enroll in available courses for this session.</p>
                </div>
              </div>

              {/* FILTER SECTION WRAPPER */}
              <div className="p-1">
                <CourseFilters
                  courses={coursesWithStatus}
                  onFilterChange={setFilteredCourses}
                  showStatusFilter={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-[rgb(var(--muted))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg))]/50">
                    <Search size={48} className="opacity-20 mb-4" />
                    <p className="font-bold">No courses match your filters.</p>
                  </div>
                ) : (
                  filteredCourses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      status={course.enrollment_status === 'not_enrolled' ? null : course.enrollment_status}
                      onEnroll={() => handleEnroll(course.id)}
                      loading={actionLoading === course.id}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'academics' && (
            <div className="space-y-8">
              <div className="border-b border-[rgb(var(--border))] pb-6">
                <h1 className="text-3xl font-bold text-[rgb(var(--text))]">Academic Overview</h1>
                <p className="text-[rgb(var(--muted))] mt-1">Track your progress, grades, and enrollments.</p>
              </div>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Current CGPA" value={cgpa} icon={FileText} />
                <StatCard label="Courses Completed" value={grades.length} icon={CheckCircle2} />
                <StatCard label="Active Enrollments" value={enrollments.filter(e => e.status === 'approved' && !grades.some(g => g.course_id === e.course_id)).length} icon={BookOpen} />
              </section>

              <div className="grid md:grid-cols-2 gap-8">
                {/* ENROLLMENT HISTORY */}
                <PortalCard className="h-full">
                  <h2 className="font-bold text-lg text-[rgb(var(--text))] mb-6 flex items-center gap-2">
                    <Clock className="text-[rgb(var(--primary))]" size={20} /> Enrollment History
                  </h2>
                  <div className="space-y-3">
                    {enrollments.length === 0 ? (
                      <p className="text-[rgb(var(--muted))] italic text-center py-8">No enrollment history found.</p>
                    ) : enrollments.map(e => {
                      const isGraded = grades.some(g => g.course_id === e.course_id);
                      const displayStatus = (e.status === 'approved' && isGraded) ? 'completed' : e.status;

                      return (
                        <div key={e.id} className="flex justify-between items-center p-4 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))]/30 transition-colors">
                          <div>
                            <span className="font-bold text-sm text-[rgb(var(--text))] block">{e.course?.title || `Course ID: ${e.course_id}`}</span>
                            <span className="text-xs text-[rgb(var(--muted))] font-mono">{e.course?.course_code}</span>
                          </div>
                          <PortalBadge variant={displayStatus}>{displayStatus}</PortalBadge>
                        </div>
                      );
                    })}
                  </div>
                </PortalCard>

                {/* GRADE SHEET */}
                <PortalCard className="h-full">
                  <h2 className="font-bold text-lg text-[rgb(var(--text))] mb-6 flex items-center gap-2">
                    <FileText className="text-[rgb(var(--primary))]" size={20} /> Grade Sheet
                  </h2>

                  {grades.length === 0 ? (
                    <p className="text-[rgb(var(--muted))] italic text-center py-8">No grades published yet.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-[rgb(var(--border))]">
                      <table className="w-full text-sm">
                        <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] font-bold text-xs uppercase">
                          <tr>
                            <th className="px-6 py-3 text-left">Subject</th>
                            <th className="px-6 py-3 text-right">Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                          {grades.map(g => (
                            <tr key={g.id} className="bg-[rgb(var(--surface))] hover:bg-[rgb(var(--bg))] transition-colors">
                              <td className="px-6 py-4 font-medium text-[rgb(var(--text))]">
                                {g.course?.title || 'Unknown'}
                                <div className="text-xs text-[rgb(var(--muted))] font-mono">{g.course?.course_code}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-mono font-bold text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 px-2 py-1 rounded">
                                  {g.marks}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </PortalCard>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

// --- SUB-COMPONENTS ---

const CourseCard = ({ course, status, onEnroll, loading }) => (
  <PortalCard className="flex flex-col h-full hover:-translate-y-1 transition-transform duration-200">
    <div className="flex-1 mb-6">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))] bg-[rgb(var(--bg))] px-2 py-1 rounded border border-[rgb(var(--border))]">
          {course.course_code}
        </span>
        <span className="text-xs font-bold text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5 px-2 py-1 rounded-full">
          {course.credits} Credits
        </span>
      </div>
      <h3 className="font-bold text-xl text-[rgb(var(--text))] leading-tight mb-2">{course.title}</h3>
      <p className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wide">{course.department}</p>
    </div>

    {status ? (
      <div className={`w-full py-3 rounded-xl text-center text-sm font-bold border-2 flex items-center justify-center gap-2 ${status === 'completed' ? 'bg-teal-100 text-teal-800 border-teal-200' :
          status === 'approved' ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/20' :
            status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
              'bg-red-50 text-red-700 border-red-200'
        }`}>
        {status === 'completed' && <CheckCircle2 size={16} />}
        {status === 'approved' && <BookOpen size={16} />}
        {status === 'pending' && <Clock size={16} />}
        {status === 'rejected' && <XCircle size={16} />}

        {status === 'completed' ? "Completed" :
          status === 'approved' ? "Enrolled" :
            status === 'pending' ? "Request Pending" : "Rejected"}
      </div>
    ) : (
      <PortalButton onClick={onEnroll} loading={loading}>
        Enroll Now <ArrowRight size={16} />
      </PortalButton>
    )}
  </PortalCard>
);

const SidebarTab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group text-sm text-left
      ${active
        ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-md font-bold'
        : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--text))] font-medium'
      }
    `}
  >
    <Icon size={20} className={active ? 'stroke-[2.5px]' : 'group-hover:scale-110 transition-transform'} />
    <span className="flex-1">{label}</span>
    {active && <ArrowRight size={16} />}
  </button>
);

const StatCard = ({ label, value, icon: Icon }) => (
  <PortalCard className="flex items-center justify-between">
    <div>
      <p className="text-[rgb(var(--muted))] text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-[rgb(var(--text))]">{value}</p>
    </div>
    <div className="p-4 rounded-2xl bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
      <Icon size={28} />
    </div>
  </PortalCard>
);
