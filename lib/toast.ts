// lib/toast.ts
type ToastType = 'success' | 'error' | 'info' | 'warning';

export function toast(message: string, type: ToastType = 'info') {
  // Simple console implementation for now
  // You can enhance this with a proper toast library later
  const emoji = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠'
  }[type];
  
  console.log(`${emoji} ${message}`);
  
  // If you're using a toast library like react-hot-toast or sonner, implement it here
  // Example: toast.success(message) or toast.error(message)
}