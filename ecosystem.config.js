module.exports = {
  apps: [
    {
      name: "rw-platform-api",
      script: "dist/main.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3015
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3015
      }
    }
  ]
};
