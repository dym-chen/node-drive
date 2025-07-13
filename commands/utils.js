
import { Command } from 'commander';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

// share -> share files and directories
// tree -> output a tree structure of files and directories
// list -> list all files and directories

export const list = new Command('list')
    .description('list all files and their metadata')
    .action(async () => {
        try {
            const response = await fetch('http://localhost:8000/files', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch files: ${response.statusText}`);
            }

            const data = await response.json();
            console.table(data);
        } catch (error) {
            console.error('Error listing files:', error.message);
        }
    });

