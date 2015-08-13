THREE = require "node.three.js"
Promise = require "bluebird"
fs = require "fs"

{SceneSerializer} = require "../../../scene-serializer"

copyVector = (to, from) ->
	to.x = from.x
	to.y = from.y
	to.z = from.z

putBackTransformations = (scene, objectMapping) ->
	for trigger in scene.Triggers.triggers
		obj = objectMapping.trigger[trigger.idx]
		copyVector trigger.vv, obj.position

writeScene = (scene, objectMapping) ->
	putBackTransformations scene, objectMapping
	serializer = new SceneSerializer()
	serializer.serialize scene

exports.writeScene = (fileName, data, objectMapping, callback) ->
	fs.writeFile fileName, writeScene(data, objectMapping), (err) ->
		callback err

exports.writeSceneAsync = Promise.promisify exports.writeScene