import { useState } from "react";
import { Circle, CheckCircle2, CalendarDays, Plus } from "lucide-react";
import { motion } from "motion/react";

interface Task {
  text: string;
  completed: boolean;
}

interface TodayPlanCardProps {
  tasks: Task[];
  onToggle: (index: number) => void;
  onAddTask?: (text: string) => void;
}

export function TodayPlanCard({ tasks, onToggle, onAddTask }: TodayPlanCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draftTask, setDraftTask] = useState("");

  const handleAdd = () => {
    const text = draftTask.trim();
    if (!text) {
      return;
    }

    onAddTask?.(text);
    setDraftTask("");
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-[18px] bg-gradient-to-br from-[#E5F5E3] to-[#D1F0CD] flex items-center justify-center shadow-sm border border-white">
            <CalendarDays className="w-[26px] h-[26px] text-[#34C759]" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[22px] font-bold text-black tracking-tight leading-none mb-1">Today's Plan</h3>
            <p className="text-[15px] font-medium text-black/40 tracking-tight">Based on your strategy</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((current) => !current)}
          className="w-[34px] h-[34px] rounded-full bg-[#F5F5F7] flex items-center justify-center hover:bg-[#E5E5EA] transition-colors"
          aria-label="Add plan task"
        >
          <Plus className="w-[18px] h-[18px] text-black" strokeWidth={2.5} />
        </button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-black/[0.08] bg-[#FAFAFB] px-5 py-6 text-center">
            <p className="text-[16px] font-semibold tracking-tight text-black">No plan items yet</p>
            <p className="mt-2 text-[14px] leading-6 text-black/50">
              Add a task here, or use the AI assistant to generate today&apos;s plan.
            </p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <motion.button
              whileTap={{ scale: 0.98 }}
              key={index}
              onClick={() => onToggle(index)}
              className={`flex items-center gap-4 w-full text-left py-3 px-4 rounded-[20px] transition-colors border ${
                task.completed
                  ? "bg-[#F5F5F7]/50 border-transparent"
                  : "bg-white border-black/[0.06] shadow-sm hover:border-[#34C759]/30"
              }`}
            >
              {task.completed ? (
                <CheckCircle2 className="w-6 h-6 text-[#34C759] flex-shrink-0" strokeWidth={2.5} />
              ) : (
                <Circle className="w-6 h-6 text-black/20 flex-shrink-0" strokeWidth={2.5} />
              )}

              <p
                className={`text-[16px] font-medium tracking-tight ${
                  task.completed ? "text-black/40 line-through" : "text-black/80"
                }`}
              >
                {task.text}
              </p>
            </motion.button>
          ))
        )}
      </div>

      {isAdding ? (
        <div className="mt-5 pt-5 border-t border-black/[0.05]">
          <input
            type="text"
            value={draftTask}
            onChange={(event) => setDraftTask(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAdd();
              }
              if (event.key === "Escape") {
                setIsAdding(false);
                setDraftTask("");
              }
            }}
            placeholder="Add a plan task..."
            className="w-full px-4 py-3.5 bg-[#F5F5F7] rounded-2xl border border-transparent focus:bg-white focus:border-[#34C759]/30 focus:outline-none focus:ring-4 focus:ring-[#34C759]/10 text-[15px] transition-all"
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-3 bg-black text-white text-[15px] font-medium rounded-xl hover:bg-black/90 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setDraftTask("");
              }}
              className="flex-1 py-3 bg-[#F5F5F7] text-black text-[15px] font-medium rounded-xl hover:bg-[#E5E5EA] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
