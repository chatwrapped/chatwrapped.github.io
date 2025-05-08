
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  adSlot?: string;
  adFormat?: "horizontal" | "vertical" | "rectangle";
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({
  adSlot = "auto",
  adFormat = "horizontal",
  className,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Try to reload ads when component mounts
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("Ad loading error:", e);
      }
    }
  }, []);

  if (!isClient) return null;

  return (
    <div className={cn(
      "overflow-hidden bg-white/10 backdrop-blur-sm rounded-md",
      "border border-white/20 shadow-sm text-center",
      {
        "h-[90px] w-full": adFormat === "horizontal",
        "h-[600px] w-[300px]": adFormat === "vertical",
        "h-[250px] w-[300px]": adFormat === "rectangle",
      },
      className
    )}>
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-muted-foreground">Spazio pubblicitario</span>
      </div>
      {/* Real ad would go here in production */}
    </div>
  );
};

export default AdBanner;
