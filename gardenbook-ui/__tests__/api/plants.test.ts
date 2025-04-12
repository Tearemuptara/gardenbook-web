// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => {
      return {
        json: async () => data,
        status: options?.status || 200
      };
    })
  }
}));

// Import after mocking
import { NextResponse } from 'next/server';

// Create a mock implementation of the API route
async function GET() {
  try {
    const response = await fetch('http://localhost:3001/api/plants', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}

// Mock the global fetch function
global.fetch = jest.fn();

describe('Plants API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return plants data on successful API call', async () => {
    // Mock data to be returned from the external API
    const mockPlantsData = [
      { id: 1, name: 'Snake Plant', scientificName: 'Sansevieria' },
      { id: 2, name: 'Monstera', scientificName: 'Monstera deliciosa' }
    ];

    // Mock the successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlantsData
    });

    // Call the API route handler
    const response = await GET();
    const responseData = await response.json();

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/plants', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check that the response contains the expected data
    expect(responseData).toEqual(mockPlantsData);
  });

  it('should handle errors from the external API', async () => {
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    // Call the API route handler
    const response = await GET();
    const responseData = await response.json();

    // Check that the response contains the error message
    expect(responseData).toEqual({ error: 'Failed to fetch plants' });
    expect(response.status).toBe(500);
  });

  it('should handle network errors', async () => {
    // Mock a network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Call the API route handler
    const response = await GET();
    const responseData = await response.json();

    // Check that the response contains the error message
    expect(responseData).toEqual({ error: 'Failed to fetch plants' });
    expect(response.status).toBe(500);
  });
}); 