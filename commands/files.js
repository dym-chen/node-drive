import { Command } from 'commander';

// scan -> output all meta data for files
// push -> upload files to the server
// pull -> download files from the server
// delete -> delete files and directories

export const test = new Command('test')
    .version('1.0.0')
    .description('CLI tool for organizing files and directories')
    .option("-n, --name <type>", "Add you name")
    .action((options) => {
        console.log(`Hello, ${options.name || 'World'}!`);
    });