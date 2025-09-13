# node-drive

A command-line file management system with a REST API backend for organizing, uploading, downloading, and managing files and directories.

## Features

- **File Management**: Upload, download, list, and delete files
- **REST API**: HTTP endpoints for file operations
- **SQLite Database**: Persistent storage with metadata tracking
- **CLI Interface**: Easy-to-use command-line tools
- **File Metadata**: Track file size, MIME type, upload date, and more
- **Unique File Storage**: Prevents filename conflicts with timestamp-based naming

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd node-drive
```

2. Install dependencies:

```bash
npm install
```

3. Make the CLI globally available:

```bash
npm link
```

## Usage

### Starting the Server

Start the REST API server:

```bash
npm start
# or
node server.js
```

The server will run on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

## Development

### Running in Development Mode

```bash
npm start
```

This uses nodemon for automatic server restarts during development.

### Environment Variables

- `PORT`: Server port (default: 3000)

## File Storage

Files are stored in the `uploads/` directory with unique names to prevent conflicts. The original filename is preserved in the database for reference.
