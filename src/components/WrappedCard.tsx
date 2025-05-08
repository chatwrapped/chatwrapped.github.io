import React, { useRef, useState } from "react";
import { ChatAnalysis } from "@/utils/chatAnalyzer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Star, MessageSquare, Calendar } from "lucide-react";
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

  const users = getMostFrequentUsers();
  const mostActiveUser = users.length ? users[0] : "nessuno";
  const secondMostActiveUser = users.length > 1 ? users[1] : "";

  // Make sure card is always responsive and fits well on mobile
  const phoneSize = "w-full h-auto min-h-[70vh] max-w-md";

  return (
    <div className="w-full px-4 max-w-md mx-auto animate-fade-in">

      <div className="mb-6 md:mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">La tua ChatWrapped</h2>
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

      <div className={`phone-mockup mx-auto ${phoneSize}`}>

        <div
          ref={cardRef}
          className={`wrapped-card text-white ${getCardClass()}`}
        >
          <div className="mb-auto">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-black mb-1 md:mb-2">ChatWrapped</h1>
              <p className="text-xs md:text-sm opacity-70">La tua chat in una card</p>
            </div>

            {/* Stats with icons */}
            <div className="space-y-5 md:space-y-6">
              <div className="stat-highlight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 text-yellow-200" />
                <span>
                  Hai scambiato <span className="text-yellow-200 font-black">{analysis.totalMessages}</span> messaggi
                </span>
              </div>

              <div className="stat-highlight flex items-center gap-2">
                <Star className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 text-yellow-200" />
                {secondMostActiveUser && (
                  <span>
                    <span className="text-yellow-200 font-black">{mostActiveUser}</span> è più attivo/a nella chat
                  </span>
                )}
              </div>

              <div className="stat-highlight flex items-center gap-2">
                <Heart className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 text-yellow-200" />
                <span>
                  La parola preferita è stata <span className="text-yellow-200 font-black">"{analysis.mostUsedWord.word}"</span>
                  <div className="text-sm md:text-base font-normal opacity-70">
                    L'hai usata {analysis.mostUsedWord.count} volte
                  </div>
                </span>
              </div>

              {analysis.mostUsedEmoji.emoji && (
                <div className="stat-highlight flex items-center gap-2">
                  <span className="text-2xl md:text-3xl">{analysis.mostUsedEmoji.emoji}</span>
                  <span>
                    L' emoji preferita
                    <div className="text-sm md:text-base font-normal opacity-70">
                      Usata {analysis.mostUsedEmoji.count} volte
                    </div>
                  </span>
                </div>
              )}

              <div className="stat-highlight flex items-center gap-2">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 text-yellow-200" />
                <span>
                  Ami chattare di <span className="text-yellow-200 font-black">{getTimeOfDayStats()}</span>
                </span>
              </div>

              <div className="stat-highlight">
                Tempo di risposta medio <span className="text-yellow-200 font-black">{formatResponseTime(analysis.averageResponseTime)}</span>
              </div>

              {/* Additional statistics */}
              <div className="stat-highlight">
                Avete scritto un totale di <span className="text-yellow-200 font-black">{getTotalWords()}</span> parole
              </div>

              {getMostActiveDay() && (
                <div className="stat-highlight">
                  Il giorno più attivo è stato <span className="text-yellow-200 font-black">{getMostActiveDay()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-xs md:text-sm opacity-70 mt-4 md:mt-6">
            Generato con ChatWrapped
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
        <Button onClick={onBack} variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Statistiche
        </Button>

        {/* Sostituiamo il pulsante di download con RewardedAd */}
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
