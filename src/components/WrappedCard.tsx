
import React, { useRef, useState } from "react";
import { ChatAnalysis } from "@/utils/chatAnalyzer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Calendar, Clock, Heart, Laugh, MessageSquare, Star } from "lucide-react";
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
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
        return "bg-gradient-green";
      case "pink":
        return "bg-gradient-pink";
      case "blue":
        return "bg-gradient-blue";
      default:
        return "bg-gradient-purple";
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
    
    // Get top 6 stats
    return stats.slice(0, 6);
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
          className="bg-gradient-purple text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Viola
        </Button>
        <Button
          variant={cardTheme === "green" ? "default" : "outline"}
          onClick={() => setCardTheme("green")}
          className="bg-gradient-green text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Verde
        </Button>
        <Button
          variant={cardTheme === "pink" ? "default" : "outline"}
          onClick={() => setCardTheme("pink")}
          className="bg-gradient-pink text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Rosa
        </Button>
        <Button
          variant={cardTheme === "blue" ? "default" : "outline"}
          onClick={() => setCardTheme("blue")}
          className="bg-gradient-blue text-white border-none hover:opacity-90 text-xs md:text-sm px-3"
        >
          Blu
        </Button>
      </div>

      <div className="phone-mockup mx-auto">
        <div
          ref={cardRef}
          className={`wrapped-card ${getCardClass()}`}
        >
          {/* Spotify-style noise overlay */}
          <div className="noise-overlay"></div>
          
          <div className="relative z-10 mb-6">
            <div className="text-center mb-6 mt-2">
              <h1 className="spotify-big-text">CHAT<br/>WRAPPED</h1>
              <p className="text-sm md:text-base opacity-90 font-medium">La tua chat in numeri</p>
            </div>

            {/* Spotify-style stats */}
            <div className="space-y-3">
              {getDynamicStats().map((stat, index) => (
                <div 
                  key={index} 
                  className="spotify-stat" 
                  style={{ 
                    '--delay': index, 
                    background: 'rgba(255,255,255,0.1)',
                    borderLeft: '4px solid rgba(255,255,255,0.3)'
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-white/10 flex-shrink-0">
                      {stat.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/80">{stat.title}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-xl font-black">{stat.value}</p>
                        {stat.suffix && (
                          <span className="text-sm text-white/80">{stat.suffix}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-xs md:text-sm opacity-70 relative z-10 mt-auto pb-2">
            <p className="font-semibold">ChatWrapped</p>
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
