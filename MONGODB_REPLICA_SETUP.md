# MongoDB Replica Set Setup for Local Development

## Why do we need this?

Prisma requires MongoDB to run as a replica set when using:
- Transactions
- Unique constraints (like `@unique` on the `slug` field)
- Certain atomic operations

## Quick Setup (5 minutes)

### Option 1: Using Docker (Recommended)

1. **Stop your current MongoDB instance** (if running)

2. **Create a docker-compose.yml file** in your project root:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: mongodb-replica
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123

volumes:
  mongodb_data:
```

3. **Start MongoDB**:
```bash
docker-compose up -d
```

4. **Initialize the replica set**:
```bash
docker exec -it mongodb-replica mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
```

5. **Update your DATABASE_URL** in `.env`:
```
DATABASE_URL="mongodb://admin:password123@localhost:27017/coparmex?authSource=admin&replicaSet=rs0"
```

### Option 2: Using Local MongoDB Installation

If you have MongoDB installed locally:

1. **Stop MongoDB**:
```bash
brew services stop mongodb-community
# or
sudo systemctl stop mongod
```

2. **Start MongoDB with replica set**:
```bash
mongod --replSet rs0 --dbpath /usr/local/var/mongodb --bind_ip localhost
```

3. **In another terminal, initialize the replica set**:
```bash
mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
```

4. **Update your DATABASE_URL** in `.env`:
```
DATABASE_URL="mongodb://localhost:27017/coparmex?replicaSet=rs0"
```

## Verify Setup

Run this command to check if replica set is working:

```bash
mongosh --eval "rs.status()"
```

You should see status "PRIMARY" for your node.

## Troubleshooting

### Error: "no replset config has been received"
- Make sure you initialized the replica set (step 4 in Docker setup)
- Wait a few seconds and try again

### Error: "connection refused"
- Check if MongoDB is running: `docker ps` or `brew services list`
- Check if port 27017 is available

### Error: "Authentication failed"
- Make sure your DATABASE_URL credentials match the docker-compose.yml
- For local installation without auth: remove username/password from DATABASE_URL

## Development Workflow

```bash
# Start MongoDB
docker-compose up -d

# Check logs
docker-compose logs -f mongodb

# Stop MongoDB
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

## After Setup

1. Push your schema to the database:
```bash
pnpm db:push
```

2. Seed initial data:
```bash
pnpm db:seed
```

3. Restart your Next.js dev server:
```bash
pnpm dev
```

## Production Note

In production (MongoDB Atlas or managed hosting), replica sets are enabled by default. This setup is only needed for local development.
