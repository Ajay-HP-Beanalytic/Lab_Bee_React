module.exports = {
  apps: [
    {
      name: "labbee",
      script: "index.js",
      max_memory_restart: "500M",  // restart if RAM exceeds 500 MB (memory leak guard)
      restart_delay: 3000,          // wait 3s before restarting after a crash
      max_restarts: 15,             // stop restarting after 15 attempts (prevents infinite crash loop)
      min_uptime: "10s",            // only count as a successful start if it runs for 10s
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};