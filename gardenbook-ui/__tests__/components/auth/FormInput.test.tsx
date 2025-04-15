import { render, screen, fireEvent } from '@testing-library/react';
import FormInput from '../../../app/components/auth/FormInput';

describe('FormInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnBlur.mockClear();
  });
  
  test('renders with required props', () => {
    render(
      <FormInput
        id="test-input"
        label="Test Label"
        type="text"
        value="Test Value"
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByLabelText('Test Label');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Test Value');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('type', 'text');
  });
  
  test('renders with required flag', () => {
    render(
      <FormInput
        id="test-input"
        label="Test Label"
        type="text"
        value="Test Value"
        onChange={mockOnChange}
        required
      />
    );
    
    const label = screen.getByText(/Test Label/);
    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator.tagName).toBe('SPAN');
    expect(requiredIndicator).toHaveClass('text-red-500');
  });
  
  test('displays error message', () => {
    render(
      <FormInput
        id="test-input"
        label="Test Label"
        type="text"
        value="Test Value"
        onChange={mockOnChange}
        error="This is an error message"
      />
    );
    
    const errorMessage = screen.getByText('This is an error message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-500');
    
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveClass('border-red-500');
  });
  
  test('calls onChange when input changes', () => {
    render(
      <FormInput
        id="test-input"
        label="Test Label"
        type="text"
        value="Test Value"
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByLabelText('Test Label');
    fireEvent.change(input, { target: { value: 'New Value' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });
  
  test('calls onBlur when input loses focus', () => {
    render(
      <FormInput
        id="test-input"
        label="Test Label"
        type="text"
        value="Test Value"
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );
    
    const input = screen.getByLabelText('Test Label');
    fireEvent.blur(input);
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });
}); 