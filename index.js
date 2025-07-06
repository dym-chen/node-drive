#!/usr/bin/env node

import { program } from 'commander';
import { test } from './commands/files.js';

// have to add authorization after

program.
    version('1.0.0')
    .name('drive')
    .description('CLI tool for organizing files and directories')

program.addCommand(test);

program.parse();
