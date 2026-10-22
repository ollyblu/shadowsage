const handler = {}
handler.main = function(dt,pesan){
  if(dt.args.length<3)return pesan.reply('Untuk mendeskripsi pesan ketik\n!decryptcaesarcipher <kode> <text>\nContoh:\n!decryptcaesarcipher 20 Ujuwivu xcwivu')
  let shift = 26 - (Number(dt.args[1])%26)
  if(isNaN(shift))return pesan.reply('Kode harus angka')
    let message = dt.args.slice(2).join(' ')
    let encryptedMessage = "";
    for (let i = 0; i < message.length; i++) {
      let char = message[i];
  
      if (char.match(/[a-z]/i)) {
        const charCode = char.charCodeAt(0);
        const isUpperCase = char === char.toUpperCase();
        const baseCharCode = isUpperCase ? 65 : 97;
  
        const encryptedCharCode = (((charCode - baseCharCode + shift) % 26) + 26) % 26 + baseCharCode;
        encryptedMessage += String.fromCharCode(encryptedCharCode);
      } else {
        encryptedMessage += char;
      }
    }
  return pesan.reply(encryptedMessage)  
}
handler.command = /^(decryptCaesarCipher|decryptCC)$/i
handler.help = 'decryptCaesarCipher kode Pesan...'
handler.tags = ['tools']
module.exports = handler