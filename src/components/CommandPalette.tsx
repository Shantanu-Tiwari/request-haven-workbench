
import React, { useState, useEffect } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useApiStore } from '@/hooks/useApiStore';
import { Plus, Send, Settings, Clock, Database } from 'lucide-react';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const { 
    addTab, 
    sendRequest, 
    activeTabId, 
    tabs, 
    environments, 
    setActiveEnvironment,
    collections,
    loadFromCollection 
  } = useApiStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleCommand = (command: string, value?: any) => {
    setOpen(false);
    
    switch (command) {
      case 'new-request':
        addTab();
        break;
      case 'send-request':
        if (activeTabId) {
          sendRequest(activeTabId);
        }
        break;
      case 'switch-environment':
        setActiveEnvironment(value);
        break;
      case 'load-collection':
        loadFromCollection(value);
        break;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleCommand('new-request')}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </CommandItem>
          {activeTabId && (
            <CommandItem onSelect={() => handleCommand('send-request')}>
              <Send className="mr-2 h-4 w-4" />
              Send Current Request
            </CommandItem>
          )}
        </CommandGroup>

        <CommandGroup heading="Environments">
          {environments.map((env) => (
            <CommandItem
              key={env.id}
              onSelect={() => handleCommand('switch-environment', env.id)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Switch to {env.name}
            </CommandItem>
          ))}
        </CommandGroup>

        {collections.length > 0 && (
          <CommandGroup heading="Collections">
            {collections.slice(0, 5).map((request) => (
              <CommandItem
                key={request.id}
                onSelect={() => handleCommand('load-collection', request)}
              >
                <Database className="mr-2 h-4 w-4" />
                {request.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Tabs">
          {tabs.map((tab) => (
            <CommandItem
              key={tab.id}
              onSelect={() => {
                setOpen(false);
                // This would switch to the tab - we can implement this later
              }}
            >
              <Clock className="mr-2 h-4 w-4" />
              {tab.request.name} ({tab.request.method})
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
