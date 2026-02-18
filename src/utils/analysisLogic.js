
// Skill Dictionaries
const SKILLS = {
    CORE_CS: ['dsa', 'oop', 'dbms', 'os', 'networks', 'operating systems', 'computer networks', 'data structures', 'algorithms'],
    LANGUAGES: ['java', 'python', 'javascript', 'typescript', 'c', 'c++', 'c#', 'go', 'ruby', 'swift', 'kotlin', 'php'],
    WEB: ['react', 'next.js', 'node.js', 'express', 'rest', 'graphql', 'html', 'css', 'tailwind', 'redux', 'vue', 'angular'],
    DATA: ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'nosql', 'oracle'],
    CLOUD: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'linux', 'devops', 'jenkins', 'git'],
    TESTING: ['selenium', 'cypress', 'playwright', 'junit', 'pytest', 'jest', 'mocha']
};

const DEFAULT_STACK_SKILLS = ["Communication", "Problem solving", "Basic coding", "Projects"];
const CATEGORY_KEYS = {
    CORE_CS: 'coreCS',
    LANGUAGES: 'languages',
    WEB: 'web',
    DATA: 'data',
    CLOUD: 'cloud',
    TESTING: 'testing'
};

const DEFAULT_STACK = "General Technical Skills";

/**
 * Extract skills from JD text
 * Returns strict schema: { coreCS: [], languages: [], ... other: [] }
 */
const extractSkills = (text) => {
    const lowerText = text.toLowerCase();
    const extracted = {
        coreCS: [],
        languages: [],
        web: [],
        data: [],
        cloud: [],
        testing: [],
        other: []
    };
    const flatFound = [];

    let foundAny = false;

    Object.entries(SKILLS).forEach(([category, keywords]) => {
        const found = keywords.filter(keyword => {
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            return regex.test(lowerText);
        });

        if (found.length > 0) {
            const key = CATEGORY_KEYS[category];
            extracted[key] = found;
            flatFound.push(...found);
            foundAny = true;
        }
    });

    if (!foundAny) {
        extracted.other = DEFAULT_STACK_SKILLS;
        flatFound.push(...DEFAULT_STACK_SKILLS);
    }

    return { extracted, flatFound };
};

/**
 * Calculate Base Readiness Score
 */
const calculateBaseScore = (extractedSkills, company, role, jdText) => {
    let score = 35;

    // Categories present
    const categoryCount = Object.keys(extractedSkills).filter(k => extractedSkills[k].length > 0 && k !== 'other').length;
    score += Math.min(categoryCount * 5, 30);

    // Metadata bonus
    if (company && company.trim().length > 0) score += 10;
    if (role && role.trim().length > 0) score += 10;

    // Length bonus
    if (jdText.length > 800) score += 15;

    return Math.min(score, 100);
};

/**
 * Generate 7-Day Plan (Structured)
 */
const generatePlan7Days = (flatSkills, extractedSkills) => {
    const hasWeb = extractedSkills.web?.length > 0;
    const hasCore = extractedSkills.coreCS?.length > 0;

    // prioritize specific stack if found
    const techStack = flatSkills.filter(s => !DEFAULT_STACK_SKILLS.includes(s));
    const stack = techStack.slice(0, 3).join(', ') || DEFAULT_STACK;

    return [
        {
            day: 'Day 1-2',
            focus: 'Basics + Core CS',
            tasks: [
                'Revise Language Fundamentals (OOP, Syntax)',
                hasCore ? 'Deep dive into OS & DBMS concepts' : 'Review General aptitude and logic',
                'Solve 5 basic implementation problems'
            ]
        },
        {
            day: 'Day 3-4',
            focus: 'DSA + Coding Practice',
            tasks: [
                'Focus on Arrays, Strings, and Maps',
                'Practice 2-pointer and Sliding Window patterns',
                'Solve 3 Medium LeetCode problems daily'
            ]
        },
        {
            day: 'Day 5',
            focus: 'Project + Resume Alignment',
            tasks: [
                `Review projects using ${stack}`,
                'Prepare "Challenges Faced" stories',
                'Optimize resume keywords for this JD'
            ]
        },
        {
            day: 'Day 6',
            focus: 'Mock Interview Questions',
            tasks: [
                'Behavioral questions (STAR method)',
                `Technical deep dive into ${stack}`,
                'Mock interview with a peer or AI'
            ]
        },
        {
            day: 'Day 7',
            focus: 'Revision + Weak Areas',
            tasks: [
                'Review notes and tricky concepts',
                'Rest and mental preparation',
                'Company research (Values, Products)'
            ]
        }
    ];
};

/**
 * Generate Round-wise Checklist (Structured Array)
 */
const generateChecklist = (flatSkills) => {
    const techStack = flatSkills.filter(s => !DEFAULT_STACK_SKILLS.includes(s));
    const stack = techStack.length > 0 ? techStack.join(', ') : 'Java/Python';

    return [
        {
            roundTitle: 'Round 1: Aptitude / Basics',
            items: [
                'Quantitative Aptitude (Time & Work, Probability)',
                'Logical Reasoning (Puzzles, Series)',
                'Verbal Ability',
                'Basic Debugging',
                'Time Complexity analysis'
            ]
        },
        {
            roundTitle: 'Round 2: DSA + Core CS',
            items: [
                'Data Structures (Arrays, Linked Lists, Trees)',
                'Algorithms (Sorting, Searching, Recursion)',
                'OOP concepts',
                'DBMS (SQL Queries, Normalization)',
                'OS (Processes, Threads)'
            ]
        },
        {
            roundTitle: 'Round 3: Tech Interview',
            items: [
                `Discussion on ${stack}`,
                'Project Design choices',
                'System Design basics',
                'Live coding',
                'Clean code practices'
            ]
        },
        {
            roundTitle: 'Round 4: Managerial / HR',
            items: [
                'Why this company?',
                'Strengths/Weaknesses',
                'Conflict resolution',
                'Future goals',
                'Negotiation'
            ]
        }
    ];
};

/**
 * Generate Interview Questions
 */
const generateQuestions = (extractedSkills) => {
    const questions = [];

    // Specific questions based on detected skills
    if (extractedSkills.languages?.some(s => s.includes('java'))) {
        questions.push('Explain the difference between JDK, JRE, and JVM.', 'How does Garbage Collection work in Java?');
    }
    if (extractedSkills.languages?.some(s => s.includes('python'))) {
        questions.push('Explain the difference between list and tuple.', 'How is memory managed in Python?');
    }
    if (extractedSkills.languages?.some(s => s.includes('script'))) { // js, ts
        questions.push('Explain Event Loop and Closures.', 'Difference between == and ===?');
    }
    if (extractedSkills.web?.some(s => s.includes('react'))) {
        questions.push('Explain React Lifecycle methods vs Hooks.', 'How does Virtual DOM work?');
    }
    if (extractedSkills.data?.some(s => s.includes('sql'))) {
        questions.push('Explain Indexing and when it helps.', 'Difference between DELETE and TRUNCATE?');
    }
    if (extractedSkills.coreCS?.length > 0) {
        questions.push('Explain process vs thread.', 'What is Deadlock?');
    }

    // Generic
    const generic = [
        'How would you optimize search in sorted data?',
        'Explain a challenging bug you fixed recently.',
        'Design a URL shortener system (High level).',
        'Check for balanced parentheses.',
        'Explain Polymorphism.',
        'Find Kth largest element.'
    ];

    return [...new Set([...questions, ...generic])].slice(0, 10);
};

// --- Intel Logic ---

const KNOWN_ENTERPRISES = [
    'google', 'amazon', 'facebook', 'meta', 'apple', 'netflix', 'microsoft',
    'tcs', 'infosys', 'wipro', 'accenture', 'cognizant', 'capgemini',
    'jpmorgan', 'goldman sachs', 'morgan stanley', 'adobe', 'salesforce',
    'oracle', 'ibm', 'cisco', 'intel', 'nvidia', 'uber', 'airbnb', 'stripe', 'deloitte', 'pwc', 'ey', 'kpmg'
];

const generateCompanyIntel = (companyName) => {
    const normalize = (companyName || '').toLowerCase().trim();

    let size = 'Startup';
    let industry = 'Technology';
    let focus = 'Rapid feature development, Full-stack ownership, Practical problem solving';

    if (!normalize) return { size, industry, focus };

    if (KNOWN_ENTERPRISES.some(k => normalize.includes(k))) {
        size = 'Enterprise';
        focus = 'Scalability, System Design, Core CS fundamentals, Optimization';
    } else if (normalize.includes('bank') || normalize.includes('financial')) {
        size = 'Enterprise';
        industry = 'FinTech / Banking';
        focus = 'Security, Transaction consistency, High availability';
    } else if (normalize.includes('startup')) {
        size = 'Startup';
    }

    return { size, industry, focus };
};

const generateRoundMapping = (extractedSkills, companyIntel) => {
    const rounds = [];
    const isEnterprise = companyIntel.size === 'Enterprise';
    const flatSkills = Object.values(extractedSkills).flat();
    const techStack = flatSkills.filter(s => !DEFAULT_STACK_SKILLS.includes(s));
    const topStack = techStack.length > 0 ? techStack[0] : 'Coding';

    // Round 1
    if (isEnterprise) {
        rounds.push({
            roundTitle: 'Online Assessment',
            focusAreas: ['Aptitude', 'DSA', 'Core CS'],
            whyItMatters: 'Filters candidates based on raw problem-solving speed.'
        });
    } else {
        rounds.push({
            roundTitle: 'Screening / Take-home',
            focusAreas: ['Practical Implementation', 'Code Quality'],
            whyItMatters: 'Validates ability to build actual features.'
        });
    }

    // Round 2
    if (isEnterprise) {
        rounds.push({
            roundTitle: 'Technical Round 1 (DSA)',
            focusAreas: ['Data Structures', 'Algorithms', 'Edge Cases'],
            whyItMatters: 'Tests algorithmic efficiency and optimization.'
        });
    } else {
        rounds.push({
            roundTitle: `Machine Coding (${topStack.toUpperCase()})`,
            focusAreas: [topStack, 'Framework knowledge', 'Speed'],
            whyItMatters: 'Tests hands-on coding skills in a timed environment.'
        });
    }

    // Round 3
    if (isEnterprise) {
        rounds.push({
            roundTitle: 'System Design / LLD',
            focusAreas: ['Scalability', 'DB Design', 'API Design'],
            whyItMatters: 'Tests architectural understanding.'
        });
    } else {
        rounds.push({
            roundTitle: 'Architecture & Discussion',
            focusAreas: ['Project Deep Dive', 'System Limits', 'Trade-offs'],
            whyItMatters: 'Tests depth of understanding and ownership.'
        });
    }

    // Round 4
    rounds.push({
        roundTitle: 'Managerial / Culture Fit',
        focusAreas: ['Behavioral', 'Culture', 'Growth Mindset'],
        whyItMatters: 'Ensures alignment with company values.'
    });

    return rounds;
};

export const analyzeJD = (jdText, company = '', role = '') => {
    const { extracted, flatFound } = extractSkills(jdText);
    const score = calculateBaseScore(extracted, company, role, jdText);
    const plan = generatePlan7Days(flatFound, extracted);
    const checklist = generateChecklist(flatFound);
    const questions = generateQuestions(extracted);

    // New Phase 3 Calls
    const companyIntel = generateCompanyIntel(company);
    const roundMapping = generateRoundMapping(extracted, companyIntel);

    const now = new Date().toISOString();

    // Strict Schema Return
    return {
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
        company: company || "",
        role: role || "",
        jdText: jdText || "",

        extractedSkills: extracted,
        flatSkills: flatFound, // Helper, redundant but useful for UI

        baseScore: score,
        finalScore: score, // Initially same as base
        skillConfidenceMap: {}, // Empty initially

        plan7Days: plan,
        checklist: checklist,
        questions: questions,

        companyIntel: companyIntel,
        roundMapping: roundMapping
    };
};
