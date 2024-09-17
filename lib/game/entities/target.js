ig.module(
	'game.entities.target'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityTarget = ig.Entity.extend({
	size: {x: 8, y: 8},	
	className:'target',

	gravityFactor:0,
    zIndex:-10,
	
	type: ig.Entity.TYPE.B,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
			
	origSprite: 'media/target.png',
	reflectsLight: false,

	val:1,
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
	},
	allAnim: function()
    {
		this.addAnim( 'idle', 1, [this.val-1] );
    },
    update: function(){
    	this.currentAnim = this.anims.idle;
        this.parent();
    }
});

});