import { StorageEngine } from 'multer';
import { Request } from 'express';
import { Bucket, Storage, CreateWriteStreamOptions, PredefinedAcl, StorageOptions } from '@google-cloud/storage';
import { WriteStream } from 'fs';
import { join } from 'path';
import { v4 } from 'uuid';

export interface ConfigurationStorage extends StorageOptions {
    bucket: string;
    contentType?: ContentTypeFunction;
    acl?: PredefinedAcl;
    metadata?: any;
    filename?: (req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void
    ) => void;
    destination?: (req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void
    ) => void;
}

export default class MulterGoogleCloudStorage implements StorageEngine {
    private gcobj: Storage;
    private gcsBucket: Bucket;

    public getContentType: ContentTypeFunction = (req, file) => {
        return 'application/octet-stream';
    }

    constructor(private options: ConfigurationStorage) {
        this.getFilename = this.options.filename || this.getFilename;
        this.getDestination = this.options.destination || this.getDestination;
        this.getContentType = this.options.contentType || this.getContentType;

        this.options.bucket = this.options.bucket || process.env.GOOGLE_CLOUD_STORAGE_BUCKET as string;
        this.options.projectId = this.options.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID as string;
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

        this.gcobj = new Storage(this.options);

        this.gcsBucket = this.gcobj.bucket(options.bucket);
    }

    getFilename(
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void
    ) {
        callback(null,`${v4()}_${file.originalname}`);
    }

    getDestination(
        req: Request,
        file: Express.Multer.File,
        callback: (err: Error | null, destination: string) => void
    ) {
        callback(null, '');
    }

    _handleFile = (
        req: Request,
        file: Express.Multer.File & { stream: WriteStream },
        callback: (error?: any, info?: Partial<Express.Multer.File>) => void
    ) => {
        this.getDestination(req, file, (err, destination) => {
            if (err) {
                return callback(err);
            }
            this.getFilename(req, file, (err, filename) => {
                if (err) {
                    return callback(err);
                }

                const upload = this.gcsBucket.file(join(destination, filename));
                const contentType = this.getContentType(req, file);

                const streamOptions: CreateWriteStreamOptions = {
                    metadata: this.options.metadata,
                    predefinedAcl: this.options.acl || 'private'
                };

                if (contentType) {
                    streamOptions.metadata = Object.assign(this.options.metadata || {}, { contentType });
                }

                file.stream.pipe(
                    upload.createWriteStream(streamOptions)
                        .on('error', (err) => callback(err))
                        .on('finish', () => callback(null, {
                            path: `https://${this.options.bucket}.storage.googleapis.com/${filename}`,
                            filename: filename
                        }))
                );
            });
        });
    };

    _removeFile = (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error) => void
    ) => {
        this.gcsBucket
            .file(file.filename)
            .delete(callback);
    };
}

export function storageEngine(opts: ConfigurationStorage) {
    return new MulterGoogleCloudStorage(opts);
}

export type ContentTypeFunction = (req: Request, file: Express.Multer.File) => string | undefined;
