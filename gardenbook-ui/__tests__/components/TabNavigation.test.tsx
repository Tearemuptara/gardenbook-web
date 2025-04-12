import React from 'react';
import { render, screen } from '@testing-library/react';
import TabNavigation from '../../app/components/TabNavigation';

// Mock the usePathname hook
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

import { usePathname } from 'next/navigation';

describe('TabNavigation', () => {
  beforeEach(() => {
    // Reset the mock before each test
    jest.clearAllMocks();
  });

  it('should render all navigation tabs', () => {
    // Mock the usePathname to return a specific path
    (usePathname as jest.Mock).mockReturnValue('/myplants');
    
    render(<TabNavigation />);
    
    // Check that all tab labels are in the document
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('My Plants')).toBeInTheDocument();
    expect(screen.getByText('Encyclopedia')).toBeInTheDocument();
  });

  it('should mark the active tab correctly', () => {
    // Mock the usePathname to return the chat path
    (usePathname as jest.Mock).mockReturnValue('/chat');
    
    const { container } = render(<TabNavigation />);
    
    // Find all tab elements
    const tabElements = container.querySelectorAll('a');
    
    // Find the div inside each a tag that contains the actual classes
    const chatTabDiv = tabElements[0].querySelector('div');
    const myPlantsTabDiv = tabElements[1].querySelector('div');
    const encyclopediaTabDiv = tabElements[2].querySelector('div');
    
    // Check that the correct tab has the active class
    expect(chatTabDiv?.className).toContain('bg-gradient-to-r');
    expect(myPlantsTabDiv?.className).not.toContain('bg-gradient-to-r');
    expect(encyclopediaTabDiv?.className).not.toContain('bg-gradient-to-r');
  });

  it('should create links with the correct hrefs', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    
    const { container } = render(<TabNavigation />);
    
    // Find all tab links
    const tabLinks = container.querySelectorAll('a');
    
    // Check that the links have the correct hrefs
    expect(tabLinks[0].getAttribute('href')).toBe('/chat');
    expect(tabLinks[1].getAttribute('href')).toBe('/myplants');
    expect(tabLinks[2].getAttribute('href')).toBe('/encyclopedia');
  });
}); 