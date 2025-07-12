
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RequestEditor } from '@/components/RequestEditor';

const Index = () => {
  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar />
      <RequestEditor />
    </div>
  );
};

export default Index;
