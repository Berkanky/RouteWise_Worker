const { createGunzip, gunzipSync } = require("zlib");
const { ObjectId } = require("mongodb");

async function read_country_meta_data_report(id, bucket) {

  var fileId = typeof id === "string" ? new ObjectId(id) : id;

  var files = await bucket.find({ _id: fileId }).toArray();
  if (!files || files.length === 0) {
    throw new Error("GridFS file not found.");
  }

  var fileDoc = files[0];
  var isGzipped = fileDoc.metadata?.content_encoding === "gzip";

  return new Promise((resolve, reject) => {
    var downloadStream = bucket.openDownloadStream(fileId);
    var chunks = [];

    downloadStream
      .on("error", reject)
      .on("data", chunk => chunks.push(chunk))
      .on("end", () => {
        try {
          var buffer = Buffer.concat(chunks);

          var rawBuffer = isGzipped
            ? gunzipSync(buffer)
            : buffer;

          var jsonString = rawBuffer.toString("utf8");
          var data = JSON.parse(jsonString);

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