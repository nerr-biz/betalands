ig.module(
	'game.entities.store'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityStore = ig.Entity.extend({
	size: {x: 16, y: 16},
	gravityFactor:0,

	zIndex: -1,
	target:'',
	level:'',

	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.PASSIVE,

	animSheet: new ig.AnimationSheet( 'media/oldman.png', 16, 16 ),	
	
	init: function( x, y, settings ) {
		this.addAnim( 'idle', 1, [0] );
		this.parent( x, y, settings );
	},
    update: function(){
        this.parent();
    },
    check: function( other ) {
        
        if( ig.input.pressed('jump') && other instanceof EntityPlayer) {
        	ig.game.inMenu = true;
	    	$('#gameDiv').show();
        }
    }
    });	
});