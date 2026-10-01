import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '@/components/forms/ContactForm';

/**
 * The public form is the highest-traffic interactive surface on the site, so it
 * gets a full interaction test: validation, honeypot, submit payload and the
 * success / error states.
 */

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
});

const fillRequiredFields = async () => {
  await userEvent.type(screen.getByLabelText(/Firstname/), 'Ada');
  await userEvent.type(screen.getByLabelText(/Surname/), 'Lovelace');
  await userEvent.type(screen.getByLabelText(/E-mail/), 'ada@example.com');
  await userEvent.type(screen.getByLabelText(/Your enquiry/), 'I would like a consultation.');
};

/** The form-level status message, as distinct from the per-field errors. */
const statusMessage = () => screen.getByText(/Please check the highlighted fields\./);

describe('ContactForm', () => {
  it('blocks submission and reports the missing fields', async () => {
    render(<ContactForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await statusMessage()).toBeInTheDocument();
    // Every field also carries its own inline error, wired via aria-describedby.
    expect(screen.getByLabelText(/Firstname/)).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid e-mail address before hitting the network', async () => {
    render(<ContactForm />);
    await fillRequiredFields();
    await userEvent.clear(screen.getByLabelText(/E-mail/));
    await userEvent.type(screen.getByLabelText(/E-mail/), 'not-an-email');

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await statusMessage()).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts JSON to the configured endpoint and shows the success state', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, id: 7, message: 'Thank you. We will reply shortly.' }),
    });

    render(<ContactForm endpoint="/api/contact" />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText(/Message received/)).toBeInTheDocument();
    expect(screen.getByText('Thank you. We will reply shortly.')).toBeInTheDocument();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/contact');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');

    const payload = JSON.parse(options.body);
    expect(payload).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      message: 'I would like a consultation.',
    });
    // The honeypot must travel as an empty string, never as a real value.
    expect(payload.website).toBe('');
    // Timing metadata used by the server-side bot check.
    expect(typeof payload._t).toBe('number');
  });

  it('maps server-side field errors back onto the inputs', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Please check the highlighted fields.',
        details: { email: 'That e-mail address is already on our list.' },
      }),
    });

    render(<ContactForm />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('That e-mail address is already on our list.')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('aria-invalid', 'true');
    // The summary is polite while the field error is assertive.
    expect(screen.getByText(/Please check the highlighted fields\./)).toBeInTheDocument();
  });

  it('surfaces a network failure with a recoverable message', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    render(<ContactForm />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // The form offers a fallback (phone number) rather than a dead end.
    expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+32 2 376 43 26' })).toHaveAttribute(
      'href',
      'tel:+3223764326',
    );
  });

  it('disables the submit button once the message has been sent', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    render(<ContactForm />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('keeps the honeypot out of the tab order and hides it from screen readers', () => {
    render(<ContactForm />);
    const trap = document.querySelector('input[name="website"]');
    expect(trap).toHaveAttribute('tabindex', '-1');
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(trap).toHaveAttribute('autocomplete', 'off');
  });

  it('omits the phone field when showPhone is false', () => {
    render(<ContactForm showPhone={false} />);
    expect(screen.queryByLabelText(/Phone/)).not.toBeInTheDocument();
  });
});