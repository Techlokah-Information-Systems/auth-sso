export function Loader() {
  return (
    <div
      suppressHydrationWarning
      className="flex items-center justify-center min-h-[50vh]"
    >
      <div
        suppressHydrationWarning
        className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100"
      ></div>
    </div>
  );
}
