/*
 *  Copyright 2019, 2020, 2021, 2022 LiteFarm.org
 *  This file is part of LiteFarm.
 *
 *  LiteFarm is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  LiteFarm is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details, see <<https://www.gnu.org/licenses/>.>
 */

import DocumentModel from '../models/documentModel.js';

import { v4 as uuidv4 } from 'uuid';

import {
  getPrivateS3BucketName,
  s3,
  imaginaryPost,
  getRandomFileName,
  getPrivateS3Url,
} from '../util/digitalOceanSpaces.js';
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import { getEnvBool  } from "../util/env.js"
import path from "path";

const useInternalS3 = getEnvBool("S3_USE_INTERNAL_FILE_SERVICE", false);


/**
 * Fix file paths for files to use internal file service
 */
function fixFilePaths(result) {
  if(!useInternalS3 || !process.env.API_PUBLIC_URL || !result) return result;  // Don't fix if we are using external S3
  const { farm_id } = result;

  const prefix= process.env.API_PUBLIC_URL+'/document/farm/'+farm_id;
  if(result.thumbnail_url) {
    result.thumbnail_url=prefix+'/'+result.document_id+'/'+result.document_id+'/t/thumbnail.webp';
  }
  const files=result.files;
  if(!Array.isArray(files) || files.length === 0) return result;
  for(const f of files) {
    const url=prefix+'/'+f.document_id+'/'+f.file_id;
    const fn=encodeURIComponent(f.file_name);

    if(f.url) f.url=url+'/o/'+fn; // Original file
    if(f.thumbnail_url) f.thumbnail_url=url+'/t/thumbnail.webp'; // Thumbnail file
  }
  return result;
}

function fixResults(results) {
  if(Array.isArray(results)) {
    for(const r of results) fixFilePaths(r);
  } else if(Array.isArray(results?.files)) {
    return fixFilePaths(results);
  }
  return results;
}

const documentController = {
  getDocumentsByFarmId() {
    return async (req, res, next) => {
      const { farm_id } = req.params;
      try {
        const result = await DocumentModel.query()
          .whereNotDeleted()
          .withGraphFetched('[files]')
          .where({ farm_id });
        return result?.length
          ? res.status(200).send(fixResults(result))
          : res.status(404).send('No documents found');
      } catch (error) {
        console.error(error);
        return res.status(400).json({ error });
      }
    };
  },
  downloadDocument() {
    return async(req, res, next) => {
      const { farm_id, document_id, file_id, type } = req.params;
      const isThumbnail = (type === 'thumbnail' || type === 't');

      const result = await DocumentModel.query()
          .context(req.auth)
          .findById(document_id)
          .withGraphFetched('[files]')
          .where({ farm_id, document_id });
      console.log("Document request: "+req.url+", params: "+JSON.stringify(req.params));
      console.log("Got result: "+JSON.stringify(result));

      if (!result) return res.status(404).send('Document not found');

      let file;
      // Special case for thumbnail of document and not individual file
      if(document_id===file_id && isThumbnail) {
        file=result.files?.find(f => !!f.thumbnail_url);
      } else {
        file=result.files?.find(f => f.file_id === file_id);
      }
      if (!file) {
        console.log("File not found: "+file_id);
        return res.status(404).send('File not found');
      }

      // We need to remove prefix from file_name
      const url=isThumbnail?file.thumbnail_url:file.url;
      console.log("File key: "+url);
      let response;
      try {
        response = await s3.send(
            new GetObjectCommand({
              Bucket: getPrivateS3BucketName(),
              Key: url,
              ACL: 'private',
            }),
        );
      }catch (e) {
        console.log("Error getting file: "+e);
        return res.status(500).send('Error getting file');
      }
      console.log("Got response: "+ response?.ETag);
      if(!response?.Body) {
        return res.status(404).send('File not found');
      }
      // Transform the response to http response
      res.status(200).header({
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      })
      if(response.ContentLength) res.header('Content-Length', response.ContentLength);
      if(response.ContentType) res.header('Content-Type', response.ContentType);

      response.Body.pipe(res);
    }
  },
  createDocument() {
    return async (req, res, next) => {
      try {
        const result = await DocumentModel.transaction(async (trx) => {
          return await DocumentModel.query(trx)
            .context({ user_id: req.auth.user_id })
            .upsertGraph(req.body, { noUpdate: true, noDelete: true });
        });
        return res.status(201).send(fixResults(result));
      } catch (error) {
        console.log(error);
        res.status(400).json({
          error,
        });
      }
    };
  },

  patchDocumentArchive() {
    return async (req, res, next) => {
      const { document_id } = req.params;
      try {
        const result = await DocumentModel.query()
          .context(req.auth)
          .findById(document_id)
          .patch({ archived: req.body.archived });
        return result ? res.sendStatus(200) : res.status(404).send('Document not found');
      } catch (error) {
        console.error(error);
        return res.status(400).json({ error });
      }
    };
  },

  updateDocument() {
    return async (req, res, next) => {
      try {
        const { document_id } = req.params;
        const result = await DocumentModel.transaction(async (trx) => {
          return await DocumentModel.query(trx)
            .context({ user_id: req.auth.user_id })
            .upsertGraph({ document_id, ...req.body });
        });
        return res.status(201).send(fixResults(result));
      } catch (err) {
        console.log(err);
        return res.status(400).json({
          error: err,
        });
      }
    };
  },

  uploadDocument() {
    return async (req, res, next) => {
      const { farm_id } = req.params;
      try {
        const s3BucketName = getPrivateS3BucketName();

        const fileName = `${farm_id}/document/${getRandomFileName(req.file)}`;

        const uploadOriginalDocument = () =>
          s3.send(
            new PutObjectCommand({
              Body: req.file.buffer,
              Bucket: s3BucketName,
              Key: fileName,
              ACL: 'private',
            }),
          );

        if (req.isMinimized) {
          await uploadOriginalDocument();
          return res.status(201).json({
            url: fileName,
            thumbnail_url: fileName,
          });
        } else if (req.isTextDocument) {
          await uploadOriginalDocument();
          return res.status(201).json({
            url: fileName,
          });
        } else if (req.isNotMinimized) {
          const THUMBNAIL_FORMAT = 'webp';
          const THUMBNAIL_WIDTH = '300';

          const [thumbnail] = await Promise.all([
            imaginaryPost(req.file, {
              width: THUMBNAIL_WIDTH,
              type: THUMBNAIL_FORMAT,
            }),
            uploadOriginalDocument(),
          ]);

          const thumbnailName = `${farm_id}/thumbnail/${uuidv4()}.${THUMBNAIL_FORMAT}`;

          await s3.send(
            new PutObjectCommand({
              Body: thumbnail.data,
              Bucket: getPrivateS3BucketName(),
              Key: thumbnailName,
              ACL: 'private',
            }),
          );

          return res.status(201).json({
            url: fileName,
            thumbnail_url: thumbnailName,
          });
        }
        return req.status(400);
      } catch (error) {
        console.log(error);
        return res.status(400).send('Fail to upload document');
      }
    };
  },
};

export default documentController;
