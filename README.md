# @breq/roslib

[![Test](https://github.com/breqdev/roslibjs/actions/workflows/test.yml/badge.svg)](https://github.com/breqdev/roslibjs/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/breqdev/roslibjs/branch/develop/graph/badge.svg?token=3RK2PR2PH4)](https://codecov.io/gh/breqdev/roslibjs)

## A Modern TypeScript Library for ROS

This project is a port of [roslibjs](http://wiki.ros.org/roslibjs) to TypeScript using modern ECMAScript features. The API is similar to the original, but not entirely compatible, as many asynchronous functions have been modified to return a Promise instead of accepting a callback.

This project is designed to work with projects in the [Robot Web Tools](http://robotwebtools.org/) effort. In particular, you must run [`rosbridge_server`](http://wiki.ros.org/rosbridge_server) on your ROS node in order to connect with this library.

Do not expose a rosbridge endpoint to a public network or to the internet! This is a security risk. If you cannot run your robot's control system on a private network, you should use a reverse proxy on the server-side to restrict access.

### ES Modules

This project is ESM only! ECMAScript modules reduce the build complexity, and they enable the use of tree-shaking to make your bundle smaller.

- If you are creating a client app using a bundler like Webpack or Rollup, ensure that it can load ES modules.
- If you are using Node on the server, set `"type": "module"` in your `package.json` file.
- If you are developing a package that uses this library, your package must also be ESM only.

### Dependencies

- [`@xmldom/xmldom`](https://github.com/xmldom/xmldom) is used to parse Unified Robot Description Format (URDF) files.
- [`bson`](https://github.com/mongodb/js-bson) is used to decode BSON-encoded messages from ROS.
- [`cbor-js`](https://github.com/paroga/cbor-js) is used to decompress CBOR messages from ROS.
- [`EventEmitter2`](https://github.com/EventEmitter2/EventEmitter2) is used as the base for the `Ros` class and others to handle events.
- [`isomorphic-ws`](https://github.com/heineiuo/isomorphic-ws/) is used to support WebSocket connections in both Node and browsers.
- [`pngparse`](https://github.com/darkskyapp/pngparse) is used to decode PNG-encoded messages in Node.

## Differences to `roslibjs`

### TypeScript

This project is written entirely in TypeScript. This reduces bugs and gives users only the best 100% organic, grass-fed type definitions.

### Unit Tests

This project has unit tests written covering `Topic`, `Service` and `Param` functionality. Code coverage is tracked.

### Promise-based API

Services are written using ECMAScript Promises. This simplifies writing asynchronous code. Additionally, any functionality relying on ROS Services (such as calls to `rosapi`) now has a Promise-based API as well.

### Narrower Scope

This project does not use Babel, Grunt, or similar build tools--just the TypeScript compiler. As a result, browser bundles are not provided. If you are building a client-side app, use a bundler like Webpack or Rollup. If you would like to target an older runtime (old Node, IE, etc.), you will need to use Babel yourself.

### Pure ES Module, No Side Effects

This project is written purely in ES modules with zero side effects. This allows bundlers to remove unused code, and it simplifies use in browsers.

### Support for modern bundlers (Vite, Create React App)

The original roslibjs did not work with Rollup due to a quirk in the configuration. Additionally, the original required [`webworkify`](https://github.com/browserify/webworkify) to be installed, which is a dead library that does not work with Webpack 5. This project maintains compatibility with the latest bundlers, enabling use with tools like Vite and Create React App.

### Use of ES6 Classes

This project replaces the original `prototype`-based classes with ES6 classes. This improves type-checking and code readability.

### Cleaner WebSocket-in-Web-Worker Support

The original `roslib` relied on hijacking [`browserify/webworkify`](https://github.com/browserify/webworkify) to take advantage of its internal implementation for running WebSockets in Web Workers. This library uses the [`workersocket`](https://github.com/breqdev/workersocket) library instead.

## Usage

```
npm install roslibjs
```

```ts
import { Ros } from "roslib";

const ros = new Ros({
  url: "ws://localhost:9090",
});

const topic = ros.Topic({
  name: "/chatter",
  messageType: "std_msgs/String",
});

topic.subscribe((message) => {
  console.log(message.data);
  topic.unsubscribe();
  ros.close();
});

setTimeout(() => {
  topic.publish({
    data: "Hello, world!",
  });
}, 100);
```

## Troubleshooting

1. Check that connection is established. You can listen to error and
   connection events to report them to console. See
   examples/simple.html for a complete example:

   ```ts
   ros.on("error", (error) => {
     console.log(error);
   });
   ros.on("connection", () => {
     console.log("Connection made!");
   });
   ```

2. Check that you have the websocket server is running on
   port 9090. For server use, run

   ```bash
   netstat -a | grep 9090
   ```

   and to check on the client, open `http://[host]:9090/` in your browser,
   replacing `[host]` with the remote address of your ROS server. You should
   see a page mentioning "WebSocket Server."

## Status

The following portions of the library have not yet been rewritten:

- `src/actionlib`, ActionServer and client related utilities
- `src/tf`, utilities related to the `tf2` transform handling library
