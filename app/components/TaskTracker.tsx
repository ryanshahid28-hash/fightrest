"use client";

import { useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup, Reorder, useDragControls } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Type,
  ImageIcon,
  Link2,
  Music,
  CheckSquare,
  Check,
  GripVertical,
  ArrowLeft,
  CalendarPlus,
  Clock,
  RotateCcw,
  Pencil,
  Wind,
  Zap,
} from "lucide-react";
import { generateCalendarEvent } from "@/lib/generateCalendarEvent";
import { useTasks, type Task, type ContentBlock } from "@/lib/hooks/useTasks";
import { useHappyList, type HappyItem } from "@/lib/hooks/useHappyList";
import { useReflections } from "@/lib/hooks/useReflections";
import { parseEmbedUrl, getEmbedHeight } from "@/lib/music-embed";
import EndOfDayModal from "./EndOfDayModal";

/* ── Spring configs ───────────────────────── */
const SPRING = { type: "spring" as const, mass: 0.8, stiffness: 180, damping: 20 };
const SPRING_SOFT = { type: "spring" as const, mass: 0.6, stiffness: 130, damping: 16 };

/* ── Date helper ──────────────────────────── */
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function formatDateFromKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/* ── Props ────────────────────────────────── */
interface TaskTrackerProps {
  dateKey: string;
  onBack: () => void;
}

/* ── Modular Draggable Wrapper Component ──── */
function DraggableTaskWrapper({
  item,
  isCompleted,
  isBubble,
  children
}: {
  item: Task;
  isCompleted: boolean;
  isBubble: boolean;
  children: (dragControls: ReturnType<typeof useDragControls>) => ReactNode;
}) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: isDragging ? 1.05 : 1,
        zIndex: isDragging ? 50 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={SPRING_SOFT}
      className={`relative rounded-3xl transition-[box-shadow] duration-500 ease-out ${
        isDragging ? "shadow-[0_20px_40px_rgba(0,0,0,0.4)]" : "shadow-none"
      }`}
    >
      <div
        className={`glass overflow-hidden w-full transition-[background-color,border-color,box-shadow,opacity] duration-500 ease-out ${
          isCompleted
            ? "task-glow-soap"
            : isBubble
            ? "task-glow-bubble"
            : ""
        } ${isDragging ? "!bg-white/10 border-white/20" : ""}`}
      >
        {children(dragControls)}
      </div>

      {/* Live Presence Tag */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", mass: 0.5, stiffness: 250, damping: 20 }}
            className="absolute -bottom-4 right-6 pointer-events-none z-[60] flex flex-col items-center"
          >
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-x-transparent border-b-purple-500" />
            <div className="bg-purple-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-lg tracking-wide uppercase">
              You
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

/* ── Spark Block Timer ────────────────────── */
function SparkBlock({
  value,
  onChange,
  onDelete,
}: {
  value: string;
  onChange: (val: string) => void;
  onDelete: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (timeLeft === 0) setTimeLeft(60);
    setIsActive(!isActive);
  };

  return (
    <div className="fc-content-block relative group/block flex flex-col items-center justify-center p-6 text-center">
      <h4 className="text-white font-bold tracking-wider uppercase mb-3 text-sm flex items-center gap-2">
        <Zap size={16} className="text-amber-400" /> 1-Minute Momentum
      </h4>
      <input
        type="text"
        placeholder="What is your initial momentum task?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input w-full max-w-sm mb-4 px-3 py-2 text-sm text-center text-white/90 placeholder-white/30 font-mono focus:outline-none focus:border-[#E23D68]/50"
      />
      {timeLeft > 0 ? (
        <>
          <div className="text-4xl font-mono font-bold text-amber-400 mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            00:{timeLeft.toString().padStart(2, "0")}
          </div>
          <button
            onClick={toggleTimer}
            className="fc-add-btn px-6 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-wider"
            style={{ 
              background: isActive ? "linear-gradient(135deg, #1A1A1A 0%, #333 100%)" : undefined,
              boxShadow: isActive ? "none" : undefined
            }}
          >
            {isActive ? "Pause" : "Ignite"}
          </button>
        </>
      ) : (
        <div className="text-amber-400 font-bold uppercase tracking-widest animate-pulse mt-2 flex items-center gap-2">
          Momentum Achieved! 🚀
          <button onClick={toggleTimer} className="ml-2 text-white/50 hover:text-white transition-colors" title="Restart">
            <RotateCcw size={14} />
          </button>
        </div>
      )}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ── Component ────────────────────────────── */
export default function TaskTracker({ dateKey, onBack }: TaskTrackerProps) {
  const {
    tasks,
    isLoading,
    addTask,
    deleteTask,
    toggleComplete,
    toggleExpand,
    reorder,
    updateTask,
  } = useTasks(dateKey);

  const { saveReflection, rolloverTasks } = useReflections();
  const { items: happyItems } = useHappyList();

  const [input, setInput] = useState("");
  const [showFrustrated, setShowFrustrated] = useState(false);
  const [randomHappyItems, setRandomHappyItems] = useState<HappyItem[]>([]);
  const [endOfDay, setEndOfDay] = useState(false);
  const [showEODModal, setShowEODModal] = useState(false);
  const [taskTimes, setTaskTimes] = useState<Record<string, string>>({});
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState("");

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const formattedDate = useMemo(() => formatDateFromKey(dateKey), [dateKey]);

  /* ── Task CRUD (delegated to hook) ──────── */
  const handleAddTask = () => {
    if (!input.trim()) return;
    addTask(input.trim());
    setInput("");
  };

  const handleFrustratedClick = () => {
    if (!showFrustrated) {
      if (happyItems.length === 0) {
        setRandomHappyItems([{ id: "fallback", text: "Close your eyes and take 3 deep breaths", checked: false }]);
      } else {
        const shuffled = [...happyItems].sort(() => 0.5 - Math.random());
        setRandomHappyItems(shuffled.slice(0, 3));
      }
    }
    setShowFrustrated(!showFrustrated);
  };

  const injectHappyTask = (text: string) => {
    addTask(`[Happy List] ${text}`);
    setShowFrustrated(false);
  };

  /* ── Block handlers ─────────────────────── */
  const addBlock = (taskId: string, type: ContentBlock["type"]) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      value: "",
      todos: type === "todo" ? [{ id: crypto.randomUUID(), text: "", done: false }] : undefined,
    };
    updateTask(taskId, { blocks: [...task.blocks, newBlock] });
  };

  const updateBlock = (taskId: string, blockId: string, value: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      blocks: task.blocks.map((b) => (b.id === blockId ? { ...b, value } : b)),
    });
  };

  const deleteBlock = (taskId: string, blockId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      blocks: task.blocks.filter((b) => b.id !== blockId),
    });
  };

  const toggleTodo = (taskId: string, blockId: string, todoId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      blocks: task.blocks.map((b) =>
        b.id === blockId
          ? { ...b, todos: b.todos?.map((td) => (td.id === todoId ? { ...td, done: !td.done } : td)) }
          : b
      ),
    });
  };

  const updateTodoText = (taskId: string, blockId: string, todoId: string, text: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      blocks: task.blocks.map((b) =>
        b.id === blockId
          ? { ...b, todos: b.todos?.map((td) => (td.id === todoId ? { ...td, text } : td)) }
          : b
      ),
    });
  };

  const addTodo = (taskId: string, blockId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      blocks: task.blocks.map((b) =>
        b.id === blockId
          ? { ...b, todos: [...(b.todos || []), { id: crypto.randomUUID(), text: "", done: false }] }
          : b
      ),
    });
  };

  /* ── End of Day ─────────────────────────── */
  const handleEndOfDayToggle = () => {
    if (!endOfDay) {
      setEndOfDay(true);
      setShowEODModal(true);
    } else {
      setEndOfDay(false);
    }
  };

  const handleRollover = useCallback(
    async (taskIds: string[], note: string) => {
      // Save reflection
      await saveReflection({
        date: dateKey,
        totalTasks: tasks.length,
        completedTasks: completedCount,
        summaryText: note || `Completed ${completedCount}/${tasks.length} tasks.`,
      });

      // Roll over selected tasks
      if (taskIds.length > 0) {
        await rolloverTasks(dateKey, taskIds);
      }
    },
    [dateKey, tasks.length, completedCount, saveReflection, rolloverTasks]
  );

  /* ── Render Block ─────────────────────────── */
  const renderBlock = (task: Task, block: ContentBlock) => {
    switch (block.type) {
      case "text":
        return (
          <div key={block.id} className="fc-content-block relative group/block">
            <textarea
              className="glass-textarea w-full px-3 py-2 text-sm text-white/80 placeholder-white/25 font-mono"
              placeholder="Write something…"
              rows={3}
              value={block.value}
              onChange={(e) => updateBlock(task.id, block.id, e.target.value)}
            />
            <button
              onClick={() => deleteBlock(task.id, block.id)}
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );

      case "image":
        return (
          <div key={block.id} className="fc-content-block relative group/block">
            {block.value ? (
              <div className="fc-image-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.value} alt="Task content" className="w-full rounded-xl" />
              </div>
            ) : (
              <label className="glass-input w-full px-4 py-8 text-sm text-white/50 hover:text-white/80 font-mono cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl hover:bg-white/5 transition-colors">
                <ImageIcon size={24} className="mb-2 opacity-50" />
                <span>Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) updateBlock(task.id, block.id, URL.createObjectURL(file));
                  }}
                />
              </label>
            )}
            <button
              onClick={() => deleteBlock(task.id, block.id)}
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );

      case "link":
        return (
          <div key={block.id} className="fc-content-block relative group/block">
            {block.value ? (
              <a
                href={block.value}
                target="_blank"
                rel="noopener noreferrer"
                className="fc-link-preview"
              >
                <Link2 size={14} />
                <span className="truncate">{block.value}</span>
              </a>
            ) : (
              <input
                className="glass-input w-full px-3 py-2 text-sm text-white/80 placeholder-white/25 font-mono"
                placeholder="Paste URL…"
                value={block.value}
                onChange={(e) => updateBlock(task.id, block.id, e.target.value)}
              />
            )}
            <button
              onClick={() => deleteBlock(task.id, block.id)}
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );

      case "music": {
        const embed = block.value ? parseEmbedUrl(block.value) : null;
        return (
          <div key={block.id} className="fc-content-block relative group/block">
            {block.value ? (
              embed ? (
                /* ── Embedded player ── */
                <div className="rounded-xl overflow-hidden border border-white/5">
                  <iframe
                    src={embed.embedUrl}
                    width="100%"
                    height={getEmbedHeight(embed.provider)}
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl"
                    style={{ borderRadius: "12px" }}
                  />
                </div>
              ) : (
                /* ── Fallback: native audio player for uploaded files ── */
                <div className="fc-audio-player">
                  <audio controls src={block.value} className="w-full h-10" />
                </div>
              )
            ) : (
              /* ── Input: URL or file upload ── */
              <div className="space-y-3">
                <input
                  className="glass-input w-full px-3 py-2 text-sm text-white/80 placeholder-white/25 font-mono"
                  placeholder="Paste Spotify, YouTube, Apple Music, or SoundCloud URL…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateBlock(task.id, block.id, (e.target as HTMLInputElement).value);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      updateBlock(task.id, block.id, e.target.value.trim());
                    }
                  }}
                />
                <div className="text-center">
                  <span className="text-white/15 text-[10px] font-mono">or</span>
                </div>
                <label className="glass-input w-full px-4 py-4 text-sm text-white/50 hover:text-white/80 font-mono cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl hover:bg-white/5 transition-colors">
                  <Music size={20} className="mb-1 opacity-50" />
                  <span className="text-xs">Upload audio file</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateBlock(task.id, block.id, URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            )}
            <button
              onClick={() => deleteBlock(task.id, block.id)}
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      }

      case "todo":
        return (
          <div key={block.id} className="fc-content-block relative group/block space-y-2">
            {block.todos?.map((td) => (
              <div key={td.id} className="flex items-center gap-2">
                <button
                  onClick={() => toggleTodo(task.id, block.id, td.id)}
                  className={`fc-todo-check ${td.done ? "checked" : ""}`}
                >
                  {td.done && <Check size={12} />}
                </button>
                <input
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 font-mono focus:outline-none"
                  placeholder="Chunk item…"
                  value={td.text}
                  onChange={(e) => updateTodoText(task.id, block.id, td.id, e.target.value)}
                  style={{ textDecoration: td.done ? "line-through" : "none", opacity: td.done ? 0.4 : 1 }}
                />
              </div>
            ))}
            <button onClick={() => addTodo(task.id, block.id)} className="fc-todo-add">
              + add item
            </button>
            <button
              onClick={() => deleteBlock(task.id, block.id)}
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );

      case "spark":
        return (
          <SparkBlock
            key={block.id}
            value={block.value}
            onChange={(val) => updateBlock(task.id, block.id, val)}
            onDelete={() => deleteBlock(task.id, block.id)}
          />
        );

      default:
        return null;
    }
  };

  /* ── Progress ───────────────────────────── */
  const total = tasks.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  /* ── Loading state ──────────────────────── */
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 pt-12 pb-20 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={SPRING_SOFT}
          onClick={onBack}
          className="absolute top-4 left-4 p-2 rounded-xl text-white/30 hover:text-white/80 hover:bg-white/5 transition-colors z-20"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="text-center mb-8">
          <h1 className="fc-title">Fight Club</h1>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: i * 0.1 }}
              className="glass h-16 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-12 pb-20 relative z-10">
      {/* ── Back Button ─────────────────────── */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={SPRING_SOFT}
        onClick={onBack}
        className="absolute top-4 left-4 p-2 rounded-xl text-white/30 hover:text-white/80 hover:bg-white/5 transition-colors z-20"
      >
        <ArrowLeft size={20} />
      </motion.button>

      {/* ── Title ───────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SOFT} className="text-center mb-8">
        <h1 className="fc-title">Fight Club</h1>
        <div className="fc-subtitle">
          <span className="fc-rule" />
          <span className="text-white/40 text-xs tracking-[0.25em] uppercase font-mono">
            {formattedDate}
          </span>
          <span className="fc-rule" />
        </div>
      </motion.div>

      {/* ── Progress ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-3 justify-center mb-10"
      >
        <span className="text-white/40 text-xs font-mono tracking-wide">
          {completedCount}/{total} done
        </span>
        <div className="w-32 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#B11F42] to-[#E23D68]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={SPRING}
          />
        </div>
      </motion.div>

      {/* ── Input ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SOFT, delay: 0.1 }}
        className="glass p-2 flex items-center gap-2 mb-6"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          placeholder="What are you fighting for today?"
          className="glass-input flex-1 px-4 py-3 text-sm text-white placeholder-white/30 font-mono"
        />
        <button onClick={handleAddTask} className="fc-add-btn px-5 py-3 rounded-xl text-white font-medium text-sm uppercase tracking-wider">
          Fight
        </button>
      </motion.div>

      {/* ── End-of-Day toggle & Frustrated Button ────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between gap-3 mb-6 relative z-[60]"
      >
        <button
          onClick={handleFrustratedClick}
          className="px-4 py-2 rounded-xl text-cyan-500/80 hover:text-cyan-400 font-medium text-xs tracking-wider uppercase border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors inline-flex items-center gap-2"
        >
          <Wind size={14} />
          Frustrated?
        </button>

        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs font-mono tracking-wide">End of day</span>
          <button
            onClick={handleEndOfDayToggle}
          className={`relative w-10 h-[22px] rounded-full transition-all duration-300 ${
            endOfDay ? "bg-[#E23D68] shadow-[0_0_12px_rgba(226,61,104,0.5)]" : "bg-white/10"
          }`}
        >
          <motion.div
            className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-md"
            animate={{ x: endOfDay ? 18 : 0 }}
            transition={SPRING}
          />
        </button>
        </div>

        {/* ── Frustrated Dropdown ── */}
        <AnimatePresence>
          {showFrustrated && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-12 left-0 w-full sm:w-80 bg-[#0a0a0a]/95 backdrop-blur-xl p-4 rounded-2xl z-[100] shadow-[0_0_40px_rgba(6,182,212,0.15)] border border-cyan-500/40"
            >
              <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wind size={14} /> Recovery Actions
              </h3>
              <div className="space-y-2">
                {randomHappyItems.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    onClick={() => injectHappyTask(item.text)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 text-white font-medium text-sm font-mono transition-colors border border-cyan-500/20 hover:border-cyan-500/40"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── End of Day Modal ──────────────────── */}
      <AnimatePresence>
        {showEODModal && (
          <EndOfDayModal
            tasks={tasks}
            dateKey={dateKey}
            onClose={() => setShowEODModal(false)}
            onRollover={handleRollover}
          />
        )}
      </AnimatePresence>

      {/* ── Task List ───────────────────────── */}
      <LayoutGroup>
        <Reorder.Group
          axis="y"
          values={tasks}
          onReorder={reorder}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <DraggableTaskWrapper
                key={task.id}
                item={task}
                isCompleted={task.completed}
                isBubble={endOfDay}
              >
                {(dragControls) => (
                  <>
                    <div className="flex items-center gap-3 p-4">
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 transition-colors touch-none user-select-none"
                        onPointerDown={(e) => dragControls.start(e)}
                      >
                        <GripVertical size={16} />
                      </div>

                      {/* Toggle circle */}
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className={`toggle-circle ${
                          task.completed ? "completed" : endOfDay ? "bubble" : ""
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {task.completed ? (
                            <motion.span
                              key="soap"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={SPRING}
                              className="text-sm"
                            >
                              🧼
                            </motion.span>
                          ) : (
                            <motion.span
                              key="bubble"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: -90 }}
                              transition={SPRING}
                              className="text-sm"
                            >
                              🫧
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>

                      {/* Task text + rollover indicator */}
                      <div className="flex-1 min-w-0">
                        {editingTaskId === task.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editTaskText}
                              onChange={(e) => setEditTaskText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (editTaskText.trim()) {
                                    const prefix = task.text.startsWith("[Happy List] ") ? "[Happy List] " : "";
                                    updateTask(task.id, { text: prefix + editTaskText.trim() });
                                    setEditingTaskId(null);
                                  }
                                } else if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                }
                              }}
                              className="glass-input flex-1 px-2 py-1 text-sm text-white font-mono bg-white/5 border border-white/20 rounded focus:border-[#E23D68]/50 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (editTaskText.trim()) {
                                  const prefix = task.text.startsWith("[Happy List] ") ? "[Happy List] " : "";
                                  updateTask(task.id, { text: prefix + editTaskText.trim() });
                                  setEditingTaskId(null);
                                }
                              }}
                              className="fc-add-btn px-3 py-1 rounded text-white text-[10px] font-medium uppercase tracking-wider"
                              title="Save"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {task.text.startsWith("[Happy List] ") && (
                              <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border border-cyan-500/30">
                                Happy List
                              </span>
                            )}
                            <span
                              className={`text-[15px] font-mono transition-opacity duration-500 ease-out ${
                                task.completed
                                  ? "line-through text-white/30"
                                  : "text-white/90"
                              }`}
                            >
                              {task.text.startsWith("[Happy List] ") ? task.text.replace("[Happy List] ", "") : task.text}
                            </span>
                            {task.rolledOverFrom && (
                              <span className="flex items-center gap-1 text-[10px] text-[#F68FA6]/50 font-mono mt-0.5 w-full sm:w-auto">
                                <RotateCcw size={10} />
                                rolled from {task.rolledOverFrom}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Edit */}
                      {editingTaskId !== task.id && (
                        <button
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditTaskText(task.text.startsWith("[Happy List] ") ? task.text.replace("[Happy List] ", "") : task.text);
                          }}
                          className="text-white/30 hover:text-white/70 transition-colors p-1"
                          title="Edit task"
                        >
                          <Pencil size={18} />
                        </button>
                      )}

                      {/* Calendar Sync */}
                      <button
                        onClick={() => setShowTimePicker(showTimePicker === task.id ? null : task.id)}
                        className={`relative p-1 transition-colors ${
                          taskTimes[task.id]
                            ? "text-[#E23D68] hover:text-[#F68FA6]"
                            : "text-white/30 hover:text-white/70"
                        }`}
                        title="Sync to calendar"
                      >
                        <CalendarPlus size={18} />
                      </button>

                      {/* Expand / Collapse */}
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="text-white/30 hover:text-white/70 transition-colors p-1"
                      >
                        {task.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-white/30 hover:text-red-400 transition-colors p-1"
                        title="Delete task"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Calendar Time Picker */}
                    <AnimatePresence>
                      {showTimePicker === task.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={SPRING_SOFT}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 flex items-center gap-3">
                            <Clock size={14} className="text-white/30 shrink-0" />
                            <input
                              type="time"
                              value={taskTimes[task.id] || ""}
                              onChange={(e) =>
                                setTaskTimes((prev) => ({ ...prev, [task.id]: e.target.value }))
                              }
                              className="glass-input px-3 py-1.5 text-sm text-white/80 font-mono bg-white/5 border border-white/10 rounded-lg focus:border-[#E23D68]/50 focus:outline-none transition-colors [color-scheme:dark]"
                            />
                            <button
                              onClick={() => {
                                const time = taskTimes[task.id];
                                if (!time) return;

                                const sparkBlock = task.blocks.find((b) => b.type === "spark");
                                let description = `Fight Club Task — ${task.text}`;
                                if (sparkBlock && sparkBlock.value) {
                                  description += `\n\n1-Minute Momentum:\n${sparkBlock.value}`;
                                }

                                generateCalendarEvent(task.text, dateKey, time, description);
                                setShowTimePicker(null);
                              }}
                              disabled={!taskTimes[task.id]}
                              className="fc-add-btn px-3 py-1.5 rounded-lg text-white text-xs font-medium uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                            >
                              Sync
                            </button>
                            <span className="text-white/20 text-[10px] font-mono hidden sm:inline">
                              → downloads .ics
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expandable content panel */}
                    <AnimatePresence>
                      {task.expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={SPRING_SOFT}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            {/* Block toolbar */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white/30 text-[11px] font-mono uppercase tracking-wider">Add:</span>
                              {[
                                { type: "text" as const, icon: Type, label: "Text", emoji: "📝" },
                                { type: "image" as const, icon: ImageIcon, label: "Image", emoji: "🖼️" },
                                { type: "link" as const, icon: Link2, label: "Link", emoji: "🔗" },
                                { type: "music" as const, icon: Music, label: "Music", emoji: "🎵" },
                                { type: "todo" as const, icon: CheckSquare, label: "Chunks", emoji: "☑️" },
                                { type: "spark" as const, icon: Zap, label: "Spark", emoji: "⚡" },
                              ].map((b) => (
                                <button
                                  key={b.type}
                                  onClick={() => addBlock(task.id, b.type)}
                                  className="fc-block-add-btn text-xs font-mono"
                                >
                                  <span>{b.emoji}</span> {b.label}
                                </button>
                              ))}
                            </div>

                            {/* Blocks */}
                            <AnimatePresence>
                              {task.blocks.length > 0 ? (
                                task.blocks.map((block) => (
                                  <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={SPRING_SOFT}
                                  >
                                    {renderBlock(task, block)}
                                  </motion.div>
                                ))
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-center py-4 text-white/15 text-xs font-mono"
                                >
                                  Click a button above to add content
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </DraggableTaskWrapper>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </LayoutGroup>

      {/* ── Legend / Footer ──────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-12 text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-6 text-[11px] font-mono text-white/30">
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#F68FA6] mr-1 align-middle pulse-dot" />
            🧼 = Clean (Done)
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#E23D68] mr-1 align-middle pulse-dot" />
            🫧 = Bubble (EOD Remaining)
          </span>
        </div>
        <p className="text-white/15 text-[10px] font-mono tracking-wider">
          first rule: you do not talk about fight club
        </p>
      </motion.div>
    </div>
  );
}
