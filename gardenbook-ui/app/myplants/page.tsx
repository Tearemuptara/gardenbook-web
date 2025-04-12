"use client";

import { useState, useEffect } from 'react';

interface Plant {
  id: number;
  name: string;
  scientificName: string;
  careLevel: string;
  waterFrequency: number;
  lastWatered?: string;
}

export default function MyPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlants = async () => {
      setIsLoading(true);
      setError('');
      
      const apiUrl = '/api/plants';
      
      try {
        console.log(`Fetching plants from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No response body');
          throw new Error(`API error ${response.status}: ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        console.log('Plants data received:', data);
        setPlants(data);
      } catch (error) {
        console.error(`Error fetching plants:`, error);
        setError(`${error instanceof Error ? error.message : 'Unknown error'}`);
        setPlants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlants();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-900">
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-100">My Plants</h1>
          <p className="text-gray-400">Track and manage your plants</p>
        </header>

        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-center mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.length > 0 ? (
            plants.map((plant) => (
              <div key={plant.id} className="border border-purple-900/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-gray-800">
                <div className="h-48 bg-gray-700 rounded-md mb-4">
                </div>
                <h3 className="font-medium text-lg text-purple-100">{plant.name}</h3>
                <p className="text-sm text-purple-200">{plant.scientificName}</p>
                <p className="text-sm text-gray-400">Care Level: {plant.careLevel}</p>
                <p className="text-sm text-gray-400">Water every {plant.waterFrequency} days</p>
                <p className="text-sm text-gray-500">
                  Last watered: {plant.lastWatered || 'Not recorded'}
                </p>
                <div className="mt-4 flex justify-between">
                  <button className="px-3 py-1 bg-purple-900/80 text-purple-100 rounded-md text-sm hover:bg-purple-800/80 border border-purple-800/50">
                    Water
                  </button>
                  <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded-md text-sm hover:bg-gray-600 border border-purple-900/30">
                    Details
                  </button>
                </div>
              </div>
            ))
          ) : !isLoading && (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-400">No plants found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}