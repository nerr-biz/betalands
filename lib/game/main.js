ig.module( 
	'game.main' 
)
.requires(
	'game.mygame',
	'game.levels.test',
	'game.levels.room1',
	'game.levels.room2',
	'game.levels.castle',
	'game.levels.underground',
	'game.levels.room3',
	'game.levels.defaultroom',
	'game.levels.arena',
	'game.levels.hell',
	'game.levels.water1',
	'game.levels.water2',
	'game.levels.water3',
	'game.levels.water4',
	'game.levels.waterworld',
	'game.levels.underwater',
	'game.levels.waterarena',
	'game.levels.default',
	'game.levels.storage',
	'game.levels.header',
	'game.levels.vertical',
	'game.levels.editor'
)
.defines(function(){

	MyGame = MyGame.extend({
		startLevel:LevelTest,

		init: function() {

			//ig.CollisionMap.defaultTileDef[46] = [1,0, 1,1,ig.CollisionMap.SOLID];
		
			//ig.DrawCounter.enable();
			
			// Bind keys
			ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
			ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
			ig.input.bind( ig.KEY.UP_ARROW, 'jump' );
			ig.input.bind( ig.KEY.DOWN_ARROW, 'down' );
			ig.input.bind( ig.KEY.A, 'left' );
			ig.input.bind( ig.KEY.D, 'right' );
			ig.input.bind( ig.KEY.W, 'jump' );
			ig.input.bind( ig.KEY.S, 'down' );
			ig.input.bind( ig.KEY.SPACE, 'action' );
			ig.input.bind( ig.KEY.ENTER, 'action' );

			ig.input.bind( ig.KEY.MOUSE1, 'click' );
			ig.input.bind( ig.KEY.MOUSE2, 'click2' );

			this.inventory =getUserInfo().inventory;

			var urlParams = new URLSearchParams(window.location.search);
			var room = urlParams.get('room') || DefaultRoom || 'LevelTest';
			if(room == DefaultRoom){
				socket.emit('changelevel', DefaultRoom, DefaultRoom+'-' + playerinfo.username);
			} else {
				socket.emit('changelevel', room, room+'-start');
			}	
			//this.spawnDoor = 'LevelTest-'+playerinfo.username;

			//this.loadLevel(this.startLevel);
		},
	});

	MyGame.start=function(){
		var screenWidth = $('#gamedivarea').width() - $('#blockarea').width();
		var scale = Math.max(1,Math.floor((screenWidth/320)))//*4)/4);
		// Disable all sounds for mobile devices
		if( ig.ua.mobile ) {
		    ig.Sound.enabled = false;
		}
		ig.main( '#canvas', MyGame, 60, 320, 160, scale );
		window.onresize=function(event){if(ig.game){ig.game.resizeGame();}};
	}

});

