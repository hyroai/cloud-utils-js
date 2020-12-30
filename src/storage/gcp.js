const { Storage } = require("@google-cloud/storage");
const moment = require("moment");
const { applySpec } = require("ramda");

const createWriteStream = storage => (bucketName, fileName) =>
  storage
    .bucket(bucketName)
    .file(fileName)
    .createWriteStream();

const getSignedUrl = storage => async (bucketName, fileName) => {
  const url = await storage
    .bucket(bucketName)
    .file(fileName)
    .getSignedUrl({
      action: "read",
      expires: moment()
        .add(2, "h")
        .toDate()
    });

  if (url && url.length) {
    return url[0];
  }
};

const downloadFileAsJson = storage => async (bucketName, fileName) => {
  try {
    return await storage
      .bucket(bucketName)
      .file(fileName)
      .download()
      .then(data => JSON.parse(data[0].toString()));
  } catch (e) {
    return Promise.reject("File is not in JSON format");
  }
};

// TODO(erez): Implement uploadJsonBlob for gcp
const uploadJsonBlob = () => () =>
  Promise.reject("uploadJsonBlob for GCP is not implemented yet.");

module.exports = () =>
  applySpec({
    createWriteStream,
    downloadFileAsJson,
    getSignedUrl,
    uploadJsonBlob
  })(new Storage());
