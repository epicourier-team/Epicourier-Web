"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    role: "user" | "agent";
    content: string;
    tool_calls?: any[];
}

export default function AgentPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "agent",
            content: "Hello! I'm your Epicourier AI Assistant. How can I help you today? I can find recipes, add meals to your calendar, or log your health metrics.",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Fetch history on load
    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/agent/history?user_id=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.history && data.history.length > 0) {
                        // Prepend greeting if needed, or just replace
                        const historyMsgs = data.history.map((h: any) => ({
                            role: h.role,
                            content: h.content,
                            tool_calls: h.tool_calls
                        }));
                        setMessages((prev) => {
                            // Keep initial greeting if history is empty, otherwise show history
                            return historyMsgs;
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load history:", error);
            }
        };
        fetchHistory();
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/agent/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    message: userMessage.content,
                    history: messages
                        .filter(m => m.role !== "agent" || m.content !== "Hello! I'm your Epicourier AI Assistant. How can I help you today? I can find recipes, add meals to your calendar, or log your health metrics.")
                        .slice(-10)
                        .map(m => ({
                            role: m.role === "agent" ? "model" : "user",
                            parts: [m.content + (m.tool_calls ? `\n\nContext from tools: ${JSON.stringify(m.tool_calls)}` : "")]
                        }))
                }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            const data = await res.json();
            const agentMessage: Message = {
                role: "agent",
                content: data.response,
                tool_calls: data.tool_calls
            };

            setMessages((prev) => [...prev, agentMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                { role: "agent", content: "Sorry, I encountered an error. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-4">
                <Bot className="h-6 w-6 text-emerald-400" />
                <h1 className="text-2xl font-bold text-neutral-100">AI Assistant</h1>
            </div>

            <div className="flex-1 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="flex flex-col gap-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                }`}
                        >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 ${msg.role === "user" ? "bg-emerald-900 text-emerald-100" : "bg-blue-900 text-blue-100"}`}>
                                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>

                            <div
                                className={`flex max-w-[80%] flex-col rounded-lg px-4 py-2 text-sm ${msg.role === "user"
                                    ? "bg-emerald-600/20 text-emerald-50"
                                    : "bg-neutral-800 text-neutral-200"
                                    }`}
                            >
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                {msg.tool_calls && msg.tool_calls.length > 0 && (
                                    <div className="mt-2 text-xs text-neutral-500 font-mono">
                                        Action performed: {msg.tool_calls.map((t: any) => t.tool).join(", ")}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 flex-row">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-blue-900 text-blue-100">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Considering...
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Ask me to find recipes, add to calendar..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="bg-neutral-800 border-neutral-700 text-neutral-100 focus-visible:ring-emerald-500"
                />
                <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
