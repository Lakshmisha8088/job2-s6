
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { Play, FileText, CheckCircle, Search, Clock, ArrowLeft, ChevronRight, BarChart2, Download, Copy, ThumbsUp, ThumbsDown, AlertCircle, Building2, GitCommit, Zap } from 'lucide-react';
import { analyzeJD } from '../utils/analysisLogic';
import { saveAnalysisResult, getAnalysisHistory, updateAnalysisResult } from '../utils/storage';

// Mock Data for Radar Chart (Keep existing visualization for "Overall" context)
const skillData = [
    { subject: 'DSA', A: 75, fullMark: 100 },
    { subject: 'Sys Design', A: 60, fullMark: 100 },
    { subject: 'Comm', A: 80, fullMark: 100 },
    { subject: 'Resume', A: 85, fullMark: 100 },
    { subject: 'Aptitude', A: 70, fullMark: 100 },
];

const CircularProgress = ({ value, size = 180, strokeWidth = 12 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg width={size} height={size} className="rotate-[-90deg]">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth={strokeWidth} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="hsl(245, 58%, 51%)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-4xl font-bold text-slate-900">{value}</span>
                <span className="text-xs text-slate-500 block uppercase tracking-wider mt-1">Score</span>
            </div>
        </div>
    );
};

export const DashboardHome = () => {
    const [view, setView] = useState('HOME'); // HOME, ANALYZE, RESULTS, HISTORY
    const [history, setHistory] = useState([]);
    const [currentResult, setCurrentResult] = useState(null);
    const [formData, setFormData] = useState({ jdText: '', company: '', role: '' });

    // Interactive State
    const [skillConfidence, setSkillConfidence] = useState({}); // { "React": "know" | "practice" }
    const [dynamicScore, setDynamicScore] = useState(0);

    useEffect(() => {
        setHistory(getAnalysisHistory());
    }, [view]);

    // Initialize interactive state when a result is loaded
    useEffect(() => {
        if (currentResult) {
            // Load existing confidence map or default to empty
            const savedConfidence = currentResult.skillConfidence || {};
            setSkillConfidence(savedConfidence);

            // Initial score calculation
            const base = currentResult.baseScore || currentResult.readinessScore || 35;

            // Backfill baseScore if missing (legacy support)
            if (!currentResult.baseScore) {
                updateAnalysisResult(currentResult.id, { baseScore: base });
            }

            calculateDynamicScore(base, savedConfidence);
        }
    }, [currentResult]);

    const calculateDynamicScore = (base, confidenceMap) => {
        let score = base;
        Object.values(confidenceMap).forEach(status => {
            if (status === 'know') score += 2;
            if (status === 'practice') score -= 2;
        });
        // Clamp between 0 and 100
        setDynamicScore(Math.max(0, Math.min(100, score)));
    };

    const handleSkillToggle = (skill) => {
        const currentStatus = skillConfidence[skill];
        const newStatus = currentStatus === 'know' ? 'practice' : 'know'; // Toggle logic

        const newConfidence = { ...skillConfidence, [skill]: newStatus };
        setSkillConfidence(newConfidence);

        // Update local state score
        const base = currentResult.baseScore || currentResult.readinessScore;
        calculateDynamicScore(base, newConfidence);

        // Persist to storage
        updateAnalysisResult(currentResult.id, {
            skillConfidence: newConfidence,
            finalScore: Math.max(0, Math.min(100, base + (Object.values(newConfidence).filter(s => s === 'know').length * 2) - (Object.values(newConfidence).filter(s => s === 'practice').length * 2))),
            updatedAt: new Date().toISOString()
        });
    };

    // Default skills to "practice" if not set when rendered
    const getSkillStatus = (skill) => {
        return skillConfidence[skill] || 'practice';
    };

    const handleAnalyze = () => {
        if (!formData.jdText.trim()) return;
        const result = analyzeJD(formData.jdText, formData.company, formData.role);
        // Save initial result with baseScore
        result.baseScore = result.readinessScore;
        saveAnalysisResult(result);
        setCurrentResult(result);
        setView('RESULTS');
        setFormData({ jdText: '', company: '', role: '' });
    };

    const handleViewHistoryItem = (item) => {
        setCurrentResult(item);
        setView('RESULTS');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const generateExportText = () => {
        if (!currentResult) return '';
        const basics = `Placement Readiness Report\nCompany: ${currentResult.company || 'N/A'}\nRole: ${currentResult.role || 'N/A'}\nScore: ${dynamicScore}/100\n\n`;

        const skills = `Skills:\n${currentResult.flatSkills.map(s => `- ${s} (${getSkillStatus(s)})`).join('\n')}\n\n`;

        const plan = `7-Day Plan:\n${currentResult.plan7Days.map(d => `${d.day}: ${d.focus}\n${d.tasks.map(t => `  - ${t}`).join('\n')}`).join('\n')}\n\n`;

        const qs = `Interview Questions:\n${currentResult.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;

        return basics + skills + plan + qs;
    };

    const downloadReport = () => {
        const element = document.createElement("a");
        const file = new Blob([generateExportText()], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `readiness-report-${currentResult.company || 'job'}.txt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    // --- Views ---

    const renderAnalyzeView = () => (
        <div className="max-w-3xl mx-auto space-y-6">
            <button onClick={() => setView('HOME')} className="flex items-center text-slate-500 hover:text-primary transition-colors mb-4">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </button>
            <Card>
                <CardHeader>
                    <CardTitle>Analyze New Job Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. Google"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role Title</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="e.g. Frontend Engineer"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Description <span className="text-red-500">*</span></label>
                        <textarea
                            className={`w-full p-3 border rounded-lg h-48 focus:ring-2 focus:border-transparent outline-none resize-none transition-colors ${formData.jdText.length > 0 && formData.jdText.length < 200
                                    ? 'border-amber-300 focus:ring-amber-200'
                                    : 'border-slate-200 focus:ring-primary'
                                }`}
                            placeholder="Paste the JD here..."
                            value={formData.jdText}
                            onChange={(e) => setFormData({ ...formData, jdText: e.target.value })}
                        ></textarea>

                        {/* Validation Warning */}
                        {formData.jdText.length > 0 && formData.jdText.length < 200 && (
                            <div className="mt-2 text-amber-600 text-sm flex items-center gap-2 bg-amber-50 p-2 rounded">
                                <AlertCircle size={14} />
                                <span>This JD is too short to analyze deeply. Paste full JD for better output.</span>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mt-1 text-right">{formData.jdText.length} characters</p>
                    </div>
                    <button
                        className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleAnalyze}
                        disabled={!formData.jdText.trim()}
                    >
                        Analyze & Generate Plan
                    </button>
                </CardContent>
            </Card>
        </div>
    );

    const renderResultsView = () => {
        if (!currentResult) return <div>No result found.</div>;

        // Calculate top weak skills for "Action Next"
        const weakSkills = currentResult.flatSkills.filter(s => getSkillStatus(s) === 'practice').slice(0, 3);

        return (
            <div className="space-y-6">
                <button onClick={() => setView('HOME')} className="flex items-center text-slate-500 hover:text-primary transition-colors mb-4">
                    <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                </button>

                {/* Score & Export Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-stretch">
                    {/* Score Card */}
                    <Card className="flex-1 flex flex-col items-center justify-center py-8">
                        <CircularProgress value={dynamicScore} size={200} />
                        <div className="text-center mt-6">
                            <h3 className="text-xl font-bold text-slate-900">{currentResult.company || "Target Company"}</h3>
                            <p className="text-slate-500">{currentResult.role || "Target Role"}</p>
                        </div>
                    </Card>

                    {/* Detected Skills & Export Actions */}
                    <Card className="flex-[2] flex flex-col">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Skills Detected</CardTitle>
                            <div className="flex gap-2">
                                <button onClick={downloadReport} title="Download Report" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><Download size={18} /></button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {Object.entries(currentResult.extractedSkills).length === 0 ? (
                                <p className="text-slate-500 italic">No specific tech stack detected.</p>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-slate-500">Click to toggle status. Score updates live!</p>
                                    {Object.entries(currentResult.extractedSkills).map(([categoryKey, skills]) => {
                                        if (skills.length === 0) return null;
                                        // Display Name Mapping
                                        const displayParams = {
                                            coreCS: 'Core CS',
                                            languages: 'Languages',
                                            web: 'Web Development',
                                            data: 'Data & Databases',
                                            cloud: 'Cloud & DevOps',
                                            testing: 'Testing',
                                            other: 'Other Skills'
                                        };
                                        const displayName = displayParams[categoryKey] || categoryKey;

                                        return (
                                            <div key={categoryKey}>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2">{displayName}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.map(skill => {
                                                        const status = getSkillStatus(skill);
                                                        return (
                                                            <button
                                                                key={skill}
                                                                onClick={() => handleSkillToggle(skill)}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 transition-all duration-200 ${status === 'know'
                                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500 ring-offset-1'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                                    }`}
                                                            >
                                                                {status === 'know' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                                                                <span className="uppercase">{skill}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Action Next Box */}
                {weakSkills.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Action Next: Focus on Weak Areas</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    You marked <strong>{weakSkills.join(', ')}</strong> as needing practice.
                                    Start with Day 1 of your plan now!
                                </p>
                            </div>
                        </div>
                        <button
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            onClick={() => copyToClipboard(generateExportText())} // Quick action: Copy full plan
                        >
                            Copy Full Plan
                        </button>
                    </div>
                )}

                {/* Phase 3: Company Intel & Round Mapping */}
                {currentResult.companyIntel && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Company Intel Card */}
                        <Card className={`md:col-span-1 text-white border-0 ${currentResult.companyIntel.size === 'Enterprise'
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                            : 'bg-gradient-to-br from-purple-600 to-pink-600'
                            }`}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Building2 size={20} /> Company Intel
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-white/80 text-xs uppercase font-bold tracking-wider">Type</p>
                                    <p className="text-xl font-bold">{currentResult.companyIntel.size}</p>
                                </div>
                                <div>
                                    <p className="text-white/80 text-xs uppercase font-bold tracking-wider">Industry</p>
                                    <p className="font-medium">{currentResult.companyIntel.industry}</p>
                                </div>
                                <div>
                                    <p className="text-white/80 text-xs uppercase font-bold tracking-wider">Hiring Focus</p>
                                    <p className="text-sm leading-relaxed mt-1 text-white/90">{currentResult.companyIntel.focus}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Round Timeline */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GitCommit size={20} className="rotate-90" /> Expected Interview Flow
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0">
                                    {currentResult.roundMapping && currentResult.roundMapping.map((round, index) => (
                                        <div key={index} className="flex gap-4 relative pb-8 last:pb-0">
                                            {/* Connecting Line */}
                                            {index !== currentResult.roundMapping.length - 1 && (
                                                <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-200"></div>
                                            )}

                                            {/* Icon/Dot */}
                                            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-sm shadow-sm z-10 ${round.type === 'Screening' ? 'bg-blue-100 text-blue-600' :
                                                round.type === 'Technical' ? 'bg-indigo-100 text-indigo-600' :
                                                    round.type === 'Design' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                {index + 1}
                                            </div>

                                            {/* Content */}
                                            <div>
                                                <h4 className="font-bold text-slate-900">{round.name}</h4>
                                                <div className="flex items-center gap-2 mt-1 mb-2">
                                                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded uppercase">
                                                        {round.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-1">{round.desc}</p>
                                                <div className="flex items-start gap-1.5 text-xs text-indigo-600 bg-indigo-50 p-2 rounded border border-indigo-100 italic">
                                                    <Zap size={14} className="shrink-0 mt-0.5" />
                                                    <span>{round.purpose}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 7 Day Plan */}
                    <Card className="h-full">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="flex items-center gap-2"><Clock size={20} /> 7-Day Strategy</CardTitle>
                            <CardTitle className="flex items-center gap-2"><Clock size={20} /> 7-Day Strategy</CardTitle>
                            <button onClick={() => copyToClipboard(currentResult.plan7Days.map(d => `${d.day}\n${d.tasks.join('\n')}`).join('\n\n'))} className="text-xs font-medium text-primary hover:underline flex items-center gap-1"><Copy size={12} /> Copy</button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {currentResult.plan7Days && currentResult.plan7Days.map((day, i) => (
                                    <div key={i} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-indigo-600 text-sm">{day.day}</span>
                                            <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{day.focus}</span>
                                        </div>
                                        <ul className="list-disc list-inside text-sm text-slate-600 pl-1">
                                            {day.tasks.map((item, idx) => <li key={idx}>{item}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Round Checklist */}
                    <Card className="h-full">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="flex items-center gap-2"><CheckCircle size={20} /> Preparation Checklist</CardTitle>
                            <CardTitle className="flex items-center gap-2"><CheckCircle size={20} /> Preparation Checklist</CardTitle>
                            <button onClick={() => {
                                const text = Array.isArray(currentResult.checklist)
                                    ? currentResult.checklist.map(r => `${r.roundTitle}\n${r.items.join('\n')}`).join('\n\n')
                                    : Object.entries(currentResult.checklist).map(([k, v]) => `${k}\n${v.join('\n')}`).join('\n\n');
                                copyToClipboard(text);
                            }} className="text-xs font-medium text-primary hover:underline flex items-center gap-1"><Copy size={12} /> Copy</button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-5">
                                {/* Adjusted for Array format in new schema */}
                                {Array.isArray(currentResult.checklist) ? (
                                    currentResult.checklist.map((roundObj, i) => (
                                        <div key={i}>
                                            <h4 className="font-semibold text-slate-800 text-sm mb-2">{roundObj.roundTitle}</h4>
                                            <div className="space-y-1.5">
                                                {roundObj.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></div>
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* Legacy Object Fallback */
                                    Object.entries(currentResult.checklist).map(([round, items], i) => (
                                        <div key={i}>
                                            <h4 className="font-semibold text-slate-800 text-sm mb-2">{round}</h4>
                                            <div className="space-y-1.5">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></div>
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Interview Questions */}
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="flex items-center gap-2"><FileText size={20} /> Likely Interview Questions</CardTitle>
                        <button onClick={() => copyToClipboard(currentResult.questions.join('\n'))} className="text-xs font-medium text-primary hover:underline flex items-center gap-1"><Copy size={12} /> Copy</button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentResult.questions.map((q, i) => (
                                <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100 text-sm text-slate-700 font-medium">
                                    Q{i + 1}: {q}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center pt-8 pb-4 text-xs text-slate-400">
                    <p>Demo Mode: Company intel & rounds are generated heuristically based on industry patterns.</p>
                </div>
            </div>
        );
    };

    const renderHistoryView = () => (
        <div className="space-y-6">
            <button onClick={() => setView('HOME')} className="flex items-center text-slate-500 hover:text-primary transition-colors mb-4">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </button>
            <Card>
                <CardHeader>
                    <CardTitle>Analysis History</CardTitle>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No analysis history found. Start a new analysis!</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {history.map(item => (
                                <div key={item.id} className="py-4 flex items-center justify-between hover:bg-slate-50 p-2 rounded transition-colors cursor-pointer" onClick={() => handleViewHistoryItem(item)}>
                                    <div>
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                            {item.company || "Unknown Company"}
                                            <span className="text-slate-400 font-normal">| {item.role || "Unknown Role"}</span>
                                            {item.companyIntel && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${item.companyIntel.size === 'Enterprise' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {item.companyIntel.size}
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.readinessScore > 75 ? 'bg-emerald-100 text-emerald-700' :
                                            item.readinessScore > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {item.readinessScore}% Ready
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderHomeView = () => (
        <div className="space-y-6">
            <div className="mb-0">
                <h1 className="text-2xl font-bold text-slate-900">Welcome back, User!</h1>
                <p className="text-slate-600">Here's your preparation overview for today.</p>
            </div>

            {/* NEW: Call to Action for Analysis */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">Targeting a specific Job?</h2>
                    <p className="text-indigo-100 max-w-lg">Paste the Job Description to get a personalized preparation plan, skill gap analysis, and likely interview questions instantly.</p>
                </div>
                <button
                    onClick={() => setView('ANALYZE')}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold shadow-md hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                    <Search size={18} /> Analyze JD
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Overall Readiness (Static for now, could be dynamic based on last analysis) */}
                <Card className="flex flex-col items-center justify-center py-8">
                    {history.length > 0 ? (
                        <>
                            <CircularProgress value={history[0].readinessScore} />
                            <p className="mt-4 font-medium text-slate-700">Last Analysis Score</p>
                            <p className="text-xs text-slate-400 mt-1">{history[0].company}</p>
                        </>
                    ) : (
                        <>
                            <CircularProgress value={0} />
                            <p className="mt-4 font-medium text-slate-700">No Analysis Yet</p>
                        </>
                    )}
                </Card>

                {/* 2. Recent History (Mini) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Analyses</CardTitle>
                        {history.length > 0 && (
                            <button onClick={() => setView('HISTORY')} className="text-sm text-primary font-medium hover:underline">View All</button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
                                <FileText size={40} className="mb-3 opacity-20" />
                                <p>No history yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.slice(0, 3).map((item) => (
                                    <div key={item.id} onClick={() => handleViewHistoryItem(item)} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{item.company || "Unknown Company"}</p>
                                            <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${item.readinessScore > 75 ? 'bg-emerald-100 text-emerald-700' :
                                            item.readinessScore > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {item.readinessScore}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Original content preserved below for "General Practice" context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Skill Breakdown (General)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Skills"
                                    dataKey="A"
                                    stroke="hsl(245, 58%, 51%)"
                                    fill="hsl(245, 58%, 51%)"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Continue Practice</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="font-medium text-slate-900">Dynamic Programming</p>
                                <p className="text-sm text-slate-500">Last practiced 2 hours ago</p>
                            </div>
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-primary">
                                <Play size={20} fill="currentColor" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">Progress</span>
                                <span className="font-medium text-slate-900">3/10</span>
                            </div>
                            <Progress value={30} />
                        </div>
                        <button className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                            Continue Session
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <div>
            {view === 'HOME' && renderHomeView()}
            {view === 'ANALYZE' && renderAnalyzeView()}
            {view === 'RESULTS' && renderResultsView()}
            {view === 'HISTORY' && renderHistoryView()}
        </div>
    );
};

export const Practice = () => (<div>Practice Module Placeholder</div>);
export const Assessments = () => (<div>Assessments Module Placeholder</div>);
export const Resources = () => (<div>Resources Module Placeholder</div>);
export const Profile = () => (<div>Profile Module Placeholder</div>);
