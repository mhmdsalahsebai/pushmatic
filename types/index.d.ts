declare class Pushmatic {
  static requestPermission(): Promise<string>;
  static registerServiceWorker(
    scriptURL: string
  ): Promise<ServiceWorkerRegistration>;
  static subscribeToPush(
    registration: ServiceWorkerRegistration,
    options: PushSubscriptionOptionsInit
  ): Promise<PushSubscription>;
  static initializePushNotifications(
    serviceWorkerUrl: string,
    options: PushSubscriptionOptionsInit
  ): Promise<PushSubscription>;
}

export default Pushmatic;
