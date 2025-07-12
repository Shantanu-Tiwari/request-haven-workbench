
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RequestEditor } from '@/components/RequestEditor';
import { CommandPalette } from '@/components/CommandPalette';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const Index = () => {
  return (
    <div className="h-screen flex bg-gray-50">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80}>
          <RequestEditor />
        </ResizablePanel>
      </ResizablePanelGroup>
      
      <CommandPalette />
    </div>
  );
};

export default Index;
