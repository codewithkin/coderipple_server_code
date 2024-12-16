import { S3Client } from "@aws-sdk/client-s3";

const config = {
    endpoint: 'https://ap-south-1.linodeobjects.com/',
    credentials: {
        accessKeyId: "XDFFL898UQK6R4ZQRRVZ",
        secretAccessKey: "2YHvBZvNmg7klIyick4UvP2iOAYpN5AQMZBEgA0l",
    },

    region: "ap-south-1"
};

export const s3Client = new S3Client(config);