import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body: string;
  collection?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
}

export interface ApiTab {
  id: string;
  request: ApiRequest;
  response?: ApiResponse;
  isLoading: boolean;
}

interface ApiStore {
  // Tabs
  tabs: ApiTab[];
  activeTabId: string | null;
  addTab: (request?: Partial<ApiRequest>) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<ApiTab>) => void;
  sendRequest: (tabId: string) => Promise<void>;

  // Collections
  collections: ApiRequest[];
  activeCollection: string;
  setActiveCollection: (collection: string) => void;
  addToCollection: (request: ApiRequest, collection?: string) => void;
  removeFromCollection: (requestId: string) => void;
  loadFromCollection: (request: ApiRequest) => void;
  addCollection: (name: string) => void;
  renameCollection: (oldName: string, newName: string) => void;

  // Environments
  environments: Environment[];
  activeEnvironmentId: string | null;
  addEnvironment: (environment: Environment) => void;
  setActiveEnvironment: (environmentId: string) => void;
  updateEnvironment: (environmentId: string, updates: Partial<Environment>) => void;
  updateEnvironmentVariable: (environmentId: string, key: string, value: string) => void;
  deleteEnvironmentVariable: (environmentId: string, key: string) => void;
  addEnvironmentVariable: (environmentId: string, key: string, value: string) => void;

  // History
  history: (ApiRequest & { timestamp: number })[];
  addToHistory: (request: ApiRequest) => void;

  // Utility
  interpolateVariables: (text: string) => string;
}

export const useApiStore = create<ApiStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      collections: [],
      activeCollection: 'Default',
      environments: [
        {
          id: 'local',
          name: 'Local',
          variables: {
            base_url: 'http://localhost:3000',
            api_key: 'dev-key-123'
          }
        },
        {
          id: 'staging',
          name: 'Staging',
          variables: {
            base_url: 'https://api-staging.example.com',
            api_key: 'staging-key-456'
          }
        },
        {
          id: 'production',
          name: 'Production',
          variables: {
            base_url: 'https://api.example.com',
            api_key: 'prod-key-789'
          }
        }
      ],
      activeEnvironmentId: 'local',
      history: [],

      addTab: (request) => {
        const id = `tab-${Date.now()}`;
        const newTab: ApiTab = {
          id,
          request: {
            id: `req-${Date.now()}`,
            name: 'Untitled Request',
            method: 'GET',
            url: '',
            headers: {},
            body: '',
            collection: get().activeCollection,
            ...request
          },
          isLoading: false
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: id,
          // Clear active environment when creating new request
          activeEnvironmentId: null
        }));

        return id;
      },

      closeTab: (tabId) => {
        set((state) => {
          const newTabs = state.tabs.filter(tab => tab.id !== tabId);
          const newActiveId = state.activeTabId === tabId 
            ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
            : state.activeTabId;

          return {
            tabs: newTabs,
            activeTabId: newActiveId
          };
        });
      },

      setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
      },

      updateTab: (tabId, updates) => {
        set((state) => ({
          tabs: state.tabs.map(tab => 
            tab.id === tabId ? { ...tab, ...updates } : tab
          )
        }));
      },

      sendRequest: async (tabId) => {
        const state = get();
        const tab = state.tabs.find(t => t.id === tabId);
        if (!tab) return;

        const { request } = tab;
        const interpolatedUrl = state.interpolateVariables(request.url);
        const interpolatedBody = state.interpolateVariables(request.body);

        // Set loading state
        get().updateTab(tabId, { isLoading: true });

        try {
          const startTime = Date.now();
          
          // Prepare headers
          const headers: Record<string, string> = {};
          Object.entries(request.headers).forEach(([key, value]) => {
            if (key.trim() && value.trim()) {
              headers[key] = state.interpolateVariables(value);
            }
          });

          // Add Content-Type for POST/PUT/PATCH if body exists and no Content-Type set
          if (['POST', 'PUT', 'PATCH'].includes(request.method) && interpolatedBody && !headers['Content-Type']) {
            try {
              JSON.parse(interpolatedBody);
              headers['Content-Type'] = 'application/json';
            } catch {
              headers['Content-Type'] = 'text/plain';
            }
          }

          const response = await fetch(interpolatedUrl, {
            method: request.method,
            headers,
            body: ['GET', 'DELETE'].includes(request.method) ? undefined : interpolatedBody || undefined,
          });

          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Get response data
          const responseText = await response.text();
          let responseData;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = responseText;
          }

          // Create response headers object
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          const apiResponse: ApiResponse = {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data: responseData,
            time: responseTime,
            size: new Blob([responseText]).size
          };

          // Update tab with response
          get().updateTab(tabId, { 
            response: apiResponse, 
            isLoading: false 
          });

          // Add to history
          get().addToHistory(request);

        } catch (error) {
          console.error('Request failed:', error);
          
          const errorResponse: ApiResponse = {
            status: 0,
            statusText: 'Network Error',
            headers: {},
            data: { error: error instanceof Error ? error.message : 'Unknown error' },
            time: 0,
            size: 0
          };

          get().updateTab(tabId, { 
            response: errorResponse, 
            isLoading: false 
          });
        }
      },

      setActiveCollection: (collection) => {
        set({ activeCollection: collection });
      },

      addToCollection: (request) => {
        const state = get();
        const requestWithCollection = { 
          ...request, 
          collection: state.activeCollection
        };
        
        set((state) => ({
          collections: [...state.collections, requestWithCollection]
        }));
      },

      removeFromCollection: (requestId) => {
        set((state) => ({
          collections: state.collections.filter(req => req.id !== requestId)
        }));
      },

      loadFromCollection: (request) => {
        get().addTab(request);
      },

      addCollection: (name) => {
        set({ activeCollection: name });
        // Track the collection exists by ensuring it's in available collections
        const state = get();
        if (!state.collections.some(req => req.collection === name)) {
          // Add a placeholder to track the collection exists
          set((currentState) => ({
            collections: [...currentState.collections, {
              id: `collection-placeholder-${Date.now()}`,
              name: `Placeholder for ${name}`,
              method: 'GET' as const,
              url: '',
              headers: {},
              body: '',
              collection: name
            } as ApiRequest]
          }));
        }
      },

      renameCollection: (oldName, newName) => {
        set((state) => ({
          collections: state.collections.map(req => 
            req.collection === oldName 
              ? { ...req, collection: newName }
              : req
          )
        }));
      },

      addEnvironment: (environment) => {
        set((state) => ({
          environments: [...state.environments, environment]
        }));
      },

      setActiveEnvironment: (environmentId) => {
        set({ activeEnvironmentId: environmentId });
      },

      updateEnvironment: (environmentId, updates) => {
        set((state) => ({
          environments: state.environments.map(env => 
            env.id === environmentId ? { ...env, ...updates } : env
          )
        }));
      },

      updateEnvironmentVariable: (environmentId, key, value) => {
        set((state) => ({
          environments: state.environments.map(env => 
            env.id === environmentId 
              ? { 
                  ...env, 
                  variables: { 
                    ...env.variables, 
                    [key]: value 
                  } 
                }
              : env
          )
        }));
      },

      deleteEnvironmentVariable: (environmentId, key) => {
        set((state) => ({
          environments: state.environments.map(env => 
            env.id === environmentId 
              ? { 
                  ...env, 
                  variables: Object.fromEntries(
                    Object.entries(env.variables).filter(([k]) => k !== key)
                  )
                }
              : env
          )
        }));
      },

      addEnvironmentVariable: (environmentId, key, value) => {
        set((state) => ({
          environments: state.environments.map(env => 
            env.id === environmentId 
              ? { 
                  ...env, 
                  variables: { 
                    ...env.variables, 
                    [key]: value 
                  } 
                }
              : env
          )
        }));
      },

      addToHistory: (request) => {
        set((state) => ({
          history: [
            { ...request, timestamp: Date.now() },
            ...state.history.slice(0, 49) // Keep last 50
          ]
        }));
      },

      interpolateVariables: (text) => {
        const state = get();
        const activeEnv = state.environments.find(env => env.id === state.activeEnvironmentId);
        
        if (!activeEnv) return text;

        return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          return activeEnv.variables[varName] || match;
        });
      }
    }),
    {
      name: 'api-nexus-store',
      partialize: (state) => ({
        collections: state.collections,
        activeCollection: state.activeCollection,
        environments: state.environments,
        activeEnvironmentId: state.activeEnvironmentId,
        history: state.history
      })
    }
  )
);
