ig.module(
	'game.entities.playerremote'
)
.requires(
	'game.entities.playerbase'
)
.defines(function(){

	EntityPlayerremote = EntityPlayerbase.extend({

		//type: ig.Entity.TYPE.B, //enemy
		//checkAgainst: ig.Entity.TYPE.NONE
		
	});

});