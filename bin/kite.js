#!/usr/bin/env node

/**
 * Copyright (c) 2017 [Arthur Xie]
 * <https://github.com/kite-js/kite-cli>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

const program = require('commander');
const path = require('path');
const fs = require('fs');
const co = require('co');
const prompt = require('co-prompt');
const exec = require('child_process').exec;
const version = require('../package.json').version;
const makedir = require('make-dir');

const WELCONME = `
This utility will help you create a Kite application.
It only covers the most common items, and tries to guess sensible defaults.

Hit "Ctrl + C" at any time to quit.
`;


program
    .version(version)
    .usage('[options]')
    .option('-i, init', 'show a wizard to initialize project', init)
    .option('-a, api <module name>', 'create a controller', async() => await createModule(process.argv[3], 'controller'))
    .option('-c, controller <module name>', 'alias of option "a", create a controller', async() => await createModule(process.argv[3], 'controller'))
    .option('-m, model <model name>', 'create a model', async() => await createModule(process.argv[3], 'model'))
    .option('-s, service', 'create a service', async() => await createModule(process.argv[3], 'service'))
    .parse(process.argv);

if (process.argv.length === 2) {
    program.outputHelp();
}

/**
 * show init wizard
 */
function init() {
    const projectRoot = process.cwd();
    const packageFile = path.join(projectRoot, 'package.json');

    let package;
    try {
        package = require(packageFile);
    } catch (error) {
        console.log('package.json is not detected, please run "npm init" first');
        process.exit(1);
    }

    console.log(WELCONME);

    co(function* () {
        let tsconfig = require('../templates/tsconfig.json');
        let dist = path.basename(tsconfig.compilerOptions.outDir);

        const ENTRY_POINT = 'app.server.ts';
        const HOST_NAME = '127.0.0.1';
        const PORT = 4000;
        const ERRORS = 'errors.ts'

        tsconfig.compilerOptions.rootDir = (yield prompt(`source folder: (${tsconfig.compilerOptions.rootDir}) `)) ||
            tsconfig.compilerOptions.rootDir;

        tsconfig.compilerOptions.outDir = (yield prompt(`build folder: (${tsconfig.compilerOptions.outDir}) `)) ||
            tsconfig.compilerOptions.outDir;

        let sourceMap = (yield prompt(`generate source map for debug: (${tsconfig.compilerOptions.sourceMap}) `)) ||
            String(tsconfig.compilerOptions.sourceMap);

        tsconfig.compilerOptions.sourceMap = sourceMap === 'true';

        // config for Kite
        let hostname = (yield prompt(`server host name: (${HOST_NAME}) `)) || HOST_NAME;
        let port = (yield prompt(`server listening port: (${PORT}) `)) || PORT;
        let entrypoint = (yield prompt(`entry point: (${ENTRY_POINT}) `)) || ENTRY_POINT;
        // let errors = (yield prompt(`customer errors file: (${ERRORS}) `)) || ERRORS;
        let errors = 'errors.ts';

        // create source dir, default controllers folder
        yield makedir(path.join(tsconfig.compilerOptions.rootDir, 'controllers'));
        yield makedir(path.join(tsconfig.compilerOptions.rootDir, 'services'));
        yield makedir(path.join(tsconfig.compilerOptions.rootDir, 'models'));

        // create tsconfig.json file
        let tsconfigFile = path.join(projectRoot, 'tsconfig.json');
        if (!fs.existsSync(tsconfigFile)) {
            fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig, null, 4));
        }

        // create errors file
        let errorsFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, errors);
        if (!fs.existsSync(errorsFile)) {
            fs.writeFileSync(errorsFile, require('../templates/errors.tpl').template);
        }

        // create kite.config.ts
        let errorsImportName = '.' + path.sep + errors.substr(0, errors.length - 3);
        let kiteconfig = require('../templates/kite.config.tpl').template
            .replace('$errors$', errorsImportName)
            .replace('$hostname$', hostname)
            .replace('$port$', port);

        let configFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, 'kite.config.ts');
        if (!fs.existsSync(kiteconfig)) {
            fs.writeFileSync(configFile, kiteconfig);
        }

        // create application entry
        let appFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, entrypoint);
        if (!fs.existsSync(appFile)) {
            let tpl = require('../templates/app.tpl').template;
            fs.writeFileSync(appFile, tpl);
        }

        // create the first controller
        // let ctrlFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, 'controllers', 'greeting.ts');
        // if (!fs.existsSync(ctrlFile)) {
        //     let tpl = require('../templates/controller.tpl').template;
        //     tpl = tpl.replace('$NAME$', 'Greeting');
        //     fs.writeFileSync(ctrlFile, tpl);
        // }
        yield createModule('greeting', 'controller');

        if (package.dependencies && package.dependencies['kite-framework']) {
            console.log('Kite project initialization finished \n');
        } else {
            console.log('Kite project initialization finished, ** please run following commands to install dependencies **\n');
            console.log('npm install kite-framework --save \n');
        }

        try {
            // test Kite is already installed
            let kiteVersion = require(path.join(projectRoot, 'node_modules', 'kite-framework', 'core', 'version.js')).VERSION;
            console.log('Kite is installed, version ' + kiteVersion);
            process.exit();
        } catch (error) {
            console.log('Kite is not installed, installing from: npm install kite-framework --save');
        }


        const {
            spawn
        } = require('child_process');

        const npm = spawn('npm', ['install', 'kite-framework', '--save']);

        npm.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        npm.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        npm.on('close', (code) => {
            console.log('Kite init finished')
            process.exit();
        });

    }).catch(e => {
        console.error(e);
        process.exit(1);
    });

}


/**
 * Get name from given module name, module name could be 
 * single word, path name
 * @param {*} moduleName 
 * @param {*} folder 
 */
async function createModule(moduleName, type) {
    const folder = type + 's';
    const tsconfig = require(path.join(process.cwd(), 'tsconfig.json'));
    const src = path.resolve(tsconfig.compilerOptions.rootDir || './');

    let defaultFolder = path.join(src, folder);
    let filename;
    // if "src/controllers" does not exsit, create a controller to "src"
    if (!fs.existsSync(defaultFolder)) {
        defaultFolder = src;
    }

    // is it a path ?
    if (moduleName.indexOf(path.sep) !== -1) {
        filename = path.resolve(moduleName);
        if (!moduleName.startsWith(defaultFolder)) {
            filename = path.join(src, folder, moduleName);
        }
    } else {
        filename = path.join(defaultFolder, moduleName);
    }

    let basename = path.basename(filename);

    if (basename.endsWith('.ts')) {
        basename = basename.substr(0, basename.length - 3);
    } else {
        let ext = type === 'controller' ? '' : type;
        filename += '.' + ext + '.ts';
    }

    if (!basename) {
        console.log(`${type} name can not be empty!`);
        process.exit(1);
    }

    if (!/^[a-zA-Z_\$][a-zA-Z_\$\d]*$/.test(basename)) {
        console.log(`${type} name must starts with alphabeds or "_" or "$"`);
        process.exit(1);
    }

    // if module is exist, exit
    if (fs.existsSync(filename)) {
        console.log(`${type} file is already exist:`, path.relative(process.cwd(), filename));
        process.exit();
    }

    await makedir(path.dirname(filename));


    basename = basename.replace(/^([a-zA-Z])/, (ch) => ch.toUpperCase());
    let code = require(`../templates/${type}.tpl.js`).template.replace('$NAME$', basename);
    fs.writeFileSync(filename, code);
    console.log(`${type} "${basename}" is successfully created:`, path.relative(process.cwd(), filename));

}