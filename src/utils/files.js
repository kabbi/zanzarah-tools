const jBinary = require('jbinary');
const FileSaver = require('file-saver');

const ReadTypeMappings = {
  arraybuffer: 'readAsArrayBuffer',
  binary: 'readAsBinaryString',
  dataurl: 'readAsDataURL',
  text: 'readAsText',
};

exports.readFile = (file, type = 'text') => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = event => {
      resolve(event.target.result);
    };

    if (type === 'blob') {
      resolve(file);
      return;
    }

    if (!ReadTypeMappings[type]) {
      reject(new Error(`Unknown result type: ${type}`));
      return;
    }

    reader[ReadTypeMappings[type]](file);
  })
);

exports.saveFile = (data, typeSet, fileName, mimeType) => {
  const binary = new jBinary(JSON.stringify(data).length, typeSet);
  const bytesWritten = binary.writeAll(data);
  const buffer = binary.view.buffer.slice(0, bytesWritten);
  const blob = new Blob([buffer], { type: mimeType });
  FileSaver.saveAs(blob, fileName);
};
