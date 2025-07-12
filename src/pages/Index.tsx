
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RequestEditor } from '@/components/RequestEditor';
import { CommandPalette } from '@/components/CommandPalette';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const Index = () => {
  return (
    <div className="h-screen w-full flex bg-gray-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={20} minSize={10} maxSize={40} className="h-full">
          <Sidebar />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80} className="h-full">
          <div className="h-full w-full">
            <RequestEditor />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      <CommandPalette />
    </div>
  );
};

export default Index;
