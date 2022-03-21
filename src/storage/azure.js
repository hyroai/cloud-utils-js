const azure = require("azure-storage");
const { BlobServiceClient } = require("@azure/storage-blob");
const moment = require("moment");
const { applySpec } = require("ramda");

const streamToString = (readableStream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });

const getSignedUrl =
  ({ blobService }) =>
  (bucketName, fileName) => {
    const sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
        Start: moment().toDate(),
        Expiry: moment().add(2, "h").toDate(),
      },
    };

    const sasToken = blobService.generateSharedAccessSignature(
      bucketName,
      fileName,
      sharedAccessPolicy
    );

    return blobService.getUrl(bucketName, fileName, sasToken, true);
  };

const downloadFileAsJson =
  ({ blobServiceClient }) =>
  async (bucketName, fileName) => {
    try {
      return await downloadFileAsString({ blobServiceClient })(
        bucketName,
        fileName
      ).then((data) => JSON.parse(data));
    } catch (e) {
      return Promise.reject("File is not in JSON format");
    }
  };

const downloadFileAsString =
  ({ blobServiceClient }) =>
  async (bucketName, fileName) => {
    const downloadResponse = await blobServiceClient
      .getContainerClient(bucketName)
      .getBlockBlobClient(fileName)
      .download(0);
    try {
      return await streamToString(downloadResponse.readableStreamBody);
    } catch (e) {
      return Promise.reject("Could not stringify blob");
    }
  };

const getBlobProperties =
  ({ blobServiceClient }) =>
  (bucketName, fileName) =>
    blobServiceClient
      .getContainerClient(bucketName)
      .getBlockBlobClient(fileName)
      .getProperties();

const getBlobStream =
  ({ blobServiceClient }) =>
  async (bucketName, fileName) => {
    const { readableStreamBody, contentType, contentEncoding } =
      await blobServiceClient
        .getContainerClient(bucketName)
        .getBlockBlobClient(fileName)
        .download(0);

    return {
      stream: readableStreamBody,
      contentType,
      contentEncoding,
    };
  };

const createWriteStream =
  ({ blobService }) =>
  (bucketName, fileName) =>
    blobService.createWriteStreamToBlockBlob(bucketName, fileName);

const uploadJsonBlob =
  ({ blobServiceClient }) =>
  (container, blobName, payload) => {
    const data = JSON.stringify(payload);
    return blobServiceClient
      .getContainerClient(container)
      .getBlockBlobClient(blobName)
      .upload(data, data.length);
  };

const uploadFileBlob =
  ({ blobServiceClient }) =>
  (container, blobName, filePath) =>
    blobServiceClient
      .getContainerClient(container)
      .getBlockBlobClient(blobName)
      .uploadFile(filePath);

module.exports = (connectionString) =>
  applySpec({
    downloadFileAsJson,
    downloadFileAsString,
    getBlobProperties,
    getSignedUrl,
    createWriteStream,
    uploadJsonBlob,
    uploadFileBlob,
    getBlobStream,
  })({
    blobService: azure.createBlobService(connectionString),
    blobServiceClient: BlobServiceClient.fromConnectionString(connectionString),
  });
