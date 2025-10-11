import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}
