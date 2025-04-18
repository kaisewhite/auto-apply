'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

type Spec = Record<string, any>; // Define a more specific type if possible

export default function ApiDocPage() {
  const [spec, setSpec] = useState<Spec | null>(null);

  useEffect(() => {
    fetch('/api/doc')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
      })
      .catch((error) => {
        console.error('Failed to load swagger spec', error);
        // Handle error state appropriately in a real application
      });
  }, []);

  if (!spec) {
    return <div>Loading...</div>; // Or some other loading state
  }

  return (
    <section className="container">
      <SwaggerUI spec={spec} tryItOutEnabled={true} />
    </section>
  );
} 