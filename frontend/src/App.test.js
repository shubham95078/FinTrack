import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./api', () => ({
  API_BASE: 'http://localhost:5000',
  getMe: jest.fn().mockResolvedValue(null),
  logout: jest.fn(),
  getEntries: jest.fn(),
  getSummary: jest.fn(),
}));

test('renders login when there is no session', async () => {
  render(<App />);
  expect(await screen.findByText(/Welcome Back/i)).toBeInTheDocument();
});
