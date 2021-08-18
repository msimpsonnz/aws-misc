import { Handler, Context } from 'aws-lambda';
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export const handler: Handler = async (event: any, context: Context) => {
  console.log(JSON.stringify(event));
  try {
    const posts = await prisma.post.findMany({
      include: { author: true },
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(posts),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error),
    };
  }
};
