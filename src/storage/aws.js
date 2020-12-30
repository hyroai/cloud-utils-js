const AWS = require("aws-sdk");
const { applySpec } = require("ramda");

const createWriteStream = () => () => {
  throw new Error("createWriteStream is not supported for AWS");
};

const getSignedUrl = s3 => (bucketName, fileName) =>
  new Promise(resolve =>
    resolve(
      s3.getSignedUrl("getObject", {
        Bucket: bucketName,
        Key: fileName,
        Expires: 60 * 5
      })
    )
  );

const downloadFileAsJson = s3 => (bucketName, fileName) =>
  new Promise((resolve, reject) =>
    s3.getObject(
      {
        Bucket: bucketName,
        Key: fileName
      },
      (err, data) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(data.Body.toString()));
        } catch (e) {
          reject("File is not in JSON format");
        }
      }
    )
  );

const uploadJsonBlob = s3 => (container, blobName, payload) =>
  new Promise((resolve, reject) => {
    try {
      s3.upload(
        {
          Bucket: container,
          Key: blobName,
          Body: JSON.stringify(payload)
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        }
      );
    } catch (e) {
      reject("Payload is not in JSON format");
    }
  });

module.exports = () =>
  applySpec({
    downloadFileAsJson,
    getSignedUrl,
    createWriteStream,
    uploadJsonBlob
  })(new AWS.S3());
