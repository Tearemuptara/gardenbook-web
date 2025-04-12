import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import MyPlantsPage from '../../app/myplants/page';

// Mock the global fetch function
global.fetch = jest.fn();

describe('MyPlantsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    render(<MyPlantsPage />);
    
    // Check that the loading animation is shown
    expect(screen.getByText('My Plants')).toBeInTheDocument();
    expect(screen.getByText('Track and manage your plants')).toBeInTheDocument();
    
    // There should be 3 dots in the loading animation (div elements with animate-pulse)
    const loadingContainer = screen.getByText((content, element) => {
      return element?.className.includes('animate-pulse');
    });
    expect(loadingContainer).toBeInTheDocument();
  });

  it('should display plants when data is loaded successfully', async () => {
    // Mock plant data
    const mockPlants = [
      {
        id: 1,
        name: 'Snake Plant',
        scientificName: 'Sansevieria trifasciata',
        careLevel: 'Easy',
        waterFrequency: 14,
        lastWatered: '2023-03-15'
      },
      {
        id: 2,
        name: 'Monstera',
        scientificName: 'Monstera deliciosa',
        careLevel: 'Medium',
        waterFrequency: 7,
        lastWatered: '2023-03-20'
      }
    ];

    // Mock successful fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlants
    });

    await act(async () => {
      render(<MyPlantsPage />);
    });

    // Wait for the plants to be displayed
    await waitFor(() => {
      expect(screen.getByText('Snake Plant')).toBeInTheDocument();
    });

    // Check that both plants are displayed
    expect(screen.getByText('Snake Plant')).toBeInTheDocument();
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Sansevieria trifasciata')).toBeInTheDocument();
    expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
    
    // Check care level and water frequency
    expect(screen.getByText('Care Level: Easy')).toBeInTheDocument();
    expect(screen.getByText('Water every 14 days')).toBeInTheDocument();
    expect(screen.getByText('Care Level: Medium')).toBeInTheDocument();
    expect(screen.getByText('Water every 7 days')).toBeInTheDocument();
  });

  it('should display error message when API call fails', async () => {
    // Mock failed fetch
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    await act(async () => {
      render(<MyPlantsPage />);
    });

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('API error')).toBeInTheDocument();
    });

    // Check that the plants grid is empty
    expect(screen.getByText('No plants found.')).toBeInTheDocument();
  });
}); 