/* Canvas calculations and references */
const canvas = document.getElementById("canvas");
const originalHeight = canvas.height;
const originalWidth = canvas.width;

/* Ball calculations and references */
var ball;
const delay = 16; // ms
var gravity = 10; // px/s^2
var coeff = 0.008; // air resistence

var ground;

var grid;

var sections;

const DOT_RADIUS = 3;
const DOT_SPACING = 60;

const BLOCK_WIDTH = 10;

var clicked = false;

class Ball {
    // Radius of ball in px; radius is immutable
    constructor(radius) {
        this.radius = radius;
        this.x = 0;
        this.y = 0;
        this.xVel = 0;
        this.yVel = 0;
    }

    /**
     * Draws the ball at (x, y) coordinates on canvas
     */
    draw(x, y) {
        let context = canvas.getContext("2d");
        let ratio = Math.min(
            canvas.clientWidth / originalWidth,
            canvas.clientHeight / originalHeight
        );
        context.scale(ratio, ratio);
        context.beginPath();
        context.arc(x, y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = "lavender"
        context.strokeStyle = "black"
        context.fill();
        context.stroke();
        this.x = x;
        this.y = y;
    }

    /**
     * Moves ball to (x, y) coordinates on canvas
     */
    move(x, y) {
        let context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        this.draw(x,y);
    }

    /**
     * Gets the normal vector of the velocity
     * 
     * @returns Normal vector as an array
     */
    getVelocityNormalVector() {
        let magnitude = Math.sqrt(this.xVel*this.xVel + this.yVel*this.yVel);
        let vector = [];
        vector.push(this.xVel / magnitude)
        vector.push(this.yVel / magnitude)
        return vector;
    }

    getVelocitySlope() {
        let vector = this.getVelocityNormalVector();
        if (vector[0] == 0) {
            return vector[1];
        } else {
            return vector[1] / vector[0];
        }
    }
}

class GroundPiece {
    constructor(start_x, start_y, end_x, end_y) {
        this.start_x = start_x;
        this.start_y = start_y;
        this.end_x = end_x;
        this.end_y = end_y;
    }

    /**
     * Draws the ground piece on canvas
     */
    draw() {
        let context = canvas.getContext("2d");
        context.beginPath();
        context.moveTo(this.start_x, canvas.height);
        context.lineTo(this.start_x, this.start_y);
        context.lineTo(this.end_x, this.end_y);
        context.lineTo(this.end_x, canvas.height);
        context.closePath();
        context.fill(); //green
        context.stroke();
    }

    /**
     * Gets the normal vector of the "slope" of the ground
     * 
     * @returns Normal vector as an array
     */
    getNormalVector() {
        let vector = [];
        let x = this.end_x - this.start_x;
        let y = this.end_y - this.start_y;
        let len = Math.sqrt(x**2 + y**2);
        x /= len;
        y /= len;
        vector.push(y);
        vector.push(-x);
        return vector; // vector is returned as <x,y>
    }
}

class Ground {
    constructor() {
        this.arr = [];
    }

    /**
     * Draws ground from start point to end point and adds to GroundPiece array
     */
    addGround(start_x, start_y, end_x, end_y) {
        let curr_ground = new GroundPiece(start_x, start_y, end_x, end_y);
        curr_ground.draw();
        this.arr.push(curr_ground);
    }

    /**
     * Refreshes the ground on canvas; used for updating
     */
    refresh() {
        for(let i = 0; i < this.arr.length; i++) {
            this.arr[i].draw();
        }
    }

    checkCollision() {
        for (let i = 0; i < this.arr.length; i++) {
            checkGroundCollision(this.arr[i]);
        }
    }
}

class Dot {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    draw() {
        let context = canvas.getContext("2d");
        let ratio = Math.min(
            canvas.clientWidth / originalWidth,
            canvas.clientHeight / originalHeight
        );
        context.scale(ratio, ratio);
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = "lavender"
        context.strokeStyle = "black"
        context.fill();
        context.stroke();
    }
}

class DotsRow {
    constructor(numDots, y) {
        this.numDots = numDots;
        this.y = y;
        this.dots = [];
        if (numDots % 2 == 1) {
            this.dots.push(new Dot(canvas.width / 2, y, DOT_RADIUS));
            for (let i = 1; i < numDots / 2; i++) {
                this.dots.push(new Dot((canvas.width / 2) - (60 * i), y, DOT_RADIUS));
            }
            for (let i = 1; i < numDots / 2; i++) {
                this.dots.push(new Dot((canvas.width / 2) + (60 * i), y, DOT_RADIUS));
            }
        } else {
            let offset = DOT_SPACING / 2;
            for (let i = 0; i < numDots / 2; i++) {
                this.dots.push(new Dot((canvas.width / 2) + (60 * i) + offset, y, DOT_RADIUS));
            }
            for (let i = 0; i < numDots / 2; i++) {
                this.dots.push(new Dot((canvas.width / 2) - (60 * i) - offset, y, DOT_RADIUS));
            }
        }
        
    }

    checkCollision() {
        for (let i = 0; i < this.numDots; i++) {
            checkDotCollision(this.dots[i]);
        }
    }
    
    refresh() {
        for (let i = 0; i < this.numDots; i++) {
            this.dots[i].draw();
        }
    }
}

class DotsGrid {
    constructor(maxWidth, numRows) {
        this.maxWidth = maxWidth;
        this.numRows = numRows;
        this.rows = [];
        let offset = 100;
        for (let i = 0; i < numRows; i++) {
            if (i % 2 == 0) {
                this.rows.push(new DotsRow(maxWidth, offset + i * DOT_SPACING));
            } else {
                this.rows.push(new DotsRow(maxWidth - 1, offset + i * DOT_SPACING));
            }
        }
    }

    refresh() {
        for (let i = 0; i < this.numRows; i++) {
            this.rows[i].refresh();
        }
    }

    checkCollision() {
        for (let i = 0; i < this.numRows; i++) {
            // if (ball.y + ball.radius <= this.rows.y - 2 && ball.y - ball.radius >= this.rows.y + 2) {
                this.rows[i].checkCollision();
            // }
        }
    }
}

class Sections {
    constructor(labels) {
        this.labels = labels;
        this.ground = new Ground();

        let space = canvas.width / labels.length;

        for (let i = 1; i < labels.length; i++) {
            this.ground.addGround(space * i, canvas.height - 100, space * i + BLOCK_WIDTH, canvas.height - 100);
        }
    }

    refresh() {
        this.ground.refresh();
        this.drawLabels();
    }

    checkCollision() {
        this.ground.checkCollision();
    }

    drawLabels() {
        let context = canvas.getContext("2d");
        context.font = "16px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";

        let sectionWidth = canvas.width / this.labels.length;
        for (let i = 0; i < this.labels.length; i++) {
            let x = sectionWidth * i + sectionWidth / 2; // Center of each section
            let y = canvas.height - 50; // Slightly above the ground
            context.fillText(this.labels[i], x, y);
        }
    }
}


function init() {
    initBoxDimensions();
    ball = new Ball(17);

    let interval = setInterval(updateCanvas, delay);
    // ground = new Ground();
    // ground.addGround(150, canvas.height - 100, 160, canvas.height - 100);
    // ground.addGround(250, canvas.height - 100, 260, canvas.height - 100);
    // ground.addGround(350, canvas.height - 100, 360, canvas.height - 100);
    // ground.addGround(450, canvas.height - 100, 460, canvas.height - 100);
    let list = [];
    let text;

    do {
        text = window.prompt("Add an option! Once you have added all choices, click cancel to finish");
        if (text !== null && text.trim() !== "") {
            list.push(text.trim());
        }
    } while (text !== null);

    // if (list.length === 0) {
    //     list.push("Default 1", "Default 2");
    // }

    // Pass the list to Sections
    sections = new Sections(shuffleArray(list));
    grid = new DotsGrid(14, 9);

    ball.move(ball.radius+Math.random()*(canvas.width - 2*ball.radius), 0 + ball.radius);
}

function initBoxDimensions() {
    const dimensions = getObjectFitSize(
        true,
        canvas.clientWidth,
        canvas.clientHeight,
        canvas.width,
        canvas.height
    );
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
}

document.addEventListener("keypress", pushBall);

function pushBall(event) {
    let string = `${event.code}`;
    switch (string) {
        case "KeyA":
            ball.xVel -= 5;
            break;
        case "KeyD":
            ball.xVel += 5;
            break;
        case "KeyS":
            ball.yVel += 5;
            break;
        case "KeyW":
            ball.yVel -= 5;
            break;
    }
}
function toggleGravity() {
    if (gravity > 0) {
        gravity = 0;
    } else {
        gravity = 6;
    }
}

function rerun() {
    ball.move(ball.radius+Math.random()*(canvas.width - 2*ball.radius), 0 + ball.radius);
    sections = new Sections(shuffleArray(list));
}

function toggleFriction() {
    if (coeff > 0) {
        coeff = 0;
    } else {
        coeff = 0.004;
    }
}

function getObjectFitSize(
    contains /* true = contain, false = cover */,
    containerWidth,
    containerHeight,
    width,
    height
  ) {
    var doRatio = width / height;
    var cRatio = containerWidth / containerHeight;
    var targetWidth = 0;
    var targetHeight = 0;
    var test = contains ? doRatio > cRatio : doRatio < cRatio;
  
    if (test) {
      targetWidth = containerWidth;
      targetHeight = targetWidth / doRatio;
    } else {
      targetHeight = containerHeight;
      targetWidth = targetHeight * doRatio;
    }
  
    return {
      width: targetWidth,
      height: targetHeight,
      x: (containerWidth - targetWidth) / 2,
      y: (containerHeight - targetHeight) / 2
    };
}

function updateCanvas() {
    context = canvas.getContext("2d");
    
    checkXCollision();
    checkYCollision();

    // Calculate acceleration due to gravity
    ball.yVel = ball.yVel + (gravity * delay/1000);
    
    
    // Add "air resistance"
    if (ball.y > 0) {
        if (ball.yVel < 0 && ball.yVel - ball.yVel*coeff <= 0) {
            ball.yVel -= ball.yVel*coeff;
        } else
        if (ball.yVel > 0) {
            ball.yVel -= ball.yVel*coeff;
        }
    }
    if (ball.xVel > 0 && ball.xVel - ball.xVel*coeff >= 0) {
        ball.xVel -= ball.xVel*coeff;
    } else 
    if (ball.xVel < 0 && ball.xVel + ball.xVel*coeff <= 0) {
        ball.xVel -= ball.xVel*coeff;
    } else {
        ball.xVel = 0;
    }
    // ground.refresh();
    sections.checkCollision();
    grid.checkCollision();
    let x = ball.x + ball.xVel;
    let y = ball.y + ball.yVel;


    ball.move(x,y);
    sections.refresh();
    grid.refresh();
}

/**
 * Checks if ball collides with border 
 * 
 * @returns True if ball collided with border, false otherwise
 */
function checkXCollision() {
    if (ball.x - ball.radius <= 0) {
        ball.move(ball.radius, ball.y);
        ball.xVel = -ball.xVel;
    }
    if (ball.x + ball.radius >= canvas.width) {
        ball.move(canvas.width - ball.radius, ball.y);
        ball.xVel = -ball.xVel;
    }
}

/**
 * Checks if ball collides with border 
 * 
 * @returns True if ball collided with border, false otherwise
 */
function checkYCollision() {
    if (ball.y - ball.radius <= 0) {
        ball.move(ball.x, ball.radius);
        ball.yVel = -ball.yVel;
    }
    if (ball.y + ball.radius >= canvas.height) {
        ball.move(ball.x, canvas.height - ball.radius);
        ball.yVel = -ball.yVel;
    }
}


/**
 * Checks if the ball collides with the ground piece and changes velocity accordingly
 */
function checkGroundCollision(curr_ground) {

    let ground_width = curr_ground.end_x - curr_ground.start_x;
    // check collision with slant
    let norm = curr_ground.getNormalVector();
    let ball_x_comp = -norm[0] * ball.radius; // x component pointing towards slope
    let ball_y_comp = -norm[1] * ball.radius; // y component pointing towards slope
    let slope = (curr_ground.end_y - curr_ground.start_y) / (curr_ground.end_x - curr_ground.start_x);
    let is_colliding_slope = curr_ground.start_y <= slope * (curr_ground.start_x - (ball.x + ball_x_comp)) + (ball.y + ball_y_comp);
    if (ball.x >= curr_ground.start_x && ball.x <= curr_ground.end_x
            && is_colliding_slope) {
                let perp_x = (ball.xVel * norm[0] + ball.yVel * norm[1]) * norm[0];
                let perp_y = (ball.xVel * norm[0] + ball.yVel * norm[1]) * norm[1];
                let parallel_x = ball.xVel - perp_x;
                let parallel_y = ball.yVel - perp_y;

                // Negate velocity from collision
                ball.xVel = parallel_x - perp_x;
                ball.yVel = parallel_y - perp_y;
                let x_calc = calculateXIntersectionGround(curr_ground);
                let y_calc = calculateYIntersectionGround(x_calc);

                ball.move(x_calc + ball.radius * ball.getVelocityNormalVector()[0], y_calc + ball.radius * ball.getVelocityNormalVector()[1]);
            }

    // check left wall of ground for collision
    // todo: check for height of the wall in comparison to ball
    else if (ball.x + ball.radius >= curr_ground.start_x 
            && ball.x < curr_ground.start_x + (ground_width / 2)
            && is_colliding_slope) {
                ball.move(curr_ground.start_x - (ball.radius), ball.y);
                ball.xVel = -ball.xVel;
    }
    // check right wall of ground for collision
    else if (ball.x - ball.radius <= curr_ground.end_x 
        && ball.x > curr_ground.end_x - (ground_width / 2)
        && is_colliding_slope) {
            ball.move(curr_ground.end_x + ball.radius, ball.y);
            ball.xVel = -ball.xVel;
    }
}

/**
 * Calculates the intersection between the ball and a piece of ground
 * 
 * @return The X component of the intersection
 * 
 */
function calculateXIntersectionGround(ground) {
    let g_slope = (ground.end_y - ground.start_y) / (ground.end_x - ground.start_x);
    let x_slope = ball.getVelocitySlope();
    return (-x_slope*ball.x + g_slope*ground.start_x - ground.start_y + ball.y) / (g_slope - x_slope);
}

/**
 * Calculates the intersection between the ball and a piece of ground
 * 
 * @return The Y component of the intersection
 * 
 */
function calculateYIntersectionGround(x_calc) {
    let x_slope = ball.getVelocitySlope();
    return (x_slope*(x_calc-ball.x)) + ball.y;
}

let collisionCooldown = false;

function checkDotCollision(curr_dot) {
    if (collisionCooldown) return;

    let x_diff = curr_dot.x - ball.x;
    let y_diff = curr_dot.y - ball.y;
    let distanceSquared = x_diff * x_diff + y_diff * y_diff;

    let radiiSum = ball.radius + curr_dot.radius;
    if (distanceSquared <= radiiSum * radiiSum) {
        collisionCooldown = true;
        setTimeout(() => collisionCooldown = false, 50); // Cooldown for 50ms
        calculateDotCollision(curr_dot);
    }
}

function calculateDotCollision(dot) {
    // Compute normal vector
    let normal_x = dot.x - ball.x;
    let normal_y = dot.y - ball.y;
    let normal_length = Math.sqrt(normal_x ** 2 + normal_y ** 2);
    normal_x /= normal_length; // Normalize
    normal_y /= normal_length;

    // Calculate ball's normal and tangential velocity components
    let ball_normal_vel = ball.xVel * normal_x + ball.yVel * normal_y;
    let ball_tangent_vel_x = ball.xVel - ball_normal_vel * normal_x;
    let ball_tangent_vel_y = ball.yVel - ball_normal_vel * normal_y;

    // Reverse the normal velocity
    ball_normal_vel = -ball_normal_vel;

    // Recombine the velocity components
    ball.xVel = ball_normal_vel * normal_x + ball_tangent_vel_x;
    ball.yVel = ball_normal_vel * normal_y + ball_tangent_vel_y;

    // Separate the ball from the dot to prevent sticking
    let overlap = ball.radius + dot.radius - normal_length; // Calculate overlap distance
    if (overlap > 0) {
        ball.x += normal_x * overlap; // Push ball out along the collision normal
        ball.y += normal_y * overlap;
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1)); // Random index between 0 and i
        // Swap elements
        [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
    }
    return array;
}