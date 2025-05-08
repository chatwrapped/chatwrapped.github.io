
import React from "react";
import { ChatAnalysis } from "@/utils/chatAnalyzer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download } from "lucide-react";

interface ChatStatsProps {
  analysis: ChatAnalysis;
  onGenerateCard: () => void;
}

const COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981"];

const ChatStats: React.FC<ChatStatsProps> = ({ analysis, onGenerateCard }) => {
  const formatTimeOfDay = (timeOfDay: string): string => {
    const mapping: Record<string, string> = {
      morning: "Mattina (6-12)",
      afternoon: "Pomeriggio (12-18)",
      evening: "Sera (18-22)",
      night: "Notte (22-6)",
    };
    return mapping[timeOfDay] || timeOfDay;
  };

  const formatResponseTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} secondi`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minuti`;
    } else {
      return `${Math.round(seconds / 3600)} ore`;
    }
  };

  const timeOfDayData = Object.keys(analysis.timeOfDayStats).map((key) => ({
    name: formatTimeOfDay(key),
    value: analysis.timeOfDayStats[key as keyof typeof analysis.timeOfDayStats],
  }));

  const userMessageData = Object.keys(analysis.userStats).map((username) => ({
    name: username,
    messages: analysis.userStats[username].messageCount,
  }));

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-primary mb-2">
          Analisi della tua chat
        </h2>
        <p className="text-muted-foreground">
          Ecco cosa abbiamo scoperto dalla tua conversazione
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="time">Tempi</TabsTrigger>
          <TabsTrigger value="users">Utenti</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Messaggi Totali</CardTitle>
                <CardDescription>Numero di messaggi scambiati</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">
                  {analysis.totalMessages}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parola Più Usata</CardTitle>
                <CardDescription>La parola che compare più spesso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">
                  {analysis.mostUsedWord.word}
                </div>
                <p className="text-sm text-muted-foreground">
                  Usata {analysis.mostUsedWord.count} volte
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emoji Più Usata</CardTitle>
                <CardDescription>L'emoji che compare più spesso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {analysis.mostUsedEmoji.emoji || "Nessuna emoji"}
                </div>
                {analysis.mostUsedEmoji.emoji && (
                  <p className="text-sm text-muted-foreground">
                    Usata {analysis.mostUsedEmoji.count} volte
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Medio di Risposta</CardTitle>
                <CardDescription>
                  Quanto tempo ci metti a rispondere in media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">
                  {formatResponseTime(analysis.averageResponseTime)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Periodo del Giorno</CardTitle>
                <CardDescription>Quando scrivete di più</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeOfDayData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {timeOfDayData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Giorno con più messaggi</CardTitle>
                <CardDescription>Il giorno più attivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {new Date(analysis.dayWithMostMessages.date).toLocaleDateString("it-IT", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  {analysis.dayWithMostMessages.count} messaggi
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Messaggi per Utente</CardTitle>
              <CardDescription>Chi scrive di più</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userMessageData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    height={60}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {Object.keys(analysis.userStats).map((username) => (
              <Card key={username}>
                <CardHeader>
                  <CardTitle className="truncate">{username}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Messaggi:</span>
                      <span className="font-medium">
                        {analysis.userStats[username].messageCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parole:</span>
                      <span className="font-medium">
                        {analysis.userStats[username].wordCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emoji:</span>
                      <span className="font-medium">
                        {analysis.userStats[username].emojiCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-10 flex justify-center">
        <Button
          size="lg"
          onClick={onGenerateCard}
          className="group"
        >
          Genera ChatWrapped Card
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default ChatStats;
