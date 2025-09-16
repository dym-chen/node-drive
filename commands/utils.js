
import { Command } from 'commander';
import fetch from 'node-fetch';

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

export const tree = new Command('tree')
    .description('display a tree structure of files and directories')
    .option('-d, --depth <depth>', 'maximum depth to display', '10')
    .option('-a, --all', 'show all files including hidden ones')
    .action(async (options) => {
        try {
            const response = await fetch('http://localhost:8000/tree', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch tree structure: ${response.statusText}`);
            }

            const data = await response.json();
            const maxDepth = parseInt(options.depth);

            // Display the tree structure
            displayTree(data, '', true, 0, maxDepth, options.all);
        } catch (error) {
            console.error('Error displaying tree:', error.message);
        }
    });

function displayTree(node, prefix, isLast, currentDepth, maxDepth, showAll) {
    if (currentDepth > maxDepth) return;

    // Skip hidden files unless --all is specified
    if (!showAll && node.name.startsWith('.')) return;

    const connector = isLast ? '└── ' : '├── ';
    console.log(prefix + connector + node.name);

    if (node.children && node.children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        node.children.forEach((child, index) => {
            const isLastChild = index === node.children.length - 1;
            displayTree(child, newPrefix, isLastChild, currentDepth + 1, maxDepth, showAll);
        });
    }
}

