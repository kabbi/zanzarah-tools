World = requireEntity "world.base"
logger = requireLogger module

module.exports = class TestWorld extends World
	constructor: (client) ->
		super client
		logger.info "Constructing test world #{@uid}"

