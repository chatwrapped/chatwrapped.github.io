
// Types for chat analysis
export interface ChatAnalysis {
  totalMessages: number;
  mostUsedWord: { word: string; count: number };
  mostUsedEmoji: { emoji: string; count: number };
  timeOfDayStats: { [key: string]: number };
  dayWithMostMessages: { date: string; count: number };
  averageResponseTime: number;
  mediaCount: number;
  userStats: {
    [username: string]: {
      messageCount: number;
      wordCount: number;
      emojiCount: number;
    };
  };
}

// Time periods
const TIME_PERIODS = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 22 },
  night: { start: 22, end: 6 }
};

// Emoji regex (compatibile con tutti i browser)
const EMOJI_REGEX = /\p{Emoji}/gu;

// REGEX aggiornate per supportare tutti i formati
// 1. WhatsApp iOS formato originale: [dd/mm/yy, HH:MM:SS] Username: Message
// 2. WhatsApp Android formato originale: dd/mm/yy, HH:MM - Username: Message
// 3. Nuovo formato: dd/mm/yy, HH:MM - Username: Message (senza spazio dopo i due punti)
const WHATSAPP_IOS_REGEX = /^\[(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)$/;
const WHATSAPP_ANDROID_REGEX = /^(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*([^:]+):\s*(.*)$/;
const WHATSAPP_NEW_FORMAT_REGEX = /^(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*([^:]+):(.*)$/;
const WHATSAPP_SYSTEM_MESSAGE_REGEX = /^(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(.+)$/;

function normalizeMessages(fileContent: string): Array<{ timestamp: Date; username: string; message: string }> {
  const lines = fileContent.split('\n').filter(line => line.trim());
  const normalizedMessages: Array<{ timestamp: Date; username: string; message: string }> = [];

  // Messaggi da ignorare (comuni in tutte le chat WhatsApp)
  const ignoredMessages = [
    'i messaggi e le chiamate sono crittografati',
    'messaggi e chiamate sono crittografate',
    'il tuo codice di sicurezza',
    'solo le persone in questa chat',
    'per saperne di più',
    'tocca per saperne di più'
  ];

  for (const line of lines) {
    let match: RegExpMatchArray | null = null;
    let format: 'ios' | 'android' | 'new' | 'system' | null = null;

    // Detect format and match the line
    if ((match = line.match(WHATSAPP_IOS_REGEX))) {
      format = 'ios';
    } else if ((match = line.match(WHATSAPP_ANDROID_REGEX))) {
      format = 'android';
    } else if ((match = line.match(WHATSAPP_NEW_FORMAT_REGEX))) {
      format = 'new';
    } else if ((match = line.match(WHATSAPP_SYSTEM_MESSAGE_REGEX))) {
      // È un messaggio di sistema, lo ignoriamo
      continue;
    } else {
      // Per debug
      console.log("Riga non analizzata:", line);
      continue;
    }

    // Estrai i componenti dal match in base al formato
    let date: string, time: string, username: string, message: string;
    
    if (format === 'ios') {
      [, date, time, username, message] = match;
    } else if (format === 'android') {
      [, date, time, username, message] = match;
    } else if (format === 'new') {
      [, date, time, username, message] = match;
    } else {
      continue; // Non dovrebbe mai accadere
    }

    // Skip messaggi di sistema e crittografia
    if (ignoredMessages.some(text => 
        (message && message.toLowerCase().includes(text.toLowerCase())) ||
        (username && username.toLowerCase().includes(text.toLowerCase()))
    )) {
      continue;
    }

    // Parse date and time
    const timestamp = parseDateTime(date, time);
    if (!timestamp) {
      console.warn("Errore nel parsing della data/ora:", date, time);
      continue;
    }

    // Controllo per i messaggi contenenti media
    if (message.includes("<Media omessi>")) {
      normalizedMessages.push({
        timestamp,
        username: username.trim(),
        message: "<Media omessi>"
      });
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

// Helper function to parse date and time
function parseDateTime(date: string, time: string): Date | null {
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
  try {
    return [...text.matchAll(EMOJI_REGEX)].map(match => match[0]);
  } catch (error) {
    console.warn("Errore nell'estrazione emoji:", error);
    return [];
  }
}

export const analyzeChatFile = (fileContent: string): ChatAnalysis => {
  const normalizedMessages = normalizeMessages(fileContent);
  console.log('Messaggi analizzati:', normalizedMessages.length); // Debug

  // Initialize analysis object
  const analysis: ChatAnalysis = {
    totalMessages: normalizedMessages.length,
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
    if (message === "<Media omessi>") {
      analysis.mediaCount++;
      
      // Aggiungiamo comunque il messaggio ai conteggi dell'utente
      if (!analysis.userStats[username]) {
        analysis.userStats[username] = {
          messageCount: 0,
          wordCount: 0,
          emojiCount: 0
        };
      }
      analysis.userStats[username].messageCount++;
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

    // Count messages per user
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
  if (responseTimes.length > 0) {
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    analysis.averageResponseTime = sum / responseTimes.length;
  }

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
