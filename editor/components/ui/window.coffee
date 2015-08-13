Component = requireComponent "base"
logger = requireLogger module

module.exports = class AtbWindow extends Component
	attach: (entity) ->
		super entity
		# Default value
		entity.closeable ?= true
		# Display right away if needed
		if entity.createByDefault
			entity._createWindow()
			entity.ATB.Define " #{entity.barName} iconified=true "

	detach: (entity) ->
		if entity.bar
			entity.ATB.Define ""
		entity.bar = null
		
	onClick: (event) ->
		return unless event.button is 1
		@openWindow()

	openWindow: ->
		if @bar
			@ATB.Define " #{@barName} visible=true "
			@ATB.Define " #{@barName} iconified=false "
		else
			@_createWindow()

	closeWindow: ->
		@ATB.Define " #{@barName} visible=false "

	_createWindow: ->
		# Bar name is a shortcut made from window name
		@barName = Math.random().toString()[2..]
		@bar = @ATB.NewBar @barName
		@ATB.Define " #{@barName} label='#{@windowName}' "
		@_populateProperties()

	_populateProperties: ->
		for prop in @windowEntries or []
			switch prop.control
				when "var"
					if prop.property then do (prop) ->
						[ref, key] = prop.property
						prop.cbs =
							getter: -> ref[key]
							setter: (x) -> ref[key] = x
					@bar.AddVar prop.name, prop.type, prop.cbs, prop.def
				when "button"
					@bar.AddButton prop.name, prop.cb, prop.def
				when "separator"
					@bar.AddSeparator prop.name
				when "define"
					@ATB.Define " #{@barName}/#{prop.name} #{prop.def} "
		if @closeable
			@bar.AddSeparator()
			@bar.AddButton "closeButton", =>
				@closeWindow()
			, " label='[Close]' help='Close window'"
