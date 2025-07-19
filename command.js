#!/usr/bin/env node

import { program } from 'commander';
import { push, pull, del } from './commands/files.js';
import { list } from './commands/utils.js';

// have to add authorization after
program.
    version('1.0.0')
    .name('drive')
    .description('CLI tool for organizing files and directories')

program.addCommand(push);
program.addCommand(pull);
program.addCommand(list);
program.addCommand(del);
program.parse();