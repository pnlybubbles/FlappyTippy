enchant();

// var DEBUG = true;
var DEBUG = false;
if(location.hash == "#debug") DEBUG = true;

var config = {
  // ゲーム画面のサイズ
  "game_width" : 500,
  "game_height" : 450,
  // ゲームのfps上限
  "game_fps" : 100,
  //プレイヤーの画像を変更するインターバル(ms)
  "player_imgs_change_interval" : 230,
  // プレイヤーの位置(x座標)
  "player_x" : 70,
  // プレイヤーの初期位置(y座標)
  "player_y" : 120,
  // プレイヤーに作用する重力加速度(y方向)
  "player_y_gravity" : 850,
  // プレイヤーがジャンプした時に作用する力積(速度)(y方向)
  "player_y_jump_velocity" : -290,
  // プレイヤーの回転(下を向く時)の基準となる速度上限値(この値を超過すると下を向く)
  "player_rotation_limit_velocity" : 500,
  // プレイヤーの衝突判定用の矩形サイズ
  "player_collision_ray_width" : 30,
  "player_collision_ray_height" : 26,
  // プレイヤーの衝突判定用の矩形とプレイヤー画像の相対位置
  "player_collision_ray_x" : 3,
  "player_collision_ray_y" : 5,
  // 地面の高さ(画面下方からの距離)(落下判定用)
  "ground_height" : 100,
  // 背景の流れる速さ
  "background_scroll_speed" : 12,
  // 地面、パイプの流れる速さ
  "ground_scroll_speed" : 120,
  // パイプ同士の距離(左右)
  "pipe_interval" : 185,
  // パイプ同士の距離(上下)
  "pipe_margin" : 90,
  // 最初のパイプの位置(ゲーム画面幅 + 指定したx座標)
  "first_pipe_x" : 300
};

if(location.hash.match("#fps")) config.game_fps = parseInt(location.hash.replace(/#fps/, ""), 10);

window.onload = function() {
  var game = new Game(config.game_width, config.game_height);
  game.fps = config.game_fps;
  game.preload("player-1.png", "player-2.png", "background.png", "ground.png", "pipe-middle.png", "pipe-down.png", "pipe-up.png", "splash.png", "ceiling.png", "scoreboard.png", "replay.png");
  console.log(game);
  game.onload = function() {
    gameFlow(game);
  };
  game.start();
};

var debug = null;

function gameFlow (game) {
  var background_image_width = 552;
  var background_image_height = 497;
  var ground_image_width = 552;
  var ground_image_height = 102;
  var stage = new Group();
  var background = new FlowEndless(game, config.background_scroll_speed, "background.png", background_image_width, background_image_height, -(background_image_height - game.height + ground_image_height));
  var player = new PlayerSprite(game);
  var pipe_object = new FlowPipe(game, config.ground_scroll_speed, config.pipe_margin, player.collision_ray);
  var ground = new FlowEndless(game, config.ground_scroll_speed, "ground.png", ground_image_width, ground_image_height, game.height - ground_image_height);
  var ceiling = new FlowEndless(game, config.ground_scroll_speed, "ceiling.png", 640, 16, 0, player.collision_ray);
  if(DEBUG) debug = new DebugWindow(game);
  var game_flow = true;
  var game_stop = function() {
    if(game_flow) {
      // console.log("intersect");
      player.y_velocity = 0;
      player.imgs_animation = false;
      stop_scrolling();
      game_flow = false;
      var result = new ResultWindow(game);
      stage.addChild(result);
      result.show();
      result.onreplay = function() {
        // console.log("replay");
        game.popScene();
        gameFlow(game);
      };
    }
  };
  var stop_scrolling = function() {
    background.stop();
    ground.stop();
    pipe_object.stop();
    ceiling.stop();
  };
  player.onfall = function() {
    game_stop();
  };
  pipe_object.onappearedobject = function(s) {
    var pipe_margin_position = Math.random();
    var x = s.x + config.pipe_interval;
    // console.log(x, pipe_margin_position);
    this.add_object(x, pipe_margin_position);
  };
  pipe_object.onintersectobject = function() {
    game_stop();
  };
  ceiling.onintersectobject = function() {
    game_stop();
  };
  stage.addChild(background);
  stage.addChild(player);
  stage.addChild(pipe_object);
  stage.addChild(ground);
  stage.addChild(ceiling);
  start = new Group();
  start_splash = new Sprite(188, 170);
  start_splash.image = game.assets["splash.png"];
  start_splash.x = Math.round(game.width / 2 - start_splash.width / 2);
  start_splash.y = Math.round((game.height - config.ground_height) / 2 - start_splash.height / 2);
  start_splash.opacity = 0;
  start.addChild(start_splash);
  start_splash.tl.fadeIn(0.6 * game.fps, enchant.Easing.LINEAR);
  var stage_scene = new Scene();
  stage_scene.addChild(stage);
  stage_scene.addChild(start);
  if(DEBUG) stage_scene.addChild(debug);
  var game_started = false;
  player.y_gravity = 0;
  stage_scene.addEventListener("touchstart", function() {
    if(!game_started) {
      start_splash.tl.fadeOut(0.2 * game.fps, enchant.Easing.LINEAR).then(function() {
        stage_scene.removeChild(start);
      });
      player.y_gravity = config.player_y_gravity;
      pipe_object.add_object(-(pipe_object.x) + game.width + config.first_pipe_x, 0.3);
      game_started = true;
    }
    if(!player.fallen && game_flow) {
      player.jump();
    }
  });
  if(DEBUG) {
    debug.add("fps");
    var fps_log = [];
  }
  stage_scene.addEventListener("enterframe", function() {
    if(DEBUG) {
      fps_log.push(game.actualFps);
      if(game.frame % game.fps === 0) {
        var fps_sum = 0;
        for(var i = 0; i <= fps_log.length - 1; i++) {
          fps_sum += fps_log[i];
        }
        debug.line.fps.text = "fps: " + (fps_sum / fps_log.length);
        fps_log = [];
      }
    }
  });
  game.pushScene(stage_scene);
}

var ResultWindow = Class.create(Group, {
  initialize: function(game) {
    this.game = game;
    Group.call(this);
    this.scoreboard = new Sprite(236, 280);
    this.scoreboard.image = this.game.assets["scoreboard.png"];
    this.scoreboard.x = Math.round(game.width / 2 - this.scoreboard.width / 2);
    this.scoreboard.y = Math.round((game.height - config.ground_height) / 2 - this.scoreboard.height / 2) + 40 + 30;
    this.scoreboard.opacity = 0;
    this.addChild(this.scoreboard);
    this.replay_button = new Sprite(114, 70);
    this.replay_button.image = this.game.assets["replay.png"];
    this.replay_button.x = Math.round(game.width / 2 - this.replay_button.width / 2);
    this.replay_button.y = this.scoreboard.y + 175 + 30;
    this.replay_button.opacity = 0;
    this.addChild(this.replay_button);
  },
  show: function() {
    var animation_frame = 0.7 * this.game.fps;
    var animation_easing = enchant.Easing.EXPO_EASEOUT;
    this.scoreboard.tl.fadeIn(animation_frame, animation_easing);
    this.scoreboard.tl.and();
    this.scoreboard.tl.moveTo(this.scoreboard.x, Math.round((this.game.height - config.ground_height) / 2 - this.scoreboard.height / 2) + 40, animation_frame, animation_easing);
    console.log(this.scoreboard);
    this.replay_button.tl.delay(0.5 * this.game.fps).fadeIn(animation_frame, animation_easing);
    this.replay_button.tl.and();
    this.replay_button.tl.moveTo(this.replay_button.x, this.scoreboard.y + 175, animation_frame, animation_easing);
    this.replay_button.addEventListener("touchstart", function() {
      this.parentNode.onreplay();
    });
  },
  onreplay: function() {}
});

var DebugWindow = Class.create(Group, {
  initialize: function(game) {
    this.game = game;
    Group.call(this);
    this.width = this.game.width;
    this.height = this.game.height;
    this.line = {};
    this.line_height = 3;
  },
  add: function(name) {
    this.line[name] = new Label();
    this.line[name].font = "10px";
    this.line[name].y = this.line_height;
    this.line[name].x = 3;
    this.line_height += 13;
    this.addChild(this.line[name]);
  }
});

var PlayerSprite = Class.create(Group, {
  initialize: function(game) {
    this.game = game;
    Group.call(this);
    this.width = 35;
    this.height = 35;
    this.default_x = config.player_x;
    this.default_y = config.player_y;
    this.x = this.default_x;
    this.y = this.default_y;
    this.y_jump_velocity = config.player_y_jump_velocity;
    this.y_velocity = 0;
    this.y_gravity = config.player_y_gravity;
    this.rotation_limit_velocity = config.player_rotation_limit_velocity;
    this.y_ground = this.game.height - config.ground_height;
    this.imgs = ["player-1.png", "player-2.png"];
    this.imgs_n = 0;
    this.imgs_animation = true;
    this.imgs_change_frame = Math.ceil(this.game.fps * (config.player_imgs_change_interval / 1000));
    this.img_ray = new Sprite(this.width, this.height);
    this.img_ray.image = this.game.assets[this.imgs[0]];
    this.collision_ray = new Sprite(config.player_collision_ray_width, config.player_collision_ray_height);
    this.collision_ray.x = config.player_collision_ray_x;
    this.collision_ray.y = config.player_collision_ray_y;
    if(DEBUG) this.collision_ray.backgroundColor = "#f00";
    this.addChild(this.collision_ray);
    this.addChild(this.img_ray);
    this.onfall = function() {};
    this.fallen = false;
    // console.log(this);
  },
  onenterframe: function() {
    this.y_velocity += this.y_gravity * (1 / this.game.fps);
    this.y += this.y_velocity * (1 / this.game.fps);
    var rotation_value = 0;
    if(this.y_gravity === 0) {
      rotation_value = this.img_ray.rotation + 45;
    } else if(this.y_velocity > this.rotation_limit_velocity) {
      rotation_value = 135;
    } else {
      rotation_value = 135 * ((this.y_velocity + (-this.y_jump_velocity)) / (this.rotation_limit_velocity + (-this.y_jump_velocity)));
    }
    this.img_ray.rotation = rotation_value - 45;
    if(this.y > this.y_ground - this.height) {
      this.y_velocity = 0;
      this.y_gravity = 0;
      // this.img_ray.rotation = 90;
      this.y = this.y_ground - this.height;
      this.fallen = true;
      this.onfall();
    }
    this.moveTo(this.x, this.y);
    if(this.imgs_animation && this.game.frame % this.imgs_change_frame === 0) {
      this.imgs_n += 1;
      if(this.imgs_n > this.imgs.length - 1) { this.imgs_n = 0; }
      this.img_ray.image = this.game.assets[this.imgs[this.imgs_n]];
    }
  },
  jump: function() {
    this.y_velocity = this.y_jump_velocity;
  },
  test: function() {
    console.log(this);
  }
});

var Flow = Class.create(Group, {
  initialize: function(game, speed) {
    this.game = game;
    Group.call(this);
    this.default_speed = speed;
    this.speed = this.default_speed;
    this.flow_sprites = [];
  },
  onenterframe: function() {
    // this.x = -(this.speed) * (this.game.frame / this.game.fps);
    this.x -= this.speed * (1 / this.game.fps);
    // if(this.game.frame % this.game.fps === 0) {
    //   console.log(this.x);
    // }
  },
  add: function(s) {
    s.onenterframe = function() {
      if(this.parentNode.x + this.x + this.width < 0) {
        // console.log(this.parentNode.x, this.x + this.width);
        this.appeared = false;
        this.parentNode.ondisappearedobject(this);
        this.parentNode.flow_sprites.splice(this.parentNode.flow_sprites.indexOf(this), 1);
        this.parentNode.removeChild(this);
      } else if(!this.appeared && this.parentNode.x - this.parentNode.game.width + this.x < 0) {
        this.appeared = true;
        this.parentNode.onappearedobject(this);
      }
      if(this.appeared && this.parentNode && this.parentNode.collision_to) {
        var child_node = [this];
        if(this.childNodes) {
          child_node = this.childNodes;
        }
        child_node.forEach(function(si, i) {
          if(this.parentNode.collision_to.intersect(si)) {
            // console.log("intersect");
            this.parentNode.onintersectobject(this);
          }
        }, this);
      }
    };
    // console.log(s);
    this.flow_sprites.push(s);
    this.addChild(s);
  },
  // intersect: function(a, b) {
  //   c0 = a._offsetX + a.width > b._offsetX;
  //   c1 = a._offsetY < b._offsetY + b.height;
  //   c2 = a._offsetX < b._offsetX + b.width;
  //   c3 = a._offsetY + a.height > b._offsetY;
  //   // console.log(a._offsetX + a.width, b._offsetX, a._offsetX, b._offsetX + b.width);
  //   // console.log(a._offsetY, b._offsetY + b.height, a._offsetY + a.height, b._offsetY);
  //   // console.log(c0 && c2, c1 && c3);
  //   // console.log(c0 && c1 && c2 && c3, c0, c1, c2, c3);
  //   // puts([c0 && c1 && c2 && c3, c0, c1, c2, c3]);
  //   return c0 && c1 && c2 && c3;
  // },
  stop: function() {
    this.speed = 0;
  },
  resume: function() {
    this.speed = this.default_speed;
  },
  ondisappearedobject: function() {},
  onappearedobject: function() {},
  onintersectobject: function() { console.log("intersect(function not defined)"); }
});

var FlowEndless = Class.create(Flow, {
  initialize: function(game, speed, assets, width, height, y, collision_to) {
    this.game = game;
    Flow.call(this, this.game, speed);
    this.assets = assets;
    this.s_y = y;
    this.s_width = width;
    this.s_height = height;
    this.collision_to = collision_to;
    for(var i = 0; i <= 1; i++) {
      var s = this.create_sprite();
      s.x = i * s.width;
      this.add(s);
    }
  },
  create_sprite: function() {
    var s = new Sprite(this.s_width, this.s_height);
    s.y = this.s_y;
    if(this.assets) s.image = this.game.assets[this.assets];
    return s;
  },
  ondisappearedobject: function(rs) {
    var s = this.create_sprite();
    s.x = rs.x + rs.width * 2;
    this.add(s);
  }
});

var FlowPipe = Class.create(Flow, {
  initialize: function(game, speed, pipe_margin, collision_to) {
    this.game = game;
    Flow.call(this, this.game, speed);
    this.pipe_margin = pipe_margin;
    this.pipe_down_height = 26;
    this.pipe_down_width = 52;
    this.pipe_up_height = 26;
    this.pipe_up_width = 52;
    this.pipe_middle_height = 1;
    this.pipe_middle_width = 52;
    this.y_ground = this.game.height - config.ground_height;
    this.collision_to = collision_to;
  },
  add_object: function(x, pipe_margin_position) { // pipe_margin_position : parcentage from top (0.0 , 1.0)
    var s = this.create_sprite(pipe_margin_position);
    s.x = x;
    this.add(s);
  },
  create_sprite: function(pipe_margin_position) {
    // console.log("create pipe");
    var available_pipe_area = this.y_ground;
    var pipe_extra_length = 5;
    var not_available_pipe_length = this.pipe_down_height + this.pipe_up_height + pipe_extra_length * 2 + this.pipe_margin;
    var available_pipe_length = available_pipe_area - not_available_pipe_length;
    var top_pipe_length = Math.round(not_available_pipe_length / 2) + Math.round(available_pipe_length * pipe_margin_position) - Math.round(this.pipe_margin / 2);
    var bottom_pipe_length = Math.round(not_available_pipe_length / 2) + Math.round(available_pipe_length * (1 - pipe_margin_position)) - Math.round(this.pipe_margin / 2);
    var top_pipe_middle_sprite = new Sprite(this.pipe_middle_width, top_pipe_length - this.pipe_down_height);
    var bottom_pipe_middle_sprite = new Sprite(this.pipe_middle_width, bottom_pipe_length - this.pipe_up_height);
    var top_pipe_down_sprite = new Sprite(this.pipe_down_width, this.pipe_down_height);
    var bottom_pipe_up_sprite = new Sprite(this.pipe_up_width, this.pipe_up_height);
    top_pipe_middle_sprite.image = this.game.assets["pipe-middle.png"];
    bottom_pipe_middle_sprite.image = this.game.assets["pipe-middle.png"];
    top_pipe_down_sprite.image = this.game.assets["pipe-down.png"];
    bottom_pipe_up_sprite.image = this.game.assets["pipe-up.png"];
    top_pipe_middle_sprite.x = 0;
    top_pipe_middle_sprite.y = 0;
    top_pipe_down_sprite.x = 0;
    top_pipe_down_sprite.y = top_pipe_length - this.pipe_down_height;
    bottom_pipe_middle_sprite.x = 0;
    bottom_pipe_middle_sprite.y = available_pipe_area - bottom_pipe_length + this.pipe_up_height;
    bottom_pipe_up_sprite.x = 0;
    bottom_pipe_up_sprite.y = available_pipe_area - bottom_pipe_length;
    var s = new Group();
    s.addChild(top_pipe_middle_sprite);
    s.addChild(top_pipe_down_sprite);
    s.addChild(bottom_pipe_middle_sprite);
    s.addChild(bottom_pipe_up_sprite);
    s.x = 0;
    s.y = 0;
    return s;
  }
});

var puts_log = [];

function puts (obj) {
  if(puts_log.indexOf(obj) == -1) {
    puts_log.push(obj);
    console.log(obj);
  }
}
