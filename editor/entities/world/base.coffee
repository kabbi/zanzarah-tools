path = require "path"
{EventEmitter} = require "events"
Entity = requireEntity "base"
logger = requireLogger module

module.exports = class World extends Entity
	constructor: (client) ->
		super client
		# TODO: implement something