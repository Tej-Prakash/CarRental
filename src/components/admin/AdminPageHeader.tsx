
import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // For action buttons like "Add New"
}

export default function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {children && <div className="space-x-2 flex-shrink-0 ml-4">{children}</div>}
      </div>
    </div>
  );
}
