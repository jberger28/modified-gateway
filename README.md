# Mozilla WebThings Gateway
## With Modifications by Jared Berger, Karol Regula, and Kelly Shaw

Web of Things gateway connected to a distibuted, NoSQL Cassandra database.

See prerequisites for building below. Then, run the following: 
### Install Regular (One Gateway) Version
```
$ git clone https://github.com/jberger28/modified-gateway
```

### Install Multiple Gateway Version
```
$ git clone -b multiple-gateways https://github.com/jberger28/modified-gateway
```

### Navigate to Gateway Directory
```
$ cd modified-gateway
```

### If you have not yet installed node
```
$ nvm install
$ nvm use
$ nvm alias default $(node -v)
```

### Install Dependencies
```
$ npm ci
```

### Add Firewall exceptions (Fedora Linux Only)


    $ sudo firewall-cmd --zone=public --add-port=4443/tcp --permanent
    $ sudo firewall-cmd --zone=public --add-port=8080/tcp --permanent
    $ sudo firewall-cmd --zone=public --add-port=5353/udp --permanent


### Start Gateway
```
npm start
```

### If Setting Up for the First Time
After starting the gateway:
Load `http://localhost:8080` in web browser, and follow instructions to set up domain name and register.

## Prerequisites for Building (from original repo: https://github.com/mozilla-iot/gateway)

### Update Package Cache (Linux only)

Under Ubuntu/Debian Linux:
```
$ sudo apt update
```

Under Fedora Linux:
```
$ sudo dnf --refresh upgrade
```

### Install pkg-config

Under Ubuntu/Debian Linux:
```
$ sudo apt install pkg-config
```

Under Fedora Linux:
```
$ sudo dnf install pkgconfig
```

Under macOS:
```
$ brew install pkg-config
```

### Install curl (needed to install nvm)

Under Ubuntu/Debian Linux:
```
$ sudo apt install curl
```

Under Fedora Linux:
```
$ sudo dnf install curl
```

### Install nvm (Recommended)

nvm allows you to easily install different versions of node. To install nvm:

```
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
```

Reinitialize your terminal session.

```
$ . ~/.bashrc
```

### Install libusb and libudev (Linux only)

Under Ubuntu/Debian Linux:
```
$ sudo apt install libusb-1.0-0-dev libudev-dev
```

Under Fedora Linux:
```
$ sudo dnf install libudev-devel libusb1-devel
```

### Install autoconf

Under Ubuntu/Debian Linux:
```
$ sudo apt install autoconf
```

Under Fedora Linux:
```
$ sudo dnf install autoconf
```

Under macOS:
```
$ brew install autoconf
```

### Install libpng (Linux only)

Under x86-64 or x86 Ubuntu/Debian Linux:
```
$ sudo apt install libpng16-16
```

Under ARM Ubuntu/Debian Linux:
```
$ sudo apt install libpng-dev
```

Under Fedora Linux:
```
$ sudo dnf install libpng-devel
```

### Install libffi

Under Ubuntu/Debian Linux:
```
$ sudo apt install libffi-dev
```

Under Fedora Linux:
```
$ sudo dnf install libffi-devel
```

Under macOS:
```
$ brew install libffi
```

### Install git

You'll need git to checkout the repositories.

Under Ubuntu/Debian Linux:
```
$ sudo apt install git
```

Under Fedora Linux:
```
$ sudo dnf install git
```

### Install gcc

Under Ubuntu/Debian Linux:
```
$ sudo apt install build-essential
```

Under Fedora Linux:
```
$ sudo dnf group install "C Development Tools and Libraries"
```

### Install Python tools

Under Ubuntu/Debian Linux:
```
$ sudo apt install python-pip python3-pip
$ sudo python2 -m pip install six
$ sudo python3 -m pip install git+https://github.com/mozilla-iot/gateway-addon-python#egg=gateway_addon
```

Under Fedora Linux:
```
$ sudo dnf install python2-pip python3-pip
$ sudo python2 -m pip install six
$ sudo python3 -m pip install git+https://github.com/mozilla-iot/gateway-addon-python#egg=gateway_addon
```

## Browser Support

The Gateway only supports the following browsers, due to its use of the [`Fetch API`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) and [`WebSocket API`](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API):
* Firefox 52+
* Chrome 43+
* Edge 14+
* Safari 10.1+
* Opera 29+


## Source Code Structure

* **`config/`** - Gateway configuration files
* **`image/`** - Tools for building the Raspberry Pi image
* **`src/`**
  * **`addons-test/`** - Add-ons used strictly for testing
  * **`controllers/`** - App URL routes and their logic
  * **`models/`** - Data model and business logic
  * **`platforms/`** - Platform-specific functionality
  * **`plugin/`** - Utility classes and methods used by add-ons
  * **`rules-engine/`** - The rules engine
  * **`test/`** - Integration tests
  * **`views/`** - HTML views
  * **`addon-loader.js`** - Script used for starting up Node-based add-ons
  * **`addon-manager.js`** - Manages add-ons (e.g. Zigbee, Z-Wave)
  * **`app.js`** - The main back end
  * **`certificate-manager.js`** - Certificate registration and renewal, via Let's Encrypt
  * **`command-utils.js`** - Utilities used by commands parser
  * **`constants.js`** - System-wide constants
  * **`db.js`** - Manages the SQLite3 database
  * **`deferred.js`** - Wraps up a promise in a slightly more convenient manner for passing around, or saving
  * **`dynamic-require.js`** - Small utility to require code from file system, rather than webpacked bundle
  * **`ec-crypto.js`** - Elliptic curve helpers for the ES256 curve
  * **`jwt-middleware.js`** - Express middleware for determining authentication status
  * **`log-timestamps.js`** - Utilities for adding timestamps to console logging functions
  * **`mdns-server.js`** - mDNS server
  * **`oauth-types.js`** - OAuth types
  * **`passwords.js`** - Password utilities
  * **`platform.js`** - Platform-specific utilities
  * **`push-service.js`** - Push notification service
  * **`router.js`** - Routes app URLs to controllers
  * **`router-setup.js`** - Initial router setup code for OpenWrt
  * **`sleep.js`** - Small utility to implement a promise-based sleep
  * **`ssltunnel.js`** - Utilities to determine state of tunnel and manage the PageKite process
  * **`user-profile.js`** - Manages persistent user data
  * **`utils.js`** - Various utility functions
  * **`wifi-setup.js`** - Initial Wi-Fi setup code for Raspbian
* **`static/`** - Static CSS, JavaScript & image resources for web app front end
* **`tools/`** - Helpful utilities (not part of the build)
* **`package.json`** - npm module manifest
