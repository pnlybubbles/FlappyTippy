enchant();

var DEBUG = false;

window.onload = function() {
  var game = new Game(400, 500);
  game.fps = 60;
  game.preload("player.png", "background.png", "ground.png", "pipe-middle.png", "pipe-down.png", "pipe-up.png");
  console.log(game);
  game.onload = function() {
    game.pushScene(createStage(game));
  };
  game.start();
};

function createStage (game) {
  var stage = new Group();
  var background = new FlowEndless(game, 8, "background.png", 552, 497, -99); // (game, speed, assets, width, height, y)
  var player = new PlayerSprite(game);
  var pipe_object = new FlowPipe(game, 80, 100, player.collision_ray);
  var ground = new FlowEndless(game, 80, "ground.png", 552, 102, 398);
  player.onfall = function() {
    background.stop();
    ground.stop();
    pipe_object.stop();
  };
  pipe_object.add_object(game.width + 300, 0.3);
  pipe_object.onappearedobject = function(s) {
    var pipe_margin_position = Math.random();
    var x = s.x + 200;
    // console.log(x, pipe_margin_position);
    this.add_object(x, pipe_margin_position);
  };
  var game_flow = true;
  pipe_object.onintersectobject = function(s) {
    if(game_flow) {
      console.log("intersect");
      player.y_velocity = 0;
      background.stop();
      ground.stop();
      pipe_object.stop();
      game_flow = false;
    }
  };
  stage.addChild(background);
  stage.addChild(player);
  stage.addChild(pipe_object);
  stage.addChild(ground);
  var stage_scene = new Scene();
  stage_scene.addChild(stage);
  stage_scene.addEventListener("touchstart", function() {
    if(!player.fallen && game_flow) {
      player.jump();
    }
  });
  return stage_scene;
}

var PlayerSprite = Class.create(Group, {
  initialize: function(game) {
    this.game = game;
    Group.call(this);
    this.width = 35;
    this.height = 35;
    this.default_x = Math.round(this.game.width / 2 - this.width / 2) - 8;
    this.default_y = 50;
    this.x = this.default_x;
    this.y = this.default_y;
    this.y_jump_velocity = -190;
    this.y_velocity = 0;
    this.y_gravity = 320;
    this.rotation_limit_velocity = 300;
    this.y_ground = this.game.height - 102;
    this.img_ray = new Sprite(this.width, this.height);
    this.img_ray.image = this.game.assets["player.png"];
    this.collision_ray = new Sprite(this.width - 4, this.height - 8);
    this.collision_ray.y = 4;
    this.collision_ray.x = 2;
    if(DEBUG) this.collision_ray.backgroundColor = "#f00";
    this.addChild(this.collision_ray);
    this.addChild(this.img_ray);
    this.onfall = function() {};
    this.fallen = false;
    console.log(this);
  },
  onenterframe: function() {
    this.y_velocity += this.y_gravity * (1 / this.game.fps);
    this.y += this.y_velocity * (1 / this.game.fps);
    var rotation_value = 0;
    if(this.y_velocity <= 0) {
      if(this.y_gravity === 0) {
        rotation_value = 135;
      } else {
        rotation_value = 0;
      }
    } else if(this.y_velocity > this.rotation_limit_velocity) {
      rotation_value = 135;
    } else if(this.y_velocity > 0) {
      rotation_value = 135 * (this.y_velocity / this.rotation_limit_velocity);
    }
    this.img_ray.rotation = rotation_value - 45;
    if(this.y > this.y_ground - this.height) {
      this.y_velocity = 0;
      this.y_gravity = 0;
      this.img_ray.rotation = 90;
      this.y = this.y_ground - this.height;
      this.fallen = true;
      this.onfall();
    }
    this.moveTo(this.x, this.y);
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
    this.appeared = false;
  },
  onenterframe: function() {
    this.x -= this.speed * (1 / this.game.fps);
  },
  add: function(s) {
    // console.log(s.x);
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
        this.childNodes.forEach(function(si, i) {
          if(this.parentNode.collision_to.intersect(si)) {
            this.parentNode.onintersectobject(this);
          }
        }, this);
      }
    };
    this.flow_sprites.push(s);
    this.addChild(s);
  },
  stop: function() {
    this.speed = 0;
  },
  resume: function() {
    this.speed = this.default_speed;
  },
  ondisappearedobject: function() {},
  onappearedobject: function() {},
  onintersectobject: function() {}
});

var FlowEndless = Class.create(Flow, {
  initialize: function(game, speed, assets, width, height, y) {
    this.game = game;
    Flow.call(this, this.game, speed);
    this.assets = assets;
    this.s_y = y;
    this.s_width = width;
    this.s_height = height;
    for(var i = 0; i <= 1; i++) {
      var s = this.create_sprite();
      s.x = i * s.width;
      this.add(s);
    }
  },
  create_sprite: function() {
    var s = new Sprite(this.s_width, this.s_height);
    s.y = this.s_y;
    s.image = this.game.assets[this.assets];
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
    this.y_ground = this.game.height - 102;
    this.collision_to = collision_to;
  },
  add_object: function(x, pipe_margin_position) { // pipe_margin_position : parcentage from top (0.0 , 1.0)
    var s = this.create_sprite(pipe_margin_position);
    s.x = x;
    this.add(s);
  },
  create_sprite: function(pipe_margin_position) {
    var available_pipe_area = this.y_ground;
    var pipe_extra_length = 5;
    var not_available_pipe_length = this.pipe_down_height + this.pipe_up_height + pipe_extra_length * 2 + this.pipe_margin;
    var available_pipe_length = available_pipe_area - not_available_pipe_length;
    var top_pipe_length = Math.round(not_available_pipe_length / 2) + Math.round(available_pipe_length * pipe_margin_position) - Math.round(this.pipe_margin / 2);
    var bottom_pipe_length = Math.round(not_available_pipe_length / 2) + Math.round(available_pipe_length * (1 - pipe_margin_position)) - Math.round(this.pipe_margin / 2);
    var top_pipe_middle_sprite = new Sprite(this.pipe_middle_width, top_pipe_length - this.pipe_down_height);
    top_pipe_middle_sprite.image = this.game.assets["pipe-middle.png"];
    var bottom_pipe_middle_sprite = new Sprite(this.pipe_middle_width, bottom_pipe_length - this.pipe_up_height);
    bottom_pipe_middle_sprite.image = this.game.assets["pipe-middle.png"];
    var top_pipe_down_sprite = new Sprite(this.pipe_down_width, this.pipe_down_height);
    top_pipe_down_sprite.image = this.game.assets["pipe-down.png"];
    var bottom_pipe_up_sprite = new Sprite(this.pipe_up_width, this.pipe_up_height);
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
