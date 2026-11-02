import React, { useEffect, useState } from 'react';
import { Dialog } from '../common/Dialog';
import { Notice } from '../common/Notice';
import { Spinner } from '../common/Spinner';
import { describeError, type ErrorDescription } from '../../utils/apiErrors';

interface RenameConversationDialogProps {
  open: boolean;
  currentTitle: string;
  onClose: () => void;
  onRename: (title: string) => Promise<void>;
}

export function RenameConversationDialog({ open, currentTitle, onClose, onRename }: RenameConversationDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorDescription | null>(null);
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(currentTitle);
      setError(null);
      setValidation(null);
    }
  }, [open, currentTitle]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return setValidation('Give the conversation a name.');
    if (clean.length > 80) return setValidation('Keep it under 80 characters.');
    setBusy(true);
    setError(null);
    try {
      await onRename(clean);
      onClose();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? () => undefined : onClose} title="Rename conversation">
      <form onSubmit={submit} noValidate>
        <label htmlFor="rename-title" className="label">Conversation name</label>
        <input
          id="rename-title"
          data-autofocus
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(validation)}
          maxLength={120} />
        
        {validation && <p className="mt-1.5 text-[13px] text-danger">{validation}</p>}
        {error &&
        <Notice className="mt-4" tone={error.code === 'not_implemented' ? 'integration' : 'danger'} title={error.title} contract={error.code === 'not_implemented' ? error.contract : undefined}>
            {error.message}
          </Notice>
        }
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <Spinner />}
            {busy ? 'Saving…' : 'Save name'}
          </button>
        </div>
      </form>
    </Dialog>);

}