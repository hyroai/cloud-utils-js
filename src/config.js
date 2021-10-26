module.exports = {
  vault: {
    host: process.env.VAULT_HOST || "http://vault.vault:8200",
    env: process.env.VAULT_KEY || "dev",
    role: process.env.ROLE,
  },
};
