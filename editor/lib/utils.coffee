path = require "path"

texturePath = "TEXTURES"

rootZanzarahPath = exports.rootZanzarahPath = "../../"

resourcesPath = exports.resourcesPath = "../../uncompressed/"

exports.texturePathByModelPath = (modelPath) ->
	modelDir = path.dirname modelPath
	modelSubdir = path.basename modelDir
	rootPath = path.normalize "#{modelDir}/../../"
	basePath = path.basename path.dirname modelPath
	path.join rootPath, "TEXTURES", modelSubdir

exports.texturePathByWorldPath = (modelPath) ->
	modelDir = path.dirname modelPath
	modelSubdir = path.basename modelDir
	rootPath = path.normalize "#{modelDir}/../"
	basePath = path.basename path.dirname modelPath
	path.join rootPath, "TEXTURES", modelSubdir