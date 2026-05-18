const mongoose = require('mongoose');
const AppError = require('./AppError');

function ensureObjectId(value, label = 'id') {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
}

module.exports = ensureObjectId;
