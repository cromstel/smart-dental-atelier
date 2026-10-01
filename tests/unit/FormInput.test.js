import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';

/**
 * The accessibility contract of the form controls: every input must have a
 * real label, errors must be announced and linked with aria-describedby, and
 * required fields must expose aria-required.
 */
describe('FormInput', () => {
  it('associates the label with the input', () => {
    render(<FormInput label="Firstname" name="firstName" />);
    expect(screen.getByLabelText(/Firstname/)).toBeInTheDocument();
  });

  it('marks optional fields as such', () => {
    render(<FormInput label="Phone" name="phone" />);
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  it('sets aria-required when the field is required', () => {
    render(<FormInput label="E-mail" name="email" required />);
    const input = screen.getByLabelText(/E-mail/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('links the error message and flags the field as invalid', () => {
    render(<FormInput label="E-mail" name="email" error="Please enter a valid e-mail address." />);
    const input = screen.getByLabelText(/E-mail/);

    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Please enter a valid e-mail address.');
    // The describedby must point at the error node so a screen reader reads it.
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('shows the hint when there is no error', () => {
    render(<FormInput label="Preferred date" name="date" hint="We confirm by phone." />);
    expect(screen.getByText('We confirm by phone.')).toBeInTheDocument();
  });

  it('renders a textarea when type="textarea"', () => {
    render(<FormTextArea label="Your enquiry" name="message" />);
    expect(screen.getByLabelText(/Your enquiry/).tagName).toBe('TEXTAREA');
  });

  it('is a controlled component', async () => {
    const handleChange = jest.fn();
    render(<FormInput label="Firstname" name="firstName" value="Ada" onChange={handleChange} />);

    const input = screen.getByLabelText(/Firstname/);
    expect(input).toHaveValue('Ada');

    await userEvent.type(input, 'x');
    expect(handleChange).toHaveBeenCalled();
  });
});