// Using azure legacy (v2) API for WriteStream since it's not available in current (v12)

const storageService = (provider, connectionString) => {
  const providerMap = {
    azure: require("./azure"),
    gcp: require("./gcp"),
    aws: require("./aws")
  };

  return providerMap[provider](connectionString);
};

module.exports = storageService;
