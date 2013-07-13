var MessagesController = Composer.Controller.extend({
	inject: tagit.main_container_selector,

	elements: {
		'.sidebar .conversations': 'conversations',
		'div.message': 'message_pane'
	},

	events: {
		'click .button.compose': 'open_compose',
		'click div.button.persona.add': 'open_personas'
	},

	// holds the messages collection
	messages: null,

	conversations_controller: null,
	view_controller: null,

	init: function()
	{
		this.messages = tagit.messages;

		this.render();

		tagit.controllers.HeaderBar.select_app(null, 'messages');

		this.conversations_controller = new ConversationListController({
			inject: this.conversations,
			collection: this.messages.conversations
		});

		this.view_controller = new ConversationViewController({
			inject: this.message_pane,
			model: null
		});

		this.messages.conversations.bind('change:selected', this.show_conversation.bind(this), 'conversations:select:'+this.cid());
	},

	release: function()
	{
		if(this.conversations_controller) this.conversations_controller.release();
		if(this.view_controller) this.view_controller.release();
		this.messages.conversations.unbind('change:selected', 'conversations:select:'+this.cid());
		return this.parent.apply(this, arguments);
	},

	render: function()
	{
		var content = Template.render('messages/index', {
			messages: toJSON(this.messages)
		});
		this.html(content);
	},

	open_compose: function(e)
	{
		if(e) e.stop();
		new MessageComposeController();
	},

	open_personas: function(e)
	{
		if(e) e.stop();
		new PersonaEditController({
			collection: tagit.user.get('personas')
		});
	},

	show_conversation: function(model)
	{
		this.messages.conversations.each(function(c) {
			if(c.id() == model.id()) return;
			c.set({selected: false}, {silent: 'change:selected'});
		});
		if(this.view_controller) this.view_controller.release();
		this.view_controller	=	new ConversationViewController({
			inject: this.message_pane,
			model: model
		});
	}
});
