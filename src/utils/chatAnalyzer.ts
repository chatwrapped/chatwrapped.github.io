
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

// Regex principale per estrarre messaggi WhatsApp con tutti i formati possibili
// - Formato con timestamp completo: [20/11/23, 17:30:20] Username: Message
// - Formato con timestamp senza secondi: [20/11/23, 17:30] Username: Message
// - Formato senza parentesi quadre: 20/11/23, 17:30 - Username: Message
// - Formato nuovo: 20/11/23, 17:30 - Username:Message (senza spazio)


const WHATSAPP_MESSAGE_REGEX = /(?:\[)?(\d{2}\/\d{2}\/\d{2}),\s(\d{1,2}:\d{2}(?::\d{2})?(?: ?[AP]M)?)\]?[\s-]+(?:([^:\n]+):)?\s?([^\n]+(?:\n(?!\d{2}\/\d{2}\/\d{2},).*)*)/g;

// Regex per i messaggi di sistema
const WHATSAPP_SYSTEM_REGEX = /^(?:\[)?(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*-\s*(.+)$/;

// Media message patterns
const MEDIA_PATTERNS = [
  "<media omessi>",
  "immagine omessa",
  "documento omesso",
  "media omesso",
  "‎immagine omessa",
  "‎documento omesso",
  "‎media omesso"
];

// Messaggi da ignorare (comuni in tutte le chat WhatsApp)
const IGNORED_MESSAGES = [
  "i messaggi e le chiamate sono crittografati",
  "messaggi e chiamate sono crittografate",
  "il tuo codice di sicurezza",
  "solo le persone in questa chat",
  "per saperne di più",
  "tocca per saperne di più"
];

function normalizeMessages(fileContent: string): Array<{ timestamp: Date; username: string; message: string }> {
  console.log("Normalizing messages...");
  const lines = fileContent.split('\n').filter(line => line.trim());
  const normalizedMessages: Array<{ timestamp: Date; username: string; message: string }> = [];

  console.log(`Trovate ${lines.length} righe nel file`);
  // Debug: Mostra le prime righe
  console.log("Prime 5 righe:", lines.slice(0, 5));

  let currentMessage = "";
  let currentDate = "";
  let currentTime = "";
  let currentUser = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Verifica se la riga inizia con un timestamp (data e ora)
    const hasTimestamp = line.match(/(?:\[)?(\d{2}\/\d{2}\/\d{2,4}),\s*(\d{1,2}:\d{2})/);

    if (hasTimestamp) {
      // Se abbiamo un messaggio precedente da processare
      if (currentMessage) {
        processMessage(currentDate, currentTime, currentUser, currentMessage, normalizedMessages);
      }

      // Estrai le informazioni dal nuovo messaggio
      const match = line.match(WHATSAPP_MESSAGE_REGEX);

      if (match) {
        const [, date, time, username, messageContent] = match;
        currentDate = date;
        currentTime = time;
        currentUser = username || ""; // Se il username è undefined (messaggio di sistema)
        currentMessage = messageContent || "";
      } else {
        // Potrebbe essere un messaggio di sistema
        const systemMatch = line.match(WHATSAPP_SYSTEM_REGEX);
        if (systemMatch) {
          const [, date, time, systemMessage] = systemMatch;
          // Ignora i messaggi di sistema ma salva data e ora per debug
          console.log(`Messaggio di sistema ignorato [${date}, ${time}]: ${systemMessage}`);
          currentMessage = "";
        } else {
          console.log("Riga non analizzata:", line);
          currentMessage = "";
        }
      }
    } else {
      // Se non ha un timestamp, è una continuazione del messaggio precedente
      if (currentMessage) {
        currentMessage += "\n" + line;
      }
    }
  }

  // Non dimenticare l'ultimo messaggio
  if (currentMessage) {
    processMessage(currentDate, currentTime, currentUser, currentMessage, normalizedMessages);
  }

  console.log(`Messaggi normalizzati: ${normalizedMessages.length}`);
  return normalizedMessages;
}

// Helper function to process a single message
function processMessage(
  date: string,
  time: string,
  username: string,
  message: string,
  normalizedMessages: Array<{ timestamp: Date; username: string; message: string }>
) {
  // Skip messaggi di sistema e crittografia
  const lowerMessage = message.toLowerCase().trim();

  if (IGNORED_MESSAGES.some(text => lowerMessage.includes(text))) {
    console.log(`Ignorato messaggio di sistema: ${message.substring(0, 30)}...`);
    return;
  }

  // Parse date and time
  const timestamp = parseDateTime(date, time);
  if (!timestamp) {
    console.warn(`Errore nel parsing della data/ora: ${date}, ${time}`);
    return;
  }

  // Controlli per vari tipi di media
  if (MEDIA_PATTERNS.some(pattern => message.includes(pattern))) {
    normalizedMessages.push({
      timestamp,
      username: username.trim(),
      message: "<Media omessi>"
    });
    return;
  }

  // Aggiungi il messaggio normalizzato
  normalizedMessages.push({
    timestamp,
    username: username.trim(),
    message: message.trim()
  });
}

// Helper function to parse date and time
function parseDateTime(date: string, time: string): Date | null {
  try {
    console.log(`Parsing date and time: ${date}, ${time}`);

    const [day, month, yearOrDay] = date.split('/');

    // Assicurarsi che year sia un numero a 4 cifre
    let year: number;
    if (yearOrDay.length === 2) {
      year = 2000 + parseInt(yearOrDay);  // Aggiungiamo 2000 per date come 23 -> 2023
    } else {
      year = parseInt(yearOrDay);
    }

    const monthIndex = parseInt(month) - 1;  // In JavaScript i mesi partono da 0
    const dayValue = parseInt(day);

    // Parsing dell'ora
    const timeParts = time.split(':');
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    // Gestione dei secondi (se presenti)
    const secondMatch = timeParts[1]?.match(/(\d{2}):/);
    const second = secondMatch ? parseInt(secondMatch[1]) : (timeParts.length > 2 ? parseInt(timeParts[2]) : 0);

    console.log(`Transformed: ${year}-${monthIndex + 1}-${dayValue} ${hour}:${minute}:${second}`);

    return new Date(year, monthIndex, dayValue, hour, minute, second);
  } catch (error) {
    console.error("Errore durante il parsing della data:", error, date, time);
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
  console.log("Inizio analisi del file");

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

  if (normalizedMessages.length === 0) {
    console.error("Nessun messaggio analizzato! Il file potrebbe essere in un formato non supportato.");
    return analysis;
  }

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
