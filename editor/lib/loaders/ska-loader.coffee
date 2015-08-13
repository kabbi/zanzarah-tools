THREE = require "node.three.js"
Promise = require "bluebird"
path = require "path"
fs = require "fs"
{AnimationParser} = require "../../../ska-parser"
utils = require "../utils"

parseAnimation = (data, filePath) ->
	animation =
		name: path.basename filePath
		length: data.duration
		hierarchy: []
	hierarchy = animation.hierarchy

	tempQuat = new THREE.Quaternion()
	parentToBoneMapping = {}
	for p, idx in data.points
		if p.parent >= data.pointCount
			hierarchy.push
				parent: -1
				keys: []
			parentToBoneMapping[idx] = idx
			continue
		# Find out bone number
		bone = parentToBoneMapping[idx] = parentToBoneMapping[p.parent]
		# And persist the data
		tempQuat.copy p.rot
		tempQuat.inverse()
		hierarchy[bone].keys.push
			time: p.time
			pos: [p.pos.x, p.pos.y, p.pos.z]
			rot: tempQuat.clone()
		# Populate scale for first keyframe
		if hierarchy[bone].keys.length is 1
			hierarchy[bone].keys[0].scl = [1, 1, 1]
	animation

exports.loadAnimation = (filePath, callback) ->
	# Enhance buffer size a bit
	file = fs.createReadStream filePath,
		highWaterMark: 1e6
	parser = new AnimationParser()
	parser.on "data", (data) ->
		callback null, parseAnimation data
	file.pipe parser

exports.loadAnimationAsync = Promise.promisify exports.loadAnimation