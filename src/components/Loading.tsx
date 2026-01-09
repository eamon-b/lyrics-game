interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Generating puzzle...' }: LoadingProps) {
  return (
    <div className="loading">
      <div className="spinner" />
      <p>{message}</p>
      <p className="loading-hint">
        Finding songs that match your theme across 7 decades...
      </p>
    </div>
  );
}
