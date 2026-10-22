const https = require('https');
const xml2js = require('xml2js');
const fs = require('fs');

const xmlUrl = 'https://cbt-storage.is3.cloudhost.id'; // Ganti dengan URL XML yang sesuai

https.get(xmlUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // Proses XML menggunakan xml2js
    xml2js.parseString(data, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return;
      }

      // Simpan hasil parsing sebagai JSON ke dalam file
      let jsonresult = convertArrayToObject(result)
      jsonresult.Asli = xmlUrl
      let database = JSON.stringify(jsonresult,null,2)
      fs.writeFile('result.json', database, (err) => {
        if (err) {
          console.error('Error writing JSON file:', err);
          return;
        }
        console.log('Hasil JSON telah disimpan dalam file "result.json"');
      });
    });
  });
}).on('error', (err) => {
  console.error('Error retrieving XML data:', err);
});
function convertArrayToObject(arr) {
    if(typeof arr == 'object'){
        for(let obj in arr){
            arr[obj] = convertArrayToObject(arr[obj])
        }
    }
    if (Array.isArray(arr) && arr.length === 1) {
      return arr[0];
    }
    return arr;
  }
