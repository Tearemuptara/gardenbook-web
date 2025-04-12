"use client";

import { useState } from 'react';

export default function EncyclopediaPage() {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/encyclopedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      alert('Successfully submitted!');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900">
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-100">Encyclopedia</h1>
          <p className="text-gray-400">Plant knowledge database</p>
        </header>
        
        <div className="max-w-2xl mx-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add context for your plant chatbot here"
            rows={20}
            className="w-full px-6 py-4 text-lg bg-gray-800 border border-purple-900/30 rounded-xl 
                     text-purple-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                     focus:ring-purple-600/50 focus:border-transparent transition-all
                     shadow-lg hover:shadow-purple-900/5 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium
                     hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500
                     focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50
                     disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
} 