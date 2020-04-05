/// <reference types="node" />
import { StorageEngine } from 'multer';
import { Request } from 'express';
import { PredefinedAcl, StorageOptions } from '@google-cloud/storage';
import { WriteStream } from 'fs';
export interface ConfigurationStorage extends StorageOptions {
    bucket: string;
    contentType?: ContentTypeFunction;
    acl?: PredefinedAcl;
    metadata?: any;
    filename?: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => void;
    destination?: (req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => void;
}
export default class MulterGoogleCloudStorage implements StorageEngine {
    private options;
    private gcobj;
    private gcsBucket;
    getContentType: ContentTypeFunction;
    constructor(options: ConfigurationStorage);
    getFilename(req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void): void;
    getDestination(req: Request, file: Express.Multer.File, callback: (err: Error | null, destination: string) => void): void;
    _handleFile: (req: Request<import("express-serve-static-core").ParamsDictionary>, file: Express.Multer.File & {
        stream: WriteStream;
    }, callback: (error?: any, info?: Partial<Express.Multer.File> | undefined) => void) => void;
    _removeFile: (req: Request<import("express-serve-static-core").ParamsDictionary>, file: Express.Multer.File, callback: (error: Error) => void) => void;
}
export declare function storageEngine(opts: ConfigurationStorage): MulterGoogleCloudStorage;
export declare type ContentTypeFunction = (req: Request, file: Express.Multer.File) => string | undefined;
