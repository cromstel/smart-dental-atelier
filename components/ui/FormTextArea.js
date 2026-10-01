import FormInput from './FormInput';

/**
 * Styled textarea. Shares FormInput's accessibility wiring (label, error,
 * `aria-describedby`) and only differs in the default rows.
 */
export default function FormTextArea({
  label = 'Your enquiry',
  name = 'message',
  rows = 5,
  placeholder,
  required = false,
  error,
  hint,
  maxLength = 4000,
  ...rest
}) {
  return (
    <FormInput
      label={label}
      name={name}
      type="textarea"
      rows={rows}
      placeholder={placeholder}
      required={required}
      error={error}
      hint={hint}
      maxLength={maxLength}
      className="resize-y"
      {...rest}
    />
  );
}