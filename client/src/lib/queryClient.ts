import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // First element is the base URL
    const baseUrl = queryKey[0] as string;
    
    // Second element (if exists) could be parameters
    const params = queryKey.length > 1 && typeof queryKey[1] === 'object' 
      ? queryKey[1] as Record<string, any>
      : null;
    
    // Build URL with query parameters if they exist
    let url = baseUrl;
    if (params) {
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlParams.append(key, value.toString());
        }
      });
      
      // Add parameters to URL if we have any
      const queryString = urlParams.toString();
      if (queryString) {
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    
    console.log(`Fetching from URL: ${url}`);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });
      
      console.log(`Received response with status: ${res.status}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('Returning null due to 401 status');
        return null;
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const text = await res.text();
      console.log(`Response text: ${text.substring(0, 100)}...`);
      
      try {
        if (text.trim() === '') {
          console.log('Empty response text, returning empty array');
          return [] as T;
        }
        
        const json = JSON.parse(text);
        console.log(`Successfully parsed JSON. Type: ${Array.isArray(json) ? 'array' : typeof json}, Length: ${Array.isArray(json) ? json.length : 'N/A'}`);
        return json;
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        console.error('Raw response:', text);
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
    } catch (fetchError) {
      console.error(`Error fetching ${url}:`, fetchError);
      throw fetchError;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
