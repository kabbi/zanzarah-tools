ZanzarahComponent = requireComponent "zanzarah.base"
logger = requireLogger module

module.exports = class Trigger extends ZanzarahComponent
	attach: (entity) ->
		super entity
		
	dataOnly: true