ig.module(
	'game.entities.playerbase'
)
.requires(
	'impact.entity',
	'impact.timer',
	'game.entities.gun'
)
.defines(function(){

EntityPlayerbase = ig.Entity.extend({

	animSheet:null,
	origSprite: 'media/megaman.png',
	currSprite: '',
	aFrameX:26,
	aFrameY:30,
	reflectsLight:true,
	gunType:'',
	
	// The players (collision) size is a bit smaller than the animation
	// frames, so we have to move the collision box a bit (offset)
	size: {x: 18, y:28},
	offset: {x: 4, y: 2},
	
	origMaxVel:{x: 100, y: 204},
	maxVel: {x: 100, y: 204},
	friction: {x: 600, y: 0},
	moveTo:{x:0,y:0},

	type: ig.Entity.TYPE.A, // Player friendly group
	checkAgainst: ig.Entity.TYPE.BOTH,	
	collides: ig.Entity.COLLIDES.LITE,	
	
	// These are our own properties. They are not defined in the base
	// ig.Entity class. We just use them internally for the Player
	flip: false,
	headflip:false,
	accelGround: 400,
	accelAir: 200,
	jump: 204,
	hitVel:200,
	jumps:0,
	health: 10,
	user_id: '',
	head: false,
	gun:false,
	speech: '',
	name: '???',
	asleep: false,
	pressed:{right:false, right:false, up:false, action:false},
	pressing:{right:false, right:false, up:false, action:false},
	usedoor:false,
	onPlatform:false,
	wasOnPlatform:false,

	punching:false,
	swimming:false,
	startpunch:false,
	hit:0,
	remotepos: {x:0,y:0},
	damage:0,
	spectator:false,
	onwall:0,
	isDead:false,
	equipped:[],
	equippedItems:{},
	zIndex:1,
	displayName:null,


	init: function( x, y, settings ) {

		if( !ig.global.wm ) { // not in wm?
			var playername = this instanceof EntityPlayer ? getUserInfo().username : settings['name'];
				this.defaultSprite(playername);
		}

		if(settings && settings['image'])
		{
			this.origSprite = settings['image'];
			this.aFrameX = 32;
			this.aFrameY = 32;
			this.offset = {x: 7, y: 4};
		}

		//if(settings && settings.anim)
		//{this.animSheet = new ig.AnimationSheet( settings.anim, 26, 32 )}

		this.parent( x, y, settings );
		this.talktimer = new ig.Timer();
		this.sleepTimer = new ig.Timer(60);


		for(var i=0;i<this.equipped.length;i++)
		{
			this.equipItem(this.equipped[i]);
		}

		if(settings && !ig.global.wm)
		{
			if(settings.headimage)
			{
				settings.hidehead = (settings.headimage == 'nohead');
				this.head = ig.game.spawnEntity( EntityPlayerhead, x, y, settings );
				this.head.zIndex = this.zIndex + 1;
				this.headflip = false;
			}
			else if(settings.anim)
			{
				settings.hidehead = this.shouldhidehead(playername);
				this.head = ig.game.spawnEntity( EntityPlayerhead, x, y, settings );
				this.head.zIndex = this.zIndex + 1;
			}

			this.gun = ig.game.spawnEntity( EntityGun, x, y, {owner:this.name, local:(this instanceof EntityPlayer)} );
			this.gun.zIndex = this.zIndex + 1;

			ig.game.sortEntitiesDeferred();
		}
	},
	allAnim: function()
	{
		// Add the animations
		this.addAnim( 'idle', 1, [0] );
		this.addAnim( 'run', 0.08, [1,2,3,2] );
		this.addAnim( 'jump', 1, [4] );
		this.addAnim( 'fall', 0.4, [4] );
		this.addAnim( 'punchg', 0.5, [6]);
		this.addAnim( 'punchj', 0.5, [5]);

	},
	setColor: function(hex)
	{
		var newsprite = this.origSprite + hex;
		if(this.currSprite == newsprite)
			return;
		this.animSheet = new ig.AnimationSheet( newsprite, 26, 30 );
		this.allAnim();
		this.currSprite = newsprite;
	},
	shouldhidehead: function(name)
	{
		switch(name)
		{
			case 'Nastasia':
			case 'Popple':
			case 'Fortran':
			case 'Yena':
			case 'Kerosena':
			case 'Penguin Porn♠':
			case 'Penguin PornAce':
			case 'Ignorant':
			case 'Lord Crump':
				return true;
		}
		return false;
	},
	defaultSprite: function(playername)
	{
		switch(playername)
		{
			case 'Viddd':
			case 'Flar3':
			case 'JacobDaGun':
				this.headflip = true;
			case 'Slim':
			case 'Vacation Claus':
			case 'Nastasia':
			case 'Ph1r3':
			case 'Shadeston':
			case 'Alpha_StevO':
			case 'Doopliss':
			case 'Popple':
			case 'Kerosena':
			case 'Gold Prognosticus':
			case 'Fortran':
			case 'Yena':
			case 'Penguin Porn♠':
			case 'Penguin PornAce':
			case 'Ignorant':
			case 'Lord Crump':
			case 'JacobDaGun':
				this.origSprite = 'media/player/'+playername+'.png';
				break;
			default:
				this.origSprite = 'media/megaman.png';
				break;
		}
	},

	initplayer: function(anim, headimage){
		if(this.head)
		{
			this.head.updateImage(headimage, this.shouldhidehead(this.name));
			return;
		}
		if(headimage)
		{
			if(headimage == 'nohead')
				this.head = ig.game.spawnEntity( EntityPlayerhead, this.pos.x, this.pos.y, {'anim':anim, 'hidehead':true} );
			else
			{
				this.headflip = false;
				this.head = ig.game.spawnEntity( EntityPlayerhead, this.pos.x, this.pos.y, {'anim':anim, 'hidehead':false, 'headimage':headimage} );
			}
		}
		else
		{
			this.head = ig.game.spawnEntity( EntityPlayerhead, this.pos.x, this.pos.y, {'anim':anim, 'hidehead':this.shouldhidehead(this.name)} );
		}
		this.head.zIndex = this.zIndex + 1;
/*
		if(equip && this.equipped == [])
		{
			for(var i=0;i<this.equip.length;i++)
			{
				this.equipItem(this.equip[i]);
			}
		}
*/
		//this.gun = ig.game.spawnEntity( EntityGun, this.pos.x, this.pos.y, {owner:this.name, local:(this instanceof EntityPlayer)} );
		//this.gun.zIndex = this.zIndex + 1;

		//ig.game.sortEntitiesDeferred();		
	},
	setGun: function(gunClass){
		if(this.gun)
			this.gun.kill();
		if(gunClass)
		{
			this.gun = ig.game.spawnEntity( gunClass, this.pos.x, this.pos.y, {owner:this.name, local:(this instanceof EntityPlayer)} );
			this.gun.zIndex = this.zIndex + 1;
		}
		else
		{
			this.gun = null;
		}
	},
	equipItem: function(name){
		if(name == 'defaultbody')
		{
			var i = this.equipped.length;
			while(i--)
			{
				var item = playerinfo.items[this.equipped[i]];
				if(item)
					if(item['settings']['equip'] && item['settings']['equip'] == 'body')
					{
						this.equipped.splice(i, 1);
					}
			}

			var playername = this instanceof EntityPlayer ? getUserInfo().username : this.name;
			this.defaultSprite(playername);
			this.aFrameX = 26;
			this.aFrameY = 30;
			this.offset = {x: 4, y: 2};
			this.animSheet = new ig.AnimationSheet( this.origSprite, this.aFrameX, this.aFrameY );
			this.allAnim();
			this.currSprite = this.origSprite;
			this.displayName = null;
			if(playerinfo.username == this.name)
				playerinfo.equipped = this.equipped;
			return;
		}
		if(name == 'defaulthead')
		{
			var i = this.equipped.length;
			while(i--)
			{
				if(this.equipped[i] == 'nohead')
					this.equipped.splice(i, 1);
				else{
					var item = playerinfo.items[this.equipped[i]];
					if(item)
						if(item['settings']['equip'] && item['settings']['equip'] == 'head')
						{
							this.equipped.splice(i, 1);
						}
				}
			}

			this.head.updateImage(null, this.shouldhidehead(this.name));
			if(playerinfo.username == this.name)
				playerinfo.equipped = this.equipped;
			return;
		}
		if(name == 'nohead')
		{
			var i = this.equipped.length;
			while(i--)
			{
				if(this.equipped[i] == 'defaulthead')
					this.equipped.splice(i, 1);
				else{
					var item = playerinfo.items[this.equipped[i]];
					if(item)
						if(item['settings']['equip'] && item['settings']['equip'] == 'head')
						{
							this.equipped.splice(i, 1);
						}
				}
			}
			this.hidehead = true;
			if(this.head)
				this.head.hidehead = true;
			this.equipped.push(name);
			if(playerinfo.username == this.name)
				playerinfo.equipped = this.equipped;

			return;
		}
		var i = this.equipped.length;
		while(i--)
		{
			if(this.equipped[i] == name)
			{
				if(this.equippedItems[name])
				{
					this.equipped.splice(i, 1);
					this.equippedItems[name].kill();
					delete(this.equippedItems[name]);
				}
				if(playerinfo.username == this.name)
					$('.equips > .equip.'+name).removeClass('selected');
				return;
			}
		}
		if(name == 'tiptron')
		{
			this.equipped.push('tiptron');
			var item = ig.game.spawnEntity( EntityTiptron, this.pos.x, this.pos.y, {} );
			item.zIndex = this.zIndex + 1;
			this.equippedItems['tiptron'] = item;
			if(playerinfo.username == this.name)
			{
				playerinfo.equipped = this.equipped;
				$('.equips > .equip.'+name).addClass('selected');
			}
		}
		else
		{
			var item = playerinfo.items[name];
			if(!item)
				item = itemsInfo[name];
			if(!item)
			{
				ig.game.socketEmit('fetchitem', name);
				return;
			}

			if(item['settings']['equip'])
			{
				if(item['settings']['equip'] == 'body')
				{

					var i = this.equipped.length;
					while(i--)
					{
						var existingitem = playerinfo.items[this.equipped[i]];
						if(existingitem)
							if(existingitem['settings']['equip'] && existingitem['settings']['equip'] == 'body')
							{
								this.equipped.splice(i, 1);
							}
					}

					var img = item['image'] || 'media/player/default.png';
					this.origSprite = img;
					this.aFrameX = 32;
					this.aFrameY = 32;
					this.offset = {x: 7, y: 4};
					this.animSheet = new ig.AnimationSheet( img, this.aFrameX, this.aFrameY );
					this.allAnim();
					this.currSprite = img;
					this.displayName = item['settings']['name'];
				}
				if(item['settings']['equip'] == 'head')
				{
					var i = this.equipped.length;
					while(i--)
					{
						if(this.equipped[i] == 'defaulthead' || this.equipped[i] == 'nohead')
							this.equipped.splice(i, 1);
						else{
							var existingitem = playerinfo.items[this.equipped[i]];
							if(existingitem)
								if(existingitem['settings']['equip'] && existingitem['settings']['equip'] == 'head')
								{
									this.equipped.splice(i, 1);
								}
						}
					}

					var img = item['image'] || 'media/custom16x16.png';
					this.head.updateImage(img, this.shouldhidehead(this.name));
					this.head.zIndex = this.zIndex + 1;
					this.headflip = false;
					this.hidehead = false;
				}

				this.equipped.push(name);
				if(playerinfo.username == this.name)
					playerinfo.equipped = this.equipped;
			}
		}
	},
	getGunType: function(){
		if(this.gun)
			return this.gun.className;
		else
			return '';
	},
	getGunTypeId: function(){
		if(this.gun) {
			switch (this.gun.className) {
				case 'blaster':
					return 1;
				case 'crackerlauncher':
					return 2;
			}
		}
		return false;
	},
	update: function() {

		if(ig.game.lastWaterMap)
		{
			if(ig.game.lastWaterMap.getTile(this.pos.x,this.pos.y) > 0){
				if(this.vel.y > 0) //falling
					this.maxVel.y = 75;
				else
					this.maxVel.y = this.origMaxVel.y+1;
				if(!this.swimming)
				{
					this.vel.y = -10;
					this.swimming = true;
				}
				this.maxVel.x = 50;
            }
            else
            {
            	this.gravityFactor = 1;
            	this.maxVel.x = this.origMaxVel.x+1;
            	this.maxVel.y = this.origMaxVel.y+1;
            	if(this.swimming)
            	{
            		this.jumps = 0;
            		//this.vel.y = -this.jump;
            	}
            	this.swimming = false;
            }
		}

		if(this.spectator)
			return;

		//bottom limit
		if (!ig.game.inArena && !ig.game.inLevel && this.pos.y > ig.game.mainMap.height * ig.game.mainMap.tilesize - (this.size.y))
		{
			this.pos.y = ig.game.collisionMap.height * ig.game.collisionMap.tilesize - (this.size.y) ;
			this.vel.y = 0;
			this.accel.y = 0;
			this.standing = true;
		}
		//side limit
		if (!ig.game.inArena && this.pos.x > ig.game.collisionMap.width * ig.game.collisionMap.tilesize - (this.size.x))
		{
			this.pos.x = ig.game.collisionMap.width * ig.game.collisionMap.tilesize - (this.size.x) ;
			this.vel.x = 0;
			this.accel.x = 0;
		}
		if (!ig.game.inArena && this.pos.x < 0){
			this.pos.x = 0;
			this.vel.x = 0;
			this.accel.x = 0;
		}

		if (this instanceof EntityPlayer && ig.game.inArena && this.pos.y > ig.game.collisionMap.height * ig.game.collisionMap.tilesize + (this.size.y*2))
		{
			//dead			
			ig.game.deaths++;
			this.damage = 0;
			this.maxVel= {x: 100, y: 200};
			this.friction= {x: 600, y: 0};

			if(ig.game.inArena)
				ig.game.socketEmit('playerkill',ig.game.lasthit,this.name);

			var kickout = (ig.game.deaths >= 3)

			var doors = ig.game.getEntitiesByType( EntityDoor );
			for( var i = 0; i < doors.length; i++ ){
				var door =doors[i];
				if(door.spectator && kickout)
				{

					this.pos = door.pos;
					this.vel = {x:0,y:0};					
				}
				else if(door.spectator)
					continue;
				else if(!kickout)
				{
					this.pos = door.pos;
					this.vel = {x:0,y:0};					
				}
			}

			if(kickout)
			{
				this.jumps = 3;
				ig.game.deaths = 0;
				this.spectator = true;
				socket.emit('changelevel', (DefaultRoom || 'LevelTest'), 'gameover');
			}

			ig.game.lasthit='suicide';
		}
		if (this instanceof EntityPlayer && ig.game.inLevel && this.pos.y > ig.game.collisionMap.height * ig.game.collisionMap.tilesize + (this.size.y*2))
		{
			//dead
			this.respawn();
		}


		if(this.standing)
		{
			this.friction.x = 600;
			this.jumps=0;
			if(this instanceof EntityPlayer && this.hit == 0)
				ig.game.lasthit='suicide';
		}

		
		// move left or right
		var accel = this.standing ? this.accelGround : this.accelAir;
		if( this.pressed.left) {
			this.accel.x = -accel;
			this.flip = true;
		}
		else if( this.pressed.right) {
			this.accel.x = accel;
			this.flip = false;
		}
		else {
			this.accel.x = 0;
		}

		if(!ig.game.inArena)
			this.damage = 0;

		var strength = 20;		
		if(ig.game.inArena)
		{
			this.maxVel.x = this.origMaxVel.x + this.damage*strength;
			this.maxVel.y = this.origMaxVel.y + this.damage*strength;			
		}
		var damagetouse = this.damage;
		if(this.hit > 1 || this.hit < 1)
			damagetouse = 1;
		if(this.hit < 0){
			this.vel.x = this.hitVel+(damagetouse*strength);
		}
		if(this.hit > 0){
			this.vel.x = -this.hitVel-(damagetouse*strength);
		}

		if(this.hit != 0)
		{
			this.friction.x = 0;
			this.vel.y = -this.jump-(damagetouse*strength);
			this.hit = 0;
			this.jumps=0;
		}
		
		// jump
		if( (this.standing || this.jumps < 2 || this.swimming || this.onwall != 0) && this.pressed.up ) {
			if(this.swimming)
				this.maxVel.y = this.origMaxVel.y+1;
			this.vel.y = -this.jump;
			if(this.onwall != 0)
				this.vel.y = -this.jump/1.4;
			if(this.onwall > 0)
				this.vel.x = -this.hitVel;
			else if(this.onwall < 0)
				this.vel.x = this.hitVel;
			this.pressed.up = false;
			if(!this.swimming)
				this.jumps++;
		}
		else if(!this.standing && !this.pressing.up && this.vel.y < 0 && this.friction.x != 0) {
            this.vel.y = Math.floor(this.vel.y/2);
        }

		if(this.startpunch)
		{
			this.startpunch = false;
		}

		if( this.pressed.action ) {
			this.punching = true;
			this.startpunch = true;
			this.pressed.action = false;
			if(this.standing)
				this.currentAnim = this.anims.punchg.rewind();
			else
				this.currentAnim = this.anims.punchj.rewind();
			//check collision ?
		}
		else if(this.punching && this.currentAnim.loopCount > 0)
		{
			this.punching = false;
		}
		
		if(this.punching)
		{
			if(this.standing)
				this.currentAnim = this.anims.punchg;
			else
				this.currentAnim = this.anims.punchj;
		}			
		// set the current animation, based on the player's speed
		else if( this.vel.y < 0 && !this.onPlatform){// && !this.wasOnPlatform) {
			this.currentAnim = this.anims.jump;
		}
		else if( this.vel.y > 0  && !this.onPlatform){// && !this.wasOnPlatform) {
			this.currentAnim = this.anims.fall;
		}
		else if( this.vel.x != 0 ) {
			this.currentAnim = this.anims.run;
		}
		else {
			this.currentAnim = this.anims.idle;
		}
		
		this.currentAnim.flip.x = this.flip;

		if(this.remotepos.x)
		{
			//float t = currentTime / moveDuration
			//vector currentPos = posA  + (posB - posA) * t
			var diff = (this.remotepos.x - this.pos.x)/2;
			if((diff < 4 && diff > -4) || (diff > 80 || diff < -80))
			{
				this.pos.x = this.remotepos.x;
				this.pos.y = this.remotepos.y;
				this.remotepos.x = false;
			}
			else{
				var diffx = this.pos.x + diff;
				if(diff != 0)
					this.pos.y = this.pos.y + (this.remotepos.y - this.pos.y)*(( diffx - this.pos.x)/(this.remotepos.x - this.pos.x))
				this.pos.x = diffx;
			}
		}

		if(this instanceof EntityPlayer && (this.pressed.left || this.pressed.right || ig.input.pressed( 'jump' ) || this.pressed.down || this.pressed.action || ig.input.pressed( 'click' )))
		{
			this.asleep = false;
			this.sleepTimer.reset();
		}
		if(this.sleepTimer.delta() > 0 && !this.asleep)
		{
			this.asleep = true;
			if(this instanceof EntityPlayer)
				ig.game.socketEmit('playerupdate',{player:{pos:this.pos, vel:this.vel, asleep:true, gun:this.getGunType(), equipped:this.equipped},room:ig.game.currentLevel});
		}

		// move!
		this.parent();

        /*
        if(lightLevel > 0)
        	this.setColor('#000000');
        else
        	this.setColor('');
        	//lightAlpha = lightLevel/10;
        //this.currentAnim.alpha = lightAlpha;
		*/

		if(this.head)
		{
		this.head.pos.x = this.pos.x;
		this.head.pos.y = this.pos.y-2;
		this.head.currentAnim.flip.x = (this.headflip) ? !this.flip : this.flip;
		this.head.accel.x = this.accel.x;
		this.head.accel.y = this.accel.y;
		this.head.vel.x = this.vel.x;
		this.head.vel.y = this.vel.y;
		this.head.reflectsLight = this.reflectsLight;
		}
		if(this.gun)
		{
			if(this.punching)
				this.gun.fire = true;
		this.gun.pos.x = this.pos.x;
		this.gun.pos.y = this.pos.y+12;
		//this.gun.currentAnim.flip.x = this.flip;
		this.gun.flip = this.flip;
		this.gun.accel.x = this.accel.x;
		this.gun.accel.y = this.accel.y;
		this.gun.vel.x = this.vel.x;
		this.gun.vel.y = this.vel.y;
		//this.gun.reflectsLight = this.reflectsLight;
		}
		for(var i=0;i<this.equipped.length;i++)
		{
			var eq = this.equippedItems[this.equipped[i]];
			if(eq)
			{
				if(this.flip)
					eq.pos.x = this.pos.x+18;
				else
					eq.pos.x = this.pos.x-18;
				eq.pos.y = this.pos.y-10;
				eq.currentAnim.flip.x = this.flip;
				eq.accel.x = this.accel.x;
				eq.accel.y = this.accel.y;
				eq.vel.x = this.vel.x;
				eq.vel.y = this.vel.y;
			}
		}
		this.wasOnPlatform = this.onPlatform;
		this.onPlatform = false;

	},

	draw: function(){
		if(this.isDead)
			return;
		if (!ig.global.wm){

			if (this.talktimer.delta() < 0) {
				var tosay = this.speech.substr(0,(this.speech.length > 24 ? 24 : this.speech.length));
				tosay = this.speech.length > 24 ? tosay + '...' : tosay;
				ig.game.font.draw(tosay,(this.pos.x - ig.game.screen.x + 8),(this.pos.y - ig.game.screen.y - 6),ig.Font.ALIGN.CENTER);
			}
			if(this.name)
			{
				if(ig.game.inArena)
					ig.game.font.draw(this.damage,(this.pos.x - ig.game.screen.x + 8),(this.pos.y - ig.game.screen.y + 32),ig.Font.ALIGN.CENTER);
				else if(this.displayName)
				{
					var disp = this.displayName.substr(0,(this.displayName.length > 32 ? 32 : this.displayName.length));
					disp = this.displayName.length > 32 ? disp + '...' : disp;

					//ig.game.font.draw(this.name,(this.pos.x - ig.game.screen.x + 8),(this.pos.y - ig.game.screen.y + 32),ig.Font.ALIGN.CENTER);
					ig.game.font.draw(disp,(this.pos.x - ig.game.screen.x + 8),(this.pos.y - ig.game.screen.y + 32),ig.Font.ALIGN.CENTER);
				}
				else
				{
					var disp = this.name.substr(0,(this.name.length > 32 ? 32 : this.name.length));
					disp = this.name.length > 32 ? disp + '...' : disp;
					ig.game.font.draw(disp,(this.pos.x - ig.game.screen.x + 8),(this.pos.y - ig.game.screen.y + 32),ig.Font.ALIGN.CENTER);
				}
				if(this.asleep)
				{
					var zzzVal = Math.floor(this.sleepTimer.delta()) % 3;
					var zzz = 'zZz';
					if(zzzVal == 1)
						zzz = 'zzZ';
					if(zzzVal == 2)
						zzz = 'Zzz';
					ig.game.font.draw(zzz,(this.pos.x - ig.game.screen.x + 8),(this.pos.y - ig.game.screen.y - 8),ig.Font.ALIGN.CENTER);
				}
			}
		}
		this.parent();
	},
    check: function( other ) {
		if( this.startpunch && other instanceof EntityPlayerbase) {
			if(ig.game.inArena)
			{
				if(other.name == playerinfo.username)
					ig.game.lasthit = this.name;
				ig.game.socketEmit('playerhit',this.name,other.name, 2);
			}
			//hit other player
			if(this.flip)
				other.hit = 1;
			else
				other.hit = -1;
		}
		if( this.startpunch && other instanceof EntityPlayerhead) {

			if(this.flip)
				other.vel.x = -this.hitVel;
			else
				other.vel.x = this.hitVel;
			other.vel.y = -this.hitVel;
		}
		this.startpunch = false;

        if( other instanceof EntityMover ) {
            // resolve collision between player (this) and (other)
            ig.Entity.solveCollision( this, other );
        }
	},
	/*
	collideWith: function(other, axis) {
	    if( other instanceof EntityPlatform && // entity is platform
	        axis === 'y' && // vertical collision
	        this.pos.y + this.size.y <= other.pos.y ) // above platform
	    {
	        console.log("You are standing on a platform. Now what?");
	    }
	},*/
    handleMovementTrace: function(res){
		if(res.tile.x == 12){	
			res.collision.x = false;
			res.pos.x = this.pos.x + this.vel.x * ig.system.tick;
		}

		if(res.collision.x && !this.standing && !this.swimming){	
			if(this.vel.x != 0)
				this.onwall = this.vel.x;
		}
		else if(this.onwall != 0)
		{
			this.onwall = 0;
		}

	    this.parent(res);
    }
});

EntityPlayerhead = ig.Entity.extend({
	
	size: {x: 16, y:16},		
	type: ig.Entity.TYPE.NONE, // Player friendly group
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
	
	// These are our own properties. They are not defined in the base
	// ig.Entity class. We just use them internally for the Player
	flip: false,
	user_id: '',
	hidehead:false,

	currSprite: '',
	headimage:false,
	
	init: function( x, y, settings ) {

		if(settings && settings.anim)
		{
			if(settings.anim && settings.anim.indexOf('http') == 0){
				settings.width = 32;
				settings.height = 32;
			}

			this.origSprite = settings.anim;
			this.reflectsLight = true;
			//this.animSheet = new ig.AnimationSheet( settings.anim, 16, 16 );
		}
		if(settings && settings.headimage && settings.headimage != 'hidehead')
		{
			this.origSprite = settings.headimage;
			this.reflectsLight = false;
			//this.animSheet = new ig.AnimationSheet( settings.anim, 16, 16 );
		}

		this.parent( x, y, settings );
	},
	allAnim:function(){
		this.addAnim( 'idle', 1, [0] );
	},
	updateImage:function(headimage, shouldhide){
		if(headimage)
		{
			if(headimage == 'nohead')
				this.hidehead = true;
			else
			{
				this.headflip = false;
				this.headimage = headimage;
				this.origSprite = headimage;
				this.hidehead = false;
				this.animSheet = new ig.AnimationSheet( headimage, 16,16 );
				this.allAnim();
				this.currSprite = headimage;
			}
		}
		else
		{
			this.hidehead = shouldhide;
			this.headimage = null;
			this.origSprite = this.anim;

			this.animSheet = new ig.AnimationSheet( this.anim, 16,16 );
			this.allAnim();
			this.currSprite = this.anim;
		}
	},
	
	update: function() {
		this.currentAnim = this.anims.idle;

		if((ig.game.currentLevel == 'LevelUnderground' || ig.game.currentLevel == 'LevelHell') && ig.game.lanternOn)
			this.reflectsLight = false;
		else if(!this.headimage)
			this.reflectsLight = true;
		else
			this.reflectsLight = false;

        this.parent();

		if(!this.reflectsLight)
		{
			this.setLight(0);
		}
	},
	draw: function(){
		if(!this.hidehead)
			this.parent();
	},
    handleMovementTrace: function(res){
		if(res.tile.x == 12){	
			res.collision.x = false;
			res.pos.x = this.pos.x + this.vel.x * ig.system.tick;
       }
	    this.parent(res);
    }
});

EntityTiptron = ig.Entity.extend({
	
	size: {x: 16, y:16},		
	type: ig.Entity.TYPE.NONE, // Player friendly group
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
	
	flip: false,
	user_id: '',
	hidehead:false,

	origSprite: 'media/tiptron.png',
	reflectsLight: true,

	currSprite: '',

	player:null,
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
	},
	allAnim:function(){
		this.addAnim( 'idle', 1, [0,1] );
	},
	
	
	update: function() {
		this.currentAnim = this.anims.idle;

		if((ig.game.currentLevel == 'LevelUnderground' || ig.game.currentLevel == 'LevelHell') && ig.game.lanternOn)
			this.reflectsLight = false;
		else
			this.reflectsLight = true;

        this.parent();

		if(!this.reflectsLight)
		{
			this.setLight(0);
		}
	}
});

});