import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: 'ftp.livenetstudios.co.za',
      user: 'livenets',
      password: 'Livenet@2026',
      secure: false
    });
    const remoteDir = '/maps.livenetstudios.co.za';
    console.log('Clearing remote directory');
    // List and delete all files and subfolders
    async function clear(dir) {
      const list = await client.list(dir);
      for (const item of list) {
        const fullPath = `${dir}/${item.name}`;
        if (item.isDirectory) {
          await clear(fullPath);
          await client.removeDir(fullPath);
        } else {
          await client.remove(fullPath);
        }
      }
    }
    await clear(remoteDir);
    console.log('Upload fresh build');
    const localDist = path.resolve(__dirname, './dist');
    await client.uploadFromDir(localDist, remoteDir);
    console.log('Deployment complete');
  } catch (err) {
    console.error('Deployment error', err);
  }
  client.close();
})();
