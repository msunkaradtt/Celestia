#!/bin/sh
# A super-simple wait-for script

# This script will wait for the host "db" on port "5432" to be available
# before starting the Node.js application.

set -e

HOST="db"
PORT="5432"
# The command to run after the database is ready
CMD_TO_RUN="node /app/dist/server.js"

echo "Waiting for $HOST:$PORT..."

# Loop until a connection can be made
while ! nc -z "$HOST" "$PORT"; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
# Execute the node application
exec $CMD_TO_RUN