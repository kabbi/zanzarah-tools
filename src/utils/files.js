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
