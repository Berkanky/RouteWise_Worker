const crypto = require('crypto');
const { Readable } = require('stream');
const { createGzip } = require('zlib');

async function create_country_meta_data_report(app, diff_checker_result){
    
    if( !diff_checker_result ) return { success: false, request_date: new Date() };

    var gzip = true;
    var diff_checker_result_formatted_string = JSON.stringify(diff_checker_result);

    var bucket = app.locals.country_meta_data_reports;
    if (!bucket) throw new Error('country_meta_data_reports bucket required. ');

    var rawBuf = Buffer.from(diff_checker_result_formatted_string, 'utf8');

    var issuer = 'worker.routewiseapp.com';
    var process_id = crypto.randomUUID();
    var created_date = new Date();

    var created_grid_fs_meta_data = {
        content_type: 'application/json',
        content_encoding: gzip ? 'gzip' : 'identity',
        size_uncompressed: rawBuf.length,
        hash: crypto.createHash('sha256').update(rawBuf).digest('hex'),
        created_at: created_date,
        issuer: issuer,
        process_id: process_id
    };  
    
    var fname = `country_meta_data_report.${issuer}.${process_id}.${created_date.toISOString()}.json${gzip ? '.gz' : ''}`;

    var src = Readable.from(rawBuf);
    var upload = bucket.openUploadStream(fname, { metadata: created_grid_fs_meta_data });
    var pipeFrom = gzip ? src.pipe(createGzip()) : src;

    await new Promise((resolve, reject) => {
        pipeFrom.pipe(upload).on('error', reject).on('finish', resolve);
    });
    
    return { success: true, id: upload.id, length: upload.length, filename: fname, metadata: created_grid_fs_meta_data };
};

module.exports = create_country_meta_data_report;