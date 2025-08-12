module.exports = {
  apps: [
    // NestJS API
    {
      name: "rw-platform-api",
      script: "api/dist/src/main.js",
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
    },
    {
      name: "rw-platform-client",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
