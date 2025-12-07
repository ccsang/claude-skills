const mime = require('mime');
console.log('mime.default:', mime.default);
if (mime.default) {
    console.log('mime.default keys:', Object.keys(mime.default));
    console.log('mime.default.getExtension:', mime.default.getExtension);
}
console.log('mime.Mime:', mime.Mime);
