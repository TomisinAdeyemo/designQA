export function useParams(): Record<string, string> {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  return {
    id: segments[1] || '',
  };
}

export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
