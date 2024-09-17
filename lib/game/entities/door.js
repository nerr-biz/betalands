ig.module(
	'game.entities.door'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityDoor = ig.Entity.extend({
	size: {x: 16, y: 32},
	gravityFactor:0,
    animImage:'media/door.png',
    //origSprite:'media/door.png',
    title:'',

	zIndex: -1,	
	level:'',
	
	doortype:1,
	val:1,

    _wmScalable: true,
    _wmDrawBox: true,
    _wmBoxColor: 'rgba(196, 255, 0, 0.7)',
	
	// The fraction of force with which this entity bounces back in collisions
	//bounciness: 0.2, 
	
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.NEVER,
			
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		if(this.direction == 'up' || this.direction == 'both' || this.direction == 'action'){
			this.origSprite = this.currSprite = this.animImage;
			this.reflectsLight = true;
        	this.animSheet = new ig.AnimationSheet( this.animImage, this.size.x, this.size.y );
        	this.allAnim();
	    }
	},
    allAnim: function()
    {
	    if(this.direction == 'action')
	    	this.addAnim( 'idle', 1, [4] );	
	    else if(this.doortype == 2)
	    {
	    	this.addAnim( 'idle', 1, [1] );	
	    }
		else if(this.doortype == 3)
	    {
	    	this.addAnim( 'idle', 1, [2] );	
	    }
    	else if(this.target && this.target[1].indexOf('|') > -1)
        {
        	this.addAnim( 'idle', 1, [0] );
        }
        else
	        this.addAnim( 'idle', 1, [3] );
    },
    update: function(){
    	this.currentAnim = this.anims.idle;
        this.parent();
    },
    isOwner: function(username){
    	if(!this.name)
    		return false;
		var doorname = this.name.split('-')[1];
		if(doorname == username )
			return true;
		else if(doorname.split('*')[0] == username )
			return true;
    },
    
	draw: function() {
		var cursor;
		if(ig.game.cursorOn && ig.game.currentLevel.indexOf('|') == -1 && (!ig.game.inLevel || ig.game.levelOwner == playerinfo.username) && !ig.game.inArena)
        {		
        	var cursor = ig.game.getEntitiesByType( EntityCursor )[0];
        	if(cursor && cursor.animImage && cursor.animImage == 'media/door.png')
        	{
                var ctx = ig.system.context;
                var s = ig.system.scale;
                var x = (this.pos.x - 16*3) * s - ig.game.screen.x * s;
                var y = (this.pos.y -16*3)  * s - ig.game.screen.y * s;
                var sizeX = this.size.x * 7 * s;
                var sizeY = this.size.y * 3 * s;
                ctx.save();
                ctx.strokeStyle = "rgb(255,0,0)";
                ctx.fillStyle = "rgba(255,0,0,.2)";
                ctx.fillRect(x,y,sizeX,sizeY);
            }
        }
        if((ig.game.selectedItemName == 'block' || ig.game.selectedItemName == 'eraser') && ig.game.currentLevel.indexOf('|') == -1 && (!ig.game.inLevel || ig.game.levelOwner == playerinfo.username) && !ig.game.inArena)
        {
        	if(this.isOwner(playerinfo.username))
        	{
	            var ctx = ig.system.context;
	            var s = ig.system.scale;
	            var x = (this.pos.x - 16*3) * s - ig.game.screen.x * s;
	            var y = (this.pos.y -16*3)  * s - ig.game.screen.y * s;
	            var sizeX = this.size.x * 7 * s;
	            var sizeY = this.size.y * 3 * s;
	            ctx.save();
	            ctx.beginPath();
	            ctx.strokeStyle = "rgb(0,255,0)";
	            //ctx.fillStyle = "rgba(0,255,0,0)";
	            ctx.rect(x,y,sizeX,sizeY);
	            ctx.lineWidth = 2;
	            ctx.stroke();
	        }
        }
        this.parent();

        if(ig.game.cursorOn && cursor && cursor.animImage == 'media/door.png')
            ctx.restore();
/*
		var ctx = ig.system.context;
		var s = ig.system.scale;
		var x = (this.pos.x - 16*3) * s - ig.game.screen.x * s;
		var y = (this.pos.y -16*3)  * s - ig.game.screen.y * s;
		var sizeX = this.size.x * 7 * s;
		var sizeY = this.size.y * 3 * s;
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.fillRect(x,y,sizeX,sizeY);
		this.parent();
		ctx.restore();
*/
	},

    check: function( other ) {

    	if(ig.game.inEditor && ig.game.shifting)
    		return;
        
        if(other instanceof EntityPlayer)
        {
        	var pressedUp = ig.input.pressed('jump') || other.autoMove.y == -1;
		if( ( ( ( this.direction == 'up' || this.direction == 'both') && pressedUp )
			 || ( this.direction == 'down' && ig.input.pressed('down') ) || this.direction == 'touch' )) {

			var split = this.target[1].split("-");
			var level = split[0];
			if(level != ig.game.currentLevel)
			{
				if(this.size.x > 16)
					ig.game.enterLevelPos = other.pos.x;
				if(this.title && this.title.length)
					ig.game.levelTitle = this.title;
				else
					ig.game.levelTitle = '';
				socket.emit('changelevel', level, this.target[1]);
			}
			else
			{
				var door = ig.game.getEntityByName( this.target[1] );
				if(door){
					other.pos.x = door.pos.x;
					other.pos.y = door.pos.y;
					other.vel.y = 0;
					ig.game.screen.y = door.pos.y - ig.system.height+(other.size.y);
				}
				if(ig.game.currentLevel == 'LevelArena')
					ig.game.deaths++;
				if(ig.game.currentLevel == 'LevelArena' && ig.game.deaths >= 3)
				{
					socket.emit('changelevel', (DefaultRoom || 'LevelTest'), 'gameover');
				}
				else
					ig.game.socketEmit('playerupdate',{pos:other.pos, vel:{x:0,y:0}, asleep:false, gun:other.getGunType()},ig.game.currentLevel);
			}
		}
		else if( this.direction == 'both' && ig.input.pressed('down')) {

			var split = this.target[2].split("-");
			var level = split[0];
			if(level != ig.game.currentLevel)
				socket.emit('changelevel', level, this.target[2]);
			else
			{
				var door = ig.game.getEntityByName( this.target[2] );
				if(door){
					other.pos.x = door.pos.x;
					other.pos.y = door.pos.y;
					other.vel.y = 0;
					ig.game.screen.y = door.pos.y - ig.system.height+(other.size.y);
				}
				ig.game.socketEmit('playerupdate',{pos:other.pos, vel:{x:0,y:0}, asleep:false, gun:other.getGunType()},ig.game.currentLevel);
			}
		}
		else if( this.direction == 'action' && ig.input.pressed('action')) {

			ig.game.inMenuTravel = this;
			var message = 'ROAD CROSSING: ';
			if(this.target[1])
			{
				var split = this.target[1].split("-");
				var level = split[0].replace('Level', '');
				message += 'NORTH [up] = '+level;
			}
			if(this.target[2])
			{
				var split = this.target[2].split("-");
				var level = split[0].replace('Level', '');
				message += 'EAST [right] = '+level;
			}
			if(this.target[3])
			{
				var split = this.target[3].split("-");
				var level = split[0].replace('Level', '');
				message += 'SOUTH [down] = '+level;
			}
			if(this.target[4])
			{
				var split = this.target[4].split("-");
				var level = split[0].replace('Level', '');
				message += 'WEST [left] = '+level;
			}
			ig.game.billboardMessage = message;
		}
		}//end if player

    }
    });	
});