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
			// console.log(err, result);
			if(err) cb('File Not Found')
			else cb('S3')
		})	
	}
}

// function checkFileLocal (fileName, cb) {
// 	cb(fs.existsSync(path.join(docsDir, fileName)))
// }

// function checkFileS3 (fileName, cb) {
// 	AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID,
// 							secretAccessKey: process.env.SECRET_ACCESS_KEY,
// 							region: 'us-east-2'});

// 	const s3 = new AWS.S3();
// 	const params = {Bucket: process.env.BUCKET_NAME,
// 				 	Key: fileName};
// 	s3.headObject(params, (err, result) => {
// 		console.log(err, result);
// 		if(err) cb(false)
// 		else cb(true)
// 	})
// }

exports.postUploadFile = (req, res) => {
	
	if (typeof req.query.uploadTo === 'undefined') 
		req.query.uploadTo = "local";

	if (req.query.uploadTo === "local") {
		const fileStorage = multer.diskStorage({
		  	destination: (req, file, cb) => {
		    	cb(null, 'docs');
		  	},
		  	filename: (req, file, cb) => {
		    	cb(null, file.originalname);
		  	}
		});

		const upload = multer({ storage: fileStorage }).single('document');

		upload(req, res, function(err) {
	         if (err) {
	            return res.status(422).json({message: "Error while uploading file: " + err });
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
								    // acl: 'public-read',
							        key: function (req, file, cb) {
							            console.log(file);
							            cb(null, file.originalname); //use Date.now() for unique file keys
							        }

    	})

    	const upload = multer({ storage: fileStorage }).single('document');

    	upload(req, res, function(err, data) {
	         if (err) {
	            return res.status(422).json({message: "Error while uploading file: " + err });
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
	  	if(err) res.status(422).json({message: "Error while GET operation: " + err });
	  	
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
					return res.status(401).json({message: "Error while deleting file: " + err })
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
					return res.status(401).json({message: "Error while deleting file: " + err })
				}
				return res.status(200).json({message: "File deleted successfully"})
			})
		} else {
			return res.status(401).json({message: "File Not Found" })
		}
	})
}

