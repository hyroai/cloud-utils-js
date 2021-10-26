const axios = require("axios");
const { path, curry } = require("ramda");
const { asyncPipe, withCacheAsync } = require("gamlajs").default;
const config = require("./config");

const baseVaultUrl = `${config.vault.host}/v1`;
const baseMetadataUrl = "http://169.254.169.254/metadata";

const identityToken = asyncPipe(
  () =>
    axios.get(
      `${baseMetadataUrl}/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fmanagement.azure.com%2F`,
      { headers: { Metadata: "true" } }
    ),
  path(["data", "access_token"])
)();

const instanceMetadata = asyncPipe(
  () =>
    axios.get(`${baseMetadataUrl}/instance?api-version=2019-08-15`, {
      headers: { Metadata: "true" },
    }),
  path(["data"])
);

const vaultAuthPayload = curry(
  (jwt, { subscriptionId, resourceGroupName, name, vmScaleSetName }) => ({
    role: config.vault.role || `${config.vault.env}-role`,
    jwt,
    subscription_id: subscriptionId,
    resource_group_name: resourceGroupName,
    vm_name: name,
    vmss_name: vmScaleSetName,
  })
);

const vaultHeaders = withCacheAsync(
  async () => ({
    "X-Vault-Token": await asyncPipe(
      path(["compute"]),
      vaultAuthPayload(await identityToken()),
      async (payload) =>
        (await axios.post(`${baseVaultUrl}/auth/azure/login`, payload)).data,
      path(["auth", "client_token"])
    )(await instanceMetadata()),
  }),
  { stdTTL: 23 * 60 * 60 } // Vault token is valid for 24 hour.
);

const readKey = async (path) =>
  (
    await axios.get(`${baseVaultUrl}/secret/data/${path}`, {
      headers: await vaultHeaders(),
    })
  ).data.data;

const writeKey = async (path, value) =>
  axios.post(
    `${baseVaultUrl}/secret/data/${path}`,
    { data: value },
    { headers: await vaultHeaders() }
  );

module.exports = { readKey, writeKey };
