import { useEffect, useMemo, useRef, useState } from "react";
import { X, Send, Mic, Plus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useHealthStore, usePlanStore, useUserStore } from "../../store";
import { getInsightsSummary } from "../lib/healthMetrics";
import { chatWithAssistantRequest } from "../lib/assistantApi";

interface Message {
  type: "user" | "ai" | "plan";
  content: string;
  plan?: {
    title: string;
    items: string[];
  };
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  initialPrompt?: string | null;
}

export function AIAssistantModal({ isOpen, onClose, onNavigate, initialPrompt }: AIAssistantModalProps) {
  const records = useHealthStore((state) => state.records);
  const { rhythmItems, planTasks, addPlanTasks } = usePlanStore();
  const profile = useUserStore((state) => state.profile);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "ai",
      content: "Hello! I'm here to help you understand your health and adjust your plan. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const handledInitialPromptRef = useRef<string | null>(null);

  const insightSummary = useMemo(
    () =>
      profile.weight !== null && profile.targetWeight !== null && profile.goal !== null
        ? getInsightsSummary(records, {
            goal: profile.goal,
            weight: profile.weight,
            targetWeight: profile.targetWeight,
          })
        : null,
    [profile.goal, profile.targetWeight, profile.weight, records],
  );

  const quickQuestions = [
    "Why am I tired?",
    "Adjust my plan",
    "What should I eat today?",
    "How to lose weight faster?",
  ];

  const sendMessage = async (text: string, options?: { hiddenUserMessage?: boolean }) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) {
      return;
    }

    const requestMessages: Message[] = [...messages, { type: "user", content: trimmed }];
    const visibleMessages = options?.hiddenUserMessage ? messages : requestMessages;
    setMessages(visibleMessages);
    setInput("");
    setIsSending(true);

    try {
      const result = await chatWithAssistantRequest({
        messages: requestMessages
          .filter((message) => message.type === "user" || message.type === "ai")
          .map((message) => ({
            role: message.type === "user" ? "user" : "assistant",
            content: message.content,
          })),
        records,
        planTasks,
        rhythmItems,
        profile: {
          name: profile.name,
          goal: profile.goal,
          weight: profile.weight,
          targetWeight: profile.targetWeight,
          activityLevel: profile.activityLevel,
        },
        insightSummary:
          insightSummary
            ? {
                score: insightSummary.score,
                fatigueTitle: insightSummary.fatigueTitle,
                subtitle: insightSummary.subtitle,
                metrics: insightSummary.metrics,
                currentWeight: insightSummary.currentWeight,
                weightGap: insightSummary.weightGap,
                aiExplanation: insightSummary.aiExplanation,
                aiSecondary: insightSummary.aiSecondary,
                suggestions: insightSummary.suggestions,
              }
            : null,
      });

      setMessages((current) => [
        ...current,
        { type: "ai", content: result.reply },
        ...(result.plan
          ? [
              {
                type: "plan" as const,
                content: "",
                plan: result.plan,
              },
            ]
          : []),
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          type: "ai",
          content: error instanceof Error ? error.message : "I couldn't respond right now. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    void sendMessage(question);
  };

  const handleSend = () => {
    void sendMessage(input);
  };

  useEffect(() => {
    if (!isOpen) {
      handledInitialPromptRef.current = null;
      return;
    }

    if (!initialPrompt || handledInitialPromptRef.current === initialPrompt) {
      return;
    }

    handledInitialPromptRef.current = initialPrompt;
    void sendMessage(initialPrompt, { hiddenUserMessage: true });
  }, [initialPrompt, isOpen]);

  const handleApplyPlan = () => {
    const latestPlan = [...messages].reverse().find((message) => message.type === "plan" && message.plan)?.plan;
    if (latestPlan) {
      addPlanTasks(latestPlan.items);
      onNavigate?.("plan");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div className="bg-[#F5F5F7] rounded-t-[40px] shadow-[0_-12px_48px_rgba(0,0,0,0.12)] h-[80vh] flex flex-col overflow-hidden border-t border-white/60 relative backdrop-blur-3xl supports-[backdrop-filter]:bg-[#F5F5F7]/90">
              
              {/* Decorative handle */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/15 rounded-full" />
              
              <div className="px-6 py-4 pt-9 bg-white/60 backdrop-blur-xl flex items-center justify-between border-b border-black/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E5F5E3] to-[#D1F0CD] flex items-center justify-center shadow-sm border border-white/50">
                    <Sparkles className="w-4 h-4 text-[#34C759]" />
                  </div>
                  <h2 className="text-[17px] font-semibold text-black tracking-tight">Health AI Assistant</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60 hover:bg-black/10 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="px-6 py-4 bg-white/40 backdrop-blur-md border-b border-black/[0.03] overflow-x-auto no-scrollbar">
                <div className="flex gap-2 w-max">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      disabled={isSending}
                      className="px-4 py-2 bg-white rounded-full text-[14px] font-medium text-black/80 shadow-sm border border-black/5 hover:border-[#34C759]/30 transition-colors whitespace-nowrap"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {messages.map((message, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    key={index} 
                    className="flex flex-col"
                  >
                    {message.type === "user" && (
                      <div className="flex justify-end">
                        <div className="bg-[#34C759] text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                          <p className="text-[16px] leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    )}

                    {message.type === "ai" && (
                      <div className="flex justify-start">
                        <div className="bg-white text-black px-5 py-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                          <p className="text-[16px] leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    )}

                    {message.type === "plan" && message.plan && (
                      <div className="mt-3 bg-white rounded-[28px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#34C759]"></div>
                        <div className="flex items-center gap-2.5 mb-5">
                          <div className="w-8 h-8 rounded-full bg-[#E5F5E3] flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#34C759]" />
                          </div>
                          <h4 className="text-[17px] font-semibold text-black tracking-tight">{message.plan.title}</h4>
                        </div>
                        <div className="space-y-4 mb-6">
                          {message.plan.items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3.5">
                              <div className="w-6 h-6 rounded-full bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                              </div>
                              <p className="text-[15px] text-black/80 font-medium leading-tight pt-0.5">{item}</p>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleApplyPlan}
                          className="w-full py-3.5 bg-black text-white text-[16px] font-semibold rounded-2xl hover:bg-black/80 active:scale-[0.98] transition-all shadow-md"
                        >
                          Apply New Plan
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
                {isSending ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white text-black px-5 py-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                      <p className="text-[16px] leading-relaxed text-black/60">Thinking through your recent data...</p>
                    </div>
                  </motion.div>
                ) : null}
              </div>

              <div className="px-5 py-3 pb-safe bg-white/80 backdrop-blur-xl border-t border-black/[0.04]">
                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    disabled
                    className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 opacity-60"
                  >
                    <Plus className="w-5 h-5 text-black/50" strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isSending}
                      placeholder="Message..."
                      className="w-full px-4 py-3 bg-[#F5F5F7] rounded-2xl border border-transparent focus:bg-white focus:border-[#34C759]/30 focus:outline-none focus:ring-4 focus:ring-[#34C759]/10 text-[16px] transition-all resize-none min-h-[44px] max-h-[120px] leading-tight"
                      rows={1}
                    />
                  </div>
                  {input.trim() ? (
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      className="w-10 h-10 rounded-full bg-[#34C759] hover:bg-[#32B353] flex items-center justify-center transition-colors flex-shrink-0 shadow-[0_4px_12px_rgba(52,199,89,0.3)] mb-0.5"
                    >
                      <Send className="w-[18px] h-[18px] text-white ml-0.5" strokeWidth={2.5} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 opacity-60"
                    >
                      <Mic className="w-5 h-5 text-black/50" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
