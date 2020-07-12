const { Storage } = require("@google-cloud/storage");
// Using azure legacy (v2) API for WriteStream since it's not available in current (v12)
const azure = require("azure-storage");
const { BlobServiceClient } = require("@azure/storage-blob");

const storageService = (provider, connectionString) => {
  const makeGcpStorage = () => {
    const storage = new Storage();

    const createWriteStream = (bucketName, fileName) =>
      storage.bucket(bucketName).file(fileName).createWriteStream();

    const gcpGetSignedUrl = async (bucketName, fileName) => {
      const url = await storage
        .bucket(bucketName)
        .file(fileName)
        .getSignedUrl({
          action: "read",
          expires: moment().add(2, "h").toDate(),
        });

      if (url && url.length) {
        return url[0];
      }
    };

    const gcpDownloadFileAsJson = async (bucketName, fileName) => {
      try {
        return await storage
          .bucket(bucketName)
          .file(fileName)
          .download()
          .then((data) => JSON.parse(data[0].toString()));
      } catch (e) {
        return Promise.reject("File is not in JSON format");
      }
    };

    return {
      downloadFileAsJson: gcpDownloadFileAsJson,
      getSignedUrl: gcpGetSignedUrl,
      createWriteStream: createWriteStream,
      // TODO(erez): Implement uploadJsonBlob for gcp
      uploadJsonBlob: async() => {},
    };
  };

  const makeAzureStorage = (connectionString) => {
    const blobService = azure.createBlobService(connectionString);
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    function streamToString(readableStream) {
      return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
          chunks.push(data.toString());
        });
        readableStream.on("end", () => {
          resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
      });
    }

    const azureGetSignedUrl = async (bucketName, fileName) => {
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

    const azureDownloadFileAsJson = async (bucketName, fileName) => {
      const downloadResponse = await blobServiceClient
        .getContainerClient(bucketName)
        .getBlockBlobClient(fileName)
        .download(0);
      try {
        return await streamToString(
          downloadResponse.readableStreamBody
        ).then((data) => JSON.parse(data));
      } catch (e) {
        return Promise.reject("File is not in JSON format");
      }
    };

    const createWriteStream = (bucketName, fileName) => {
      return blobService.createWriteStreamToBlockBlob(bucketName, fileName);
    };

    const uploadJsonBlob = async (container, blobName, payload) => {
      const data = JSON.stringify(payload);
      blobServiceClient
        .getContainerClient(container)
        .getBlockBlobClient(blobName)
        .upload(data, data.length);
    };

    return {
      downloadFileAsJson: azureDownloadFileAsJson,
      getSignedUrl: azureGetSignedUrl,
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
