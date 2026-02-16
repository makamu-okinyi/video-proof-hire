import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass-panel p-12 rounded-2xl text-center max-w-md mx-4">
        <h1 className="mb-4 text-4xl font-bold text-[#1e293b]">404</h1>
        <p className="mb-6 text-xl text-[#64748b]">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90 font-medium">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
