const axios = require("axios");
const { path, curry } = require("ramda");
const { asyncPipe, withCacheAsync } = require("gamlajs").default;

const baseVaultUrl = `${process.env.VAULT_HOST}/v1`;
const baseMetadataUrl = "http://169.254.169.254/metadata";

const identityToken = async () =>
  (
    await axios.get(
      `${baseMetadataUrl}/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fmanagement.azure.com%2F`,
      { headers: { Metadata: "true" } }
    )
  ).data.access_token;

const instanceMetadata = async () =>
  (
    await axios.get(`${baseMetadataUrl}/instance?api-version=2019-08-15`, {
      headers: { Metadata: "true" },
    })
  ).data;

const vaultAuthPayload = curry((jwt, computeData) => ({
  role: process.env.ROLE || `${process.env.VAULT_KEY}-role`,
  jwt,
  subscription_id: computeData.subscriptionId,
  resource_group_name: computeData.resourceGroupName,
  vm_name: computeData.name,
  vmss_name: computeData.vmScaleSetName,
}));

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
