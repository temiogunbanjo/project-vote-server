const fs = require("fs");
const path = require("path");
const multer = require("multer");

const wiston = require("../error-helpers/WistonLogger");
const HelperUtils = require("../utils/HelperUtils");

if (!fs.existsSync("uploads")) {
  HelperUtils.print("uploads folder not found");
  fs.mkdir("uploads", (err) => {
    if (err) {
      wiston.error(err.message);
    }
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const splittedName = file.originalname.split(".");
    const extension = splittedName.length > 1 ? splittedName[splittedName.length - 1] : "";
    let uniqueSuffix = `${req.headers["content-length"]}`;

    if (req.user?.adminId) {
      uniqueSuffix += `-${req.user?.adminId}`;
    } else if (req.user?.userId) {
      uniqueSuffix += `-${req.user?.userId}`;
    }

    const d = new Date().setMinutes(0, 0, 0);
    uniqueSuffix += `-${d}`;

    // console.log(req.headers['content-length']);
    cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  try {
    const imageFileSizeLimit = 2 * 1024 * 1024;
    const audioFileSizeLimit = 2 * 1024 * 1024;
    const fileSize = parseInt(req.headers["content-length"], 10);
    // console.log(req);

    const supportedTypes = /jpeg|jpg|png|gif|mp3|mpeg|wav|csv/i;
    const imageFileTypes = /jpeg|jpg|png|gif/i;
    const audioFileTypes = /mp3|mpeg|wav/i;

    const isImageMimeType = imageFileTypes.test(file.mimetype);
    const isImageExt = imageFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    // console.log(file.mimetype);
    const isAudioMimeType = audioFileTypes.test(file.mimetype);
    const isAudioExt = audioFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (isImageExt && isImageMimeType) {
      if (fileSize < imageFileSizeLimit) {
        cb(null, true);
      } else {
        cb(new Error("Files are too large. Maximum file size is 2MB"));
      }
    }

    if (isAudioExt && isAudioMimeType) {
      if (fileSize < audioFileSizeLimit) {
        cb(null, true);
      } else {
        cb(new Error("Files are too large. Maximum file size is 2MB"));
      }
    }

    if (!supportedTypes.test(path.extname(file.originalname).toLowerCase())) {
      cb(new Error("File type not supported"));
    } else {
      cb(null, true);
    }
  } catch (error) {
    cb(error);
  }
};

const upload = multer({
  storage,
  // limits: {
  //   // files: 5, // allow up to 5 files per request,
  //   fieldSize: 2 * 1024 * 1024 // 2 MB (max file size)
  // },
  fileFilter,
});

module.exports = upload;
