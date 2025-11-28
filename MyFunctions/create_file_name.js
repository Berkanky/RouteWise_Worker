function create_file_name(){

  var d = new Date();
    
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var day = d.getDate();
  
  if( month < 10 ) month = '0' + month;
  if( day < 10 ) day = '0' + day;
    
  var file_date_detail = year + '.' + month + '.' + day;
    
  var file_name = 'RouteWise_' + file_date_detail + '.json';

  return file_name;
};

module.exports = create_file_name;