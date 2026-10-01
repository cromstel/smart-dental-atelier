import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimaryButton from '@/components/ui/PrimaryButton';

/**
 * Covers the report's acceptance criterion directly: "test that
 * PrimaryButton renders with correct label and variant class".
 */
describe('PrimaryButton', () => {
  it('renders a <button> with its label', () => {
    render(<PrimaryButton label="Submit" />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('applies the primary variant by default', () => {
    render(<PrimaryButton label="Submit" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-brand-400');
    expect(button.className).toContain('text-black');
  });

  it('renders an outline style for the secondary variant', () => {
    render(<PrimaryButton label="Cancel" variant="secondary" />);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button.className).toContain('border-brand-400/60');
    expect(button.className).not.toContain('bg-brand-400 ');
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<PrimaryButton label="Submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('can be switched to type="submit"', () => {
    render(<PrimaryButton label="Send" type="submit" />);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('disables itself and marks itself busy while loading', () => {
    render(<PrimaryButton label="Sending" loading />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    // A purely decorative spinner must not be announced.
    expect(screen.queryByText('Sending')).toBeInTheDocument();
  });

  it('calls onClick when it is a button', async () => {
    const onClick = jest.fn();
    render(<PrimaryButton label="Press" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Press' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders an anchor when href is given', () => {
    render(<PrimaryButton href="/contact-us" label="Contact" />);
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', '/contact-us');
  });

  it('marks a disabled link with aria-disabled but keeps it focusable', () => {
    render(<PrimaryButton href="/x" label="Nope" disabled />);
    expect(screen.getByRole('link', { name: 'Nope' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('opens external links safely', () => {
    render(<PrimaryButton href="https://example.com" label="External" external />);
    const link = screen.getByRole('link', { name: 'External' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});