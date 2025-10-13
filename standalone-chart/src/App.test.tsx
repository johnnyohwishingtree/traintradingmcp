import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Financial Chart')).toBeInTheDocument();
  });

  it('renders drawing toolbar', () => {
    render(<App />);
    expect(screen.getByText('Cursor')).toBeInTheDocument();
    expect(screen.getByText('Line Tools')).toBeInTheDocument();
  });

  it('renders chart component', () => {
    render(<App />);
    const chartContainer = document.querySelector('.chart-container');
    expect(chartContainer).toBeInTheDocument();
  });
});