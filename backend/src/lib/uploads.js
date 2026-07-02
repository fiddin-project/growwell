const path = require('path')

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

function getUploadRoot() {
  return path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads')
}

function getEducationUploadDir() {
  return path.join(getUploadRoot(), 'edukasi')
}

module.exports = { MAX_UPLOAD_SIZE, getUploadRoot, getEducationUploadDir }
