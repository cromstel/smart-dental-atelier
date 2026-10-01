import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FAQItem from '@/components/marketing/FAQItem';
import TestimonialsSlider from '@/components/marketing/TestimonialsSlider';
import { TESTIMONIALS } from '@/lib/content';

describe('FAQItem', () => {
  it('starts collapsed and hides the answer', () => {
    render(<FAQItem question="What is a crown?" answer="A cap that replaces your tooth." />);

    const toggle = screen.getByRole('button', { name: /What is a crown\?/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('A cap that replaces your tooth.')).not.toBeVisible();
  });

  it('expands on click and exposes the answer as a region', async () => {
    render(<FAQItem question="What is a crown?" answer="A cap that replaces your tooth." />);

    const toggle = screen.getByRole('button', { name: /What is a crown\?/ });
    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region');
    expect(panel).toHaveTextContent('A cap that replaces your tooth.');
    // aria-controls must reference the panel it toggles.
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
  });

  it('can be rendered open by default', () => {
    render(<FAQItem question="Q?" answer="A." defaultOpen />);
    expect(screen.getByRole('button', { name: 'Q?' })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('TestimonialsSlider', () => {
  it('renders the first testimonial only', () => {
    render(<TestimonialsSlider testimonials={TESTIMONIALS} />);
    expect(screen.getByText(TESTIMONIALS[0].quote)).toBeInTheDocument();
    expect(screen.queryByText(TESTIMONIALS[1].quote)).not.toBeInTheDocument();
  });

  it('is exposed as a carousel with a label', () => {
    render(<TestimonialsSlider testimonials={TESTIMONIALS} heading="Patient testimonials" />);
    const region = screen.getByRole('group', { name: 'Patient testimonials' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  });

  it('advances with the next button', async () => {
    render(<TestimonialsSlider testimonials={TESTIMONIALS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next testimonial' }));
    expect(screen.getByText(TESTIMONIALS[1].quote)).toBeInTheDocument();
  });

  it('wraps around when stepping back from the first slide', async () => {
    render(<TestimonialsSlider testimonials={TESTIMONIALS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Previous testimonial' }));
    expect(screen.getByText(TESTIMONIALS[TESTIMONIALS.length - 1].quote)).toBeInTheDocument();
  });

  it('jumps to a slide with the dot buttons', async () => {
    render(<TestimonialsSlider testimonials={TESTIMONIALS} />);

    await userEvent.click(screen.getByRole('button', { name: `Show testimonial 3 from ${TESTIMONIALS[2].author}` }));
    expect(screen.getByText(TESTIMONIALS[2].quote)).toBeInTheDocument();
  });

  it('supports arrow-key navigation', async () => {
    render(<TestimonialsSlider testimonials={TESTIMONIALS} />);

    const region = screen.getByRole('group');
    region.focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByText(TESTIMONIALS[1].quote)).toBeInTheDocument();
  });

  it('announces the current slide in a live region', () => {
    render(<TestimonialsSlider testimonials={TESTIMONIALS} />);
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent(`Testimonial 1 of ${TESTIMONIALS.length}`);
  });

  it('renders nothing at all when there are no testimonials', () => {
    const { container } = render(<TestimonialsSlider testimonials={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});