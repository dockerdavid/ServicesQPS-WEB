export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    return Notification.permission;
  }
};

export const showWebNotification = (
  title: string,
  options?: NotificationOptions & { onClick?: () => void },
) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const { onClick, ...rest } = options ?? {};
  const notification = new Notification(title, rest);

  if (onClick) {
    notification.onclick = () => {
      onClick();
      notification.close();
    };
  }

  return notification;
};
