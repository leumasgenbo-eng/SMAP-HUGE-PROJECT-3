
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

const EditableField: React.FC<Props> = ({ value, onSave, className = "", multiline = false, placeholder = "Click to edit..." }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (internalValue !== value) {
      onSave(internalValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setInternalValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInternalValue(e.target.value);
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  if (isEditing) {
    return multiline ? (
      <textarea
        ref={textareaRef}
        className={`w-full bg-yellow-50 outline-none resize-none border-b-2 border-[#cca43b] transition-all p-1 ${className}`}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        rows={1}
      />
    ) : (
      <input
        type="text"
        className={`w-full bg-yellow-50 outline-none border-b-2 border-[#cca43b] transition-all p-1 ${className}`}
        value={internalValue}
        onChange={handleChange as any}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-gray-100/50 rounded p-1 transition-colors min-h-[1.2em] whitespace-pre-wrap ${className} ${!value ? 'text-gray-300 italic' : ''}`}
    >
      {value || placeholder}
    </div>
  );
};

export default EditableField;
