'use client';

import { useEffect, useRef } from 'react';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Create a temporary div to parse the HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      // Sanitize the HTML (basic example - you might want to use a library like DOMPurify for production)
      const sanitized = temp.innerHTML;
      
      // Set the sanitized HTML
      containerRef.current.innerHTML = sanitized;
      
      // Add Tailwind classes for basic styling
      containerRef.current.classList.add('prose', 'prose-sm', 'dark:prose-invert', 'max-w-none');
      
      // Add any additional classes passed as props
      if (className) {
        containerRef.current.classList.add(...className.split(' '));
      }
    }
  }, [html, className]);

  return <div ref={containerRef} className={className} />;
}
