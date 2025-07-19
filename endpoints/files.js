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

export default fileRouter;