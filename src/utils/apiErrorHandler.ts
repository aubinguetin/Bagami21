/**
 * Global API error handler for detecting account suspension
 * Add this to API calls to automatically redirect to suspended page
 */
export function handleApiError(error: any, router: any) {
  if (error?.code === 'ACCOUNT_SUSPENDED' || error?.error?.includes('suspended')) {
    // Clear auth data
    localStorage.removeItem('bagami_authenticated');
    localStorage.removeItem('bagami_user_contact');
    localStorage.removeItem('bagami_user_id');
    localStorage.removeItem('bagami_user_name');
    
    // Redirect to suspended page
    router.push('/suspended');
    return true;
  }
  return false;
}

/**
 * Fetch wrapper that automatically handles suspension errors
 */
export async function apiFetch(url: string, options?: RequestInit, router?: any): Promise<Response> {
  const response = await fetch(url, options);
  
  if (response.status === 403) {
    try {
      const data = await response.json();
      if (data.code === 'ACCOUNT_SUSPENDED' && router) {
        handleApiError(data, router);
      }
      // Re-throw with parsed data
      throw data;
    } catch (e) {
      // If JSON parsing fails, just throw the response
      throw response;
    }
  }
  
  return response;
}
