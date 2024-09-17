// global variables
var inReplyTo = 0;
var replyingTolastPost = 0;
var replyingTolastPostText = '';
var lastPost = 0;
var topicLastPost = 0;
var openedTopicId = 0;
var openedTopics = [];
var users = [];
var rooms = [];
var allrooms = [];
var globalRemovedItems = {};
var globalTileMapsInfo = {};
var itemsInfo = {};
var globalItems = {};
var stayinchat = false;
var muted = false;
var playerinfo = { damage: 0 };// username: 'Francis', avatar: 'Francis1294675276', asleep: false, posx: 0, posy: 450, room: 'LevelHell', inventory: {}, damage: 0, tiles: {} };
function getUserInfo() { return playerinfo; }
var blocks = {};
var bits = {};
var removedblocks = {};
var removedbits = {};
var usersData = {};
var noposUpdateCount = 0;

//load data & start game
let UserData = [];
let ItemData = [];
let TileData = [];
let RoomData = [];
let DefaultRoom = "LevelTest";
Promise.all([
  fetch(`data/users.json`),
  fetch(`data/items.json`),
  fetch(`data/tiles.json`),
  fetch(`data/room-files.json`),
]).then(function ([resp1, resp2, resp3, resp4]) {
  return Promise.all([resp1.json(), resp2.json(), resp3.json(), resp4.json()])
}).then(function ([ud, id, td, roomFiles]) {
  UserData = ud;
  ItemData = id;
  TileData = td;
  var foundDefaultRoom = false;
  const fetchPromises = roomFiles.map(function (url) {
    if (url == DefaultRoom) {
      foundDefaultRoom = true;
    }
    return fetch("data/rooms/" + url + ".json").then(function (response) { return response.json() });
  });
  console.log("DefaultRoom", DefaultRoom);
  Promise.all(fetchPromises).then(function (responses) {
    RoomData = responses.map(function (response) { return response });
    if (!foundDefaultRoom) {
      DefaultRoom = RoomData[0]['room'];
    }
    startServer(serversocket);
    startClient();
  }).catch(error => console.error('Error fetching data:', error));
});

// mock socket callbacks
socket.on('startgame', function (gameinfo) {
  console.log('gameinfo', gameinfo);
  $('#userlabel').html(gameinfo.user.username);
  playerinfo = JSON.parse(JSON.stringify(gameinfo.user));
  loadInventory();
  //items = gameinfo.items;
  //removeditems = gameinfo.removeditems;
  allrooms = gameinfo.allrooms;
  updateLevelList(allrooms);
  updateItems(gameinfo.user.items);
  if (ig.game) {
    socket.emit('changelevel', DefaultRoom, DefaultRoom + '-' + playerinfo.username);
  }
  else
    ig.module('main').requires('game.main').defines(function () {
      MyGame.start();
    });
});

socket.on('userleave', function (username) {
  ig.game.removeplayer(username);
});
socket.on('loadlevel', function (gameinfo) {
  if (!ig.game) {
    console.log('no game yet to load level');
    return;
  }
  playerinfo.room = gameinfo.level;
  globalItems = gameinfo.items;
  globalRemovedItems = gameinfo.removeditems;
  globalTileMapsInfo = gameinfo.tileMapsInfo;
  itemsInfo = gameinfo.itemsInfo;
  var settings = gameinfo.settings;
  if (settings)
    settings['leveltype'] = gameinfo.leveltype;
  else
    settings = { leveltype: gameinfo.leveltype };
  if (gameinfo.lastlevel)
    ig.game.changelevel(gameinfo.level, gameinfo.owner, settings, gameinfo.target, gameinfo.lastlevel);
  else
    ig.game.changelevel(gameinfo.level, gameinfo.owner, settings, gameinfo.target);
});
socket.on('playerupdate', function (user) {

  ig.game.updateplayer(user);
});

// listener, whenever the server emits 'updateusers', this updates the username list
socket.on('updateusers', function (data) {
  updateUsers(data);
});
socket.on('aup', function (data) {
  $.each(data, function (key, user) {
    usrobj = { room: 'LevelArena', username: user.u, player: user.p, damage: user.d };
    if (user.username != playerinfo.username) {
      playerinfo.posx = user.p.pos.x;
      playerinfo.posy = user.p.pos.y;
      playerinfo.damage = user.d;
    }
    if (playerinfo.room == 'LevelArena')
      ig.game.updateplayer(usrobj);
  });
});

socket.on('additem', function (data) {
  ig.game.additem(data.name, data.val, data.row, data.col, data.data, true);
});
socket.on('updateitem', function (data) {
  if (ig.game)
    ig.game.updateitem(data.name, data.val, data.row, data.col, data.data);
});
socket.on('gotitem', function (data) {
  ig.game.gotitem(data.name, data.val, data.num);
});
socket.on('itemfetched', function (data) {
  if (data)
    itemsInfo[data.itemid] = data;
});
socket.on('removeitem', function (data) {
  ig.game.removeitem(data.name, data.row, data.col, true);
});
socket.on('inputchange', function (data) {
  ig.game.inputchange(data.username, data.k, data.p, data.xy.pos, data.xy.vel);
});

//{id:req.handshake.user.id, name:req.handshake.user.name, avatar:req.handshake.user.avatar, tree:req.handshake.user.tree, inGame:false};

setInterval(function () {
  if (ig.game) {
    newpos = ig.game.sendplayerpos(playerinfo.posx, playerinfo.posy, playerinfo.asleep);
    if (newpos) {
      playerinfo.posx = newpos.pos.x;
      playerinfo.posy = newpos.pos.y;
      playerinfo.asleep = newpos.asleep;
    }
    else {
      noposUpdateCount++;
    }
  }
}, 100);

function updateUsers(data) {
  if (!ig.game)
    console.log('no game yet');
  usersData = data;
  users = [];
  $('#users').empty();
  $.each(data, function (key, user) {
    if (user.username === 'undefined') //sometimes we get empty users?
      return;
    if (users.indexOf(user.username + '#' + user.avatar) == -1) {
      users.push(user.username + '#' + user.avatar);
      var avaimg = '';

      if (user.avatar && user.avatar != '') {
        avaimg = './media/avatars/' + user.avatar + '.gif';
      }
      //$('#users').append('<div>' + user.username + ' ' + avaimg + '</div>');
      $('#users').append('<li><a href="#" class="userlink" data-username="' + user.username + '" data-avatar="' + user.avatar + '">' + user.username + ' <img src="' + avaimg + '" /></a></li>');

      //console.log(JSON.stringify(user));
    }
  });
  $('.userlink').click(function (e) {
    e.preventDefault();
    $('#userSelectModal').modal('hide');
    socket.emit('adduser', $(this).data('username'), $(this).data('avatar'));
  });
  $('#usersOnlineBtn').text('USERS (' + users.length + ')');
}

function updateLevelList(data) {
  var levelcompare = function (a, b) {
    if (a.title.toLowerCase() < b.title.toLowerCase())
      return -1;
    if (a.title.toLowerCase() > b.title.toLowerCase())
      return 1;
    return 0;
  }
  data.sort(levelcompare);

  $('#alllevels').empty();
  $('#lostlevels').empty();
  $('#roomlevels').empty();
  $('#levelsList').empty();
  var levelcount = userlevelcount = 0;
  $.each(data, function (key, room) {
    if (room.title) {
      var roomname = room.name;
      var title = $('<div/>').text(room.title.replace('ROOM:', '').replace('LOST LEVEL:', '')).html();
      var leveltext = title;// + ' : ' + room.username;
      if (room.title.indexOf('LOST LEVEL:') == 0) {
        $('#lostlevels').append('<li><a href="#" class="warplink" data-title="' + title + '" data-room="' + roomname + '" data-target="' + room.target + '">' + leveltext + '</a></li>');
      } else if (room.title.indexOf('ROOM:') == 0) {
        $('#roomlevels').append('<li><a href="#" class="warplink" data-title="' + title + '" data-room="' + roomname + '" data-target="' + room.target + '">' + leveltext + '</a></li>');
      } else {
        $('#alllevels').append('<li><a href="#" class="warplink" data-title="' + title + '" data-room="' + roomname + '" data-target="' + room.target + '">' + leveltext + '<span>' + room.username + '</span></a></li>');
      }
      levelcount++;
      //$('#levelsList').append('<tr><td><a href="#" class="warplink" data-title="' + title + '" data-room="' + roomname + '" data-target="' + room.target + '">' + title + '</a></td></tr>');
      userlevelcount++;
    }
  });
  $('#warpBtn').text('WARP (' + levelcount + ')');
  $('.warplink').click(function (e) {
    e.preventDefault();
    $('#warpModal').modal('hide');
    ig.game.levelTitle = $(this).data('title');
    socket.emit('changelevel', $(this).data('room'), $(this).data('target'));
  });
  $('#levelsBtn').text('LEVELS (' + userlevelcount + ')');
}

function updateItems(data) {
  $('#customItemsList').empty();
  var count = 0;
  $.each(data, function (key, item) {
    var title = $('<div/>').text(item.settings.name).html();
    //var image = 'media/custom.png';
    if (item.image)
      var image = item.image;
    if (item.settings.equip && item.settings.equip == 'body')
      $('#customItemsList').append('<tr><td>' + title + '</td><td><a href="#" class="bodylink btn btn-small" data-title="' + title + '" data-itemid="' + item.itemid + '">Details</a> <a class="btn btn-small itemimagelink" href="#" data-itemid="' + item.itemid + '">Edit Image</a> <a class="btn btn-small deleteitem" href="#" data-itemid="' + item.itemid + '">Delete</a> <div class="custom" style="background-image: url(' + image + '); display: inline-block;background-size:32px 224px"></div></td></tr>');
    else if (item.settings.equip && item.settings.equip == 'head')
      $('#customItemsList').append('<tr><td>' + title + '</td><td><a href="#" class="headlink btn btn-small" data-title="' + title + '" data-itemid="' + item.itemid + '">Details</a> <a class="btn btn-small itemimagelink" href="#" data-itemid="' + item.itemid + '">Edit Image</a> <a class="btn btn-small deleteitem" href="#" data-itemid="' + item.itemid + '">Delete</a> <div class="custom" style="background-image: url(' + image + '); display: inline-block;background-size:32px 32px"></div></td></tr>');
    else
      $('#customItemsList').append('<tr><td>' + title + '</td><td><a href="#" class="itemlink btn btn-small" data-title="' + title + '" data-itemid="' + item.itemid + '">Details</a> <a class="btn btn-small itemimagelink" href="#" data-itemid="' + item.itemid + '">Edit Image</a> <a class="btn btn-small deleteitem" href="#" data-itemid="' + item.itemid + '">Delete</a> <div class="custom" style="background-image: url(' + image + '); display: inline-block;"></div></td></tr>');
    count++;
  });
  $('#customItemsBtn').text('EDIT ITEMS (' + count + ')');
  $('.itemlink').click(function (e) {
    e.preventDefault();
    var itemid = $(this).data('itemid');
    $('#customItemsModal').modal('hide');
    $('#newItemForm').find(':input').each(function () {
      var name = $(this).attr("name");
      if (data[itemid] && data[itemid][name])
        $(this).val(data[itemid][name]);
      else if (data[itemid] && data[itemid]['settings'][name])
        $(this).val(data[itemid]['settings'][name]);
    });
    $('#newItemModal').modal('show');
  });
  $('.bodylink').click(function (e) {
    e.preventDefault();
    var itemid = $(this).data('itemid');
    $('#customItemsModal').modal('hide');
    $('#newBodyForm').find(':input').each(function () {
      var name = $(this).attr("name");
      if (data[itemid] && data[itemid][name])
        $(this).val(data[itemid][name]);
      else if (data[itemid] && data[itemid]['settings'][name])
        $(this).val(data[itemid]['settings'][name]);
    });
    $('#newBodyModal').modal('show');
  });
  $('.headlink').click(function (e) {
    e.preventDefault();
    var itemid = $(this).data('itemid');
    $('#customItemsModal').modal('hide');
    $('#newHeadForm').find(':input').each(function () {
      var name = $(this).attr("name");
      if (data[itemid] && data[itemid][name])
        $(this).val(data[itemid][name]);
      else if (data[itemid] && data[itemid]['settings'][name])
        $(this).val(data[itemid]['settings'][name]);
    });
    $('#newHeadModal').modal('show');
  });
  $('.itemimagelink').click(function (e) {
    e.preventDefault();
    var itemid = $(this).data('itemid');
    $('#customItemsModal').modal('hide');
    socket.emit('editor', 'item', itemid);
  });
  $('.deleteitem').click(function (e) {
    e.preventDefault();
    var itemid = $(this).data('itemid');
    var self = $(this);
    $('#customItemsModal').modal('hide');
    bootbox.confirm("Are you sure? This item will be deleted from all levels.", function (result) {
      if (result) {
        //self.parent().parent().remove();
        ig.game.selectitem($('.hand1'), 'hand', '1');
        delete playerinfo.items[itemid];
        updateItems(playerinfo.items);
        $(".invcustom[data-val='" + itemid + "']").remove();
        socket.emit('customitemdelete', itemid);
      } else {
      }
    });
  });
}

function loadInventory() {
  $('.inventory').html('');
  /*
  $('.inventory').append('<div class="move move1" data-toggle="tooltip" title="Touch-Move" data-name="move" data-val="1"><span></span></div><div class="hand hand1" data-toggle="tooltip" title="Pick-Up Items" data-name="hand" data-val="1"><span></span></div><a href="#equipModal" role="button" class="btn btn-mini" data-toggle="modal" id="equipBtn">Equip</a>');
  for(var key in playerinfo.inventory){
    for(var key2 in playerinfo.inventory[key]){
      if(key != 'null' && key != 'block' && key != 'lantern' && playerinfo.inventory[key][key2] > 0)
      {
        $('.inventory').append('<div data-toggle="tooltip" title="'+key+'" class="'+key+' '+key+key2+'" data-name="'+key+'" data-val="'+key2+'"><span>'+playerinfo.inventory[key][key2]+'</span></div>');
      }
      if(key == 'lantern')
      {
        $('.inventory').append('<div data-toggle="tooltip" title="'+key+'" class="'+key+' '+key+key2+'" data-name="'+key+'" data-val="'+key2+'"><span>OFF</span></div>')					
      }
    }
  }
  $('.inventory > div').tooltip();*/
  $('.eraser').tooltip();

  /*
  for(var key in playerinfo.inventory){
    for(var key2 in playerinfo.inventory[key]){
      $item = $('.inventory > .'+key+key2);
      $item.find('span').text(playerinfo.inventory[key][key2]);
    }
  }*/
}

function startClient() {
  updateUsers(UserData);
  var urlParams = new URLSearchParams(window.location.search);
  var username = urlParams.get('username');
  if (username) {
    $.each(UserData, function (key, user) {
      if (user.username == username) {
        var urlParams = new URLSearchParams(window.location.search);
        var equipped = urlParams.get('equipped');
        var hash = {};
        if (equipped) {
          hash.equipped = equipped.split(',');
        }
        var gun = urlParams.get('gun');
        if (gun) {
          hash.gun = gun;
        }
        socket.emit('adduser', user.username, user.avatar, hash);
      }
    })
  } else {
    $('#userSelectModal').modal('show');
  }
}

function onytplayerStateChange(newState) {
  if (ig.game)
    ig.game.youtubeStateChange(newState);
}

function onYouTubeIframeAPIReady() {
  ytplayer = new YT.Player('youtubeplayer', {
    height: '200',
    width: '200',
    playerVars: { controls: 0, modestbranding: 1, rel: 0, showinfo: 0, autohide: 1, iv_load_policy: 3, disablekb: 0, loop: 1, wmode: "opaque" },
    events: {
      onReady: function () {
        ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
        //ytplayer.loadVideoById({'videoId': 'bHQqvYy5KYo', 'startSeconds': 5, 'endSeconds': 60, 'suggestedQuality': 'small'});
        ytplayerready = true;
      }
    }
  });
}
(function ($) {
  $.fn.serializeObject = function () {

    var self = this,
      json = {},
      push_counters = {},
      patterns = {
        "validate": /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
        "key": /[a-zA-Z0-9_]+|(?=\[\])/g,
        "push": /^$/,
        "fixed": /^\d+$/,
        "named": /^[a-zA-Z0-9_]+$/
      };


    this.build = function (base, key, value) {
      base[key] = value;
      return base;
    };

    this.push_counter = function (key) {
      if (push_counters[key] === undefined) {
        push_counters[key] = 0;
      }
      return push_counters[key]++;
    };

    $.each($(this).serializeArray(), function () {

      // skip invalid keys
      if (!patterns.validate.test(this.name)) {
        return;
      }

      var k,
        keys = this.name.match(patterns.key),
        merge = this.value,
        reverse_key = this.name;

      while ((k = keys.pop()) !== undefined) {

        // adjust reverse_key
        reverse_key = reverse_key.replace(new RegExp("\\[" + k + "\\]$"), '');

        // push
        if (k.match(patterns.push)) {
          merge = self.build([], self.push_counter(reverse_key), merge);
        }

        // fixed
        else if (k.match(patterns.fixed)) {
          merge = self.build([], k, merge);
        }

        // named
        else if (k.match(patterns.named)) {
          merge = self.build({}, k, merge);
        }
      }

      json = $.extend(true, json, merge);
    });

    return json;
  };
})(jQuery);
function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// wireup UI events on load of page
$(function () {
  $('.closeGameDiv').click(function () {
    $('#gameDiv').hide();
    ig.game.inMenu = false;
  });
  $('.inventory, .inventory-actions').on("click", "div", function (event) {
    var $item = $(this);
    if ($item.data('name'))
      ig.game.selectitem($item, $item.data('name'), $item.data('val'));
  });
  $('.guns').on("click", "div", function (event) {
    playerinfo.gun = undefined;
    var $item = $(this);
    ig.game.equipitem($item, 'gun', $item.data('val'));
  });
  $('.defaultbody').click(function (event) {
    var $item = $(this);
    ig.game.equipitem($item, $item.data('val'), 1);
  });
  $('.equips').on("click", "div", function (event) {
    var $item = $(this);
    ig.game.equipitem($item, $item.data('val'), 1);
  });
  $('#mutebutton').click(function () {
    muted = !muted;
    var text = 'MUTE';
    if (muted)
      text = 'UNMUTE';
    $(this).text(text);
    if (ig.soundManager) {
      if (muted)
        ig.soundManager.volume = 0;
      else
        ig.soundManager.volume = 1;
    }
    if (ytplayer) {
      if (muted)
        ytplayer.mute();
      else
        ytplayer.unMute();
    }
  });
  $('#abortbutton').click(function () {
    socket.emit('changelevel', DefaultRoom, DefaultRoom + '-' + playerinfo.username);
  });
  $('#resetbutton').click(function () {
    DefaultRoom = "LevelTest";
    RoomData = [{ items: {}, room: DefaultRoom }];
    updateLevelList([]);
    socket.emit('changelevel', DefaultRoom, '');
  });
  $('#getlink').click(function () {
    var url = 'index.html?username=' + playerinfo.username + '&room=' + playerinfo.room;
    if (playerinfo.equipped && playerinfo.equipped.length) {
      url += ('&equipped=' + playerinfo.equipped.join(','));
    }
    if (ig.game.theplayer && ig.game.theplayer.gun && ig.game.theplayer.getGunTypeId()) {
      url += ('&gun=' + ig.game.theplayer.getGunTypeId());
    }
    window.location.replace(url);
  });
  $('#retrybutton').click(function () {
    ig.game.resetLevel(true);
  });
  $('#editorbutton').click(function () {
    socket.emit('editor', 'background');
  });
  $('.smeltBtn').click(function () {
    var btn = $(this);
    var val = btn.data('val');
    var num = parseInt($(this).parent().parent().find('input').val());
    $(this).parent().parent().find('input').val('');
    if (num > 0)
      ig.game.smelt(val, num);
  });

  $('.inventory').on('click', '.frameset', function () {
    var $btn = $(this);
    ig.game.selectedFrameSet = $btn.data('val');
    ig.game.selectframe($('.animframe1'), '1');
  });
  $('.inventory').on('click', '.addframeset', function () {
    ig.game.addTileSet();
  });
  $('.framesave').click(function () {
    ig.game.saveTiles();
  });
  $('.framecopy').click(function () {
    ig.game.copyFrame();
  });
  $('.frameshift').click(function () {
    if (ig.game.shifting) {
      ig.game.shifting = false;
      $(this).removeClass('btn-success');
    }
    else {
      ig.game.shifting = true;
      $(this).addClass('btn-success');
    }
  });
  $('.hexcolor').click(function () {
    bootbox.prompt("HEXADECIMAL COLOR CODE", function (result) {
      if (result === null) {
      } else {
        var rgb = hexToRgb(result);
        if (rgb) {
          var pal = new EntityPaint;
          pal.r = rgb.r; pal.g = rgb.g; pal.b = rgb.b; pal.hsl = false;
          ig.game.selectPalette(pal);
        }
      }
    });
  });
  $('.framepaste').click(function () {
    ig.game.pasteFrame();
  });
  $('.frameclear').click(function () {
    ig.game.clearFrame();
  });
  $('.frameadd').click(function () {
    ig.game.addTile();
  });
  $('.frameflip,.frameflop').click(function () {
    ig.game.flipTiles($('.frameflip').is(":checked"), $('.frameflop').is(":checked"));
  });
  $('.framelayer').click(function () {
    if ($(this).is(":checked"))
      ig.game.selectedLayer = '2';
    else
      ig.game.selectedLayer = '1';
  });
  $('#newLevelBtn').click(function () {
    $('#newLevelForm').find(':input').each(function () {
      $(this).val('');
    });
  });
  $('.levelsave').click(function () {
    ig.game.saveLevel();
  });
  $('#newItemForm').submit(function (e) {
    e.preventDefault();
    ig.game.saveItem();
  });
  $('#newBodyForm').submit(function (e) {
    e.preventDefault();
    ig.game.saveBody();
  });
  $('#newHeadForm').submit(function (e) {
    e.preventDefault();
    ig.game.saveHead();
  });
  $('#newItemBtn').click(function () {
    $('#newItemForm').find(':input').each(function () {
      $(this).val('');
    });
  });

  $('.invtoggle').click(function () {
    $('.inventory > .invbits').hide();
    $('.inventory > .invitems').hide();
    $('.inventory > .invcustom').hide();
    $('.inventory > .invtiles').hide();
    $('.inventory > .' + $(this).data('val')).show();
  });
  $('.animframes').on('click', '.animframe', function () {
    ig.game.selectframe($(this), $(this).data('val'));
  });
  /*
  $('.animframeimage').click(function(e) {
    var offset = $(this).offset();
    var x = (e.clientX - offset.left);
    var y = (e.clientY - offset.top);
    ig.game.selectframe($animframe, $animframe.data('val'));
  });
 */
  $('canvas').mouseleave(
    function () { if (ig.game) { ig.game.mouseleave(); } }
  ).mouseenter(
    function () { if (ig.game) { ig.game.mouseenter(); } }
  );

  $(window).resize(function () { //adjust video elements
    $("iframe[src*='vimeo.com'], object, embed, .imgsize").each(function () {
      var $el = $(this);
      var oWidth = $el.attr('data-owidth');
      var oHeight = $el.attr('data-oheight');
      var aspectRatio = oHeight / oWidth;
      var fluidElWidth = $('figure').width();
      var newWidth = 0;
      if (fluidElWidth >= oWidth)
        newWidth = oWidth;
      else
        newWidth = fluidElWidth;
      var newHeight = newWidth * aspectRatio;
      $el
        .width(newWidth)
        .height(newHeight);
    });
    var gameOriginalWidth = 320;
    var gameScreenWidth = $('#gamedivarea').width() - $('#blockarea').width();
    var gameScale = Math.max(1, Math.floor((gameScreenWidth / gameOriginalWidth)))
    $('#blockarea').css({ 'maxHeight': ((160 * gameScale) - 100) + 'px' });
  }).resize();

});
