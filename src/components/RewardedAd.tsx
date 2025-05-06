
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RewardedAdProps {
  onAdCompleted: () => void;
  buttonText: string;
  size?: 'default' | 'sm' | 'lg';
}

const RewardedAd: React.FC<RewardedAdProps> = ({ 
  onAdCompleted, 
  buttonText, 
  size = 'default' 
}) => {
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [adInterval, setAdInterval] = useState<number | null>(null);
  const { toast } = useToast();

  const watchAd = () => {
    setIsWatching(true);
    toast({
      title: "Pubblicità in riproduzione",
      description: "Attendi 20 secondi per sbloccare il download"
    });

    // Simulare il caricamento dell'annuncio con un timer di 20 secondi
    let secondsWatched = 0;
    const interval = window.setInterval(() => {
      secondsWatched += 1;
      setProgress(Math.min(100, (secondsWatched / 20) * 100));
      
      if (secondsWatched >= 20) {
        clearInterval(interval);
        setIsWatching(false);
        onAdCompleted();
        toast({
          title: "Download sbloccato!",
          description: "Grazie per aver visualizzato la pubblicità"
        });
      }
    }, 1000);

    // @ts-ignore - TypeScript non conosce il tipo di setInterval
    setAdInterval(interval);
  };

  // Se siamo in ambiente di sviluppo, eseguiamo direttamente l'azione
  const handleClick = () => {
    if (process.env.NODE_ENV === 'development') {
      onAdCompleted();
      return;
    }
    
    // In ambiente di produzione, mostra la rewarded ad
    watchAd();
  };

  return (
    <>
      {isWatching ? (
        <div className="w-full max-w-xs mx-auto">
          <div className="mb-2 flex justify-between text-xs">
            <span>Pubblicità in riproduzione...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-center mt-2 text-muted-foreground">
            Attendi il completamento per sbloccare il download
          </p>
        </div>
      ) : (
        <Button onClick={handleClick} className="gap-2" size={size}>
          <Download className="h-4 w-4" />
          {buttonText}
        </Button>
      )}
    </>
  );
};

export default RewardedAd;
