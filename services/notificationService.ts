export const NotificationService = {
  isSupported: (): boolean => {
    return 'Notification' in window;
  },

  getPermission: (): NotificationPermission => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  send: (title: string, body?: string) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/vite.svg', // Uses default vite icon for now
        badge: '/vite.svg',
        vibrate: [200, 100, 200]
      } as any);
    }
  }
};