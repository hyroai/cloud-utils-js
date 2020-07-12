const { Storage } = require("@google-cloud/storage");
// Using azure legacy (v2) API for WriteStream since it's not available in current (v12)
const azure = require("azure-storage");
const { BlobServiceClient } = require("@azure/storage-blob");

const storageService = (provider, connectionString) => {
  const makeGcpStorage = () => {
    const storage = new Storage();

    const createWriteStream = (bucketName, fileName) =>
      storage.bucket(bucketName).file(fileName).createWriteStream();

    return {
      createWriteStream: createWriteStream,
      // TODO(erez): Implement uploadJsonBlob for gcp
      uploadJsonBlob: async() => {},
    };
  };

  const makeAzureStorage = (connectionString) => {
    const blobService = azure.createBlobService(connectionString);

    const createWriteStream = (bucketName, fileName) => {
      return blobService.createWriteStreamToBlockBlob(bucketName, fileName);
    };

    const uploadJsonBlob = async (container, blobName, payload) => {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const data = JSON.stringify(payload);
      blobServiceClient
        .getContainerClient(container)
        .getBlockBlobClient(blobName)
        .upload(data, data.length);
    };

    return {
      createWriteStream: createWriteStream,
      uploadJsonBlob: uploadJsonBlob,
    };
  };

  const providerMap = {
    azure: makeAzureStorage,
    gcp: makeGcpStorage,
  };

  return providerMap[provider](connectionString);
};

module.exports = storageService;
