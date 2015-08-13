uuid = require "node-uuid"
logger = requireLogger module

module.exports = class Entity
	constructor: (@client) ->
		@id = uuid.v4()
		@components = {}
		@client.prepareEntity @

	destroy: ->
		for name of @components
			component = requireComponent name
			component = new component @client
			component.detach @
		@client.removeEntity @

	hasComponent: (name) ->
		!! @components[name]

	addComponent: (name, data) ->
		component = requireComponent name
		component = new component @client, data
		@components[name] = true
		component.attach @

	removeComponent: (name) ->
		component.detach @
		delete @components[name]
		