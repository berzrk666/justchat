import type { ErrorMessage as ErrorMessageType } from '../../types/messages';

interface ErrorMessageProps {
  message: ErrorMessageType;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const { payload, timestamp } = message;

  return (
    <div className="relative p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg shadow-md border-l-4 border-red-500">
      {/* Error indicator badge */}
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          ERROR
        </span>
      </div>

      {/* Message header */}
      <div className="flex items-center gap-2 mb-2 pr-24">
        <div className="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full font-semibold text-sm">
          !
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-red-900">
            Error
          </span>
          <span className="text-xs text-gray-500">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Error message content */}
      <div className="pl-10 text-red-800 leading-relaxed font-medium">
        {payload.detail}
      </div>
    </div>
  );
}
