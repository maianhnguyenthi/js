var BoardsEditController = FormController.extend({
	elements: {
		'input[name=title]': 'inp_title'
	},

	events: {
		'click a[rel=delete]': 'delete_board',
	},

	modal: null,
	model: null,
	formclass: 'boards-edit',

	init: function()
	{
		if(!this.model) this.model = new Board();
		var space = turtl.profile.current_space();

		var perm_map = {
			add: Permissions.permissions.add_board,
			edit: Permissions.permissions.edit_board,
		};
		if(!permcheck(space, perm_map[this.model.is_new() ? 'add' : 'edit'])) return this.release();

		var title = this.model.is_new() ?
			i18next.t('Create board in {{space}}', {space: space.get('title')}) :
			i18next.t('Edit board');
		this.action = this.model.is_new() ?
			i18next.t('Create') :
			i18next.t('Edit');

		this.modal = new TurtlModal({
			show_header: true,
			title: title,
		});

		this.parent();
		this.render();

		var close = this.modal.close.bind(this.modal);
		this.modal.open(this.el);
		this.with_bind(this.modal, 'close', this.release.bind(this));
		this.bind(['cancel', 'close'], close);
	},

	render: function()
	{
		var space = turtl.profile.current_space();
		var show_delete = !this.model.is_new()
			&& space.can_i(Permissions.permissions.delete_board);
		this.html(view.render('boards/edit', {
			action: this.action,
			board: this.model.toJSON(),
			show_delete: show_delete,
		}));
		if(this.model.is_new())
		{
			this.inp_title.focus.delay(300, this.inp_title);
		}
	},

	submit: function(e)
	{
		if(e) e.stop();
		var title = this.inp_title.get('value').toString().trim();

		var errors = [];
		if(!title) errors.push(i18next.t('Please give your board a title'));

		if(errors.length)
		{
			barfr.barf(errors.join('<br>'));
			return;
		}

		this.model.create_or_ensure_key({silent: true});
		var clone = this.model.clone();
		clone.set({title: title});
		clone.save()
			.bind(this)
			.then(function() {
				this.model.set(clone.toJSON());

				// add the board to our main board list
				turtl.profile.get('boards').upsert(this.model);

				this.trigger('close');
				var space = turtl.profile.current_space();
				turtl.route('/spaces/'+space.id()+'/boards/'+this.model.id()+'/notes');
			})
			.catch(function(err) {
				turtl.events.trigger('ui-error', i18next.t('There was a problem updating that board'), err);
				log.error('board: edit: ', this.model.id(), derr(err));
			});
	},

	delete_board: function(e)
	{
		if(e) e.stop();
		var space = turtl.profile.current_space();
		if(!permcheck(space, Permissions.permissions.delete_board)) return;
		if(!confirm(i18next.t('Really delete this board and all of its notes?'))) return;
		var board_id = this.model.id();
		this.model.destroy({delete_notes: true})
			.bind(this)
			.then(function() {
				if(turtl.param_router.get().board_id == board_id) {
					turtl.route('/spaces/'+space.id()+'/notes');
				}
				this.trigger('close');
			})
			.catch(function(err) {
				log.error('board: delete: ', derr(err));
				barfr.barf(i18next.t('There was a problem deleting your board: {{message}}', {message: err.message}));
			});
	},
});

