
import React, { useState, useEffect } from "react";
import FileUploader from "@/components/FileUploader";
import { analyzeChatFile, ChatAnalysis } from "@/utils/chatAnalyzer";
import ChatStats from "@/components/ChatStats";
import WrappedCard from "@/components/WrappedCard";
import { useToast } from "@/components/ui/use-toast";
import { Github, Copyright, Info } from "lucide-react";
import AdBanner from "@/components/AdBanner";

const Index = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCard, setShowCard] = useState<boolean>(false);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  // Aggiungiamo lo script di Google AdSense al caricamento della pagina
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleFileUpload = async (content: string) => {
    setIsLoading(true);
    setFileContent(content);

    try {
      console.log("Prima riga del file:", content.split('\n')[0]);

      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      const chatAnalysis = analyzeChatFile(content);
      setAnalysis(chatAnalysis);
      console.log("Analisi completata:", chatAnalysis);

      toast({
        title: "Analisi completata",
        description: "I tuoi messaggi sono stati analizzati con successo",
      });
    } catch (error) {
      console.error("Error analyzing chat:", error);
      toast({
        title: "Errore nell'analisi",
        description: "Formato del file non riconosciuto o contenuto non valido",
        variant: "destructive",
      });
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 md:py-6 px-4">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center text-white tracking-tight drop-shadow-md">
            ChatWrapped
          </h1>
          <p className="text-center text-white/90 mt-1 md:mt-2 text-base md:text-lg font-medium">
            Scopri le statistiche delle tue conversazioni
          </p>
        </div>
      </header>

      <main className="flex-1 py-6 md:py-12 px-4">
        <div className="container app-container p-4 md:p-6">
          {!fileContent ? (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8 md:mb-12 animate-fade-in">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3 md:mb-4 tracking-tight">
                  Scopri l' <span className="text-primary">MVP</span> della tua chat
                </h2>
                <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8">
                  Come ottenere il file da WhatsApp?
                </p>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-6 shadow-md border border-white/30">
                  <h3 className="font-semibold text-lg mb-2 text-primary">Come ottenere il file da WhatsApp?</h3>
                  <ol className="text-left space-y-2 text-sm md:text-base">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">1.</span>
                      <span>Apri la chat che vuoi analizzare su WhatsApp</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">2.</span>
                      <span>Su Android clicca sui 3 puntini in alto a destra e cerca esporta chat</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">3.</span>
                      <span>Su iPhone clicca sul nome del contatto in alto, scendi e cerca esporta chat</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">4.</span>
                      <span>Clicca su esporta chat e poi senza media</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">5.</span>
                      <span>Salva il file sul tuo telefono, estrai il file .txt e caricalo su ChatWrapped</span>
                    </li>
                  </ol>
                </div>
              </div>

              <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />

              <div className="mt-8 md:mt-12 space-y-4 md:space-y-6 animate-fade-in">
                <div className="text-xs md:text-sm text-muted-foreground text-center">
                  <p>I tuoi dati rimangono sul tuo computer, nessun dato viene inviato a server esterni.</p>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-16">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
              <p className="text-sm md:text-base text-muted-foreground">Analisi in corso...</p>
            </div>
          ) : showCard && analysis ? (
            <WrappedCard
              analysis={analysis}
              onBack={() => setShowCard(false)}
            />
          ) : analysis ? (
            <ChatStats
              analysis={analysis}
              onGenerateCard={() => setShowCard(true)}
            />
          ) : null}
        </div>
      </main>

      {/* Banner pubblicitario prima del footer */}
      <div className="container mx-auto px-4 my-6">
        <AdBanner adSlot="1234567890" adFormat="horizontal" className="max-w-4xl mx-auto" />
      </div>

      <footer className="py-6 md:py-8 px-4 mt-auto">
        <div className="container max-w-4xl mx-auto">
          <div className="bg-white/30 backdrop-blur-md rounded-lg p-4 md:p-6 shadow-md border border-white/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div>
                <h4 className="text-base font-semibold flex items-center justify-center md:justify-start mb-2 text-primary-foreground">
                  <Info size={18} className="mr-2" />
                  ChatWrapped
                </h4>
                <p className="text-xs md:text-sm text-foreground/90">
                  Crea belle statistiche delle tue conversazioni WhatsApp senza condividere nessun dato personale.
                  Ideale per chi vuole scoprire i propri pattern di comunicazione.
                </p>
              </div>

              <div>
                <h4 className="text-base font-semibold flex items-center justify-center md:justify-start mb-2 text-primary-foreground">
                  <Github size={18} className="mr-2" />
                  Open Source
                </h4>
                <p className="text-xs md:text-sm text-foreground/90">
                  ChatWrapped è un progetto completamente open source.
                  Tutte le analisi avvengono direttamente nel tuo dispositivo.
                </p>
              </div>

              <div>
                <h4 className="text-base font-semibold flex items-center justify-center md:justify-start mb-2 text-primary-foreground">
                  <Copyright size={18} className="mr-2" />
                  Disclaimer
                </h4>
                <p className="text-xs md:text-sm text-foreground/90">
                  <strong>NESSUN DATO VIENE INVIATO FUORI DAL TUO DISPOSITIVO</strong>.
                  Le tue conversazioni rimangono private e sicure.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 flex flex-col md:flex-row justify-between items-center text-xs text-white/80">
              <p>
                © {currentYear} ChatWrapped
              </p>
              <p className="mt-2 md:mt-0">
                Creato per gli appassionati di dati e privacy
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
