const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION
});

const BUCKET = process.env.S3_BUCKET;

function uploadToS3(fileBuffer, fileName, mimeType) {
  const params = {
    Bucket: BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType
  };
  return s3.upload(params).promise();
}

function deleteFromS3(fileName) {
  const params = {
    Bucket: BUCKET,
    Key: fileName
  };
  return s3.deleteObject(params).promise();
}

function getS3Url(fileName) {
  return `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  getS3Url,
  s3 // Export the s3 instance
}; 