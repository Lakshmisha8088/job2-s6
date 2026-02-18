
const STORAGE_KEY = 'placement_readiness_history';

export const saveAnalysisResult = (result) => {
    try {
        const history = getAnalysisHistory();
        // Add new result to the beginning
        const updatedHistory = [result, ...history];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        return true;
    } catch (e) {
        console.error('Failed to save analysis result:', e);
        return false;
    }
};

export const getAnalysisHistory = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const rawHistory = JSON.parse(stored);

        // Strict Validation: Filter out corrupt entries
        const validHistory = rawHistory.filter(item => {
            // Essential fields check
            if (!item.id || !item.createdAt || !item.jdText) {
                console.warn('Skipping corrupt history entry:', item);
                return false;
            }
            return true;
        });

        return validHistory;
    } catch (e) {
        console.error('Failed to retrieve analysis history:', e);
        // If critical parse error, return empty to allow app to function (user loses history but avoids crash)
        return [];
    }
};

export const updateAnalysisResult = (id, updates) => {
    try {
        const history = getAnalysisHistory();
        const index = history.findIndex(item => item.id === id);

        if (index === -1) return false;

        // Merge updates into existing item
        history[index] = { ...history[index], ...updates };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history[index];
    } catch (e) {
        console.error('Failed to update analysis result:', e);
        return false;
    }
};

export const clearHistory = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (e) {
        console.error('Failed to clear history:', e);
        return false;
    }
};

export const getAnalysisById = (id) => {
    const history = getAnalysisHistory();
    return history.find(item => item.id === id);
};
