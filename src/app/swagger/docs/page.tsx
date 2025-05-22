
"use client";

import 'swagger-ui-react/swagger-ui.css';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import SwaggerUI to avoid SSR issues, as it's a client-side only component
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="ml-4 text-lg">Loading API Documentation...</p>
    </div>
  ),
});

export default function SwaggerDocsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
     return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="ml-4 text-lg">Initializing API Documentation Viewer...</p>
        </div>
     );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <SwaggerUI url="/openapi.json" />
    </div>
  );
}
