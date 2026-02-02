module.exports = {
  apps: [
    {
      name: "labbee",
      script: "index.js",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
