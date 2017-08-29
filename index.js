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
const version = require('./package.json').version;
const makedir = require('make-dir');

const WELCONME = `
This utility will help you create a Kite application.
It only covers the most common items, and tries to guess sensible defaults.

Hit "Ctrl + C" at any time to quit.
`;

const ERRORS_TEMPLATE = `
export const errors = {
    // 2000: 'Database connection error',
}
`;

const CONFIG_TEMPLATE = `
import { Config } from 'kite-framework';
import { errors } from '$errors$';

export const kiteConfig: Config = {
    errors: errors,
    hostname: '$hostname$',
    port: $port$
};
`;

const APP_TEMPLATE = `
import { Kite } from 'kite-framework';

new Kite('./kite.config').fly();
`;

const CTRL_TEMPLATE = `
import { Controller, Entry } from 'kite-framework';

@Controller()
export class GreetingController {
    @Entry()
    async exec() {
        return { message: 'Hello world!' };
    }
}
`;

program
    .version(version)
    .usage('[options]')
    .option('i, init', 'show a wizard to initialize project', wizard)
    .parse(process.argv);

if (process.argv.length === 2) {
    wizard();
}


function wizard() {
    const projectRoot = process.cwd();
    const packageFile = path.join(projectRoot, 'package.json');

    let package;
    try {
        package = require(packageFile);
    } catch (error) {
        console.log('package.json is not detected, please run "npm init" firstly.');
        process.exit(1);
    }

    console.log(WELCONME);

    let tsconfig = require('./tsconfig.template.json');
    co(function* () {

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
        let errors = (yield prompt(`customer errors file: (${ERRORS}) `)) || ERRORS;

        // create source dir, default controllers folder
        yield makedir(path.join(tsconfig.compilerOptions.rootDir, 'controllers'));

        // create tsconfig.json file
        let tsconfigFile = path.join(projectRoot, 'tsconfig.json');
        fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig, null, 4));

        // create errors file
        let errorsFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, errors);
        fs.writeFileSync(errorsFile, ERRORS_TEMPLATE);

        // create kite.config.ts
        let errorsImportName = '.' + path.sep + errors.substr(0, errors.length - 3);
        let kiteconfig = CONFIG_TEMPLATE
            .replace('$errors$', errorsImportName)
            .replace('$hostname$', hostname)
            .replace('$port$', port);
        
        let configFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, 'kite.config.ts');
        fs.writeFileSync(configFile, kiteconfig);

        // create application entry
        let appFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, entrypoint);
        fs.writeFileSync(appFile, APP_TEMPLATE);

        // create the first controller
        let ctrlFile = path.join(projectRoot, tsconfig.compilerOptions.rootDir, 'controllers', 'greeting.ts');
        fs.writeFileSync(ctrlFile, CTRL_TEMPLATE);

        if(package.dependencies && package.dependencies['kite-framework']) {
            console.log('Kite project initialization finished \n');
        } else {
            console.log('Kite project initialization finished, ** please run following commands to install dependencies **\n');
            console.log('npm install kite-framework --save \n');
        }

        process.exit();
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });

}