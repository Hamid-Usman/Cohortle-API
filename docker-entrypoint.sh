#!/bin/sh
set -e

echo "Running Sequelize migrations..."
npx sequelize-cli db:migrate

echo "Starting application..."
exec node bin/www
