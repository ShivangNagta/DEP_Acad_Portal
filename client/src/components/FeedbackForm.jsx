import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api`;

const FeedbackForm = ({ onClose }) => {
    const [step, setStep] = useState('course-select');
    const [instructors, setInstructors] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('mid');
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [currentSession, setCurrentSession] = useState('');
    const [selectedCourseData, setSelectedCourseData] = useState(null);
    const token = localStorage.getItem('access_token');

    useEffect(() => {
        fetchInstructorsAndQuestions();
    }, []);

    const fetchInstructorsAndQuestions = async () => {
        setLoading(true);
        try {
            const [insRes, qRes, sessionRes] = await Promise.all([
                fetch(`${API_BASE}/feedback/instructors`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/feedback/questions`),
                fetch(`${API_BASE}/feedback/current-session`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (insRes.ok) setInstructors(await insRes.json());
            if (qRes.ok) {
                const qs = await qRes.json();
                setQuestions(qs);
                const initialResponses = {};
                qs.forEach(q => { initialResponses[q.id] = null; });
                setResponses(initialResponses);
            }
            if (sessionRes.ok) {
                const data = await sessionRes.json();
                setCurrentSession(data.session);
            }
        } catch (e) {
            console.error(e);
            setMessage('Failed to load feedback form');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = async () => {
        if (!selectedCourse) return;
        const course = instructors.find(c => c.course_id === selectedCourse);
        if (!course) return;
        
        try {
            const res = await fetch(`${API_BASE}/feedback/check?course_id=${selectedCourse}&semester=${selectedSemester}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.exists) {
                setMessage('You have already submitted feedback for this instructor');
                return;
            }
            setStep('questions');
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        if (Object.values(responses).some(r => r === null)) {
            setMessage('Please answer all questions');
            return;
        }

        const course = instructors.find(c => c.course_id === selectedCourse);
        if (!course) return;

        setSubmitting(true);
        try {
            const feedbackData = Object.entries(responses).map(([question_id, response]) => ({
                question_id,
                response: parseInt(response)
            }));

            const res = await fetch(`${API_BASE}/feedback/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_id: selectedCourse,
                    instructor_id: course.instructor_id,
                    semester: selectedSemester,
                    responses: feedbackData
                })
            });

            if (res.ok) {
                setMessage('Feedback submitted successfully!');
                setTimeout(() => onClose(), 2000);
            } else {
                setMessage('Failed to submit feedback');
            }
        } catch (e) {
            console.error(e);
            setMessage('Error submitting feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const responseLabels = {
        1: 'Strongly Disagree',
        2: 'Disagree',
        3: 'Neutral',
        4: 'Agree',
        5: 'Strongly Agree'
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl bg-[rgb(var(--surface))] rounded-2xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 p-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-[rgb(var(--text))]">Instructor Feedback</h2>
                            {currentSession && (
                                <p className="text-xs text-[rgb(var(--muted))] font-bold mt-1">
                                    Academic Session: {currentSession}
                                </p>
                            )}
                        </div>
                        <button onClick={onClose} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-[rgb(var(--primary))]" size={32} />
                        </div>
                    ) : step === 'course-select' ? (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[rgb(var(--muted))] uppercase">
                                    Select Course & Instructor
                                    </label>

                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text))] focus:border-[rgb(var(--primary))] outline-none"
                                    >
                                        <option value="">Choose a course...</option>
                                        {instructors.map(inst => (
                                            <option key={inst.course_id} value={inst.course_id}>
                                                {inst.course_title} - {inst.instructor_name} ({inst.department_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[rgb(var(--muted))] uppercase">Feedback Type</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedSemester('mid')}
                                            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all ${
                                                selectedSemester === 'mid'
                                                    ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))]'
                                                    : 'bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text))]'
                                            }`}
                                        >
                                            Mid Semester
                                        </button>
                                        <button
                                            onClick={() => setSelectedSemester('end')}
                                            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all ${
                                                selectedSemester === 'end'
                                                    ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))]'
                                                    : 'bg-[rgb(var(--bg))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text))]'
                                            }`}
                                        >
                                            End Semester
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-bold border border-red-200 flex gap-2">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{message}</span>
                                </div>
                            )}

                            <button
                                onClick={handleCourseSelect}
                                disabled={!selectedCourse}
                                className="w-full py-3 px-4 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--surface))] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                            >
                                Continue
                            </button>
                        </>
                    ) : (
                        <>
                            {selectedCourse && instructors.find(c => c.course_id === selectedCourse) && (
                                <div className="mb-6 p-4 rounded-lg bg-[rgb(var(--primary))]/10 border border-[rgb(var(--primary))]/20 space-y-2">
                                    <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))] font-bold">Feedback Details</p>
                                    <p className="text-sm font-bold text-[rgb(var(--text))]">
                                        📖 Course: {instructors.find(c => c.course_id === selectedCourse)?.course_title}
                                    </p>
                                    <p className="text-sm font-bold text-[rgb(var(--text))]">
                                        👨‍🏫 Instructor: {instructors.find(c => c.course_id === selectedCourse)?.instructor_name}
                                    </p>
                                    <p className="text-sm font-bold text-[rgb(var(--text))]">
                                        🏢 Department: {instructors.find(c => c.course_id === selectedCourse)?.department_name}
                                    </p>
                                    <p className="text-sm font-bold text-[rgb(var(--primary))]">
                                        📅 {selectedSemester === 'mid' ? 'Mid Semester' : 'End Semester'} Feedback
                                    </p>
                                </div>
                            )}

                            <div className="space-y-6">
                                {questions.map((question, idx) => (
                                    <div key={question.id} className="space-y-3">
                                        <p className="text-sm font-bold text-[rgb(var(--text))]">
                                            {idx + 1}. {question.question_text}
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            {[1, 2, 3, 4, 5].map(rating => (
                                                <button
                                                    key={rating}
                                                    onClick={() => setResponses({ ...responses, [question.id]: rating })}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                                        responses[question.id] === rating
                                                            ? 'bg-[rgb(var(--primary))] text-[rgb(var(--surface))]'
                                                            : 'bg-[rgb(var(--bg))] text-[rgb(var(--text))] border-2 border-[rgb(var(--border))] hover:border-[rgb(var(--primary))]'
                                                    }`}
                                                >
                                                    {rating}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-[rgb(var(--muted))] italic">
                                            {responses[question.id] ? responseLabels[responses[question.id]] : 'Select a rating'}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm font-bold border ${
                                    message.includes('success') 
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => { setStep('course-select'); setMessage(''); }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-[rgb(var(--bg))] text-[rgb(var(--text))] font-bold border-2 border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || Object.values(responses).some(r => r === null)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--surface))] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    Submit Feedback
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default FeedbackForm;
