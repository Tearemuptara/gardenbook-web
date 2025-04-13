import { NextResponse } from 'next/server';

// Valid MongoDB ObjectId (24 characters)
const DEFAULT_USER_ID = '507f1f77bcf86cd799439011';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.text) {
      return NextResponse.json(
        { success: false, message: 'Text is required' },
        { status: 400 }
      );
    }

    // Call backend API to update encyclopedia
    // Using a valid MongoDB ObjectId - in a real app, this would come from authentication
    const userId = DEFAULT_USER_ID;
    // Use the environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:3001';
      
    const response = await fetch(`${apiUrl}/api/users/${userId}/encyclopedia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encyclopedia: body.text }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, message: error.error || 'Failed to update encyclopedia' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, message: 'Encyclopedia updated successfully', data });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Using a valid MongoDB ObjectId - in a real app, this would come from authentication
    const userId = DEFAULT_USER_ID;
    // Use the environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:3001';
      
    const response = await fetch(`${apiUrl}/api/users/${userId}/encyclopedia`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, message: error.error || 'Failed to fetch encyclopedia' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching encyclopedia:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch encyclopedia' },
      { status: 500 }
    );
  }
} 