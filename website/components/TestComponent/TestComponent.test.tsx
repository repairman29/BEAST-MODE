import { render, screen } from '@testing-library/react';
import TestComponent from './TestComponent';

describe('TestComponent', () => {
  it('renders correctly', () => {
    render(<TestComponent />);
    expect(screen.getByText('TestComponent')).toBeInTheDocument();
  });
});
