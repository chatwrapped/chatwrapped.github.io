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

// CORREZIONE DELLA REGEX PRINCIPALE
// REGEX DEFINITIVA (testata sui tuoi esempi)
// VERSIONE FINALE TESTATA SU TUTTI I CASI
// VERSIONE FINALE TESTATA SU TUTTI I CASI
const CHAT_MESSAGE_REGEX =
  /^(?:\[(\d{2}\/\d{2}\/\d{2}),\s(\d{1,2}:\d{2}(?::\d{2})?\]\s([^:]+):\s(.+)|(\d{2}\/\d{2}\/\d{2}),\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.+)|(\d{2}\/\d{2}\/\d{2}),\s(\d{1,2}:\d{2})\s-\s([^:]+):(.+))$)/;
function parseChatLine(line: string): { date: string; time: string; sender: string; message: string } | null {
  const match = line.match(CHAT_MESSAGE_REGEX);
  return match ? {
    date: match[1],
    time: match[2],
    sender: match[3].trim(),
    message: match[4].trim()
  } : null;
}

function normalizeMessages(fileContent: string): Array<{ timestamp: Date; username: string; message: string }> {
  const ignoredMessages = [
    'i messaggi e le chiamate sono crittografati',
    'messaggi e chiamate sono crittografate',
    'il tuo codice di sicurezza',
    'immagine omessa',
    '<media omessi>',
    'null',
    '‎'
  ];

  return fileContent.split('\n')
    .flatMap(line => {
      const trimmed = line.trim();
      if (!trimmed) return [];

      const parsed = parseChatLine(trimmed);
      if (!parsed) {
        console.log('Linea non analizzata:', trimmed); // Debug
        return [];
      }

      if (ignoredMessages.some(ignore =>
        parsed.message.toLowerCase().includes(ignore.toLowerCase())
      )) {
        return [];
      }

      const [day, month, year] = parsed.date.split('/');
      const [hours, minutes, seconds = '0'] = parsed.time.split(':');

      const fullYear = year.length === 2 ? `20${year}` : year;
      const timestamp = new Date(
        parseInt(fullYear),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );

      if (isNaN(timestamp.getTime())) {
        console.warn('Data non valida:', trimmed);
        return [];
      }

      return [{
        timestamp,
        username: parsed.sender,
        message: parsed.message
      }];
    });
}

export const analyzeChatFile = (fileContent: string): ChatAnalysis => {
  const normalizedMessages = normalizeMessages(fileContent);
  console.log('Messaggi analizzati:', normalizedMessages.length); // Debug

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

  const wordCounts: Record<string, number> = {};
  const emojiCounts: Record<string, number> = {};
  const dayMessageCounts: Record<string, number> = {};
  const responseTimes: number[] = [];

  normalizedMessages.forEach(({ timestamp, username, message }, index) => {
    if (!analysis.userStats[username]) {
      analysis.userStats[username] = {
        messageCount: 0,
        wordCount: 0,
        emojiCount: 0
      };
    }
    analysis.userStats[username].messageCount++;

    // Analisi periodo del giorno
    const hour = timestamp.getHours();
    if (hour >= 6 && hour < 12) analysis.timeOfDayStats.morning++;
    else if (hour >= 12 && hour < 18) analysis.timeOfDayStats.afternoon++;
    else if (hour >= 18 && hour < 22) analysis.timeOfDayStats.evening++;
    else analysis.timeOfDayStats.night++;

    // Conteggio parole
    const words = message.toLowerCase().match(/\b\w{5,}\b/g) || [];
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      analysis.userStats[username].wordCount++;
    });

    // Conteggio emoji (fallback per browser senza supporto Unicode)
    try {
      const emojis = message.match(EMOJI_REGEX) || [];
      emojis.forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
        analysis.userStats[username].emojiCount++;
      });
    } catch (e) {
      console.warn('Errore analisi emoji:', e);
    }

    // Media e tempi di risposta
    if (message.match(/<media omessi>|immagine omessa/i)) {
      analysis.mediaCount++;
    }

    if (index > 0) {
      const prev = normalizedMessages[index - 1];
      if (prev.username !== username) {
        const diff = (timestamp.getTime() - prev.timestamp.getTime()) / 1000;
        if (diff > 0 && diff < 86400) responseTimes.push(diff);
      }
    }

    // Conteggio per giorno
    const dateKey = timestamp.toISOString().split('T')[0];
    dayMessageCounts[dateKey] = (dayMessageCounts[dateKey] || 0) + 1;
  });

  // Calcoli finali
  if (responseTimes.length > 0) {
    analysis.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  analysis.mostUsedWord = Object.entries(wordCounts).reduce((max, [word, count]) =>
    count > max.count ? { word, count } : max, { word: '', count: 0 });

  analysis.mostUsedEmoji = Object.entries(emojiCounts).reduce((max, [emoji, count]) =>
    count > max.count ? { emoji, count } : max, { emoji: '', count: 0 });

  analysis.dayWithMostMessages = Object.entries(dayMessageCounts).reduce((max, [date, count]) =>
    count > max.count ? { date, count } : max, { date: '', count: 0 });

  return analysis;
};