"use client";

import React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon && (
          <div className="text-6xl mb-4 opacity-50">
            {icon}
          </div>
        )}
        <h3 className="text-white text-xl font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 max-w-md mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
