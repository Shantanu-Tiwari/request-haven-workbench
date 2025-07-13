
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RequestEditor } from '@/components/RequestEditor';
import { CommandPalette } from '@/components/CommandPalette';

const Index = () => {
  return (
    <div className="h-screen w-full flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 h-full">
        <RequestEditor />
      </div>
      <CommandPalette />
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </div>
  );
};

export default Index;
