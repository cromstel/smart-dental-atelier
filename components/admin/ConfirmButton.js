import { useEffect, useRef, useState } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';

/**
 * Destructive action button with an inline confirmation step.
 *
 * A native `window.confirm` is deliberately avoided: it is unstyled, blocks
 * the event loop and is awkward for assistive tech. This renders a real dialog
 * with focus management and an explicit "Cancel / Delete" pair.
 */
export default function ConfirmButton({
  onConfirm,
  label = 'Delete',
  confirmLabel = 'Delete permanently',
  dialogTitle = 'Are you sure?',
  dialogBody = 'This cannot be undone.',
  variant = 'danger',
  size = 'sm',
  disabled = false,
  busy = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const confirm = async () => {
    setOpen(false);
    await onConfirm();
  };

  return (
    <>
      <PrimaryButton
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        disabled={disabled || busy}
        className={className}
      >
        {label}
      </PrimaryButton>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-body"
            className="w-full max-w-md rounded-lg border border-white/15 bg-ink-800 p-6"
          >
            <h2 id="confirm-dialog-title" className="text-xl">
              {dialogTitle}
            </h2>
            <p id="confirm-dialog-body" className="mt-3 text-sm text-silver-400">
              {dialogBody}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                autoFocus
                onClick={() => setOpen(false)}
                className="rounded-md border border-transparent px-5 py-2.5 text-sm font-semibold text-silver-300 transition hover:bg-white/5 hover:text-brand-200"
              >
                Cancel
              </button>
              <PrimaryButton variant="danger" onClick={confirm}>
                {confirmLabel}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}