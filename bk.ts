// Types for chat analysis
export interface ChatAnalysis {
    totalMessages: number;
    mostUsedWord: { word: string; count: number };
    mostUsedEmoji: { emoji: string; count: number };
    timeOfDayStats: { [key: string]: number };
    dayWithMostMessages: { date: string; count: number };
    averageResponseTime: number; // in seconds
    mediaCount: number; // New field for counting media
    userStats: {
        [username: string]: {
            messageCount: number;
            wordCount: number;
            emojiCount: number;
        };
    };
}

// Regular expressions for different chat formats
const WHATSAPP_IOS_REGEX = /^\[(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.*)$/;
const WHATSAPP_ANDROID_REGEX = /^(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.*)$/;
const WHATSAPP_SYSTEM_MESSAGE_REGEX = /^(?:\[\d{2}\/\d{2}\/\d{2,4},\s*\d{1,2}:\d{2}:\d{2}\]|\d{2}\/\d{2}\/\d{2,4},\s*\d{1,2}:\d{2})\s*-\s*(.*)$/;

// Time of day periods
const TIME_PERIODS = {
    morning: { start: 6, end: 12 },
    afternoon: { start: 12, end: 18 },
    evening: { start: 18, end: 22 },
    night: { start: 22, end: 6 }
};

// Emoji regex
const EMOJI_REGEX = /[\p{Emoji}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu;

// Function to normalize messages into a standard JSON format
function normalizeMessages(fileContent: string): Array<{ timestamp: Date; username: string; message: string }> {
    const lines = fileContent.split('\n').filter(line => line.trim());
    const normalizedMessages: Array<{ timestamp: Date; username: string; message: string }> = [];

    for (const line of lines) {
        let match: RegExpMatchArray | null = null;
        let format: 'ios' | 'android' | null = null;

        // Detect format and match the line
        if ((match = line.match(WHATSAPP_IOS_REGEX))) {
            format = 'ios';
        } else if ((match = line.match(WHATSAPP_ANDROID_REGEX))) {
            format = 'android';
        } else if (WHATSAPP_SYSTEM_MESSAGE_REGEX.test(line)) {
            // Skip system messages
            continue;
        } else {
            // Skip invalid lines
            console.warn("No match for line:", line);
            continue;
        }

        const [, date, time, username, message] = match;

        // Skip irrelevant messages
        if (
            message.toLowerCase().includes("i messaggi e le chiamate sono crittografati") ||
            message.toLowerCase().includes("il tuo codice di sicurezza") ||
            message.toLowerCase().includes("<media omessi>") ||
            message.toLowerCase() === "null"
        ) {
            continue;
        }

        // Parse date and time
        const timestamp = parseDateTime(date, time, format);
        if (!timestamp) {
            console.warn("Failed to parse datetime:", date, time);
            continue;
        }

        normalizedMessages.push({
            timestamp,
            username: username.trim(),
            message: message.trim()
        });
    }

    return normalizedMessages;
}

// Main function to analyze chat file
export const analyzeChatFile = (fileContent: string): ChatAnalysis => {
    const normalizedMessages = normalizeMessages(fileContent);

    // Initialize analysis object
    const analysis: ChatAnalysis = {
        totalMessages: 0,
        mostUsedWord: { word: '', count: 0 },
        mostUsedEmoji: { emoji: '', count: 0 },
        timeOfDayStats: { morning: 0, afternoon: 0, evening: 0, night: 0 },
        dayWithMostMessages: { date: '', count: 0 },
        averageResponseTime: 0,
        mediaCount: 0,
        userStats: {}
    };

    // Data structures for analysis
    const wordCounts: Record<string, number> = {};
    const emojiCounts: Record<string, number> = {};
    const dayMessageCounts: Record<string, number> = {};
    const responseTimes: number[] = [];
    const lastMessageTime: Record<string, Date> = {};

    for (const { timestamp, username, message } of normalizedMessages) {
        // Count media messages
        if (message.toLowerCase().includes("<media omessi>")) {
            analysis.mediaCount++;
            continue;
        }

        // Initialize user stats if not exists
        if (!analysis.userStats[username]) {
            analysis.userStats[username] = {
                messageCount: 0,
                wordCount: 0,
                emojiCount: 0
            };
        }

        // Count total messages
        analysis.totalMessages++;
        analysis.userStats[username].messageCount++;

        // Count messages per day
        const dayKey = timestamp.toISOString().split('T')[0];
        dayMessageCounts[dayKey] = (dayMessageCounts[dayKey] || 0) + 1;

        // Time of day analysis
        const hour = timestamp.getHours();
        if (hour >= TIME_PERIODS.morning.start && hour < TIME_PERIODS.morning.end) {
            analysis.timeOfDayStats.morning++;
        } else if (hour >= TIME_PERIODS.afternoon.start && hour < TIME_PERIODS.afternoon.end) {
            analysis.timeOfDayStats.afternoon++;
        } else if (hour >= TIME_PERIODS.evening.start && hour < TIME_PERIODS.evening.end) {
            analysis.timeOfDayStats.evening++;
        } else {
            analysis.timeOfDayStats.night++;
        }

        // Word analysis
        const words = message.toLowerCase().split(/\s+/);
        for (const word of words) {
            const cleanWord = word.replace(/[^\w\sàèéìòù]/g, '').trim();
            if (cleanWord && cleanWord.length >= 3) {
                wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
                analysis.userStats[username].wordCount++;
            }
        }

        // Emoji analysis
        const emojis = extractEmojis(message);
        for (const emoji of emojis) {
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
            analysis.userStats[username].emojiCount++;
        }

        // Calculate response time
        const otherUsers = Object.keys(lastMessageTime).filter(user => user !== username);
        if (otherUsers.length > 0) {
            const lastOtherUserMessage = Math.max(...otherUsers.map(user => lastMessageTime[user].getTime()));
            const responseTime = (timestamp.getTime() - lastOtherUserMessage) / 1000; // in seconds
            if (responseTime > 0 && responseTime < 86400) {
                responseTimes.push(responseTime);
            }
        }

        lastMessageTime[username] = timestamp;
    }

    // Finalize analysis
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    analysis.averageResponseTime = sum / responseTimes.length;

    // Find most used word and emoji
    analysis.mostUsedWord = Object.entries(wordCounts).reduce(
        (max, [word, count]) => (count > max.count ? { word, count } : max),
        { word: '', count: 0 }
    );
    analysis.mostUsedEmoji = Object.entries(emojiCounts).reduce(
        (max, [emoji, count]) => (count > max.count ? { emoji, count } : max),
        { emoji: '', count: 0 }
    );

    // Find the day with the most messages
    analysis.dayWithMostMessages = Object.entries(dayMessageCounts).reduce(
        (max, [date, count]) => (count > max.count ? { date, count } : max),
        { date: '', count: 0 }
    );

    return analysis;
};

// Helper function to parse date and time
function parseDateTime(date: string, time: string, format: 'ios' | 'android'): Date | null {
    try {
        const [day, month, yearOrDay] = date.split('/');
        let year = parseInt(yearOrDay.length === 2 ? `20${yearOrDay}` : yearOrDay);
        const month2 = parseInt(month) - 1;
        const day2 = parseInt(day);

        const [hour, minute, second] = time.split(':').map(part => parseInt(part));
        return new Date(year, month2, day2, hour, minute, second || 0);
    } catch {
        return null;
    }
}

// Helper function to extract emojis from text
function extractEmojis(text: string): string[] {
    return [...text.matchAll(EMOJI_REGEX)].map(match => match[0]);
}