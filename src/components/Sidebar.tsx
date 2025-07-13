
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Database, Settings, Folder, FolderOpen, Plus, Edit2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useApiStore } from '@/hooks/useApiStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export const Sidebar = () => {
  const { 
    collections, 
    history, 
    environments,
    activeEnvironmentId,
    loadFromCollection,
    setActiveEnvironment,
    addCollection,
    renameCollection
  } = useApiStore();

  const [activeSection, setActiveSection] = useState<'collections' | 'history' | 'environments'>('collections');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  const toggleCollection = (collection: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collection)) {
        newSet.delete(collection);
      } else {
        newSet.add(collection);
      }
      return newSet;
    });
  };

  const handleCreateCollection = () => {
    const name = prompt('Enter collection name:');
    if (name && name.trim()) {
      addCollection(name.trim());
    }
  };

  const handleRenameCollection = (oldName: string, newName: string) => {
    if (newName && newName.trim() && newName !== oldName) {
      renameCollection(oldName, newName.trim());
    }
    setEditingCollection(null);
    setNewCollectionName('');
  };

  const startEditingCollection = (collectionName: string) => {
    setEditingCollection(collectionName);
    setNewCollectionName(collectionName);
  };

  const groupedCollections = collections.reduce((acc, request) => {
    const collection = request.collection || 'Uncategorized';
    if (!acc[collection]) acc[collection] = [];
    acc[collection].push(request);
    return acc;
  }, {} as Record<string, typeof collections>);

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600 bg-green-50',
      POST: 'text-blue-600 bg-blue-50',
      PUT: 'text-orange-600 bg-orange-50',
      DELETE: 'text-red-600 bg-red-50',
      PATCH: 'text-purple-600 bg-purple-50'
    };
    return colors[method as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-full'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900">API Nexus</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Environment
            </label>
            <select
              value={activeEnvironmentId || ''}
              onChange={(e) => setActiveEnvironment(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {environments.map(env => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Navigation Tabs - Made scrollable */}
          <div className="border-b border-gray-200 shrink-0">
            <ScrollArea className="w-full">
              <div className="flex min-w-max" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[
                  { id: 'collections', label: 'Collections', icon: Database },
                  { id: 'history', label: 'History', icon: Clock },
                  { id: 'environments', label: 'Env', icon: Settings }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id as any)}
                    className={`flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSection === id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </button>
                ))}
              </div>
              <style jsx>{`
                .scrollArea::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </ScrollArea>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {activeSection === 'collections' && (
                <div className="space-y-2">
                  {/* Add Collection Button */}
                  <Button
                    onClick={handleCreateCollection}
                    variant="outline"
                    size="sm"
                    className="w-full mb-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Collection
                  </Button>

                  {Object.keys(groupedCollections).length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No saved requests</p>
                      <p className="text-xs text-gray-400 mt-1">Save requests to organize them here</p>
                    </div>
                  ) : (
                    Object.entries(groupedCollections).map(([collectionName, requests]) => (
                      <div key={collectionName} className="space-y-1">
                        <div className="flex items-center group">
                          <button
                            onClick={() => toggleCollection(collectionName)}
                            className="flex items-center flex-1 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            {expandedCollections.has(collectionName) ? (
                              <FolderOpen className="h-4 w-4 mr-2 text-gray-500" />
                            ) : (
                              <Folder className="h-4 w-4 mr-2 text-gray-500" />
                            )}
                            {editingCollection === collectionName ? (
                              <input
                                type="text"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                onBlur={() => handleRenameCollection(collectionName, newCollectionName)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameCollection(collectionName, newCollectionName);
                                  } else if (e.key === 'Escape') {
                                    setEditingCollection(null);
                                    setNewCollectionName('');
                                  }
                                }}
                                className="flex-1 bg-transparent border-none outline-none"
                                autoFocus
                              />
                            ) : (
                              collectionName
                            )}
                            <span className="ml-auto text-xs text-gray-500">
                              {requests.length}
                            </span>
                          </button>
                          {editingCollection !== collectionName && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditingCollection(collectionName)}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        {expandedCollections.has(collectionName) && (
                          <div className="ml-4 space-y-1">
                            {requests.map(request => (
                              <button
                                key={request.id}
                                onClick={() => loadFromCollection(request)}
                                className="flex items-center w-full px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors group"
                              >
                                <span className={`px-2 py-0.5 text-xs font-mono rounded ${getMethodColor(request.method)}`}>
                                  {request.method}
                                </span>
                                <div className="ml-2 flex-1 text-left">
                                  <div className="font-medium text-gray-900 truncate">
                                    {request.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {request.url}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'history' && (
                <div className="space-y-2">
                  {history.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No request history</p>
                      <p className="text-xs text-gray-400 mt-1">Your recent requests will appear here</p>
                    </div>
                  ) : (
                    history.map((request, index) => (
                      <button
                        key={`${request.id}-${request.timestamp}`}
                        onClick={() => loadFromCollection(request)}
                        className="flex items-center w-full px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <span className={`px-2 py-0.5 text-xs font-mono rounded ${getMethodColor(request.method)}`}>
                          {request.method}
                        </span>
                        <div className="ml-2 flex-1 text-left">
                          <div className="font-medium text-gray-900 truncate">
                            {request.url || 'Untitled Request'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(request.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'environments' && (
                <div className="space-y-4">
                  {environments.map(env => (
                    <div key={env.id} className="space-y-2">
                      <div className="font-medium text-gray-900">{env.name}</div>
                      <div className="space-y-1">
                        {Object.entries(env.variables).map(([key, value]) => (
                          <div key={key} className="flex items-center text-sm">
                            <span className="text-gray-600 font-mono w-20 truncate">{key}:</span>
                            <span className="text-gray-900 font-mono flex-1 truncate ml-2">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};
