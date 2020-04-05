"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("@google-cloud/storage");
const path_1 = require("path");
const uuid_1 = require("uuid");
class MulterGoogleCloudStorage {
    constructor(options) {
        this.options = options;
        this.getContentType = (req, file) => {
            return 'application/octet-stream';
        };
        this._handleFile = (req, file, callback) => {
            this.getDestination(req, file, (err, destination) => {
                if (err) {
                    return callback(err);
                }
                this.getFilename(req, file, (err, filename) => {
                    if (err) {
                        return callback(err);
                    }
                    const upload = this.gcsBucket.file(path_1.join(destination, filename));
                    const contentType = this.getContentType(req, file);
                    const streamOptions = {
                        metadata: this.options.metadata,
                        predefinedAcl: this.options.acl || 'private'
                    };
                    if (contentType) {
                        streamOptions.metadata = Object.assign(this.options.metadata || {}, { contentType });
                    }
                    file.stream.pipe(upload.createWriteStream(streamOptions)
                        .on('error', (err) => callback(err))
                        .on('finish', (sd) => callback(null, {
                        path: `https://${this.options.bucket}.storage.googleapis.com/${filename}`,
                        filename: filename
                    })));
                });
            });
        };
        this._removeFile = (req, file, callback) => {
            this.gcsBucket
                .file(file.filename)
                .delete(callback);
        };
        this.getFilename = this.options.filename || this.getFilename;
        this.getDestination = this.options.destination || this.getDestination;
        this.getContentType = this.options.contentType || this.getContentType;
        this.options.bucket = this.options.bucket || process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
        this.options.projectId = this.options.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID;
        this.options.keyFilename = this.options.keyFilename || process.env.GOOGLE_CLOUD_KEY_FILE;
        if (!this.options.bucket) {
            throw new Error('You have to specify bucket for Google Cloud Storage to work.');
        }
        if (!this.options.projectId) {
            throw new Error('You have to specify project id for Google Cloud Storage to work.');
        }
        if (!this.options.keyFilename && !this.options.credentials) {
            throw new Error('You have to specify credentials key file or credentials for Google Cloud Storage to work.');
        }
        this.gcobj = new storage_1.Storage(this.options);
        this.gcsBucket = this.gcobj.bucket(options.bucket);
    }
    getFilename(req, file, callback) {
        callback(null, `${uuid_1.v4()}_${file.originalname}`);
    }
    getDestination(req, file, callback) {
        callback(null, '');
    }
}
exports.default = MulterGoogleCloudStorage;
function storageEngine(opts) {
    return new MulterGoogleCloudStorage(opts);
}
exports.storageEngine = storageEngine;
