import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  GraduationCap, BookOpen, Loader2, CheckCircle2,
  AlertCircle, Clock, FileText, Check, Search, ArrowRight, XCircle, Filter, Download, MessageCircle, Trash2
} from 'lucide-react';
import CourseFilters from '../components/CourseFilters';
import FeedbackForm from '../components/FeedbackForm';
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
  const [selectedSemester, setSelectedSemester] = useState('sem-1');
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterInstructor, setFilterInstructor] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCredits, setFilterCredits] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Row selection state
  const [selectedRows, setSelectedRows] = useState({});
  
  // Enrollment filtering state
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
  const [enrollmentFilterSemester, setEnrollmentFilterSemester] = useState('');
  const [enrollmentFilterStatus, setEnrollmentFilterStatus] = useState('');
  const [enrollmentShowAdvancedFilters, setEnrollmentShowAdvancedFilters] = useState(false);
  const [selectedEnrollmentRows, setSelectedEnrollmentRows] = useState({});
  
  // Grade filtering state
  const [gradeSearchQuery, setGradeSearchQuery] = useState('');
  const [gradeFilterSemester, setGradeFilterSemester] = useState('');
  const [gradeShowAdvancedFilters, setGradeShowAdvancedFilters] = useState(false);
  const [selectedGradeRows, setSelectedGradeRows] = useState({});

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [dropConfirmModal, setDropConfirmModal] = useState({ show: false, enrollmentId: null, courseTitle: null });

  const token = localStorage.getItem('access_token');
  const semesters = ['sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8'];

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

  // Apply filtering
  useMemo(() => {
    let filtered = coursesWithStatus;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.course_code?.toLowerCase().includes(query) ||
        course.title?.toLowerCase().includes(query) ||
        course.instructor?.name?.toLowerCase().includes(query) ||
        course.instructor?.entry_number?.toLowerCase().includes(query) ||
        course.instructor?.departments?.name?.toLowerCase().includes(query)
      );
    }

    if (filterSession) {
      filtered = filtered.filter(course => course.academic_session === filterSession);
    }

    if (filterInstructor) {
      filtered = filtered.filter(course => 
        course.instructor?.name?.toLowerCase().includes(filterInstructor.toLowerCase()) ||
        course.instructor?.entry_number?.toLowerCase().includes(filterInstructor.toLowerCase())
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(course => 
        course.instructor?.departments?.name === filterDepartment ||
        course.instructor?.departments?.code === filterDepartment
      );
    }

    if (filterCredits) {
      filtered = filtered.filter(course => course.credits === parseInt(filterCredits));
    }

    if (filterStatus) {
      filtered = filtered.filter(course => course.enrollment_status === filterStatus);
    }

    setFilteredCourses(filtered);
  }, [coursesWithStatus, searchQuery, filterSession, filterInstructor, filterDepartment, filterCredits, filterStatus]);

  // Enrollment filtering logic
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  useMemo(() => {
    let filtered = enrollments;
    
    if (enrollmentSearchQuery) {
      const query = enrollmentSearchQuery.toLowerCase();
      filtered = filtered.filter(enrollment =>
        enrollment.course?.course_code?.toLowerCase().includes(query) ||
        enrollment.course?.title?.toLowerCase().includes(query) ||
        enrollment.course?.instructor?.name?.toLowerCase().includes(query) ||
        enrollment.course?.instructor?.entry_number?.toLowerCase().includes(query)
      );
    }

    if (enrollmentFilterSemester) {
      filtered = filtered.filter(enrollment => enrollment.semester === enrollmentFilterSemester);
    }

    if (enrollmentFilterStatus) {
      const query = enrollmentFilterStatus.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const isGraded = grades.some(g => g.course_id === enrollment.course_id);
        const displayStatus = (enrollment.status === 'approved' && isGraded) ? 'completed' : enrollment.status;
        return displayStatus.includes(query);
      });
    }

    setFilteredEnrollments(filtered);
  }, [enrollments, enrollmentSearchQuery, enrollmentFilterSemester, enrollmentFilterStatus, grades]);

  // Grade filtering logic
  const [filteredGrades, setFilteredGrades] = useState([]);
  useMemo(() => {
    let filtered = grades;
    
    if (gradeSearchQuery) {
      const query = gradeSearchQuery.toLowerCase();
      filtered = filtered.filter(grade =>
        grade.course?.course_code?.toLowerCase().includes(query) ||
        grade.course?.title?.toLowerCase().includes(query) ||
        grade.course?.instructor?.name?.toLowerCase().includes(query)
      );
    }

    if (gradeFilterSemester) {
      filtered = filtered.filter(grade => grade.semester === gradeFilterSemester);
    }

    setFilteredGrades(filtered);
  }, [grades, gradeSearchQuery, gradeFilterSemester]);

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

  const handleEnroll = async (courseId, semester) => {
    if (!semester) {
      showFeedback('error', 'Please select a semester');
      return;
    }
    setActionLoading(courseId);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId, semester })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');

      setEnrollments([...enrollments, { course_id: courseId, status: 'pending', semester, id: Date.now() }]);
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

  const handleDropCourse = async () => {
    if (!dropConfirmModal.enrollmentId) return;
    
    setActionLoading(dropConfirmModal.enrollmentId);
    try {
      const enrollment = enrollments.find(e => e.id === dropConfirmModal.enrollmentId);
      if (!enrollment) {
        showFeedback('error', 'Enrollment not found');
        setDropConfirmModal({ show: false, enrollmentId: null, courseTitle: null });
        setActionLoading(null);
        return;
      }

      const res = await fetch(`${API_BASE}/enrollments/drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: enrollment.course_id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to drop course');

      setEnrollments(enrollments.filter(e => e.id !== dropConfirmModal.enrollmentId));
      showFeedback('success', `Course "${dropConfirmModal.courseTitle}" dropped successfully`);
      setDropConfirmModal({ show: false, enrollmentId: null, courseTitle: null });
    } catch (e) {
      showFeedback('error', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const cgpa = useMemo(() => {
    if (!grades.length) return 'N/A';
    const total = grades.reduce((acc, curr) => acc + curr.marks, 0);
    return ((total / grades.length) / 10).toFixed(2);
  }, [grades]);

  // Calculate semester-wise statistics
  const getSemesterStats = (semester) => {
    const semesterGrades = grades.filter(g => g.semester === semester);
    const semesterEnrollments = enrollments.filter(e => e.semester === semester && e.status === 'approved');
    
    if (semesterGrades.length === 0) {
      return {
        gpa: 'N/A',
        totalCredits: 0,
        courses: []
      };
    }

    // Calculate GPA (4.0 scale)
    const gradePoints = {
      'A': 4.0, 'A+': 4.0, 'A-': 3.7,
      'B': 3.0, 'B+': 3.3, 'B-': 2.7,
      'C': 2.0, 'C+': 2.3, 'C-': 1.7,
      'D': 1.0, 'D+': 1.3, 'D-': 0.7,
      'F': 0.0
    };

    const totalGradePoints = semesterGrades.reduce((sum, g) => {
      const courseEnrollment = semesterEnrollments.find(e => e.course_id === g.course_id);
      const credits = courseEnrollment?.course?.credits || 0;
      return sum + ((gradePoints[g.grade] || 0) * credits);
    }, 0);

    const totalCredits = semesterEnrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0);
    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';

    return {
      gpa,
      totalCredits,
      courses: semesterGrades
    };
  };

  // Calculate current semester credits for enrollment validation
  const _getAvailableCreditsForSemester = (semester) => {
    const approvedEnrollments = enrollments.filter(e => e.semester === semester && e.status === 'approved');
    const usedCredits = approvedEnrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0);
    return 24 - usedCredits;
  };

  // Get used credits for a specific semester
  const getUsedCreditsForSemester = (semester) => {
    const approvedEnrollments = enrollments.filter(e => e.semester === semester && e.status === 'approved');
    return approvedEnrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0);
  };

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
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group text-sm text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--text))] font-medium"
            >
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span className="flex-1 text-left">Feedback</span>
            </button>
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

      {/* Drop Course Confirmation Modal */}
      {dropConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[rgb(var(--surface))] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[rgb(var(--border))]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-[rgb(var(--text))]">Drop Course?</h3>
            </div>
            
            <p className="text-[rgb(var(--muted))] mb-6">
              Are you sure you want to drop <span className="font-bold text-[rgb(var(--text))]">"{dropConfirmModal.courseTitle}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <PortalButton
                variant="secondary"
                onClick={() => setDropConfirmModal({ show: false, enrollmentId: null, courseTitle: null })}
                disabled={actionLoading === dropConfirmModal.enrollmentId}
              >
                No
              </PortalButton>
              <PortalButton
                variant="primary"
                onClick={handleDropCourse}
                loading={actionLoading === dropConfirmModal.enrollmentId}
              >
                Yes, I want to drop this course
              </PortalButton>
            </div>
          </div>
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

              {/* FILTER & SEARCH SECTION */}
              <div className="space-y-4">
                {/* Quick Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by course code, title, or instructor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] rounded-lg text-[rgb(var(--text))] text-sm outline-none focus:border-[rgb(var(--primary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-4 py-2.5 rounded-lg border-2 border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] transition-colors flex items-center gap-2 font-bold text-sm"
                  >
                    <Filter size={16} /> Filters
                  </button>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Academic Session</label>
                      <select
                        value={filterSession}
                        onChange={(e) => setFilterSession(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-sm outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer font-medium"
                      >
                        <option value="">All Sessions</option>
                        {['2024-2025', '2025-2026', '2026-2027'].map(session => (
                          <option key={session} value={session}>{session}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Instructor</label>
                      <input
                        type="text"
                        placeholder="Search instructor name..."
                        value={filterInstructor}
                        onChange={(e) => setFilterInstructor(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-sm outline-none focus:border-[rgb(var(--primary))] font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Department</label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-sm outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer font-medium"
                      >
                        <option value="">All Departments</option>
                        {['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'].map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Credits</label>
                      <select
                        value={filterCredits}
                        onChange={(e) => setFilterCredits(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-sm outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer font-medium"
                      >
                        <option value="">All Credits</option>
                        {[1, 2, 3, 4, 5, 6].map(credit => (
                          <option key={credit} value={credit}>{credit} Credits</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-sm outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer font-medium"
                      >
                        <option value="">All Status</option>
                        <option value="not_enrolled">Not Enrolled</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Results</label>
                      <div className="flex items-center py-2 text-sm font-bold text-[rgb(var(--primary))]">
                        {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                      </div>
                    </div>
                  </div>
                )}

                {/* Row Selection Bar */}
                {filteredCourses.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                    <input
                      type="checkbox"
                      checked={Object.keys(selectedRows).filter(k => selectedRows[k]).length === filteredCourses.length && filteredCourses.length > 0}
                      onChange={(e) => {
                        const newSelected = {};
                        if (e.target.checked) {
                          filteredCourses.forEach(course => newSelected[course.id] = true);
                        }
                        setSelectedRows(newSelected);
                      }}
                      className="w-4 h-4 cursor-pointer accent-[rgb(var(--primary))]"
                    />
                    <span className="text-sm font-bold text-[rgb(var(--muted))]">
                      {Object.keys(selectedRows).filter(k => selectedRows[k]).length} selected
                    </span>
                    {Object.keys(selectedRows).filter(k => selectedRows[k]).length > 0 && (
                      <div className="ml-auto flex gap-2">
                        <PortalButton variant="secondary" className="!w-auto px-3" onClick={() => console.log('Export', Object.keys(selectedRows).filter(k => selectedRows[k]))}>
                          <Download size={14} /> Export
                        </PortalButton>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-[rgb(var(--muted))] border-2 border-dashed border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--bg))]/50">
                    <Search size={48} className="opacity-20 mb-4" />
                    <p className="font-bold">No courses match your filters.</p>
                  </div>
                ) : (
                  filteredCourses.map(course => (
                    <div key={course.id} className="relative">
                      <input
                        type="checkbox"
                        checked={selectedRows[course.id] || false}
                        onChange={(e) => setSelectedRows(prev => ({...prev, [course.id]: e.target.checked}))}
                        className="absolute top-4 right-4 w-4 h-4 cursor-pointer accent-[rgb(var(--primary))] z-10"
                      />
                      <CourseCard
                        course={course}
                        status={course.enrollment_status === 'not_enrolled' ? null : course.enrollment_status}
                        onEnroll={handleEnroll}
                        loading={actionLoading === course.id}
                      />
                    </div>
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
                  <div className="space-y-4">
                    {/* Enrollment Search and Filters */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search enrollment..."
                          value={enrollmentSearchQuery}
                          onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text))] text-sm outline-none focus:border-[rgb(var(--primary))] transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => setEnrollmentShowAdvancedFilters(!enrollmentShowAdvancedFilters)}
                        className="px-3 py-2 rounded border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] transition-colors flex items-center gap-2 font-bold text-sm"
                      >
                        <Filter size={14} />
                      </button>
                    </div>

                    {/* Advanced Enrollment Filters */}
                    {enrollmentShowAdvancedFilters && (
                      <div className="grid grid-cols-2 gap-2 p-3 rounded bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Semester</label>
                          <select
                            value={enrollmentFilterSemester}
                            onChange={(e) => setEnrollmentFilterSemester(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-xs outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer"
                          >
                            <option value="">All Semesters</option>
                            {['sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8'].map(sem => (
                              <option key={sem} value={sem}>{sem}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Status</label>
                          <select
                            value={enrollmentFilterStatus}
                            onChange={(e) => setEnrollmentFilterStatus(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-xs outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer"
                          >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Row Selection Bar for Enrollments */}
                    {filteredEnrollments.length > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                        <input
                          type="checkbox"
                          checked={Object.keys(selectedEnrollmentRows).filter(k => selectedEnrollmentRows[k]).length === filteredEnrollments.length && filteredEnrollments.length > 0}
                          onChange={(e) => {
                            const newSelected = {};
                            if (e.target.checked) {
                              filteredEnrollments.forEach(enr => newSelected[enr.id] = true);
                            }
                            setSelectedEnrollmentRows(newSelected);
                          }}
                          className="w-3.5 h-3.5 cursor-pointer accent-[rgb(var(--primary))]"
                        />
                        <span className="text-xs font-bold text-[rgb(var(--muted))]">
                          {Object.keys(selectedEnrollmentRows).filter(k => selectedEnrollmentRows[k]).length} selected
                        </span>
                      </div>
                    )}

                    {/* Enrollment List */}
                    {filteredEnrollments.length === 0 ? (
                      <p className="text-[rgb(var(--muted))] italic text-center py-8 text-sm">No enrollments found.</p>
                    ) : filteredEnrollments.map(e => {
                      const isGraded = grades.some(g => g.course_id === e.course_id);
                      const displayStatus = (e.status === 'approved' && isGraded) ? 'completed' : e.status;
                      const isApproved = e.status === 'approved';
                      
                      // Get deadline from the course object
                      const courseDeadline = e.course?.enrollment_deadline;
                      let daysLeft = null;
                      let deadlineInfo = null;
                      
                      if (courseDeadline) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const deadline = new Date(courseDeadline);
                        deadline.setHours(0, 0, 0, 0);
                        daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                        deadlineInfo = new Date(courseDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      }
                      
                      // const canDrop = isApproved && daysLeft !== null && daysLeft > 0;
                      const canDrop = isApproved && (!courseDeadline || (daysLeft !== null && daysLeft > 0));

                      return (
                        <div key={e.id} className="flex items-center justify-between p-4 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))]/30 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedEnrollmentRows[e.id] || false}
                            onChange={(ev) => setSelectedEnrollmentRows({...selectedEnrollmentRows, [e.id]: ev.target.checked})}
                            className="w-3.5 h-3.5 cursor-pointer accent-[rgb(var(--primary))]"
                          />
                          <div className="flex-1 ml-3">
                            <span className="font-bold text-sm text-[rgb(var(--text))] block">{e.course?.title || `Course ID: ${e.course_id}`}</span>
                            <span className="text-xs text-[rgb(var(--muted))] font-mono">{e.course?.course_code} • {e.semester}</span>
                            
                            {/* Deadline Info for Approved Enrollments */}
                            {deadlineInfo && (
                              <div className="mt-2 text-xs text-[rgb(var(--muted))] flex items-center gap-2">
                                <Clock size={12} />
                                <span>
                                  Deadline: <span className="font-bold text-[rgb(var(--text))]">{deadlineInfo}</span>
                                  {daysLeft !== null && (
                                    <span className={`ml-2 font-bold ${daysLeft <= 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                                      ({daysLeft <= 0 ? 'Closed' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 ml-4">
                            <PortalBadge variant={displayStatus} className="text-xs">{displayStatus}</PortalBadge>
                            
                            {/* Drop Button */}
                            {canDrop && (
                              <PortalButton
                                variant="secondary"
                                className="px-3 py-1.5 text-xs h-fit"
                                onClick={() => setDropConfirmModal({ show: true, enrollmentId: e.id, courseTitle: e.course?.title || e.course_id })}
                                disabled={actionLoading === e.id}
                              >
                                <Trash2 size={14} /> Drop
                              </PortalButton>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PortalCard>

                {/* GRADE SHEET BY SEMESTER */}
                <PortalCard className="h-full">
                  <h2 className="font-bold text-lg text-[rgb(var(--text))] mb-6 flex items-center gap-2">
                    <FileText className="text-[rgb(var(--primary))]" size={20} /> Semester-wise Grades
                  </h2>

                  {grades.length === 0 ? (
                    <p className="text-[rgb(var(--muted))] italic text-center py-8">No grades published yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Grade Search and Filters */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search grade..."
                            value={gradeSearchQuery}
                            onChange={(e) => setGradeSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text))] text-sm outline-none focus:border-[rgb(var(--primary))] transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => setGradeShowAdvancedFilters(!gradeShowAdvancedFilters)}
                          className="px-3 py-2 rounded border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] transition-colors flex items-center gap-2 font-bold text-sm"
                        >
                          <Filter size={14} />
                        </button>
                      </div>

                      {/* Advanced Grade Filters */}
                      {gradeShowAdvancedFilters && (
                        <div className="p-3 rounded bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Semester</label>
                            <select
                              value={gradeFilterSemester}
                              onChange={(e) => setGradeFilterSemester(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-xs outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer"
                            >
                              <option value="">All Semesters</option>
                              {['sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8'].map(sem => (
                                <option key={sem} value={sem}>{sem}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Row Selection Bar for Grades */}
                      {filteredGrades.length > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                          <input
                            type="checkbox"
                            checked={Object.keys(selectedGradeRows).filter(k => selectedGradeRows[k]).length === filteredGrades.length && filteredGrades.length > 0}
                            onChange={(e) => {
                              const newSelected = {};
                              if (e.target.checked) {
                                filteredGrades.forEach(grade => newSelected[grade.id] = true);
                              }
                              setSelectedGradeRows(newSelected);
                            }}
                            className="w-3.5 h-3.5 cursor-pointer accent-[rgb(var(--primary))]"
                          />
                          <span className="text-xs font-bold text-[rgb(var(--muted))]">
                            {Object.keys(selectedGradeRows).filter(k => selectedGradeRows[k]).length} selected
                          </span>
                        </div>
                      )}

                      {/* Semester Tabs */}
                      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[rgb(var(--border))]">
                        {semesters.map(sem => {
                          const semStats = getSemesterStats(sem);
                          const hasGrades = semStats.courses.length > 0;
                          const usedCredits = getUsedCreditsForSemester(sem);
                          const creditPercent = (usedCredits / 24) * 100;
                          return (
                            <div key={sem} className="flex flex-col gap-1">
                              <button
                                onClick={() => setSelectedSemester(sem)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${selectedSemester === sem
                                  ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))]'
                                  : 'bg-[rgb(var(--bg))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]'
                                  } ${!hasGrades ? 'opacity-50' : ''}`}
                                disabled={!hasGrades}
                              >
                                {sem} {hasGrades && <span className="ml-1 text-xs">•</span>}
                              </button>
                              {/* Credit Usage Bar */}
                              <div className="w-full bg-[rgb(var(--bg))] rounded-full h-1.5 border border-[rgb(var(--border))]">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    creditPercent >= 100 ? 'bg-red-500' :
                                    creditPercent >= 90 ? 'bg-amber-500' :
                                    'bg-[rgb(var(--primary))]'
                                  }`}
                                  style={{ width: `${Math.min(creditPercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-[rgb(var(--muted))] font-bold">{usedCredits}/24 credits</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Semester Statistics */}
                      {(() => {
                        const semStats = getSemesterStats(selectedSemester);
                        if (semStats.courses.length === 0) {
                          return <p className="text-[rgb(var(--muted))] italic text-center py-4">No grades for this semester.</p>;
                        }
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="p-3 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                                <p className="text-xs text-[rgb(var(--muted))] font-bold mb-1">Semester GPA</p>
                                <p className="text-2xl font-bold text-[rgb(var(--primary))]">{semStats.gpa}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                                <p className="text-xs text-[rgb(var(--muted))] font-bold mb-1">Credits Earned</p>
                                <p className="text-2xl font-bold text-[rgb(var(--primary))]">{semStats.totalCredits}</p>
                              </div>
                            </div>

                            {/* Grades Table for Selected Semester */}
                            <div className="overflow-hidden rounded-lg border border-[rgb(var(--border))]">
                              <table className="w-full text-sm">
                                <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--muted))] font-bold text-xs uppercase">
                                  <tr>
                                    <th className="px-3 py-2 w-8 text-center">
                                      <input
                                        type="checkbox"
                                        checked={Object.keys(selectedGradeRows).filter(k => selectedGradeRows[k]).length === semStats.courses.length && semStats.courses.length > 0}
                                        onChange={(e) => {
                                          const newSelected = {};
                                          if (e.target.checked) {
                                            semStats.courses.forEach(grade => newSelected[grade.id] = true);
                                          }
                                          setSelectedGradeRows(newSelected);
                                        }}
                                        className="w-3.5 h-3.5 cursor-pointer accent-[rgb(var(--primary))]"
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-left">Course</th>
                                    <th className="px-4 py-2 text-right">Marks</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgb(var(--border))]">
                                  {semStats.courses.map(g => (
                                    <tr key={g.id} className="bg-[rgb(var(--surface))] hover:bg-[rgb(var(--bg))] transition-colors">
                                      <td className="px-3 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={selectedGradeRows[g.id] || false}
                                          onChange={(e) => setSelectedGradeRows({...selectedGradeRows, [g.id]: e.target.checked})}
                                          className="w-3.5 h-3.5 cursor-pointer accent-[rgb(var(--primary))]"
                                        />
                                      </td>
                                      <td className="px-4 py-3 font-medium text-[rgb(var(--text))] text-xs">
                                        {g.course?.course_code}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="font-mono font-bold text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 px-2 py-1 rounded text-xs">
                                          {g.marks}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </PortalCard>
              </div>
            </div>
          )}
        </div>
      )}
      
      {showFeedbackForm && <FeedbackForm onClose={() => setShowFeedbackForm(false)} />}
    </DashboardLayout>
  );
}

// --- SUB-COMPONENTS ---

const CourseCard = ({ course, status, onEnroll, loading }) => {
  const [selectedSemester, setSelectedSemester] = useState('');
  const semesters = ['sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8'];
  const [enrollments] = useState(() => {
    return [];
  });
  
  const _canEnroll = true;

  const getAvailableCredits = () => {
    if (!selectedSemester) return 24;
    const approvedEnrollments = enrollments.filter(e => e.semester === selectedSemester && e.status === 'approved');
    const usedCredits = approvedEnrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0);
    return 24 - usedCredits;
  };

  const availableCredits = getAvailableCredits();
  const _canEnrollCourse = !selectedSemester || availableCredits >= (course.credits || 0);

  return (
    <PortalCard className="flex flex-col h-full hover:-translate-y-1 transition-transform duration-200">
      <div className="flex-1 mb-6 space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))] bg-[rgb(var(--bg))] px-2 py-1 rounded border border-[rgb(var(--border))]">
            {course.course_code}
          </span>
          <span className="text-xs font-bold text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5 px-2 py-1 rounded-full">
            {course.credits} Credits
          </span>
        </div>
        
        <div>
          <h3 className="font-bold text-lg text-[rgb(var(--text))] leading-tight">{course.title}</h3>
        </div>

        {/* Course Details */}
        <div className="space-y-2 text-xs border-t border-[rgb(var(--border))] pt-3">
          {course.academic_session && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--muted))] font-bold">Session:</span>
              <span className="text-[rgb(var(--text))] font-medium">{course.academic_session}</span>
            </div>
          )}
          {course.instructor && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--muted))] font-bold">Instructor:</span>
              <span className="text-[rgb(var(--text))] font-medium">{course.instructor.name || course.instructor.entry_number || 'Staff'}</span>
            </div>
          )}
          {course.instructor?.departments && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--muted))] font-bold">Dept:</span>
              <span className="text-[rgb(var(--text))] font-medium">{course.instructor.departments.code}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Course enroll/drop DEADLINE*/}
      {course.enrollment_deadline && !status && (
        <div className="mb-4 p-3 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
          <div className="text-xs text-[rgb(var(--muted))] flex items-center gap-2">
            <Clock size={12} />
            <span>
              Enrollment/Drop Deadline: <span className="font-bold text-[rgb(var(--text))]">
                {new Date(course.enrollment_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const deadline = new Date(course.enrollment_deadline);
                deadline.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                return (
                  <span className={`ml-2 font-bold ${daysLeft <= 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                    ({daysLeft <= 0 ? 'Closed' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`})
                  </span>
                );
              })()}
            </span>
          </div>
        </div>
      )}

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
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase">Select Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text))] text-sm font-medium outline-none focus:border-[rgb(var(--primary))] appearance-none cursor-pointer"
            >
              <option value="">Choose semester...</option>
              {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
            </select>
          </div>
          
          {/* Credit Usage Indicator */}
          {selectedSemester && (
            <div className="space-y-1 p-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[rgb(var(--muted))]">Available Credits:</span>
                <span className={availableCredits >= course.credits ? 'text-[rgb(var(--primary))]' : 'text-red-500'}>
                  {availableCredits}/24
                </span>
              </div>
              <div className="w-full bg-[rgb(var(--border))] rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    availableCredits < 0 ? 'bg-red-500' :
                    availableCredits < course.credits ? 'bg-amber-500' :
                    'bg-[rgb(var(--primary))]'
                  }`}
                  style={{ width: `${Math.max(0, Math.min((24 - availableCredits) / 24 * 100, 100))}%` }}
                />
              </div>
              {availableCredits < course.credits && (
                <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ Not enough credits available</p>
              )}
            </div>
          )}
          
          <PortalButton 
            onClick={() => onEnroll(course.id, selectedSemester)} 
            loading={loading} 
            disabled={!selectedSemester || !_canEnroll}
          >
            Enroll Now <ArrowRight size={16} />
          </PortalButton>
        </div>
      )}
    </PortalCard>
  );
};

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
    {Icon && <Icon size={20} className={active ? 'stroke-[2.5px]' : 'group-hover:scale-110 transition-transform'} />}
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
      {Icon && <Icon size={28} />}
    </div>
  </PortalCard>
);
