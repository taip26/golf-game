/* Canvas calculations and references */
const canvas = document.getElementById("canvas");
const originalHeight = canvas.height;
const originalWidth = canvas.width;

/* Ball calculations and references */
var ball;
const delay = 16; // ms
const gravity = 6; // px/s^2
const coeff = 0.004; // air resistence


function init() {
    initBoxDimensions();
    ball = new Ball(10);
    ball.draw(canvas.width/2, canvas.height/2);
    console.log(checkYCollision());
    let interval = setInterval(updateCanvas, delay);
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
}

function moveBall() {
    ball.xVel = 5;
    // ball.yVel = 1;
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
    if (checkXCollision()) {
        ball.xVel = -ball.xVel;
    }
    if (checkYCollision()) {
        ball.yVel = -ball.yVel;
    }
    // Calculate acceleration due to gravity
    ball.yVel = ball.yVel + (gravity * delay/1000);
    
    // Add "air resistance"
    if (ball.y > 0) {
        if (ball.yVel < 0) {
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
    let x = ball.x + ball.xVel;
    let y = ball.y + ball.yVel;

    ball.move(x,y)
}

function checkXCollision() {
    if (ball.x - ball.radius <= 0) {
        ball.move(ball.radius, ball.y);
        return true;
    }
    if (ball.x + ball.radius >= canvas.width) {
        ball.move(canvas.width - ball.radius, ball.y);
        return true;
    }
    return false;
}

function checkYCollision() {
    if (ball.y - ball.radius <= 0) {
        ball.move(ball.x, ball.radius);
        return true;
    }
    if (ball.y + ball.radius >= canvas.height) {
        ball.move(ball.x, canvas.height - ball.radius);
        return true;
    }
    return false;
}
