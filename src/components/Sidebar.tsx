
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Database, Settings, Folder, FolderOpen, Plus, Edit2, PanelLeftClose, PanelLeftOpen, Trash2, Check, X } from 'lucide-react';
import { useApiStore } from '@/hooks/useApiStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export const Sidebar = () => {
  const { 
    collections, 
    history, 
    environments,
    activeEnvironmentId,
    activeCollection,
    tabs,
    activeTabId,
    loadFromCollection,
    addCollection,
    renameCollection,
    setActiveCollection,
    setActiveEnvironment,
    updateEnvironmentVariable,
    deleteEnvironmentVariable,
    addEnvironmentVariable,
    removeFromCollection,
    updateTab
  } = useApiStore();

  const [activeSection, setActiveSection] = useState<'collections' | 'history' | 'environments'>('collections');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingVariable, setEditingVariable] = useState<{envId: string, key: string} | null>(null);
  const [newVariableKey, setNewVariableKey] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const [addingVariable, setAddingVariable] = useState<string | null>(null);

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
    const collectionCount = Object.keys(groupedCollections).length;
    const newName = `Collection ${collectionCount + 1}`;
    addCollection(newName);
    setActiveCollection(newName);
    toggleCollection(newName);
  };

  const handleRenameCollection = (oldName: string, newName: string) => {
    if (newName && newName.trim() && newName !== oldName) {
      renameCollection(oldName, newName.trim());
      if (activeCollection === oldName) {
        setActiveCollection(newName.trim());
      }
    }
    setEditingCollection(null);
    setNewCollectionName('');
  };

  const handleDeleteCollection = (collectionName: string) => {
    // Remove all requests in this collection
    const requestsToDelete = collections.filter(req => req.collection === collectionName);
    requestsToDelete.forEach(req => removeFromCollection(req.id));
    
    // If this was the active collection, switch to next available collection
    if (activeCollection === collectionName) {
      const remainingCollections = Object.keys(groupedCollections).filter(name => name !== collectionName);
      setActiveCollection(remainingCollections.length > 0 ? remainingCollections[0] : 'Default');
    }
  };

  const startEditingCollection = (collectionName: string) => {
    setEditingCollection(collectionName);
    setNewCollectionName(collectionName);
  };

  const handleCollectionClick = (collectionName: string) => {
    if (activeCollection === collectionName) {
      // If clicking on already active collection, toggle its expanded state
      toggleCollection(collectionName);
    } else {
      // Set as active and expand it
      setActiveCollection(collectionName);
      if (!expandedCollections.has(collectionName)) {
        toggleCollection(collectionName);
      }
    }
  };

  const handleVariableEdit = (envId: string, key: string, value: string) => {
    updateEnvironmentVariable(envId, key, value);
    setEditingVariable(null);
    setNewVariableValue('');
  };

  const handleVariableDelete = (envId: string, key: string) => {
    deleteEnvironmentVariable(envId, key);
  };

  const handleAddVariable = (envId: string) => {
    if (newVariableKey.trim() && newVariableValue.trim()) {
      addEnvironmentVariable(envId, newVariableKey.trim(), newVariableValue.trim());
      setNewVariableKey('');
      setNewVariableValue('');
      setAddingVariable(null);
    }
  };

  const handleUseEnvironment = (environmentId: string) => {
    setActiveEnvironment(environmentId);
    
    // Populate the current tab with environment variable VALUES
    if (activeTabId) {
      const env = environments.find(e => e.id === environmentId);
      if (env && Object.keys(env.variables).length > 0) {
        // Get current tab data
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
          // Use actual values, not template syntax
          const varEntries = Object.entries(env.variables);
          const baseUrlEntry = varEntries.find(([key]) => key.toLowerCase().includes('url') || key.toLowerCase().includes('host'));
          
          updateTab(activeTabId, {
            request: {
              ...currentTab.request,
              url: baseUrlEntry ? baseUrlEntry[1] : currentTab.request.url,
              headers: {
                ...currentTab.request.headers,
                ...Object.fromEntries(
                  varEntries
                    .filter(([key]) => !key.toLowerCase().includes('url') && !key.toLowerCase().includes('host'))
                    .map(([key, value]) => [key, value])
                )
              }
            }
          });
        }
      }
    }
  };

  const handleResetEnvironment = (envId: string) => {
    const env = environments.find(e => e.id === envId);
    if (env) {
      // Reset all variables to empty
      Object.keys(env.variables).forEach(key => {
        updateEnvironmentVariable(envId, key, '');
      });
    }
  };

  const groupedCollections = collections.reduce((acc, request) => {
    const collection = request.collection || 'Default';
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

  const collectionNames = Object.keys(groupedCollections);
  if (collectionNames.length === 0) {
    collectionNames.push('Default');
  }

  return (
    <div className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
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
        
        {/* Active Collection Display - Show in all tabs */}
        {!isCollapsed && (
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Active Collection</label>
            <Select value={activeCollection} onValueChange={setActiveCollection}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {collectionNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Navigation Tabs - Horizontally scrollable */}
          <div className="border-b border-gray-200 shrink-0 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex min-w-max">
                {[
                  { id: 'collections', label: 'Collections', icon: Database },
                  { id: 'history', label: 'History', icon: Clock },
                  { id: 'environments', label: 'Environments', icon: Settings }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id as any)}
                    className={`flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                      activeSection === id
                        ? 'text-blue-600 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
                            onClick={() => handleCollectionClick(collectionName)}
                            className={`flex items-center flex-1 px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                              activeCollection === collectionName 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {expandedCollections.has(collectionName) ? (
                              <FolderOpen className="h-4 w-4 mr-2 text-gray-500" />
                            ) : (
                              <Folder className="h-4 w-4 mr-2 text-gray-500" />
                            )}
                            {editingCollection === collectionName ? (
                              <div className="flex items-center flex-1 gap-1">
                                <input
                                  type="text"
                                  value={newCollectionName}
                                  onChange={(e) => setNewCollectionName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRenameCollection(collectionName, newCollectionName);
                                    } else if (e.key === 'Escape') {
                                      setEditingCollection(null);
                                      setNewCollectionName('');
                                    }
                                  }}
                                  className="flex-1 bg-white border border-gray-300 rounded px-1 py-0.5 text-xs min-w-0"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRenameCollection(collectionName, newCollectionName)}
                                  className="p-0.5 hover:bg-gray-200 rounded"
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCollection(null);
                                    setNewCollectionName('');
                                  }}
                                  className="p-0.5 hover:bg-gray-200 rounded"
                                >
                                  <X className="h-3 w-3 text-red-600" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 truncate">{collectionName}</span>
                                <span className="ml-auto text-xs text-gray-500">
                                  {requests.length}
                                </span>
                              </>
                            )}
                          </button>
                          {editingCollection !== collectionName && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditingCollection(collectionName)}
                                className="h-6 w-6"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              {collectionName !== 'Default' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCollection(collectionName)}
                                  className="h-6 w-6 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {expandedCollections.has(collectionName) && (
                          <div className="ml-4 space-y-1">
                            {requests.map(request => (
                              <div key={request.id} className="flex items-center group">
                                <button
                                  onClick={() => loadFromCollection(request)}
                                  className="flex items-center flex-1 px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                                >
                                  <span className={`px-2 py-0.5 text-xs font-mono rounded ${getMethodColor(request.method)}`}>
                                    {request.method}
                                  </span>
                                  <div className="ml-2 flex-1 text-left min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {request.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {request.url}
                                    </div>
                                  </div>
                                </button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFromCollection(request.id)}
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
                        key={`history-${request.id}-${request.timestamp}-${index}`}
                        onClick={() => loadFromCollection(request)}
                        className="flex items-start w-full px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <span className={`px-2 py-0.5 text-xs font-mono rounded shrink-0 ${getMethodColor(request.method)}`}>
                          {request.method}
                        </span>
                        <div className="ml-2 flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {request.name || 'Untitled Request'}
                          </div>
                          <div className="text-xs text-gray-500 overflow-x-auto scrollbar-hide">
                            <div className="whitespace-nowrap">
                              {request.url}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
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
                  <div className="text-xs text-gray-500 mb-3">
                    Environment variables can be used in requests with {`{{variable_name}}`} syntax
                  </div>
                  {environments.map(env => (
                    <div key={env.id} className={`space-y-2 p-3 rounded-lg border ${
                      activeEnvironmentId === env.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}>
                       <div className="flex items-center justify-between">
                         <div className="font-medium text-gray-900">{env.name}</div>
                         <div className="flex items-center gap-2">
                           {activeEnvironmentId === env.id ? (
                             <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Active</span>
                           ) : (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleUseEnvironment(env.id)}
                               className="h-6 text-xs"
                             >
                               Use This
                             </Button>
                           )}
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleResetEnvironment(env.id)}
                             className="h-6 text-xs text-red-600 hover:text-red-700"
                           >
                             Reset
                           </Button>
                         </div>
                       </div>
                      
                      <div className="space-y-2">
                        {Object.entries(env.variables).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            {editingVariable?.envId === env.id && editingVariable?.key === key ? (
                              <>
                                <Input
                                  value={key}
                                  disabled
                                  className="h-7 text-xs font-mono flex-1"
                                />
                                <Input
                                  value={newVariableValue || value}
                                  onChange={(e) => setNewVariableValue(e.target.value)}
                                  onBlur={() => handleVariableEdit(env.id, key, newVariableValue || value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleVariableEdit(env.id, key, newVariableValue || value);
                                    } else if (e.key === 'Escape') {
                                      setEditingVariable(null);
                                      setNewVariableValue('');
                                    }
                                  }}
                                  className="h-7 text-xs font-mono flex-1"
                                  autoFocus
                                />
                              </>
                            ) : (
                              <>
                                <span className="text-gray-600 font-mono text-xs min-w-0 flex-1 truncate">{key}:</span>
                                <span className="text-gray-900 font-mono text-xs min-w-0 flex-1 truncate">{value}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingVariable({ envId: env.id, key });
                                    setNewVariableValue(value);
                                  }}
                                  className="h-6 w-6 opacity-60 hover:opacity-100"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleVariableDelete(env.id, key)}
                                  className="h-6 w-6 opacity-60 hover:opacity-100 text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                        
                        {addingVariable === env.id ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Key"
                              value={newVariableKey}
                              onChange={(e) => setNewVariableKey(e.target.value)}
                              className="h-7 text-xs font-mono"
                            />
                            <Input
                              placeholder="Value"
                              value={newVariableValue}
                              onChange={(e) => setNewVariableValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddVariable(env.id);
                                } else if (e.key === 'Escape') {
                                  setAddingVariable(null);
                                  setNewVariableKey('');
                                  setNewVariableValue('');
                                }
                              }}
                              className="h-7 text-xs font-mono"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddVariable(env.id)}
                              className="h-7 px-2"
                            >
                              Add
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddingVariable(env.id)}
                            className="w-full h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Variable
                          </Button>
                        )}
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
