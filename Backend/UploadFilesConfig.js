

// uploadConfig.js
const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./FilesAttached")
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  }
});

// Initialize upload
const filesUploadUsingMulter = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // limit file size to 1MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).array('files', 10); // handle multiple files

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|pdf|doc|docx|ppt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Files only!');
  }
}

module.exports = filesUploadUsingMulter;



// Set up storage engine
// const storage = multer.diskStorage({
//   destination: './FilesAttached/',
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// });