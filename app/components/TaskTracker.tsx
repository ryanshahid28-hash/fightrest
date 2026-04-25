"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Type,
  ImageIcon,
  Link2,
  Music,
  CheckSquare,
  Check,
} from "lucide-react";

/* ── Types ────────────────────────────────── */
interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface ContentBlock {
  id: string;
  type: "text" | "image" | "link" | "music" | "todo";
  value: string;
  todos?: TodoItem[];
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  expanded: boolean;
  blocks: ContentBlock[];
}

/* ── Spring configs ───────────────────────── */
const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 300, damping: 25 };

/* ── Date helper ──────────────────────────── */
function formatDate() {
  const d = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/* ── Component ────────────────────────────── */
export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [endOfDay, setEndOfDay] = useState(false);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  /* ── Task CRUD ──────────────────────────── */
  const addTask = () => {
    if (!input.trim()) return;
    setTasks([
      ...tasks,
      {
        id: crypto.randomUUID(),
        text: input.trim(),
        completed: false,
        expanded: false,
        blocks: [],
      },
    ]);
    setInput("");
  };

  const deleteTask = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  const toggleComplete = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const toggleExpand = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));

  /* ── Content blocks ─────────────────────── */
  const addBlock = (taskId: string, type: ContentBlock["type"]) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              blocks: [
                ...t.blocks,
                {
                  id: crypto.randomUUID(),
                  type,
                  value: "",
                  todos: type === "todo" ? [{ id: crypto.randomUUID(), text: "", done: false }] : undefined,
                },
              ],
            }
          : t
      )
    );
  };

  const updateBlock = (taskId: string, blockId: string, value: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, blocks: t.blocks.map((b) => (b.id === blockId ? { ...b, value } : b)) }
          : t
      )
    );
  };

  const deleteBlock = (taskId: string, blockId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, blocks: t.blocks.filter((b) => b.id !== blockId) }
          : t
      )
    );
  };

  /* ── To-Do helpers ──────────────────────── */
  const toggleTodo = (taskId: string, blockId: string, todoId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              blocks: t.blocks.map((b) =>
                b.id === blockId
                  ? {
                      ...b,
                      todos: b.todos?.map((td) =>
                        td.id === todoId ? { ...td, done: !td.done } : td
                      ),
                    }
                  : b
              ),
            }
          : t
      )
    );
  };

  const updateTodoText = (taskId: string, blockId: string, todoId: string, text: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              blocks: t.blocks.map((b) =>
                b.id === blockId
                  ? {
                      ...b,
                      todos: b.todos?.map((td) =>
                        td.id === todoId ? { ...td, text } : td
                      ),
                    }
                  : b
              ),
            }
          : t
      )
    );
  };

  const addTodo = (taskId: string, blockId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              blocks: t.blocks.map((b) =>
                b.id === blockId
                  ? {
                      ...b,
                      todos: [...(b.todos || []), { id: crypto.randomUUID(), text: "", done: false }],
                    }
                  : b
              ),
            }
          : t
      )
    );
  };

  /* ── Render block ───────────────────────── */
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
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-all"
            >
              <X size={14} />
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
              <input
                className="glass-input w-full px-3 py-2 text-sm text-white/80 placeholder-white/25 font-mono"
                placeholder="Paste image URL…"
                value={block.value}
                onChange={(e) => updateBlock(task.id, block.id, e.target.value)}
              />
            )}
            <button
              onClick={() => deleteBlock(task.id, block.id)}
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-all"
            >
              <X size={14} />
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
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        );

      case "music":
        return (
          <div key={block.id} className="fc-content-block relative group/block">
            {block.value ? (
              <div className="fc-audio-player">
                <audio controls src={block.value} />
              </div>
            ) : (
              <input
                className="glass-input w-full px-3 py-2 text-sm text-white/80 placeholder-white/25 font-mono"
                placeholder="Paste audio URL…"
                value={block.value}
                onChange={(e) => updateBlock(task.id, block.id, e.target.value)}
              />
            )}
            <button
              onClick={() => deleteBlock(task.id, block.id)}
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        );

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
                  placeholder="To-do item…"
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
              className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 text-white/30 hover:text-red-400 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  /* ── Progress ───────────────────────────── */
  const total = tasks.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-12 pb-20 relative z-10">
      {/* ── Title ───────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SOFT} className="text-center mb-8">
        <h1 className="fc-title">Fight Club</h1>
        <div className="fc-subtitle">
          <span className="fc-rule" />
          <span className="text-white/40 text-xs tracking-[0.25em] uppercase font-mono">
            {formatDate()}
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
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-400"
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
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="What are you fighting for today?"
          className="glass-input flex-1 px-4 py-3 text-sm text-white placeholder-white/30 font-mono"
        />
        <button onClick={addTask} className="fc-add-btn px-5 py-3 rounded-xl text-white font-bold text-sm tracking-wider uppercase">
          Fight
        </button>
      </motion.div>

      {/* ── End-of-Day toggle ────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-end gap-3 mb-6"
      >
        <span className="text-white/40 text-xs font-mono tracking-wide">End of day</span>
        <button
          onClick={() => setEndOfDay(!endOfDay)}
          className={`relative w-10 h-[22px] rounded-full transition-colors duration-300 ${
            endOfDay ? "bg-pink-500" : "bg-white/10"
          }`}
        >
          <motion.div
            className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-md"
            animate={{ x: endOfDay ? 18 : 0 }}
            transition={SPRING}
          />
        </button>
      </motion.div>

      {/* ── Task List ───────────────────────── */}
      <LayoutGroup>
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activeTasks.map((task) => (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={SPRING_SOFT}
                className={`glass overflow-hidden ${
                  task.completed
                    ? "task-glow-soap"
                    : endOfDay
                    ? "task-glow-bubble"
                    : ""
                }`}
              >
                {/* ── Task header row ─────────── */}
                <div className="flex items-center gap-3 p-4">
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

                  {/* Task text */}
                  <span
                    className={`flex-1 text-[15px] font-mono transition-all duration-300 ${
                      task.completed
                        ? "line-through text-white/30"
                        : "text-white/90"
                    }`}
                  >
                    {task.text}
                  </span>

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
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* ── Expandable content panel ── */}
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
                            { type: "todo" as const, icon: CheckSquare, label: "To-Do", emoji: "☑️" },
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
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
            <span className="inline-block w-2 h-2 rounded-full bg-pink-400 mr-1 align-middle pulse-dot" />
            🧼 = Clean (Done)
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-pink-500 mr-1 align-middle pulse-dot" />
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
