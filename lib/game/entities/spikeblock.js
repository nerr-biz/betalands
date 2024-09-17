ig.module(
	'game.entities.spikeblock'
)
.requires(
	'game.entities.mover'
)
.defines(function(){
	
EntitySpikeblock = EntityMover.extend({
	className: 'spikeblock',
	size: {x: 15, y: 15},
	friction: {x: 200, y: 0},
	origSprite: 'media/spikeblock.png',
	//animSheet: new ig.AnimationSheet( 'media/spikeblock.png', 16, 16 ),
	reflectsLight:true,	
	gravityFactor:1,
	collides: ig.Entity.COLLIDES.LITE,
	val:1,
	zIndex: -1,
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
	},
	allAnim: function()
	{
		this.addAnim( 'idle', 1, [0] );
	},
	update: function() {
		this.currentAnim = this.anims.idle;
		this.parent();
	},
	check: function( other ) {
		if(other instanceof EntityPlayer)
		{
			if(ig.game.inLevel)
			{
				other.respawn();
			}
		}
		if( other instanceof EntityGoomba ) {
            // resolve collision between player (this) and (other)
            ig.Entity.solveCollision( this, other );
        }
		this.parent(other);
	}
});

});