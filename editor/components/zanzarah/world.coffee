ZanzarahComponent = requireComponent "zanzarah.base"
logger = requireLogger module

module.exports = class World extends ZanzarahComponent
	attach: (entity) ->
		super entity
		
	dataOnly: true