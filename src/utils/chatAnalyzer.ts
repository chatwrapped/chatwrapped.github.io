
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

// Emoji regex
const EMOJI_REGEX = /\p{Emoji}/gu;

// Regex principale per estrarre messaggi WhatsApp con tutti i formati possibili
const WHATSAPP_MESSAGE_REGEX = /(?:\[)?(\d{2}\/\d{2}\/\d{2}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?[\s-]+(?:([^:\n]+):)?\s?(.+?)$/;

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

// Funzione per pulire e normalizzare il contenuto del file prima dell'analisi
function cleanFileContent(fileContent: string): string {
  console.log("Cleaning file content...");
  
  // Rimuove caratteri di controllo invisibili
  let cleanedContent = fileContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  
  // Rimuove spazi bianchi all'inizio e alla fine di ogni riga
  cleanedContent = cleanedContent.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  // Identifica e consolida messaggi multi-line
  const consolidatedLines: string[] = [];
  let currentMessage = "";
  let isMultiline = false;
  const regex = /(?:\[)?(\d{2}\/\d{2}\/\d{2}),\s/;
  
  cleanedContent.split('\n').forEach(line => {
    // Se la riga inizia con un timestamp (data e ora)
    if (regex.test(line)) {
      if (currentMessage) {
        consolidatedLines.push(currentMessage);
      }
      currentMessage = line;
      isMultiline = false;
    } else {
      // È una continuazione del messaggio precedente
      if (currentMessage) {
        currentMessage += " " + line.trim();
        isMultiline = true;
      }
    }
  });
  
  // Aggiungi l'ultimo messaggio se presente
  if (currentMessage) {
    consolidatedLines.push(currentMessage);
  }
  
  console.log(`File pulito: ${consolidatedLines.length} messaggi dopo la pulizia`);
  return consolidatedLines.join('\n');
}

function normalizeMessages(fileContent: string): Array<{ timestamp: Date; username: string; message: string }> {
  console.log("Normalizing messages...");
  
  // Prima puliamo il file
  const cleanedContent = cleanFileContent(fileContent);
  const lines = cleanedContent.split('\n').filter(line => line.trim());
  const normalizedMessages: Array<{ timestamp: Date; username: string; message: string }> = [];

  console.log(`Trovate ${lines.length} righe nel file dopo la pulizia`);
  // Debug: Mostra le prime righe
  console.log("Prime 5 righe dopo pulizia:", lines.slice(0, 5));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Estrai le informazioni dal messaggio
    const match = line.match(WHATSAPP_MESSAGE_REGEX);
    
    if (match) {
      const [, date, time, username, messageContent] = match;
      
      // Skip messaggi di sistema e crittografia
      const lowerMessage = messageContent.toLowerCase().trim();
      
      if (IGNORED_MESSAGES.some(text => lowerMessage.includes(text))) {
        console.log(`Ignorato messaggio di sistema: ${messageContent.substring(0, 30)}...`);
        continue;
      }
      
      // Parse date and time
      const timestamp = parseDateTime(date, time);
      if (!timestamp) {
        console.warn(`Errore nel parsing della data/ora: ${date}, ${time}`);
        continue;
      }
      
      // Controlli per vari tipi di media
      if (MEDIA_PATTERNS.some(pattern => messageContent.includes(pattern))) {
        normalizedMessages.push({
          timestamp,
          username: username ? username.trim() : "System",
          message: "<Media omessi>"
        });
        continue;
      }
      
      // Aggiungi il messaggio normalizzato
      normalizedMessages.push({
        timestamp,
        username: username ? username.trim() : "System",
        message: messageContent.trim()
      });
    } else {
      // Potrebbe essere un messaggio di sistema
      const systemMatch = line.match(WHATSAPP_SYSTEM_REGEX);
      if (systemMatch) {
        const [, date, time, systemMessage] = systemMatch;
        console.log(`Messaggio di sistema ignorato [${date}, ${time}]: ${systemMessage}`);
      } else {
        console.log("Riga non analizzata:", line);
      }
    }
  }

  console.log(`Messaggi normalizzati: ${normalizedMessages.length}`);
  return normalizedMessages;
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
    const secondsMatch = timeParts.length > 2 ? timeParts[2] : "0";
    const second = parseInt(secondsMatch);
    
    console.log(`Transformed: ${year}-${monthIndex+1}-${dayValue} ${hour}:${minute}:${second}`);
    
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
