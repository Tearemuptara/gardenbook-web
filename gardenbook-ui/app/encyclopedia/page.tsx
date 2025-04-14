"use client";

import { useState, useEffect } from 'react';
import ContextCard from '../components/ContextCard';
import { PlusIcon } from '@heroicons/react/24/outline';

// Type definition for context entry data
interface ContextEntry {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function EncyclopediaPage() {
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Check if location is already enabled in localStorage
  useEffect(() => {
    const storedLocationEnabled = localStorage.getItem('locationEnabled');
    if (storedLocationEnabled === 'true') {
      setLocationEnabled(true);
    }
  }, []);

  // Helper function to update encyclopedia with all context entries
  const updateEncyclopedia = async (entries: ContextEntry[]) => {
    // Format all entries into a single string for the encyclopedia
    const encyclopediaText = entries.length > 0 
      ? entries.map(entry => entry.content).join('\n\n---\n\n')
      : " "; // Use space instead of empty string to avoid API validation errors
    
    try {
      const response = await fetch('/api/encyclopedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: encyclopediaText }),
      });
      
      if (!response.ok) {
        console.error('Failed to update encyclopedia:', await response.json());
      }
    } catch (error) {
      console.error('Error updating encyclopedia:', error);
    }
  };

  // Fetch existing context entries when the page loads
  useEffect(() => {
    const fetchContextEntries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/encyclopedia');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to load existing data');
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.encyclopedia) {
          // Parse the encyclopedia text into separate context entries
          const encyclopediaText = result.data.encyclopedia.trim();
          
          if (encyclopediaText && encyclopediaText !== " ") {
            const entries = encyclopediaText.split('\n\n---\n\n').map((content: string, index: number) => ({
              id: `local-${Date.now()}-${index}`,
              content: content.trim(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
            setContextEntries(entries);
          } else {
            setContextEntries([]);
          }
        }
      } catch (error: Error | unknown) {
        console.error('Error loading encyclopedia:', error);
        setError('Failed to load existing data. The server might be unavailable.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContextEntries();
  }, []);

  const handleCreateContextEntry = async () => {
    if (!newContent.trim()) {
      setError('Please enter content for the new context');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Create a new entry with local ID
      const newEntry: ContextEntry = {
        id: `local-${Date.now()}`,
        content: newContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to state
      const updatedEntries = [...contextEntries, newEntry];
      setContextEntries(updatedEntries);
      
      // Update encyclopedia with all entries
      await updateEncyclopedia(updatedEntries);
      
      setSuccessMessage('Your context has been added successfully!');
      setNewContent('');
      setIsCreating(false);
    } catch (error: Error | unknown) {
      console.error('Error creating context:', error);
      if (error instanceof Error && error.message && error.message.includes('Network error')) {
        setError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setError('Failed to create your context. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContextEntry = async (id: string, content: string) => {
    if (!content.trim()) {
      setError('Please enter content for the context');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    
    try {
      // Update the entry in state
      const updatedEntries = contextEntries.map(entry => 
        entry.id === id 
          ? { ...entry, content, updatedAt: new Date().toISOString() } 
          : entry
      );
      
      setContextEntries(updatedEntries);
      
      // Update encyclopedia with all entries
      await updateEncyclopedia(updatedEntries);
      
      setSuccessMessage('Your context has been updated successfully!');
      
      // Clear any success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: Error | unknown) {
      console.error('Error updating context:', error);
      if (error instanceof Error && error.message && error.message.includes('Network error')) {
        setError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setError('Failed to update your context. Please try again.');
      }
      
      // Clear any error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleDeleteContextEntry = async (id: string) => {
    setError('');
    setSuccessMessage('');
    
    try {
      // Remove the entry from state
      const updatedEntries = contextEntries.filter(entry => entry.id !== id);
      setContextEntries(updatedEntries);
      
      // Update encyclopedia with remaining entries
      await updateEncyclopedia(updatedEntries);
      
      setSuccessMessage('Your context has been deleted successfully!');
      
      // Clear any success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: Error | unknown) {
      console.error('Error deleting context:', error);
      if (error instanceof Error && error.message && error.message.includes('Network error')) {
        setError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setError('Failed to delete your context. Please try again.');
      }
      
      // Clear any error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleLocationToggle = () => {
    if (!locationEnabled) {
      // Request location permission
      if (navigator.geolocation) {
        setLocationStatus('Requesting location permission...');
        navigator.geolocation.getCurrentPosition(
          () => {
            // Successfully got location
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            // Store timezone in localStorage for later use
            localStorage.setItem('userTimezone', timezone);
            localStorage.setItem('locationEnabled', 'true');
            
            setLocationEnabled(true);
            setLocationStatus(`Location enabled. Your timezone is: ${timezone}`);
          },
          (error) => {
            // Failed to get location
            console.error('Error getting location:', error);
            setLocationStatus('Could not access your location. Please check browser permissions.');
            setLocationEnabled(false);
            localStorage.setItem('locationEnabled', 'false');
          }
        );
      } else {
        setLocationStatus('Geolocation is not supported by your browser.');
      }
    } else {
      // Disable location
      localStorage.removeItem('userTimezone');
      localStorage.setItem('locationEnabled', 'false');
      setLocationEnabled(false);
      setLocationStatus('Location access disabled.');
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
              <div className="mb-6 p-4 bg-gray-800 border border-purple-900/30 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-purple-100">Location Settings</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Allow the chatbot to know your timezone for season-appropriate advice
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={locationEnabled}
                      onChange={handleLocationToggle}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {locationStatus && (
                  <p className={`mt-2 text-sm ${locationEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                    {locationStatus}
                  </p>
                )}
              </div>

              {/* Context Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-purple-100">Chatbot Context</h2>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium
                           hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500
                           disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Context
                  </button>
                </div>
                
                {error && (
                  <p className="mb-4 text-red-400 text-sm">{error}</p>
                )}
                
                {successMessage && (
                  <p className="mb-4 text-green-400 text-sm">{successMessage}</p>
                )}
                
                {/* Create new context form */}
                {isCreating && (
                  <div className="mb-4 bg-gray-800 border border-purple-900/30 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-purple-100 mb-3">Create New Context</h3>
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 mb-3 text-base bg-gray-700 border border-purple-900/30 rounded-lg 
                                  text-purple-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                                  focus:ring-purple-600/50 focus:border-transparent resize-none"
                        placeholder="Enter gardening information you'd like the chatbot to remember..."
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setIsCreating(false)}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium
                                hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateContextEntry}
                          disabled={isSubmitting || !newContent.trim()}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium
                                hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="inline-block animate-spin mr-1">⟳</span>
                              Saving...
                            </>
                          ) : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Display context entries */}
                {contextEntries.length > 0 ? (
                  contextEntries.map(entry => (
                    <ContextCard
                      key={entry.id}
                      id={entry.id}
                      content={entry.content}
                      onUpdate={handleUpdateContextEntry}
                      onDelete={handleDeleteContextEntry}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    {isCreating ? (
                      <p>Create your first context entry above!</p>
                    ) : (
                      <p>No context entries yet. Click &apos;Add Context&apos; to create your first one!</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 