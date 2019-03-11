const multer = require('multer');
const multerS3 = require('multer-s3');
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require("path");
 
const docsDir = path.join(__dirname, '../', 'docs');

function checkFileExists(fileName, cb) {
	existsFile = fs.existsSync(path.join(docsDir, fileName))
	if(existsFile) {
		cb('local')
	} else {
		AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID,
							secretAccessKey: process.env.SECRET_ACCESS_KEY,
							region: 'us-east-2'});

		const s3 = new AWS.S3();
		const params = {Bucket: process.env.BUCKET_NAME,
					 	Key: fileName};
		s3.headObject(params, (err, result) => {			
			if(err) cb('File Not Found')
			else cb('S3')
		})	
	}
}

exports.postUploadFile = (req, res) => {
	
	// var fileToBeUploaded;

	if (typeof req.query.uploadTo === 'undefined') 
		req.query.uploadTo = "local";
	
	if (req.query.uploadTo === "local") {
		const fileStorage = multer.diskStorage({
		  	destination: (reqMult, file, cb) => {
		    	cb(null, 'docs');
		  	},
		  	filename: (reqMult, file, cb) => {
		  		checkFileExists(file.originalname, result => {
	        		if(result == "S3"||result == "local") cb(null, Date.now() + '.' + file.originalname)
	        		else cb(null, file.originalname); 
	        	});
		  	}
		});
		
		const upload = multer({ storage: fileStorage })
				.single('document');
		// console.log(3)
		upload(req, res, function(err) {
			// console.log(2)
	        if (err) {
	            return res.status(400).json({message: "Error while uploading file: " + err });
	        }
	        return res.status(200).json({message: "File uploaded successfully"})
	     });

	} else if (req.query.uploadTo === "S3") {
		AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID,
							secretAccessKey: process.env.SECRET_ACCESS_KEY,
							region: 'us-east-2'});
		const s3 = new AWS.S3();

		const fileStorage = multerS3({s3,
								    bucket: process.env.BUCKET_NAME,
							        key: function (req, file, cb) {
							        	checkFileExists(file.originalname, result => {
							        		if(result == "S3"||result == "local") cb(null, Date.now() + '.' + file.originalname)
							        		else cb(null, file.originalname); 
							        	});
							        }
    	})
    	const upload = multer({ storage: fileStorage }).single('document');
    	upload(req, res, function(err, data) {
	         if (err) {
	            return res.status(400).json({message: "Error while uploading file: " + err });
	         }
	         return res.status(200).json({message: "File uploaded successfully"})
	    });
	}
	
};

exports.getAllFiles = (req, res) => {
	fileData = {fileNames: []}

	AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID,
							secretAccessKey: process.env.SECRET_ACCESS_KEY,
							region: 'us-east-2'});
	const s3 = new AWS.S3();

	const params = { 
	  Bucket: process.env.BUCKET_NAME,
	}

	s3.listObjects(params, function (err, data) {
	  	if(err) res.status(400).json({message: "Error while GET operation: " + err });
	  	
	  	data.Contents.forEach(fileDetail => {
	  		fileData.fileNames.push({file: fileDetail.Key, location: 'S3'})
	  	})

	  	fs.readdir(docsDir, (err, files) => {
		  	files.forEach(file => {
		  		fileData.fileNames.push({file, location: 'local'});
		  	})
			res.status(200).json(fileData);
		});
	});
}

exports.deleteFile = (req, res) => {
	
	fileName = req.query.fileName;
	checkFileExists(fileName, result => {
		if(result === 'local') {
			fs.unlink(path.join(docsDir, fileName), (err) => {
				if(err) {
					return res.status(400).json({message: "Error while deleting file: " + err })
				}
				return res.status(200).json({message: "File deleted successfully"})
			})

		} else if (result === "S3") {
			AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID,
							secretAccessKey: process.env.SECRET_ACCESS_KEY,
							region: 'us-east-2'});

			const s3 = new AWS.S3();
			const params = {Bucket: process.env.BUCKET_NAME,
						 	Key: fileName};

			s3.deleteObject(params, function(err, data) {
				if(err) {
					return res.status(400).json({message: "Error while deleting file: " + err })
				}
				return res.status(200).json({message: "File deleted successfully"})
			})
		} else {
			return res.status(400).json({message: "File Not Found" })
		}
	})
}

exports.getFile = (req, res) => {
	
	fileName = req.query.fileName
	
	checkFileExists(fileName, result => {
		if(result === 'local') {
			console.log(path.join(docsDir, fileName))
			res.download(path.join(docsDir, fileName), (err) => {
				if(err) {
					return res.status(400).json({message: "Error while downloading file: " + err })
				}
			})

		} else if (result === "S3") {
			AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID,
							secretAccessKey: process.env.SECRET_ACCESS_KEY,
							region: 'us-east-2'});

			const s3 = new AWS.S3();
			const params = {Bucket: process.env.BUCKET_NAME,
						 	Key: fileName};

			s3.getObject(params, function(err, data) {
				if(err) {
					return res.status(400).json({message: "Error while downloading file: " + err })
				}
				res.attachment(fileName); // or whatever your logic needs
       			res.send(data.Body);
				// return res.status(200).json({message: "File deleted successfully"})
			})
		} else {
			return res.status(400).json({message: "File Not Found" })
		}
	})
}

exports.renameFile = (req, res) => {
	originalFileName = req.body.originalFileName
	modifiedFileName = req.body.modifiedFileName
	
	checkFileExists(originalFileName, result => {
		if(result === 'local') {
			fs.rename(path.join(docsDir, originalFileName), path.join(docsDir, modifiedFileName), (err) => {
				if(err) {
					return res.status(400).json({message: "Error while renaming file: " + err })
				}
				return res.status(200).json({message: "File renamed successfully"})
			})		
		} else if (result === "S3") {
			AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID,
							secretAccessKey: process.env.SECRET_ACCESS_KEY,
							region: 'us-east-2'});

			const s3 = new AWS.S3();
			const params = {Bucket: process.env.BUCKET_NAME,
							CopySource: process.env.BUCKET_NAME + '/' + originalFileName,
						 	Key: modifiedFileName};

			s3.copyObject(params, function(err, data) {
				if(err) {
					return res.status(400).json({message: "Error while renaming file: " + err })
				}
				
				s3.deleteObject({Bucket: process.env.BUCKET_NAME,
								Key: originalFileName}, function(err, data) {
					if(err) {
						return res.status(400).json({message: "Error while renaming file: " + err })
					}
					return res.status(200).json({message: "File renamed successfully"})
				})
			})
		} else {
			return res.status(400).json({message: "File Not Found" })
		}
	})
}
