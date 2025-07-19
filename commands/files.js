import { Command } from 'commander';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// push -> upload files to the server
// pull -> download files from the server
// delete -> delete files and directories

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
                console.log('✅ File uploaded successfully!\n');
                console.table(data);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    });

export const pull = new Command('pull')
    .description('download files from the server')
    .option("-i, --id <id>", "Download file by ID")
    .option("-n, --name <name>", "Download file by name")
    .action(async (options) => {

        if (!options.id && !options.name) {
            console.error('You must specify either an ID or a name to download a file.');
            return;
        }
        const query = options.id ? `?id=${options.id}` : `?name=${options.name}`;

        try {
            const response = await fetch(`http://localhost:8000/files${query}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            // Get filename from Content-Disposition header
            const disposition = response.headers.get('content-disposition');
            let filename = 'downloaded_file';
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '');
            }

            // Save file to disk
            const dest = fs.createWriteStream(path.join(process.cwd(), filename));
            response.body.pipe(dest);
            response.body.on('end', () => {
                console.log(`File downloaded as ${filename}`);
            });
            response.body.on('error', (err) => {
                console.error('Error writing file:', err);
            });
        } catch (error) {
            console.error('Error downloading file:', error.message);
        }
    });

export const del = new Command('del')
    .description('delete files from the server')
    .option("-i, --id <id>", "Delete file by ID")
    .option("-n, --name <name>", "Delete file by name")
    .action((options) => {
        console.log(`Hello, ${options.name || 'World'}!`);
    });