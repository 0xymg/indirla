module.exports = {
  apps: [
    {
      name: 'indirla',
      script: 'npm',
      args: 'start',
      cwd: '/home/indirla/indirla',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        PATH: process.env.PATH + ':/usr/local/bin'
      },
      error_file: '/home/indirla/logs/err.log',
      out_file: '/home/indirla/logs/out.log',
      log_file: '/home/indirla/logs/combined.log',
      time: true,
      // Auto restart settings
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}