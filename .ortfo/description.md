---
made with: [javascript]
finished: 2025-07-02
aliases: [sw&rpc]
colors:
  primary: "#272501"
  secondary: "#ffffff"
  tertiary: "#F6F00A"
tags: [library]
layout:
  - m1
  - [p1, p6]
  - [p2, p6]
  - [p3, p6]
  - [p4, p6]
  - [p5, p6]
  - [l1, l2, l3]
---

# swarpc

![the logo: 'sw&rpc' written in black on top of a thick, bright yellow horizontal stripe](../logo.png)

:: en

A library to do RPC[^4] between a main web page and a Service worker[^1]. Developed while developing CIGALE: we were running neural network inference on the user's device, but doing so on the _same thread_ as the main UI[^3] code, making the application slow and laggy while inference was running (loading spinners not spinning smoothly, the UI reacting with delays, etc.)

The solution was to use [Service workers](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker), a technology that can run code off the UI thread.

But the API is a bit cumbersome: you have to send "message" events, and listen for them on the service worker code.

Thus, I made this library that, in a way that's very similar to [tRPC](https://trpc.io), allows you to define procedures (the types of their arguments, what they return, etc), implement them on the service worker code, and run them on the client as if it was a normal function.

Moreover, as this is intended for long-running functions, there is first-class support for reacting to progress updates as the function is running, and update the UI: for example, while downloading a large file, the download progress can be reported back to the callsite[^2], where it can be used to update a progress bar.

```javascript
import { type } from "arktype";
import { Client, Server } from "swarpc";

// Define (shared file)
const procedures = {
  sum: {
    input: type(["number", "number"]),
    progress: type("0 <= number <= 100"),
    success: type("number"),
  },
};

// Implement (service worker)
server = Server(procedures);
server.sum(async ([a, b], setProgress) => {
  while (a < b) {
    a += 1;
    setProgress((a / b) * 100);
  }
  return a;
});

server.start();

// Call (web page)
await Client(procedures)
  .sum([2, 2], (p) => {
    console.log(`[${p}%] Computing…`);
  })
  .then(console.info);
```

[Source code](https://github.com/gwennlbh/swarpc)

[Documentation](https://gwennlbh.github.io/swarpc/docs)

[on NPM](https://www.npmjs.com/package/swarpc)

[^1]: Web technology that allows running code in the background

[^2]: Locations in the code where a function gets called

[^3]: UI: User Interface

[^4]: RPC: Remote Procedure Calls

:: fr

Une bibliothèque pour faire du RPC[^4] entre une page web et un Service worker[^1]. Développée pendant le développement de [CIGALE](/cigale) : nous faisions tourner l'inférence d'un réseau neuronal sur l'appareil de l'utilisateurice, mais sur le _même thread_ que le code principal de l'UI[^3], ce qui rendait l'application lente pendant que l'inférence tournait (les spinners de chargement tournaient en saccades, l'UI réagissait avec des retards, etc).

La solution consistait à utiliser des [Service workers] (https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker), une technologie qui permet d'exécuter du code en dehors du thread de l'UI.

Mais l'API est un peu lourde : il faut envoyer des événements de type "message", et les écouter sur le code du service worker.

J'ai donc créé cette bibliothèque qui, d'une manière très similaire à [tRPC](https://trpc.io), permet de définir des procédures (le type de leurs arguments, ce qu'elles renvoient, etc), de les implémenter dans le code du service worker, et de les exécuter sur le client comme s'il s'agissait d'une fonction normale.

De plus, comme il s'agit de fonctions à longue durée d'exécution, il existe un support de première classe pour réagir aux mises à jour de la progression pendant que la fonction s'exécute, et mettre à jour l'UI : par exemple, pendant le téléchargement d'un gros fichier, la progression du téléchargement peut être rapportée au site d'appel[^2], où elle peut être utilisée pour mettre à jour une barre de progression.

```javascript
import { type } from "arktype";
import { Client, Server } from "swarpc";

// Define (shared file)
const procedures = {
  sum: {
    input: type(["number", "number"]),
    progress: type("0 <= number <= 100"),
    success: type("number"),
  },
};

// Implement (service worker)
server = Server(procedures);
server.sum(async ([a, b], setProgress) => {
  while (a < b) {
    a += 1;
    setProgress((a / b) * 100);
  }
  return a;
});

server.start();

// Call (web page)
await Client(procedures)
  .sum([2, 2], (p) => {
    console.log(`[${p}%] Computing…`);
  })
  .then(console.info);
```

[Code source](https://github.com/gwennlbh/swarpc)

[Documentation](https://gwennlbh.github.io/swarpc/docs)

[Sur NPM](https://www.npmjs.com/package/swarpc)

[^1]: Technologie Web qui permet d'exécuter du code en arrière-plan

[^2]: Emplacement dans le code où une fonction est appelée

[^3]: UI : Interface Utilisateur (_User Interface_)

[^4]: RPC : Appel de procédure à distance

Traduit avec DeepL.com (version gratuite)
