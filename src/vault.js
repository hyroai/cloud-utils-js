const axios = require("axios");
const { path, curry, applySpec, mergeRight } = require("ramda");
const { asyncPipe, withCacheAsync } = require("gamlajs").default;

const baseMetadataUrl = "http://169.254.169.254/metadata";

const getResultPath = (url, headers, resultPath) =>
  asyncPipe(() => axios.get(url, { headers }), path(resultPath));

const identityToken = getResultPath(
  `${baseMetadataUrl}/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fmanagement.azure.com%2F`,
  { Metadata: "true" },
  ["data", "access_token"]
);

const instanceMetadata = getResultPath(
  `${baseMetadataUrl}/instance?api-version=2019-08-15`,
  { Metadata: "true" },
  ["data"]
);

const vaultAuthPayload = curry(
  (jwt, role, { subscriptionId, resourceGroupName, name, vmScaleSetName }) => ({
    role,
    jwt,
    subscription_id: subscriptionId,
    resource_group_name: resourceGroupName,
    vm_name: name,
    vmss_name: vmScaleSetName,
  })
);

const podIdentityToken = (baseVaultUrl, role) =>
  withCacheAsync(
    async () =>
      asyncPipe(
        path(["compute"]),
        vaultAuthPayload(await identityToken(), role),
        async (payload) =>
          (await axios.post(`${baseVaultUrl}/auth/azure/login`, payload)).data,
        path(["auth", "client_token"])
      )(await instanceMetadata()),
    { stdTTL: 23 * 60 * 60 } // Vault token is valid for 24 hour.
  );

const vaultHeaders = (tokenGetter) => async () => ({
  "X-Vault-Token": await tokenGetter(),
});

const readKey =
  ({ baseVaultUrl, headersGetter }) =>
  async (path) =>
    getResultPath(
      `${baseVaultUrl}/secret/data/${path}`,
      await headersGetter(),
      ["data", "data", "data"]
    )();

const writeKey =
  ({ baseVaultUrl, headersGetter }) =>
  async (path, value) =>
    axios.post(
      `${baseVaultUrl}/secret/data/${path}`,
      { data: value },
      { headers: await headersGetter() }
    );

const updateKey =
  ({ readKey, writeKey }) =>
  async (path, value) => {
    try {
      return writeKey(path, mergeRight(await readKey(path), value));
    } catch (e) {
      return writeKey(path, value);
    }
  };

module.exports = (host, role, token) => ({
  updateKey: updateKey(
    applySpec({
      readKey,
      writeKey,
    })({
      baseVaultUrl: `${host}/v1`,
      headersGetter: vaultHeaders(
        token ? () => token : podIdentityToken(`${host}/v1`, role)
      ),
    })
  ),
});
