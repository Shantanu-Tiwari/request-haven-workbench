
import React, { useState, useEffect } from 'react';
import { Send, Plus, X, Save, Copy } from 'lucide-react';
import { useApiStore } from '@/hooks/useApiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';

export const RequestEditor = () => {
  const { 
    tabs, 
    activeTabId, 
    addTab, 
    closeTab, 
    setActiveTab, 
    updateTab,
    sendRequest,
    addToCollection,
  } = useApiStore();

  const { toast } = useToast();
  const [headerInput, setHeaderInput] = useState({ key: '', value: '' });

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleSendRequest = async () => {
    if (!activeTab) return;
    await sendRequest(activeTab.id);
  };

  const updateRequest = (updates: any) => {
    if (!activeTab) return;
    updateTab(activeTab.id, {
      request: { ...activeTab.request, ...updates }
    });
  };

  const addHeader = () => {
    if (!activeTab || !headerInput.key.trim()) return;
    
    updateRequest({
      headers: {
        ...activeTab.request.headers,
        [headerInput.key]: headerInput.value
      }
    });
    setHeaderInput({ key: '', value: '' });
  };

  const removeHeader = (key: string) => {
    if (!activeTab) return;
    const newHeaders = { ...activeTab.request.headers };
    delete newHeaders[key];
    updateRequest({ headers: newHeaders });
  };

  const handleSaveToCollection = () => {
    if (!activeTab) return;
    addToCollection(activeTab.request);
    toast({
      title: "Saved to Collection",
      description: `"${activeTab.request.name}" has been saved to your collection.`,
    });
  };

  const copyResponse = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Response content copied successfully.",
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendRequest();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        addTab();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to API Nexus</h2>
          <p className="text-gray-600 mb-6">Create your first API request to get started</p>
          <Button onClick={() => addTab()}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Tabs Header */}
      <div className="border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-1 flex items-center overflow-x-auto">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center px-4 py-3 border-r border-gray-200 cursor-pointer min-w-0 ${
                  activeTabId === tab.id
                    ? 'bg-white border-b-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={`px-2 py-1 text-xs font-mono rounded mr-2 ${
                  tab.request.method === 'GET' ? 'bg-green-100 text-green-700' :
                  tab.request.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                  tab.request.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                  tab.request.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {tab.request.method}
                </span>
                <span className="text-sm truncate max-w-32">
                  {tab.request.name}
                </span>
                {tab.isLoading && (
                  <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-2 p-1 hover:bg-gray-200 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => addTab()}
            className="m-2"
            title="New Request (Cmd+T)"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {activeTab && (
        <div className="flex-1 flex flex-col">
          {/* Request Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-4">
              {/* Name and Save */}
              <div className="flex items-center justify-between">
                <Input
                  value={activeTab.request.name}
                  onChange={(e) => updateRequest({ name: e.target.value })}
                  className="text-lg font-semibold border-none px-0 focus:ring-0"
                  placeholder="Request Name"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSaveToCollection}
                  title="Save to Collection"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>

              {/* Method, URL and Send */}
              <div className="flex items-center gap-3">
                <select
                  value={activeTab.request.method}
                  onChange={(e) => updateRequest({ method: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>

                <Input
                  value={activeTab.request.url}
                  onChange={(e) => updateRequest({ url: e.target.value })}
                  placeholder="Enter request URL (use {{variables}})"
                  className="flex-1 font-mono"
                />

                <Button 
                  onClick={handleSendRequest}
                  disabled={activeTab.isLoading}
                  className="px-6"
                  title="Send Request (Cmd+Enter)"
                >
                  {activeTab.isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Request/Response Split View */}
          <div className="flex-1">
            <ResizablePanelGroup direction="horizontal">
              {/* Request Details */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <Tabs defaultValue="headers" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="params">Params</TabsTrigger>
                  </TabsList>

                  <TabsContent value="headers" className="flex-1 p-4 space-y-4">
                    <div className="space-y-2">
                      {Object.entries(activeTab.request.headers).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Input value={key} readOnly className="flex-1 font-mono text-sm" />
                          <Input value={value} readOnly className="flex-1 font-mono text-sm" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeHeader(key)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                      <Input
                        placeholder="Header key"
                        value={headerInput.key}
                        onChange={(e) => setHeaderInput(prev => ({ ...prev, key: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                      <Input
                        placeholder="Header value"
                        value={headerInput.value}
                        onChange={(e) => setHeaderInput(prev => ({ ...prev, value: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                      <Button size="sm" onClick={addHeader}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="body" className="flex-1 p-4">
                    <Textarea
                      value={activeTab.request.body}
                      onChange={(e) => updateRequest({ body: e.target.value })}
                      placeholder="Request body (JSON, XML, etc.)"
                      className="h-full font-mono text-sm resize-none"
                    />
                  </TabsContent>

                  <TabsContent value="params" className="flex-1 p-4">
                    <div className="text-sm text-gray-500">
                      Query parameters will be automatically parsed from the URL
                    </div>
                  </TabsContent>
                </Tabs>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Response Section */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <Tabs defaultValue="response" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>

                  <TabsContent value="response" className="flex-1 p-4">
                    {activeTab.response ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 text-sm font-mono rounded ${
                              activeTab.response.status < 300 ? 'bg-green-100 text-green-700' :
                              activeTab.response.status < 400 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {activeTab.response.status} {activeTab.response.statusText}
                            </span>
                            <span className="text-sm text-gray-500">
                              {activeTab.response.time}ms
                            </span>
                            <span className="text-sm text-gray-500">
                              {(activeTab.response.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyResponse(JSON.stringify(activeTab.response?.data, null, 2))}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <pre className="bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto max-h-96">
                          {JSON.stringify(activeTab.response.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Send a request to see the response</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="headers" className="flex-1 p-4">
                    {activeTab.response ? (
                      <div className="space-y-2">
                        {Object.entries(activeTab.response.headers).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <span className="font-mono text-gray-600 w-32 truncate">{key}:</span>
                            <span className="font-mono text-gray-900 flex-1">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p>Response headers will appear here</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="raw" className="flex-1 p-4">
                    {activeTab.response ? (
                      <pre className="bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto h-full">
                        {JSON.stringify(activeTab.response, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p>Raw response will appear here</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      )}
    </div>
  );
};
