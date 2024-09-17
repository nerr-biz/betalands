ig.module(
	'game.entities.gift2013'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityGift2013 = ig.Entity.extend({
	size: {x: 16, y: 16},
	gravityFactor:0,

	zIndex: -1,
	message:'You got Triptron! Its the ultimate rare collectible. Plus, it features realistic Tippi action!',

	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.PASSIVE,

	origSprite: 'media/gift.png',
	reflectsLight: true,
	
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
    check: function( other ) {
        
        if(other instanceof EntityPlayer && ig.game.levelOwner == playerinfo.username)
        {
	        if( ig.input.pressed('action') ) {
	        	ig.game.inMenu = true;
	        	ig.game.billboardMessage = this.message;
	        	ig.game.deleteitem('gift2013', 1, this.pos.x, this.pos.y);
	        	ig.game.socketEmit('giveitem', playerinfo.username, 'tiptron', 1, this.pos.x, this.pos.y, {});
	        	$('.equip.tiptron').show();
	        }
	    }
    },
    });	
});