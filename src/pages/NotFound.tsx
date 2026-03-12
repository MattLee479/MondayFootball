import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <div className="surface-card w-full p-10 text-center">
          <p className="subtle-label mb-2">Page Not Found</p>
          <h1 className="text-6xl font-extrabold leading-none text-primary">404</h1>
          <p className="mt-4 text-lg text-muted-foreground">This route does not exist.</p>
          <a href="/" className="mt-6 inline-block">
            <Button>Return Home</Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

