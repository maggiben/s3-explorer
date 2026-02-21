import path from 'path';
import fs from 'fs';
import https from 'https';
import { ipcMain } from 'electron';

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const iconName = path.join(__dirname, 'iconForDragAndDrop.png');
const dragIcon = fs.createWriteStream(iconName);

https.get('https://img.icons8.com/ios/452/drag-and-drop.png', (response) => {
  response.pipe(dragIcon);
});

ipcMain.on('ondragstart', (event, filePath) => {
  console.log('ondragstart', filePath);
  fs.writeFileSync(path.join(__dirname, filePath), '# First file to test drag and drop');
  event.sender.startDrag({
    file: path.join(__dirname, filePath),
    icon: iconName,
  });
});
