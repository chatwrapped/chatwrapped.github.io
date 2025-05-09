
import React, { useRef, useState, useEffect } from "react";
import { ChatAnalysis } from "@/utils/chatAnalyzer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Calendar, Clock, Heart, Laugh, MessageSquare, Music, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import html2canvas from "html2canvas";
import RewardedAd from "@/components/RewardedAd";

interface WrappedCardProps {
  analysis: ChatAnalysis;
  onBack: () => void;
}

const WrappedCard: React.FC<WrappedCardProps> = ({ analysis, onBack }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTheme, setCardTheme] = useState<string>("purple");
  const [animationStarted, setAnimationStarted] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Start animation after component mount
    setTimeout(() => {
      setAnimationStarted(true);
    }, 300);
  }, []);

  // Helper functions
  const formatResponseTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} secondi`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minuti`;
    } else {
      return `${Math.round(seconds / 3600)} ore`;
    }
  };

  const getTimeOfDayStats = () => {
    const timeOfDay = Object.entries(analysis.timeOfDayStats).reduce(
      (max, [key, value]) => (value > max.value ? { key, value } : max),
      { key: "", value: 0 }
    );

    const periodMap: Record<string, string> = {
      morning: "mattina",
      afternoon: "pomeriggio",
      evening: "sera",
      night: "notte",
    };

    return periodMap[timeOfDay.key];
  };

  const getMostFrequentUsers = () => {
    return Object.entries(analysis.userStats)
      .sort(([, a], [, b]) => b.messageCount - a.messageCount)
      .map(([name]) => name);
  };

  const getMostActiveDay = () => {
    if (!analysis.dayWithMostMessages.date) return "";

    const date = new Date(analysis.dayWithMostMessages.date);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('it-IT', options);
  };

  const getTotalWords = () => {
    return Object.values(analysis.userStats).reduce(
      (sum, user) => sum + user.wordCount, 0
    );
  };

  const getTotalEmojis = () => {
    return Object.values(analysis.userStats).reduce(
      (sum, user) => sum + user.emojiCount, 0
    );
  };

  const getMessagesPerDay = () => {
    // Average messages per day (assume 30 days period)
    return Math.round(analysis.totalMessages / 30);
  };

  const getAvgMessagesPerUser = () => {
    const userCount = Object.keys(analysis.userStats).length;
    return userCount > 0 ? Math.round(analysis.totalMessages / userCount) : 0;
  };

  const getRandomFunFact = () => {
    const funFacts = [
      analysis.totalMessages > 1000 
        ? `Con ${analysis.totalMessages} messaggi, avreste potuto scrivere un piccolo libro!` 
        : `${analysis.totalMessages} messaggi, una conversazione piacevole!`,
      
      analysis.averageResponseTime < 60 
        ? "Rispondete quasi istantaneamente! Siete sempre connessi." 
        : "A volte ci mettete un po' a rispondere... forse state riflettendo?",
      
      analysis.mostUsedEmoji.emoji 
        ? `${analysis.mostUsedEmoji.emoji} è la vostra emoji preferita! La usate per esprimere ${getEmojiMood(analysis.mostUsedEmoji.emoji)}` 
        : "Non usate molte emoji... preferite le parole!",
      
      analysis.mostUsedWord.word 
        ? `"${analysis.mostUsedWord.word}" compare davvero spesso nei vostri discorsi!` 
        : "Le vostre conversazioni sono molto varie e diversificate!",
      
      getTimeOfDayStats() === "notte" 
        ? "Siete nottambuli! Le vostre conversazioni più intense avvengono di notte." 
        : `Vi piace chattare di ${getTimeOfDayStats()}. È il vostro momento preferito!`,
      
      getTotalWords() > 5000 
        ? `Avete scritto ${getTotalWords()} parole! Sarebbe un saggio universitario!` 
        : `${getTotalWords()} parole: sintetici ma efficaci!`,
      
      getTotalEmojis() > 100 
        ? `${getTotalEmojis()} emoji! Siete veri artisti dell'espressività digitale!` 
        : `Solo ${getTotalEmojis()} emoji. Preferite le parole ai simboli!`
    ];
    
    // Prendi un fatto casuale dalla lista
    return funFacts[Math.floor(Math.random() * funFacts.length)];
  };

  const getEmojiMood = (emoji: string) => {
    // Semplice mappa di alcune emoji comuni
    const emojiMoods: Record<string, string> = {
      "😂": "divertimento",
      "❤️": "affetto",
      "😍": "ammirazione",
      "👍": "approvazione",
      "🙏": "gratitudine",
      "🥰": "amore",
      "😊": "felicità",
      "🔥": "entusiasmo",
      "😭": "emozione",
      "😘": "affetto"
    };
    
    return emojiMoods[emoji] || "le tue emozioni";
  };

  const downloadCard = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          backgroundColor: null,
          logging: false
        });

        const image = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement("a");
        link.href = image;
        link.download = "ChatWrapped.jpg";
        link.click();

        toast({
          title: "Card scaricata con successo!",
          description: "Ora puoi condividerla sui social media",
        });
      } catch (error) {
        console.error("Error generating image:", error);
        toast({
          title: "Errore durante il download",
          description: "Si è verificato un problema durante la generazione dell'immagine",
          variant: "destructive",
        });
      }
    }
  };

  const getCardClass = () => {
    switch (cardTheme) {
      case "green":
        return "bg-spotify-green";
      case "pink":
        return "bg-spotify-pink";
      case "blue":
        return "bg-spotify-blue";
      case "orange":
        return "bg-spotify-orange";
      default:
        return "bg-spotify-purple";
    }
  };

  // Generate dynamic stats with Spotify-like styling
  const getDynamicStats = () => {
    const users = getMostFrequentUsers();
    const mostActiveUser = users.length ? users[0] : "nessuno";
    const timeOfDay = getTimeOfDayStats();
    const messagesPerDay = getMessagesPerDay();
    const responseTime = formatResponseTime(analysis.averageResponseTime);
    const totalWords = getTotalWords();
    const totalEmojis = getTotalEmojis();
    const mostActiveDay = getMostActiveDay();
    const avgMessagesPerUser = getAvgMessagesPerUser();
    
    let stats = [
      // Most active user - always first
      {
        icon: <Star className="w-6 h-6 text-yellow-200" />,
        title: "Il protagonista assoluto",
        value: mostActiveUser,
        color: "bg-spotify-purple",
        delay: 0
      },
      
      // Messages count
      {
        icon: <MessageSquare className="w-6 h-6 text-blue-200" />,
        title: "Messaggi totali",
        value: analysis.totalMessages.toLocaleString(),
        suffix: analysis.totalMessages > 1000 ? " 🤯" : "",
        color: "bg-spotify-blue",
        delay: 1
      },
      
      // Messages per day
      {
        icon: <Calendar className="w-6 h-6 text-green-200" />,
        title: "Media giornaliera",
        value: messagesPerDay.toString(),
        suffix: " messaggi",
        color: "bg-spotify-green",
        delay: 2
      },

      // Response time
      {
        icon: <Clock className="w-6 h-6 text-blue-200" />,
        title: "Tempo di risposta",
        value: responseTime,
        color: "bg-spotify-blue",
        delay: 3
      }
    ];
    
    // Favorite word if exists
    if (analysis.mostUsedWord.word) {
      stats.push({
        icon: <Heart className="w-6 h-6 text-pink-200" />,
        title: "Parola preferita",
        value: `"${analysis.mostUsedWord.word}"`,
        suffix: ` (${analysis.mostUsedWord.count}x)`,
        color: "bg-spotify-pink",
        delay: 4
      });
    }
    
    // Emoji if exists
    if (analysis.mostUsedEmoji.emoji) {
      stats.push({
        icon: <span className="text-3xl">{analysis.mostUsedEmoji.emoji}</span>,
        title: "Emoji preferita",
        value: analysis.mostUsedEmoji.emoji,
        suffix: ` (${analysis.mostUsedEmoji.count}x)`,
        color: "bg-spotify-orange",
        delay: 5
      });
    }
    
    // Time of day
    stats.push({
      icon: <Calendar className="w-6 h-6 text-green-200" />,
      title: "Scrivete principalmente di",
      value: timeOfDay,
      color: "bg-spotify-green",
      delay: 6
    });

    // Total words
    stats.push({
      icon: <Award className="w-6 h-6 text-yellow-200" />,
      title: "Parole totali",
      value: totalWords.toLocaleString(),
      color: "bg-spotify-purple",
      delay: 7
    });
    
    // Total emojis if significant
    if (totalEmojis > 50) {
      stats.push({
        icon: <Laugh className="w-6 h-6 text-yellow-200" />,
        title: "Emoji usate",
        value: totalEmojis.toLocaleString(),
        color: "bg-spotify-pink",
        delay: 8
      });
    }

    // Most active day
    if (mostActiveDay) {
      stats.push({
        icon: <Calendar className="w-6 h-6 text-blue-200" />,
        title: "Giorno più attivo",
        value: mostActiveDay,
        color: "bg-spotify-blue",
        delay: 9
      });
    }

    // Get all stats now (8 max)
    return stats.slice(0, 8);
  };

  return (
    <div className="w-full px-4 max-w-md mx-auto animate-fade-in">
      <div className="mb-6 md:mb-8 text-center">
        <h2 className="spotify-medium-text text-primary mb-2">La tua ChatWrapped 2024</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Scaricala e condividila sui social media!
        </p>
      </div>

      <div className="mb-4 md:mb-6 flex flex-wrap justify-center gap-2 md:gap-3">
        <Button
          variant={cardTheme === "purple" ? "default" : "outline"}
          onClick={() => setCardTheme("purple")}
          className="bg-spotify-purple text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Viola
        </Button>
        <Button
          variant={cardTheme === "green" ? "default" : "outline"}
          onClick={() => setCardTheme("green")}
          className="bg-spotify-green text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Verde
        </Button>
        <Button
          variant={cardTheme === "pink" ? "default" : "outline"}
          onClick={() => setCardTheme("pink")}
          className="bg-spotify-pink text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Rosa
        </Button>
        <Button
          variant={cardTheme === "blue" ? "default" : "outline"}
          onClick={() => setCardTheme("blue")}
          className="bg-spotify-blue text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Blu
        </Button>
        <Button
          variant={cardTheme === "orange" ? "default" : "outline"}
          onClick={() => setCardTheme("orange")}
          className="bg-spotify-orange text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Arancio
        </Button>
      </div>

      <div className="phone-mockup mx-auto">
        <div
          ref={cardRef}
          className={`wrapped-card ${getCardClass()}`}
        >
          {/* Spotify-style noise overlay */}
          <div className="noise-overlay"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-6 mt-2">
              <h1 className="spotify-big-text">CHAT<br/>WRAPPED</h1>
              <p className="text-base md:text-lg opacity-90 font-semibold tracking-tight">
                {analysis.totalMessages > 1000 ? "WOW! Che conversazione!" : "La tua chat in numeri"}
              </p>
            </div>

            {/* Dynamic fun fact */}
            <div className="mb-3 px-2">
              <div 
                className="p-4 rounded-xl text-center bg-white/10 backdrop-blur-sm border-l-4 border-white/30 shadow-xl"
                style={{ 
                  animation: animationStarted ? 'scale-in 0.5s ease-out forwards' : 'none',
                  opacity: 0
                }}
              >
                <p className="text-sm md:text-base font-semibold italic">"{getRandomFunFact()}"</p>
              </div>
            </div>

            {/* Spotify-style stats */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 spotify-stats-container">
              {getDynamicStats().map((stat, index) => (
                <div 
                  key={index} 
                  className="spotify-stat flex items-center" 
                  style={{ 
                    '--delay': stat.delay,
                    opacity: animationStarted ? 1 : 0,
                    transform: animationStarted ? 'translateY(0)' : 'translateY(10px)',
                    transition: `all 0.4s ease ${stat.delay * 0.15}s`,
                    background: 'rgba(255,255,255,0.1)',
                  } as React.CSSProperties}
                >
                  <div className="rounded-full p-2 bg-white/15 flex-shrink-0">
                    {stat.icon}
                  </div>
                  <div className="flex-1 ml-3">
                    <p className="text-xs font-medium text-white/90">{stat.title}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl font-black">{stat.value}</p>
                      {stat.suffix && (
                        <span className="text-sm text-white/80">{stat.suffix}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-xs md:text-sm opacity-80 relative z-10 mt-auto pt-4">
            <p className="font-semibold">ChatWrapped 2024</p>
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
        <Button onClick={onBack} variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Statistiche
        </Button>

        <RewardedAd
          onAdCompleted={downloadCard}
          buttonText="Scarica Card"
          size={isMobile ? "sm" : "default"}
        />
      </div>
    </div>
  );
};

export default WrappedCard;
