



export HOSTNAME=fisdemoinfrastack-databaseb269d8bb-1s37mv1sw452i.cluster-c0dngne2r7ev.ap-southeast-2.rds.amazonaws.com
export PORT=5432
export USERNAME=clusteradmin
export DATABASE_NAME=demo

psql --host $HOSTNAME --port $PORT --user $USERNAME --dbname $DATABASE_NAME

CREATE TABLE "public"."User" (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE "public"."Post" (
  id SERIAL PRIMARY KEY NOT NULL,
  title VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  content TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  "authorId" INTEGER NOT NULL,
  FOREIGN KEY ("authorId") REFERENCES "public"."User"(id)
);

CREATE TABLE "public"."Profile" (
  id SERIAL PRIMARY KEY NOT NULL,
  bio TEXT,
  "userId" INTEGER UNIQUE NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "public"."User"(id)
);

npx prisma db seed --preview-feature