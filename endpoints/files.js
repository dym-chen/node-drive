import express from 'express';
import multer from 'multer';
import path from 'path';
import db from './database.js';
import fs from 'fs';

const fileRouter = express.Router();

// MULTER SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
})
const upload = multer({ storage });

// GET REQUEST HANDLER
fileRouter.get('/files', (req, res) => {
    const { name, id } = req.query;

    if (!id && !name) {
        // List all files
        let sql = 'SELECT * FROM files ORDER BY uploaded_at DESC';
        const files = db.prepare(sql).all();
        return res.json(files);
    }

    // Download a file
    let sql = 'SELECT * FROM files WHERE';
    const conditions = [];
    const params = [];

    if (id) {
        conditions.push('id = ?');
        params.push(id);
    }
    if (name) {
        conditions.push('name = ?');
        params.push(name);
    }

    sql += ' ' + conditions.join(' AND ');

    try {
        const file = db.prepare(sql).get(...params);

        if (!file) {
            return res.status(404).send('File not found');
        }

        // Serve file from disk using stored_name
        const filePath = path.join('uploads', file.stored_name);
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found on disk');
        }
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (err) {
        console.error('Error serving file:', err);
        res.status(500).send('Internal server error');
    }
});

// POST REQUEST HANDLER
fileRouter.post('/files', upload.single('file'), (req, res) => {

    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // retrieve other data from the request
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const force = req.body.force === 'true';

    const statement = db.prepare(`
        INSERT INTO files (original_name, stored_name, size, mime_type)
        VALUES (?, ?, ?, ?)
    `);

    statement.run(file.originalname, file.filename, file.size, file.mimetype);

    res.json({
        message: 'File uploaded successfully',
        file: {
            originalName: file.originalname,
            storedName: file.filename,
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date().toISOString()
        }
    });
});

fileRouter.delete('/files', (req, res) => {
    const { id, name } = req.query;

    if (!id && !name) {
        return res.status(400).json({ error: 'You must specify either an id or a name.' });
    }

    // Find the file record
    let sql = 'SELECT * FROM files WHERE';
    const conditions = [];
    const params = [];
    if (id) {
        conditions.push('id = ?');
        params.push(id);
    }
    if (name) {
        conditions.push('name = ?');
        params.push(name);
    }
    sql += ' ' + conditions.join(' AND ');

    const file = db.prepare(sql).get(...params);
    if (!file) {
        return res.status(404).json({ error: 'File not found.' });
    }

    // Delete the file from disk
    const filePath = path.join('uploads', file.stored_name);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            return res.status(500).json({ error: 'Failed to delete file from disk.' });
        }
    }

    // Delete the record from the database
    const delSql = `DELETE FROM files WHERE ${conditions.join(' AND ')}`;
    db.prepare(delSql).run(...params);

    res.json({ message: 'File deleted successfully.' });
});

// TREE ENDPOINT
fileRouter.get('/tree', (req, res) => {
    try {
        // Get all files from database
        const sql = 'SELECT * FROM files ORDER BY original_name';
        const files = db.prepare(sql).all();

        // Build tree structure
        const tree = buildTree(files);
        res.json(tree);
    } catch (err) {
        console.error('Error building tree:', err);
        res.status(500).json({ error: 'Failed to build tree structure' });
    }
});

function buildTree(files) {
    const root = { name: 'uploads', children: [] };
    const pathMap = new Map();

    // Initialize root
    pathMap.set('', root);

    files.forEach(file => {
        const pathParts = file.original_name.split('/');
        let currentPath = '';

        pathParts.forEach((part, index) => {
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!pathMap.has(currentPath)) {
                const node = {
                    name: part,
                    children: [],
                    isFile: index === pathParts.length - 1,
                    fileData: index === pathParts.length - 1 ? {
                        id: file.id,
                        size: file.size,
                        mimeType: file.mime_type,
                        uploadedAt: file.uploaded_at
                    } : null
                };

                pathMap.set(currentPath, node);

                // Add to parent
                if (pathMap.has(parentPath)) {
                    pathMap.get(parentPath).children.push(node);
                }
            }
        });
    });

    // Sort children alphabetically
    function sortChildren(node) {
        if (node.children) {
            node.children.sort((a, b) => {
                // Directories first, then files
                if (a.isFile !== b.isFile) {
                    return a.isFile ? 1 : -1;
                }
                return a.name.localeCompare(b.name);
            });
            node.children.forEach(sortChildren);
        }
    }

    sortChildren(root);
    return root;
}

export default fileRouter;