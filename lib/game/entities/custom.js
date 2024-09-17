ig.module(
	'game.entities.custom'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntityCustom = ig.Entity.extend({
	size: {x: 16, y: 16},	

	//gravityFactor
	//passThroughWall
	//customSettings:{},
	/*
	visibile
	health
	solid
	movement: up,down,left,right,horizontal, vertical, random, towards player
	onSpawn: start, stop

	respond tos:
	-spawn: 
	-[player, entity]?
	-player touch:
	-player pounce:
	-player press: up,down,action
	-player proximity: [aligned?]: up,down,left,right, forward, behind
	-player proximity-leave: 
	-player seen: side
	-projectile:
	-cliff:
	-walls:
	-timer:
	-death:
	-targets
	
		results:
		-kill
		-reduce health
		-die
		-start, reverse, stop
		-enable,disable targets
		-swap bits color1 > color2
		-bounce
		-spawn entity
		-give item

	animations
		idle 1,2 speed
		move 3,4,5
		action ground 6
		action air 7

	*/
	respondTo:[],
	config:{},

	gravityFactor:0,
    zIndex:-10,
	
	type: ig.Entity.TYPE.NONE,
	//checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.NEVER,
			
	origSprite: 'media/custom16x16.png',
	animSheet: new ig.AnimationSheet( 'media/custom16x16.png', 16, 16 ),
	reflectsLight: false,
	frames:'1',
	itemid:'',
	equip:'',
	title:'',
	
	init: function( x, y, settings ) {
		if(settings)
		{
			if(settings['name'])
			{
				settings['title'] = settings['name'];
			}
			settings['name'] = null;
			//if(settings['itemid'])
			//	settings['name'] = settings['itemid'];

			if(settings['respondTo'])
			for(var i=0;i<settings['respondTo'].length;i++)
			{
				var resp = settings['respondTo'][i];
				if(resp['action'] == 'player-press')
				{
					settings['checkAgainst'] = ig.Entity.TYPE.A;
				}
			}
		}
		this.parent( x, y, settings );
	},
	allAnim: function()
	{
		if(this.frames == '2')
			this.addAnim( 'idle', 1, [0,1] );
		else
			this.addAnim( 'idle', 1, [0] );
	},
    update: function(){
    	this.currentAnim = this.anims.idle;
        this.parent();
    },
	check: function( other ) 
	{
		/*
		if( other instanceof EntityPlayer) {
			ig.game.levelCoins++;
			this.kill();
			this.sound.play();
		}*/
        if(other instanceof EntityPlayer)
        {
        	var pressed = false;
        	if(ig.input.pressed('jump') || other.autoMove.y == -1)
        		pressed = 'up';
        	if(ig.input.pressed('down'))
        		pressed = 'down';
        	if(ig.input.pressed('action'))
        		pressed = 'action';
        	var pressedresult = this.actionResult('player-press', pressed);
        	if(this.actionResult('player-touch', null))
	        	pressedresult = this.actionResult('player-touch', null);

        	if(pressedresult=='doorway')
    		{
    			var level = this.config['roomid'];
				if(level && level != ig.game.currentLevel)
				{
					if(level == 'back'){
						if(ig.game.lastLevel){
							socket.emit('changelevel', ig.game.lastLevel);
						}
					}
					else
						socket.emit('changelevel', level);
				}
			}
			if(pressedresult == 'message')
			{
				ig.game.billboardMessage = this.config['message'];
			}
		}//end if player


	},
	actionResult: function(action, val)
	{
		for(var i=0;i<this.respondTo.length;i++)
		{
			var resp = this.respondTo[i];
			if(resp['action'] == action && (val === null || resp['val'] == val))
			{
				return resp['result'];
			}
		}
	}
});

});