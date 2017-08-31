# kite-cli
Command line tools for creating [Kite](https://github.com/kite-js/kite) applications.

This tool initialize a folder with TypeScript configuration file `tsconfig.json`
and some basic files for developing Kite application.

# Installation

```sh
npm install kite-tools
```

# Usage

1. Create a project folder, and change working directory to it:

```sh
mkdir kite-test
cd kite-test
```

2. Run `npm init` to initialize node developing environment:

```sh
npm init
```

3. Run Kite command line tools and follow the prompt to initialize Kite project:

```sh
kite init
```

For using everything with default, simply press `enter` key to walk through the wizard.

4. Compile and run

Template source files are placed into the project if everything ends normally in the 
above steps, so compile and run this application:

```sh
tsc
node dist/app.server.js
```

5. Create Kite modules

create a controller as file "src/controllers/user/login.controller.ts":

```sh
kite -a user/login
```

create a service as file "src/services/user.service.ts":

```sh
kite -s user
```

create model as file "src/models/user.model.ts":

```sh
kite -m user
```

please note that entry point "dist/app.server.js" is the default setting, 
please replace it with your entry point file name if you specified other values.
