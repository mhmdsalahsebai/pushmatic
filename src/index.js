/**
 * pushmatic: A simple library to manage web push notifications.
 */
class Pushmatic {
  /**
   * Request permission for notifications.
   * @returns {Promise<string>} Resolves to "granted" if successful.
   */
  static requestPermission() {
    return new Promise((resolve, reject) => {
      if (!("Notification" in window)) {
        return reject(
          new Error("This browser does not support notifications.")
        );
      }
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          resolve(permission);
        } else {
          reject(new Error("Notification permission not granted."));
        }
      });
    });
  }

  /**
   * Register a service worker.
   * @param {string} scriptURL - The URL of the service worker script.
   * @returns {Promise<ServiceWorkerRegistration>} The registration object.
   */
  static registerServiceWorker(scriptURL) {
    return new Promise((resolve, reject) => {
      if (!("serviceWorker" in navigator)) {
        return reject(
          new Error("Service Workers are not supported in this browser.")
        );
      }
      navigator.serviceWorker
        .register(scriptURL)
        .then((registration) => resolve(registration))
        .catch(reject);
    });
  }

  /**
   * Subscribe to push notifications.
   * @param {ServiceWorkerRegistration} registration - The service worker registration object.
   * @param {PushSubscriptionOptionsInit} options - The subscription options.
   * @returns {Promise<PushSubscription>} The push subscription object.
   */
  static subscribeToPush(registration, options) {
    return new Promise((resolve, reject) => {
      if (!registration.pushManager) {
        return reject(
          new Error("Push messaging is not supported in this browser.")
        );
      }
      if (Notification.permission !== "granted") {
        return reject(new Error("Notification permission is not granted."));
      }
      registration.pushManager.subscribe(options).then(resolve).catch(reject);
    });
  }

  /**
   * Initialize push notifications with a single function.
   * @param {string} serviceWorkerUrl - The URL of the service worker script.
   * @param {PushSubscriptionOptionsInit} options - Push subscription options.
   * @returns {Promise<PushSubscription>} Resolves with the push subscription data.
   */
  static initializePushNotifications(serviceWorkerUrl, options) {
    return this.registerServiceWorker(serviceWorkerUrl)
      .then((registration) => {
        return this.requestPermission().then(() => registration);
      })
      .then((registration) => this.subscribeToPush(registration, options));
  }
}

export default Pushmatic;
