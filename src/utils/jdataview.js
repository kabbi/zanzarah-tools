const jDataView = require('jdataview');

exports.expand = (dataView, lengthDelta) => {
  const newDataView = new jDataView(dataView.length + lengthDelta);
  newDataView.setBytes(0, dataView);
  newDataView.seek(dataView.length);
  return newDataView;
};
