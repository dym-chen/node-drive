import { Command } from 'commander';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

// scan -> output all meta data for files
// push -> upload files to the server
// pull -> download files from the server
// delete -> delete files and directories

export const scan = new Command('scan')
    .description('upload files to the server')
    .option("-n, --name <type>", "Add you name")
    .action((options) => {
        console.log(`Hello, ${options.name || 'World'}!`);
    });

export const push = new Command('push')
    .description('upload files to the server')
    .argument('<file>', 'file to upload')
    .option("-t, --tags <tags>", "add comma separated tags", (value) => value.split(',').map(tag => tag.trim()))
    .option("-f, --force", "overwrite existing file")
    .action(async (path, options) => {
        try {
            const form = new FormData();
            form.append('file', fs.createReadStream(path));
            form.append('tags', JSON.stringify(options.tags || []));
            form.append('force', options.force ? 'true' : 'false');

            const result = await fetch('http://localhost:8000/files', {
                method: 'POST',
                body: form,
                headers: form.getHeaders()
            });

            if (!result.ok) {
                throw new Error(`Failed to upload file: ${result.statusText}`);
            } else {
                const data = await result.json();
                console.log('File uploaded successfully:', data);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    });

export const pull = new Command('pull')
    .description('upload files to the server')
    .option("-n, --name <type>", "Add you name")
    .action((options) => {
        console.log(`Hello, ${options.name || 'World'}!`);
    });

export const del = new Command('del')
    .description('upload files to the server')
    .option("-n, --name <type>", "Add you name")
    .action((options) => {
        console.log(`Hello, ${options.name || 'World'}!`);
    });