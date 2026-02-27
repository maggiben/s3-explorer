import path from 'path';
import fs from 'fs';
import https from 'https';
import os from 'os';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { ipcMain } from 'electron';
import * as s3 from '../common/s3';

const pipelineAsync = promisify(pipeline);

const iconName = path.join(os.tmpdir(), 'iconForDragAndDrop.png');
const iconStream = fs.createWriteStream(iconName);
https.get('https://img.icons8.com/ios/452/drag-and-drop.png', (response) => {
  response.pipe(iconStream);
});

/** Temp files are deleted after this delay (ms). */
const TEMP_FILE_CLEANUP_MS = 60_000;

/**
 * Drag-out to OS: start drag immediately, stream S3 to the temp file in the background.
 * No delay — we create an empty file, startDrag() right away, then pipe S3 body to
 * the same path asynchronously (fire-and-forget).
 */
ipcMain.on(
  'ondragstart',
  async (event, payload: { connectionId: number; path: string; basename?: string }) => {
    const {
      connectionId,
      path: s3Path,
      basename,
    } = typeof payload === 'object' && payload !== null
      ? payload
      : { connectionId: undefined, path: payload, basename: undefined };

    if (connectionId == null || !s3Path) {
      console.warn('ondragstart: missing connectionId or path', payload);
      return;
    }

    const fileName = (basename ?? path.basename(s3Path)) || 'download';
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const tempPath = path.join(os.tmpdir(), `s3-explorer-drag-${Date.now()}-${safeName}`);

    try {
      fs.writeFileSync(tempPath, '');
      event.sender.startDrag({
        file: tempPath,
        icon: iconName,
      });
    } catch (err) {
      console.error('ondragstart: failed to start drag', err);
      return;
    }

    s3.getObject(s3Path, connectionId)
      .then((result) => {
        if (!result?.Body) return;
        const writeStream = fs.createWriteStream(tempPath);
        pipelineAsync(result.Body as NodeJS.ReadableStream, writeStream)
          .then(() => {
            writeStream.close();
          })
          .catch((err) => {
            console.error('ondragstart: stream failed', err);
            writeStream.destroy();
          })
          .finally(() => {
            setTimeout(() => {
              try {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
              } catch {
                // ignore
              }
            }, TEMP_FILE_CLEANUP_MS);
          });
      })
      .catch((err) => {
        console.error('ondragstart: getObject failed', err);
        try {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch {
          // ignore
        }
      });
  },
);
