import { ApiError, type ApiErrorCode } from '../services/apiClient';

export interface ErrorDescription {
  title: string;
  message: string;
  code: ApiErrorCode | 'unknown';
  contract?: string;
}

export function describeError(error: unknown): ErrorDescription {
  if (!(error instanceof ApiError)) {
    return { title: 'Something went wrong', message: 'Please try again in a moment.', code: 'unknown' };
  }
  const base = { code: error.code, contract: error.endpoint };
  switch (error.code) {
    case 'unauthorized':
      return { ...base, title: 'Your session has ended', message: 'Please sign in again to continue.' };
    case 'forbidden':
      return { ...base, title: 'Not available to you', message: "This belongs to a different account or you don't have access." };
    case 'not_found':
      return { ...base, title: 'Not found', message: error.message };
    case 'network':
      return { ...base, title: "Can't reach EmoSense", message: 'Check your internet connection and try again.' };
    case 'timeout':
      return { ...base, title: 'This is taking too long', message: "The server didn't respond in time. Please try again." };
    case 'too_large':
      return { ...base, title: 'Recording too large', message: 'Voice messages must be under 20 MB. Try a shorter recording.' };
    case 'unsupported':
      return { ...base, title: 'Format not supported', message: "This audio format isn't accepted. Please record again." };
    case 'validation':
      return { ...base, title: "Couldn't process that", message: error.message };
    case 'not_configured':
      return { ...base, title: 'API not connected', message: error.message };
    case 'not_implemented':
      return { ...base, title: 'Not available yet', message: `${error.message} Nothing was changed.` };
    default:
      return { ...base, title: 'Server error', message: error.message || 'The server ran into a problem. Please try again.' };
  }
}