import React, { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { Notice } from './Notice';
import { Spinner } from './Spinner';
import { describeError, type ErrorDescription } from '../../utils/apiErrors';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
}

export function ConfirmationDialog({ open, onClose, onConfirm, title, description, confirmLabel, tone = 'danger' }: ConfirmationDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorDescription | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      description={description}
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'} onClick={confirm} disabled={busy}>
            {busy && <Spinner />}
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }>
      
      {error &&
      <Notice tone={error.code === 'not_implemented' ? 'integration' : 'danger'} title={error.title} contract={error.code === 'not_implemented' ? error.contract : undefined}>
          {error.message}
        </Notice>
      }
    </Dialog>);

}