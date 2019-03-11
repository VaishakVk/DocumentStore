const express = require('express');
const router = express.Router();

const documentController = require('../controllers/document');

router.post("/upload", documentController.postUploadFile); 
router.get("/files", documentController.getAllFiles);
router.delete("/delete", documentController.deleteFile);
router.patch("/rename", documentController.renameFile);
router.get("/download", documentController.getFile);

module.exports = router;