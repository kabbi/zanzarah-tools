logger = requireLogger module

componentKeywords = ["attach", "detach", "constructor", "toString", "client", "data", "schema"]

module.exports = class Component
	constructor: (@client, data) ->
		@data = data or {} # To allow code-only components

	attach: (entity) ->
		for key, value of @data
			entity[key] = value
		for key, value of @ when key not in componentKeywords
			# TODO: check if we replace something...
			entity[key] = value

	detach: (entity) ->
		# Do nothing