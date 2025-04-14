"use client";

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ContextCardProps {
  id: string;
  title: string;
  content: string;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
}

export default function ContextCard({ id, title, content, onUpdate, onDelete }: ContextCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsExpanded(true); // Always expand when editing
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(title);
    setEditContent(content);
  };

  const handleSave = () => {
    onUpdate(id, editTitle, editContent);
    setIsEditing(false);
    // Keep expanded to show the changes
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this context card?')) {
      onDelete(id);
    }
  };

  return (
    <div className="mb-4 bg-gray-800 border border-purple-900/30 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4">
        {isEditing ? (
          <div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 mb-3 text-lg bg-gray-700 border border-purple-900/30 rounded-lg 
                    text-purple-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-purple-600/50 focus:border-transparent"
              placeholder="Card Title"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 mb-3 text-base bg-gray-700 border border-purple-900/30 rounded-lg 
                      text-purple-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                      focus:ring-purple-600/50 focus:border-transparent resize-none"
              placeholder="Card Content"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium
                      hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium
                      hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div 
                className="flex-1 cursor-pointer" 
                onClick={handleToggleExpand}
              >
                <h3 className="text-xl font-semibold text-purple-100 pr-2">{title}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="p-1 text-gray-400 hover:text-purple-300 focus:outline-none"
                  aria-label="Edit card"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                  aria-label="Delete card"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleToggleExpand}
                  className="p-1 text-gray-400 hover:text-purple-300 focus:outline-none"
                  aria-label={isExpanded ? "Collapse card" : "Expand card"}
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="mt-3 text-gray-300 whitespace-pre-wrap">
                {content}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 