import Pushmatic from "../src";
import { jest } from "@jest/globals";

describe("Pushmatic Library", () => {
  /* ---------------------------
     Notification Permission Tests
  ---------------------------- */
  describe("requestPermission", () => {
    beforeAll(() => {
      // Create a global Notification object to simulate the browser API.
      global.Notification = {
        requestPermission: jest.fn(),
        permission: "default",
      };
    });

    beforeEach(() => {
      Notification.requestPermission.mockReset();
      Notification.permission = "default";
    });

    test("should resolve when permission is granted", async () => {
      Notification.requestPermission.mockResolvedValue("granted");
      const permission = await Pushmatic.requestPermission();
      expect(permission).toBe("granted");
    });

    test("should reject when permission is not granted", async () => {
      Notification.requestPermission.mockResolvedValue("denied");
      await expect(Pushmatic.requestPermission()).rejects.toThrow(
        "Notification permission not granted."
      );
    });
  });

  /* ---------------------------
     Service Worker Registration Tests
  ---------------------------- */
  describe("registerServiceWorker", () => {
    let originalServiceWorker;

    beforeAll(() => {
      originalServiceWorker = navigator.serviceWorker;
    });

    afterEach(() => {
      navigator.serviceWorker = originalServiceWorker;
    });

    test("should register a service worker and resolve with registration", async () => {
      const dummyRegistration = { pushManager: {} };
      navigator.serviceWorker = {
        register: jest.fn().mockResolvedValue(dummyRegistration),
      };

      const registration = await Pushmatic.registerServiceWorker("/sw.js");
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js");
      expect(registration).toEqual(dummyRegistration);
    });

    test("should reject if Service Workers are not supported", async () => {
      delete global.navigator.serviceWorker;
      await expect(Pushmatic.registerServiceWorker("/sw.js")).rejects.toThrow(
        "Service Workers are not supported in this browser."
      );
    });

    test("should reject when service worker registration fails", async () => {
      const error = new Error("Registration failed");
      navigator.serviceWorker = {
        register: jest.fn().mockRejectedValue(error),
      };
      await expect(Pushmatic.registerServiceWorker("/sw.js")).rejects.toThrow(
        "Registration failed"
      );
    });
  });

  /* ---------------------------
     Push Subscription Tests
  ---------------------------- */
  describe("subscribeToPush", () => {
    let dummyRegistration;
    let dummyPushManager;

    beforeEach(() => {
      Notification.permission = "granted";

      dummyPushManager = {
        subscribe: jest.fn(),
      };

      dummyRegistration = {
        pushManager: dummyPushManager,
      };
    });

    test("should subscribe to push notifications and resolve with subscription data", async () => {
      const dummySubscription = { endpoint: "https://dummy.push/subscription" };
      dummyPushManager.subscribe.mockResolvedValue(dummySubscription);

      const options = {
        userVisibleOnly: true,
        applicationServerKey: "dummyKey",
      };
      const subscription = await Pushmatic.subscribeToPush(
        dummyRegistration,
        options
      );
      expect(dummyPushManager.subscribe).toHaveBeenCalledWith(options);
      expect(subscription).toEqual(dummySubscription);
    });

    test("should reject if pushManager is not supported", async () => {
      const regWithoutPushManager = {};
      const options = {
        userVisibleOnly: true,
        applicationServerKey: "dummyKey",
      };
      await expect(
        Pushmatic.subscribeToPush(regWithoutPushManager, options)
      ).rejects.toThrow("Push messaging is not supported in this browser.");
    });

    test("should reject if Notification permission is not granted", async () => {
      Notification.permission = "default";
      const options = {
        userVisibleOnly: true,
        applicationServerKey: "dummyKey",
      };
      await expect(
        Pushmatic.subscribeToPush(dummyRegistration, options)
      ).rejects.toThrow("Notification permission is not granted.");
    });

    test("should reject when push subscription fails", async () => {
      const error = new Error("Subscription failed");
      dummyPushManager.subscribe.mockRejectedValue(error);
      const options = {
        userVisibleOnly: true,
        applicationServerKey: "dummyKey",
      };
      await expect(
        Pushmatic.subscribeToPush(dummyRegistration, options)
      ).rejects.toThrow("Subscription failed");
    });
  });

  /* ---------------------------
     Combined Initialization Tests
  ---------------------------- */
  describe("initializePushNotifications", () => {
    let originalRequestPermission;
    let originalRegisterServiceWorker;
    let originalSubscribeToPush;

    beforeEach(() => {
      originalRequestPermission = Pushmatic.requestPermission;
      originalRegisterServiceWorker = Pushmatic.registerServiceWorker;
      originalSubscribeToPush = Pushmatic.subscribeToPush;

      Object.defineProperty(global.navigator, "serviceWorker", {
        value: {
          register: jest.fn().mockResolvedValue({ pushManager: {} }),
        },
        writable: true,
      });
    });

    afterEach(() => {
      Pushmatic.requestPermission = originalRequestPermission;
      Pushmatic.registerServiceWorker = originalRegisterServiceWorker;
      Pushmatic.subscribeToPush = originalSubscribeToPush;
    });

    test("should resolve with subscription data when all steps succeed", async () => {
      Pushmatic.requestPermission = jest.fn().mockResolvedValue("granted");
      const dummyRegistration = { pushManager: {} };
      Pushmatic.registerServiceWorker = jest
        .fn()
        .mockResolvedValue(dummyRegistration);
      const dummySubscription = { endpoint: "https://dummy.push/subscription" };
      Pushmatic.subscribeToPush = jest
        .fn()
        .mockResolvedValue(dummySubscription);

      const options = {
        userVisibleOnly: true,
        applicationServerKey: "dummyKey",
      };
      const subscription = await Pushmatic.initializePushNotifications(
        "/sw.js",
        options
      );

      expect(Pushmatic.requestPermission).toHaveBeenCalled();
      expect(Pushmatic.registerServiceWorker).toHaveBeenCalledWith("/sw.js");
      expect(Pushmatic.subscribeToPush).toHaveBeenCalledWith(
        dummyRegistration,
        options
      );
      expect(subscription).toEqual(dummySubscription);
    });

    test("should reject if any step fails (simulate requestPermission failure)", async () => {
      jest.spyOn(Pushmatic, "registerServiceWorker").mockResolvedValue({
        pushManager: {},
      });

      jest
        .spyOn(Pushmatic, "requestPermission")
        .mockRejectedValue(new Error("Permission error"));

      await expect(
        Pushmatic.initializePushNotifications("/sw.js", {
          userVisibleOnly: true,
          applicationServerKey: "dummyKey",
        })
      ).rejects.toThrow("Permission error");
    });

    test("should reject if any step fails (simulate service worker registration failure)", async () => {
      Pushmatic.requestPermission = jest.fn().mockResolvedValue("granted");
      Pushmatic.registerServiceWorker = jest
        .fn()
        .mockRejectedValue(new Error("Registration error"));
      const options = {
        userVisibleOnly: true,
        applicationServerKey: "dummyKey",
      };
      await expect(
        Pushmatic.initializePushNotifications("/sw.js", options)
      ).rejects.toThrow("Registration error");
    });

    test("should reject if any step fails (simulate subscribeToPush failure)", async () => {
      const dummyRegistration = { pushManager: {} };
      Pushmatic.requestPermission = jest.fn().mockResolvedValue("granted");
      Pushmatic.registerServiceWorker = jest
        .fn()
        .mockResolvedValue(dummyRegistration);
      Pushmatic.subscribeToPush = jest
        .fn()
        .mockRejectedValue(new Error("Subscription error"));
      const options = {
        userVisibleOnly: true,
        applicationServerKey: "dummyKey",
      };
      await expect(
        Pushmatic.initializePushNotifications("/sw.js", options)
      ).rejects.toThrow("Subscription error");
    });
  });
});
