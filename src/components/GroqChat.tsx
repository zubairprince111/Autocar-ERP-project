import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GroqChatProps {
  contextData: any;
}

export default function GroqChat({ contextData }: GroqChatProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello Admin! I have analyzed your real-time data from Supabase. Ask me anything about your sales, inventory, or reports!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      toast.error("Groq API Key missing. Please add VITE_GROQ_API_KEY to your .env file.");
      return;
    }

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are AutoCore AI, an ERP assistant. You have access to the following real-time data from the Supabase database:
              ${JSON.stringify(contextData)}
              Provide detailed analysis, reports, and insights based on this data. Be professional and concise. If asked for monthly or daily reports, calculate them from the 'createdAt' fields in the data provided.`
            },
            ...messages,
            userMessage
          ],
        }),
      });

      const data = await response.json();
      if (data.choices?.[0]?.message) {
        setMessages((prev) => [...prev, data.choices[0].message]);
      } else {
        throw new Error("Invalid response from Groq");
      }
    } catch (error) {
      console.error("Groq Error:", error);
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-xl">
      <CardHeader className="pb-3 border-b border-primary/10">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          AutoCore AI Insights (Groq Powered)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`mt-1 h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {m.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </div>
                  <div className={`rounded-lg p-3 text-xs leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/80 text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="mt-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
                <div className="rounded-lg p-3 text-xs bg-muted/80 text-muted-foreground italic">
                  Analyzing data...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-primary/10 flex gap-2">
          <Input 
            placeholder="Ask AI about sales, inventory or reports..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            className="text-xs h-9"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={isLoading}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
