#!/usr/bin/env node

import { program } from 'commander';

program.
    version('1.0.0')
    .description('CLI tool for organizing files and directories')
    .option("-n, --name <type>", "Add you name")
    .action((options) => {
        console.log(`Hello, ${options.name || 'World'}!`);
    });

program.parse();
