"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EncyclopediaPage() {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  // Fetch existing encyclopedia data when the page loads
  useEffect(() => {
    const fetchEncyclopediaData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/encyclopedia');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to load existing data');
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.encyclopedia) {
          setText(result.data.encyclopedia);
        }
      } catch (error: Error | unknown) {
        console.error('Error loading encyclopedia data:', error);
        setError('Failed to load existing data. The server might be unavailable. You can still add new information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEncyclopediaData();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter some text before submitting');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/encyclopedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      // Handle network errors
      if (!response) {
        throw new Error('Network error: Could not connect to the server');
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit');
      }

      setSuccessMessage('Your gardening information has been saved successfully!');
      router.refresh();
    } catch (error: Error | unknown) {
      console.error('Error submitting:', error);
      if (error instanceof Error && error.message && error.message.includes('Network error')) {
        setError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setError('Failed to save your information. Please try again.');
      }
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
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
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
              {error && (
                <p className="mt-2 text-red-400 text-sm">{error}</p>
              )}
              {successMessage && (
                <p className="mt-2 text-green-400 text-sm">{successMessage}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim()}
                className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium
                         hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500
                         focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50
                         disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : 'Submit'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 