"use client";

import { useState } from "react";
import { Pencil, Trash2, Check } from "lucide-react";

interface EditableListItemProps {
  initialText: string;
  onSave: (newText: string) => void;
  onDelete?: () => void;
  className?: string;
  textClassName?: string;
}

export default function EditableListItem({
  initialText,
  onSave,
  onDelete,
  className = "",
  textClassName = "",
}: EditableListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialText);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setText(initialText);
      setIsEditing(false);
    }
  };

  return (
    <div className={`flex flex-1 items-center min-w-0 ${className}`}>
      {isEditing ? (
        <div className="flex flex-1 items-center gap-2 w-full">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="glass-input flex-1 px-3 py-1.5 text-sm text-white font-mono bg-white/5 border border-white/20 rounded focus:border-[#E23D68]/50 focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="fc-add-btn px-3 py-1.5 rounded flex items-center justify-center text-white text-[10px] font-medium uppercase tracking-wider transition-opacity shrink-0"
            title="Save"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between gap-2 w-full min-w-0">
          <span className={`text-[15px] font-mono truncate block flex-1 ${textClassName || "text-white/90"}`}>
            {initialText}
          </span>
          <div className="flex items-center shrink-0">
            <button
              onClick={() => {
                setIsEditing(true);
                setText(initialText);
              }}
              className="text-white/30 hover:text-white/70 transition-colors p-2"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-white/30 hover:text-red-400 transition-colors p-2"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
