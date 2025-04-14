import { NextResponse } from 'next/server';

// Valid MongoDB ObjectId (24 characters)
const DEFAULT_USER_ID = '507f1f77bcf86cd799439011';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params;
  
  // Get the request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  
  if (!body.title && !body.content) {
    return NextResponse.json(
      { success: false, message: 'At least one of title or content is required' },
      { status: 400 }
    );
  }

  // Call backend API to update a context card
  const userId = DEFAULT_USER_ID;
  const apiUrl = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:3001';
    
  try {
    const response = await fetch(`${apiUrl}/api/users/${userId}/context-cards/${cardId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: body.title || '',
        content: body.content || ''
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, message: error.error || 'Failed to update context card' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      message: 'Context card updated successfully', 
      data 
    });
  } catch (error) {
    console.error(`Error updating context card:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to update context card' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params;
  const userId = DEFAULT_USER_ID;
  const apiUrl = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:3001';
    
  try {
    const response = await fetch(`${apiUrl}/api/users/${userId}/context-cards/${cardId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, message: error.error || 'Failed to delete context card' },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Context card deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting context card:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete context card' },
      { status: 500 }
    );
  }
} 