# Pushmatic

A lightweight, framework-agnostic library for handling web push notifications easily.

## 🚀 Why Pushmatic?

Web push notifications allow you to engage users even when they are not actively using your website. **Pushmatic** simplifies handling web push notifications.

This package ensures **consistent behavior across all browsers** and handles browser-specific differences. For example:

- **Service Worker First**: Pushmatic ensures that the service worker is registered **before** requesting notification permission, which is required in **Edge**.
- **User-Generated Events**: It encourages requesting permission inside a **short-lived user-generated event** (e.g., a button click) because browsers like **Firefox** and **Safari** enforce this for security and user experience reasons.

Pushmatic has been **tested across all browsers that support web push notifications**, ensuring reliability and seamless integration.

### Web Push notifications

Web push notifications is actually pretty simple: when a user chooses to allow browser notifications from your website, Microsoft/Mozilla/Google create a REST endpoint somewhere in their clouds. You just need to issue a signed POST request to that endpoint with a certain payload to have notifications pushed to the user’s browser. You can send as many requests as you like, and it’s completely free.

Many developers get confused about this due to misleading articles suggesting that you need Firebase. However, since the Web Push protocol was standardized in 2016, all major browsers support it directly, eliminating the need for Firebase.

**Good read on this topic:** [How to send web push notifications for free without Firebase](https://levelup.gitconnected.com/how-to-send-web-push-notifications-for-free-with-aws-and-without-firebase-19d02eadf1f7)

## ✨ Features

- 📬 Subscribe users to push notifications
- 🔍 Check push notification permission status
- ✅ Unified API to handle everything in one function
- ⚡ Promise-based API for easy integration
- 🔗 Framework-agnostic (works with vanilla JS, React, Vue, etc.)
- 🌍 Consistent behavior across all browsers

## 📦 Installation

```sh
npm install pushmatic
```

## 🌍 Live Demo & Source Code

- Live Demo: https://pushmatic.vercel.app/

- Live Demo Source Code: https://github.com/mhmdsalahsebai/pushmatic-website

## 🔑 Generating and Using VAPID Keys

To generate VAPID keys, run:

```sh
npx web-push generate-vapid-keys --json
```

Example output:

```
Public Key:
Your generated public key

Private Key:
Your generated private key
```

- The **public key** is used on the client-side and can be stored in an environment variable.
- ⚠️ **Never store the private key in the client-side code!** The private key must remain secret and should only be used on your server to send push notifications.

## 🚀 One Function to Rule Them All

```js
import Pushmatic from "pushmatic";

Pushmatic.initializePushNotifications("/sw.js", {
  userVisibleOnly: true,
  applicationServerKey: "YOUR_PUBLIC_VAPID_KEY",
})
  .then((subscription) => {
    console.log("Subscribed:", subscription);
    // Send subscription to you server
  })
  .catch(console.error);
```

## 🛠 API Reference

### `Pushmatic.initializePushNotifications(serviceWorkerUrl, options)`

✅ **Description**:  
Registers a service worker, requests notification permission, and subscribes to push notifications in a single call.

✅ **Parameters**:

- `serviceWorkerUrl: string` → Path to the service worker file.
- `options: PushSubscriptionOptionsInit` → Push subscription options (must include `userVisibleOnly: true` and your `applicationServerKey`).

✅ **Returns**:

- `Promise<PushSubscription>` - Resolves with the subscription data.

---

## 🎯 Individual Methods (Modular Approach)

If you prefer more control, you can use the individual methods instead of `initializePushNotifications()`.

### 1️⃣ `Pushmatic.requestPermission()`

✅ **Description**:  
Requests permission from the user to enable push notifications.

✅ **Returns**:

- `Promise<string>` - Resolves with `"granted"` if permission is allowed.
- Rejects with an error if permission is denied.

✅ **Example**:

```js
Pushmatic.requestPermission()
  .then((status) => console.log("Permission status:", status))
  .catch((error) => console.error("Permission error:", error));
```

---

### 2️⃣ `Pushmatic.registerServiceWorker(scriptURL)`

✅ **Description**:  
Registers a service worker with the given script URL.

✅ **Parameters**:

- `scriptURL: string` → The path to your service worker file (e.g., `"/sw.js"`).

✅ **Returns**:

- `Promise<ServiceWorkerRegistration>` - Resolves with the service worker registration.

✅ **Example**:

```js
Pushmatic.registerServiceWorker("/sw.js")
  .then((registration) =>
    console.log("Service worker registered:", registration)
  )
  .catch((error) => console.error("Service worker error:", error));
```

---

### 3️⃣ `Pushmatic.subscribeToPush(registration, options)`

✅ **Description**:  
Subscribes the user to push notifications using the given service worker registration.

✅ **Parameters**:

- `registration: ServiceWorkerRegistration` → The service worker registration object.
- `options: PushSubscriptionOptionsInit` → Push subscription options (must include `userVisibleOnly` and `applicationServerKey`).

✅ **Returns**:

- `Promise<PushSubscription>` - Resolves with the push subscription data.

✅ **Example**:

```js
const options = {
  userVisibleOnly: true,
  applicationServerKey: "your-public-key-here",
};

Pushmatic.registerServiceWorker("/sw.js")
  .then((registration) => Pushmatic.subscribeToPush(registration, options))
  .then((subscription) => console.log("Push subscription:", subscription))
  .catch((error) => console.error("Push subscription error:", error));
```

## 📍 Where to Place the Service Worker

Your service worker file (e.g., `sw.js`) should be placed at the root of your website so that it can control the entire domain. Example content for `sw.js`:

```js
self.addEventListener("push", function (event) {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/icon.png",
  });
});
```

📌 At this point, Pushmatic library has completed its role. The next sections serve as tutorial.

## ⚛️ Using Pushmatic in a React Component

```jsx
import { useState } from "react";
import Pushmatic from "pushmatic";

function PushButton() {
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe() {
    Pushmatic.initializePushNotifications("/sw.js", {
      userVisibleOnly: true,
      applicationServerKey: "YOUR_PUBLIC_VAPID_KEY",
    })
      .then((subscription) => {
        console.log("Subscribed:", subscription);
        setSubscribed(true);
        sendSubscriptionToBackEnd(subscription);
      })
      .catch(console.error);
  }

  function sendSubscriptionToBackEnd(subscription) {
    return fetch("/api/save-subscription/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Bad status code from server.");
        }
        return response.json();
      })
      .then((responseData) => {
        if (!(responseData.data && responseData.data.success)) {
          throw new Error("Bad response from server.");
        }
      });
  }

  return (
    <button onClick={handleSubscribe} disabled={subscribed}>
      {subscribed ? "Subscribed" : "Enable Notifications"}
    </button>
  );
}

export default PushButton;
```

⚠️ **Some browsers (like Firefox and Safari) require that the notification permission request be made inside a short-lived user-generated event (e.g., a button click). Otherwise, the request will be blocked.**

## 🌐 Using Pushmatic in Vanilla JavaScript

```html
<button id="push-button">Enable Notifications</button>

<script type="module">
  import Pushmatic from "pushmatic";

  document.getElementById("push-button").addEventListener("click", () => {
    Pushmatic.initializePushNotifications("/sw.js", {
      userVisibleOnly: true,
      applicationServerKey: "YOUR_PUBLIC_VAPID_KEY",
    })
      .then((subscription) => {
        console.log("Subscribed:", subscription);
      })
      .catch(console.error);
  });
</script>
```

## 🌍 Server-Side: Saving Subscriptions and Sending Push Notifications

To send notifications from your server, use the [`web-push`](https://www.npmjs.com/package/web-push) library.

### Install `web-push` on your backend

```sh
npm install web-push
```

### Storing User Subscriptions

Your backend should have an endpoint to save user subscriptions somewhere (e.g., a database):

```js
const express = require("express");
const app = express();
app.use(express.json());

const subscriptions = [];

app.post("/api/save-subscription/", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ data: { success: true } });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Sending a Push Notification

```js
const webpush = require("web-push");

const vapidKeys = {
  publicKey: "Your generated public key",
  privateKey: "Your generated private key",
};

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const payload = JSON.stringify({
  title: "Hello!",
  body: "This is a push notification.",
});

subscriptions.forEach((subscription) => {
  webpush
    .sendNotification(subscription, payload)
    .then(() => console.log("Push notification sent!"))
    .catch(console.error);
});
```

🔗 **More details**: [Sending messages with Web Push libraries](https://web.dev/articles/sending-messages-with-web-push-libraries)

## 🧪 Testing

Pushmatic uses [Jest](https://jestjs.io/) for unit testing. To run tests:

```sh
npm test
```

## 🛠 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📜 License

MIT License © Mohamed Salah
