// Word Book Service — LocalStorage-based vocabulary storage

const STORAGE_KEY = 'filmtool_wordbook';

/**
 * Get all saved words from LocalStorage.
 * @returns {Array<Object>}
 */
export function getWordBook() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Save a new word/phrase to the word book.
 * @param {Object} entry - { id, english, chinese_explanation, style, savedAt }
 */
export function saveWord(entry) {
    const words = getWordBook();
    const exists = words.some(w => w.english === entry.english);
    if (exists) return false;
    const newEntry = {
        id: Date.now().toString(),
        ...entry,
        savedAt: new Date().toISOString()
    };
    words.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    return true;
}

/**
 * Delete a word from the word book by id.
 * @param {string} id
 */
export function deleteWord(id) {
    const words = getWordBook().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

/**
 * Check if a phrase is already saved.
 * @param {string} english
 * @returns {boolean}
 */
export function isSaved(english) {
    return getWordBook().some(w => w.english === english);
}
