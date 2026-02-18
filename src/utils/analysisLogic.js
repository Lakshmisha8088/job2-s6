
// Skill Dictionaries
const SKILLS = {
    CORE_CS: ['dsa', 'oop', 'dbms', 'os', 'networks', 'operating systems', 'computer networks', 'data structures', 'algorithms'],
    LANGUAGES: ['java', 'python', 'javascript', 'typescript', 'c', 'c++', 'c#', 'go', 'ruby', 'swift', 'kotlin', 'php'],
    WEB: ['react', 'next.js', 'node.js', 'express', 'rest', 'graphql', 'html', 'css', 'tailwind', 'redux', 'vue', 'angular'],
    DATA: ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'nosql', 'oracle'],
    CLOUD: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'linux', 'devops', 'jenkins', 'git'],
    TESTING: ['selenium', 'cypress', 'playwright', 'junit', 'pytest', 'jest', 'mocha']
};

const ALL_SKILLS = Object.values(SKILLS).flat();

const CATEGORY_NAMES = {
    CORE_CS: 'Core CS',
    LANGUAGES: 'Languages',
    WEB: 'Web Development',
    DATA: 'Data & Databases',
    CLOUD: 'Cloud & DevOps',
    TESTING: 'Testing'
};

const DEFAULT_STACK = "General fresher stack";

/**
 * Extract skills from JD text
 */
const extractSkills = (text) => {
    const lowerText = text.toLowerCase();
    const extracted = {};
    const flatFound = [];

    Object.entries(SKILLS).forEach(([category, keywords]) => {
        const found = keywords.filter(keyword => {
            // Whole word matching mostly, but some tech names are unique enough
            // Escape special chars for regex
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            return regex.test(lowerText);
        });

        if (found.length > 0) {
            extracted[CATEGORY_NAMES[category]] = found;
            flatFound.push(...found);
        }
    });

    return { extracted, flatFound };
};

/**
 * Calculate Readiness Score
 * Start 35.
 * +5 per detected category present (max 30).
 * +10 if company name provided.
 * +10 if role provided.
 * +10 if JD length > 800 chars.
 * Cap at 100.
 */
const calculateScore = (extractedSkills, company, role, jdText) => {
    let score = 35;

    // Categories present
    const categoryCount = Object.keys(extractedSkills).length;
    score += Math.min(categoryCount * 5, 30);

    // Metadata bonus
    if (company && company.trim().length > 0) score += 10;
    if (role && role.trim().length > 0) score += 10;

    // Length bonus
    if (jdText.length > 800) score += 10;

    return Math.min(score, 100);
};

/**
 * Generate 7-Day Plan
 */
const generatePlan = (flatSkills, extractedSkills) => {
    const hasWeb = extractedSkills[CATEGORY_NAMES.WEB]?.length > 0;
    const hasData = extractedSkills[CATEGORY_NAMES.DATA]?.length > 0;
    const hasCore = extractedSkills[CATEGORY_NAMES.CORE_CS]?.length > 0;

    // prioritize specific stack if found
    const stack = flatSkills.slice(0, 3).join(', ') || DEFAULT_STACK;

    return [
        { day: 'Day 1-2', focus: 'Basics + Core CS', items: ['Revise Language Fundamentals (OOP, Syntax)', hasCore ? 'Deep dive into OS & DBMS concepts' : 'Review General aptitude and logic', 'Solve 5 basic implementation problems'] },
        { day: 'Day 3-4', focus: 'DSA + Coding Practice', items: ['Focus on Arrays, Strings, and Maps', 'Practice 2-pointer and Sliding Window patterns', 'Solve 3 Medium LeetCode problems daily'] },
        { day: 'Day 5', focus: 'Project + Resume Alignment', items: [`Review projects using ${stack}`, 'Prepare "Challenges Faced" stories', 'Optimize resume keywords for this JD'] },
        { day: 'Day 6', focus: 'Mock Interview Questions', items: ['Behavioral questions (STAR method)', `Technical deep dive into ${stack}`, 'Mock interview with a peer or AI'] },
        { day: 'Day 7', focus: 'Revision + Weak Areas', items: ['Review notes and tricky concepts', 'Rest and mental preparation', 'Company research (Values, Products)'] }
    ];
};

/**
 * Generate Round-wise Checklist
 */
const generateChecklist = (flatSkills) => {
    const stack = flatSkills.length > 0 ? flatSkills.join(', ') : 'Java/Python';

    return {
        'Round 1: Aptitude / Basics': [
            'Quantitative Aptitude (Time & Work, Probability)',
            'Logical Reasoning (Puzzles, Series)',
            'Verbal Ability (Reading Comprehension)',
            'Basic Debugging / Output prediction',
            'Time Complexity analysis'
        ],
        'Round 2: DSA + Core CS': [
            'Data Structures (Arrays, Linked Lists, Trees)',
            'Algorithms (Sorting, Searching, Recursion)',
            'Object Oriented Programming concepts',
            'DBMS (SQL Queries, Normalization)',
            'Operating Systems (Processes, Threads, Memory Mgmt)'
        ],
        'Round 3: Tech Interview': [
            `Deep discussion on ${stack}`,
            'Project Architecture and Design choices',
            'Rest API / System Design basics',
            'Live coding / pair programming',
            'Code optimization and clean code practices'
        ],
        'Round 4: Managerial / HR': [
            'Why this company? / Why this role?',
            'Strengths and Weaknesses',
            'Situation handling (Conflict resolution)',
            'Future goals (Short term / Long term)',
            'Salary expectations and negotiation'
        ]
    };
};

/**
 * Generate Interview Questions
 */
const generateQuestions = (extractedSkills) => {
    const questions = [];

    // Specific questions based on detected skills
    if (extractedSkills[CATEGORY_NAMES.LANGUAGES]?.some(s => s.includes('java'))) {
        questions.push('Explain the difference between JDK, JRE, and JVM.', 'How does Garbage Collection work in Java?');
    }
    if (extractedSkills[CATEGORY_NAMES.LANGUAGES]?.some(s => s.includes('python'))) {
        questions.push('Explain the difference between list and tuple.', 'How is memory managed in Python?');
    }
    if (extractedSkills[CATEGORY_NAMES.LANGUAGES]?.some(s => s.includes('script'))) { // js, ts
        questions.push('Explain Event Loop and Closures.', 'Difference between == and ===?');
    }
    if (extractedSkills[CATEGORY_NAMES.WEB]?.some(s => s.includes('react'))) {
        questions.push('Explain React Lifecycle methods vs Hooks.', 'How does Virtual DOM work?');
    }
    if (extractedSkills[CATEGORY_NAMES.DATA]?.some(s => s.includes('sql'))) {
        questions.push('Explain Indexing and when it helps.', 'Difference between DELETE and TRUNCATE?');
    }
    if (extractedSkills[CATEGORY_NAMES.CORE_CS]?.length > 0) {
        questions.push('Explain the difference between Process and Thread.', 'What is Deadlock and how to prevent it?');
    }

    // Fill remaining with generic high-probability questions
    const generic = [
        'How would you optimize search in sorted data?',
        'Explain a challenging bug you fixed recently.',
        'Design a URL shortener system (High level).',
        'Check for balanced parentheses in a string.',
        'Explain the concept of Polymorphism with real-world example.',
        'Find the Kth largest element in an array.'
    ];

    // Merge and unique, slice 10
    const finalQs = [...new Set([...questions, ...generic])].slice(0, 10);
    return finalQs;
};

// --- New Intel Logic (Phase 3) ---

const KNOWN_ENTERPRISES = [
    'google', 'amazon', 'facebook', 'meta', 'apple', 'netflix', 'microsoft',
    'tcs', 'infosys', 'wipro', 'accenture', 'cognizant', 'capgemini',
    'jpmorgan', 'goldman sachs', 'morgan stanley', 'adobe', 'salesforce',
    'oracle', 'ibm', 'cisco', 'intel', 'nvidia', 'uber', 'airbnb', 'stripe', 'deloitte', 'pwc', 'ey', 'kpmg'
];

const generateCompanyIntel = (companyName) => {
    const normalize = (companyName || '').toLowerCase().trim();

    // Defaults
    let size = 'Startup';
    let industry = 'Technology';
    let focus = 'Rapid feature development, Full-stack ownership, Practical problem solving';

    if (!normalize) return { size, industry, focus };

    // Heuristics
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
    const topStack = flatSkills.length > 0 ? flatSkills[0] : 'Coding';

    // Round 1
    if (isEnterprise) {
        rounds.push({
            name: 'Online Assessment',
            type: 'Screening',
            desc: '60-90 min coding test on HackerRank/CodeSignal',
            purpose: 'Filters candidates based on raw DSA / Aptitude skills.'
        });
    } else {
        rounds.push({
            name: 'Screening / Take-home',
            type: 'Practical',
            desc: 'Resume screen followed by a practical coding task via email',
            purpose: 'Validates ability to build actual features, not just invert binary trees.'
        });
    }

    // Round 2
    if (isEnterprise) {
        rounds.push({
            name: 'Technical Round 1 (DSA)',
            type: 'Technical',
            desc: 'Live coding: Trees, Graphs, DP, or Array manipulation',
            purpose: 'Tests algorithmic thinking and edge-case handling.'
        });
    } else {
        rounds.push({
            name: `Machine Coding (${topSkill = topStack.toUpperCase()})`,
            type: 'Technical',
            desc: `Build a small feature using ${topStack} in 1 hour`,
            purpose: 'Tests coding speed, cleanliness, and framework knowledge.'
        });
    }

    // Round 3
    if (isEnterprise) {
        rounds.push({
            name: 'System Design / Low Level Design',
            type: 'Design',
            desc: 'Design a parking lot, rate limiter, or twitter feed',
            purpose: 'Tests ability to structure scalable systems (LLD for freshers).'
        });
    } else {
        rounds.push({
            name: 'Architecture & Discussion',
            type: 'Design',
            desc: 'Discuss past projects and potential system improvements',
            purpose: 'Tests depth of understanding and ownership.'
        });
    }

    // Round 4
    rounds.push({
        name: 'Managerial / Culture Fit',
        type: 'Behavioral',
        desc: 'Discussion with Engineering Manager',
        purpose: 'Ensures you share the company values and have a growth mindset.'
    });

    return rounds;
};

export const analyzeJD = (jdText, company = '', role = '') => {
    const { extracted, flatFound } = extractSkills(jdText);
    const score = calculateScore(extracted, company, role, jdText);
    const plan = generatePlan(flatFound, extracted);
    const checklist = generateChecklist(flatFound);
    const questions = generateQuestions(extracted);

    // New Phase 3 Calls
    const companyIntel = generateCompanyIntel(company);
    const roundMapping = generateRoundMapping(extracted, companyIntel);

    return {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        company,
        role,
        jdText,
        extractedSkills: extracted,
        flatSkills: flatFound,
        readinessScore: score,
        plan,
        checklist,
        questions,
        companyIntel,
        roundMapping
    };
};
