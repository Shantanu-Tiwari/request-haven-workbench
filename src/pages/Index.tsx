
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RequestEditor } from '@/components/RequestEditor';
import { CommandPalette } from '@/components/CommandPalette';

const Index = () => {
  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar />
      <RequestEditor />
      <CommandPalette />
    </div>
  );
};

export default Index;
