ig.module(
	'game.entities.sign'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntitySign = ig.Entity.extend({
	size: {x: 16, y: 24},
	gravityFactor:0,

	zIndex: -1,
	message:'',
	hasRead:false,
	hasTouched:false,

	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.PASSIVE,

	origSprite: 'media/sign.png',
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
        
        if(other instanceof EntityPlayer)
        {
	        if( ig.input.pressed('action') ) {
	        	ig.game.inMenu = true;
	        	ig.game.billboardMessage = this.message;
	        	this.hasRead = true;
				//other.vel.y = 0;
	        	//console.log(this.message);
		    	//$('#gameDiv').show().find('.modal-body').html(this.message);
	        }
	        this.hasTouched = true;
	    }
    },
    });	
});