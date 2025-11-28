const { createGunzip, gunzipSync } = require("zlib");
const { ObjectId } = require("mongodb");

async function read_country_meta_data_report(id, bucket) {
  const fileId = typeof id === "string" ? new ObjectId(id) : id;

  const files = await bucket.find({ _id: fileId }).toArray();
  if (!files || files.length === 0) {
    throw new Error("GridFS file not found.");
  }

  const fileDoc = files[0];
  const isGzipped = fileDoc.metadata?.content_encoding === "gzip";

  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(fileId);
    const chunks = [];

    downloadStream
      .on("error", reject)
      .on("data", chunk => chunks.push(chunk))
      .on("end", () => {
        try {
          const buffer = Buffer.concat(chunks);

          const rawBuffer = isGzipped
            ? gunzipSync(buffer)
            : buffer;

          const jsonString = rawBuffer.toString("utf8");
          const data = JSON.parse(jsonString);

          resolve({
            file: {
              _id: fileDoc._id,
              filename: fileDoc.filename,
              length: fileDoc.length,
              uploadDate: fileDoc.uploadDate,
              metadata: fileDoc.metadata
            },
            data
          });
        } catch (err) {
          reject(err);
        }
      });
  });
}

module.exports = read_country_meta_data_report;