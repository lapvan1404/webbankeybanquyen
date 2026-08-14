const dotenv = require('dotenv');
dotenv.config();
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY,
  },
});
const key = 'uploads/images/1785466847876-807c8b51-b022-4c7b-9a98-b5179c828bda.png';
const bucket = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET;
client
  .send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  .then((r) => {
    console.log('EXISTS');
    console.log(
      JSON.stringify(
        { bucket, key, contentType: r.ContentType, contentLength: r.ContentLength, etag: r.ETag },
        null,
        2,
      ),
    );
  })
  .catch((e) => {
    console.log('NOT_FOUND_OR_ERROR');
    console.log(e.name + ': ' + e.message);
    if (e.$metadata) {
      console.log(JSON.stringify(e.$metadata, null, 2));
    }
  });
