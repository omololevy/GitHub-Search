export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="w-full h-full border-4 border-t-primary border-r-accent border-b-secondary border-l-muted rounded-full animate-spin"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-10 h-10 border-4 border-t-accent border-r-secondary border-b-muted border-l-primary rounded-full animate-spin animate-duration-500"></div>
        </div>
      </div>
    </div>
  );
}
