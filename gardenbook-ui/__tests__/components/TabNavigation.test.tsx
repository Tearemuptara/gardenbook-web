import React from 'react';
import { render, screen } from '@testing-library/react';
import TabNavigation from '../../app/components/TabNavigation';
import { useAuth } from '../../app/context/AuthContext';

// Mock the usePathname hook and AuthContext
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { usePathname } from 'next/navigation';

describe('TabNavigation', () => {
  beforeEach(() => {
    // Reset the mocks before each test
    jest.clearAllMocks();
    
    // Default auth mock values for authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      logout: jest.fn(),
    });
  });

  it('should render all navigation tabs when authenticated', () => {
    // Mock the usePathname to return a specific path
    (usePathname as jest.Mock).mockReturnValue('/myplants');
    
    render(<TabNavigation />);
    
    // Check that all tab labels are in the document
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('My Plants')).toBeInTheDocument();
    expect(screen.getByText('Encyclopedia')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
  
  it('should render only public tabs when not authenticated', () => {
    // Mock auth as not authenticated
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    });
    
    // Mock the usePathname to return a specific path
    (usePathname as jest.Mock).mockReturnValue('/');
    
    render(<TabNavigation />);
    
    // Only Encyclopedia and Login should be visible
    expect(screen.getByText('Encyclopedia')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // These should not be in the document
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();
    expect(screen.queryByText('My Plants')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should mark the active tab correctly', () => {
    // Mock the usePathname to return the chat path
    (usePathname as jest.Mock).mockReturnValue('/chat');
    
    const { container } = render(<TabNavigation />);
    
    // Find all tab elements - including the clickable logout element
    const tabElements = container.querySelectorAll('a, div[role="button"], div.block.relative');
    
    // Find the first tab (Chat) and check if it's active
    const activeTabs = container.querySelectorAll('div.bg-gradient-to-r');
    expect(activeTabs.length).toBe(1);
    
    // The chat tab should be active
    expect(screen.getByText('Chat').closest('a')).toContainElement(activeTabs[0]);
  });

  it('should create links with the correct hrefs when authenticated', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    
    const { container } = render(<TabNavigation />);
    
    // Find all tab links except the logout which is a div
    const tabLinks = container.querySelectorAll('a');
    
    // When authenticated, we should have chat, myplants, encyclopedia, profile
    expect(tabLinks[0].getAttribute('href')).toBe('/chat');
    expect(tabLinks[1].getAttribute('href')).toBe('/myplants');
    expect(tabLinks[2].getAttribute('href')).toBe('/encyclopedia');
    expect(tabLinks[3].getAttribute('href')).toBe('/profile');
  });
}); 