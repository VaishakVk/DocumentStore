const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const documentRoutes = require('./routes/document');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'docs')));

require('dotenv').config();

app.use("/api", documentRoutes);

app.listen(process.env.PORT || 3000, (err) => {
	if(err) {
		return console.log(err);
	}
	return console.log('Listening to Port')
})