const path = require('path')

module.exports = (options) => {
  return {
    ...options,
    externals: [
      // Keep node_modules external — Prisma has native binaries that can't be bundled
      function ({ request }, callback) {
        // Bundle everything except node_modules
        if (/^(@nestjs|@prisma|prisma|bcrypt|passport|helmet|compression|cookie-parser|nodemailer|rxjs|reflect-metadata|class-validator|class-transformer)/.test(request)) {
          return callback(null, 'commonjs ' + request)
        }
        callback()
      },
    ],
    resolve: {
      ...options.resolve,
      alias: {
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@prisma': path.resolve(__dirname, 'src/prisma'),
      },
    },
  }
}
