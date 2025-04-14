import { NextResponse } from 'next/server';

// Valid MongoDB ObjectId (24 characters)
const DEFAULT_USER_ID = '507f1f77bcf86cd799439011';

// GET /api/context-cards - Get all context cards for the user
export async function GET() {
  try {
    // Using a valid MongoDB ObjectId - in a real app, this would come from authentication
    const userId = DEFAULT_USER_ID;
    // Use the environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:3001';
      
    const response = await fetch(`${apiUrl}/api/users/${userId}/context-cards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, message: error.error || 'Failed to fetch context cards' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching context cards:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch context cards' },
      { status: 500 }
    );
  }
}

// POST /api/context-cards - Create a new context card
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, message: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Call backend API to create a new context card
    // Using a valid MongoDB ObjectId - in a real app, this would come from authentication
    const userId = DEFAULT_USER_ID;
    // Use the environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:3001';
      
    const response = await fetch(`${apiUrl}/api/users/${userId}/context-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        title: body.title, 
        content: body.content 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, message: error.error || 'Failed to create context card' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      message: 'Context card created successfully', 
      data 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating context card:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create context card' },
      { status: 500 }
    );
  }
} 