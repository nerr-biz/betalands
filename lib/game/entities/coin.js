ig.module(
	'game.entities.coin'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityCoin = ig.Entity.extend({
	size: {x: 8, y: 8},	

	gravityFactor:0,
    zIndex:-10,
	
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.NEVER,
			
	origSprite: 'media/coin.png',
	reflectsLight: true,

	sound: new ig.Sound('media/sounds/coin.ogg'),
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
	},
	allAnim: function()
	{
		this.addAnim( 'idle', 1, [0] );
	},
    update: function(){
    	this.currentAnim = this.anims.idle;
        this.parent();
    },
	check: function( other ) 
	{
		if( other instanceof EntityPlayer) {
			ig.game.levelCoins++;
			this.kill();
			this.sound.play();
		}
	}
});

});