// --- Module Aliases ---
// These are shortcuts to make the code easier to read.
const { Engine, Render, Runner, World, Bodies } = Matter;

// --- Basic Setup ---
// Create the physics engine

const engine = Engine.create();
const world = engine.world;
engine.world.gravity.y = 0.1; // This is the default. Try changing it!

// Get the container for our canvas
const canvasContainer = document.getElementById('canvas-container');

// Create the renderer which will draw the animation
const render = Render.create({
    element: canvasContainer,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false, // Set to false to see solid shapes and colors
        background: '#f0f8ff'
    }
});

// Run the renderer and the engine
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// --- Create Static Objects (Ground and Walls) ---
// These objects don't move and will contain our shapes.
const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
const leftWall = Bodies.rectangle(-10, 300, 20, 600, { isStatic: true });
const rightWall = Bodies.rectangle(810, 300, 20, 600, { isStatic: true });

// Add these static objects to our world
World.add(world, [ground, leftWall, rightWall]);

// --- Interactivity ---
// Get references to the input box and button from our HTML
const textInput = document.getElementById('text-input');
const createButton = document.getElementById('create-button');
// --- NEW: Get references to the sliders and their value displays ---
const gravitySlider = document.getElementById('gravity-slider');
const gravityValueSpan = document.getElementById('gravity-value');
const restitutionSlider = document.getElementById('restitution-slider');
const restitutionValueSpan = document.getElementById('restitution-value');

// --- NEW: Variable to hold the bounciness value from the slider ---
let currentRestitution = 1.0;

// This function runs when the "Create Object" button is clicked
// (Removed duplicate event listener below)

// --- NEW: Event listener for the Gravity slider ---
gravitySlider.addEventListener('input', (event) => {
    const newGravity = parseFloat(event.target.value);
    engine.world.gravity.y = newGravity;
    gravityValueSpan.textContent = newGravity.toFixed(1);
});

// --- NEW: Event listener for the Bounciness slider ---
restitutionSlider.addEventListener('input', (event) => {
    currentRestitution = parseFloat(event.target.value);
    restitutionValueSpan.textContent = currentRestitution.toFixed(1);
});

// This function runs when the "Create Object" button is clicked
createButton.addEventListener('click', () => {
    const text = textInput.value;

    // Only create an object if the user has typed something
    if (text.trim()!== '') {
        // Create a new animated object based on the text
        createObjectFromText(text);
        
        // Clear the input box for the next entry
        textInput.value = '';
        textInput.focus();
    }
});
// --- Add Mouse Control ---
const mouse = Matter.Mouse.create(render.canvas);
const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

World.add(world, mouseConstraint);
// Function to create a new object and add it to the world
function createObjectFromText(text) {
    // We'll use the length of the text to determine the object's size
    const size = Math.max(20, text.length * 5);
    
    // Pick a random horizontal position at the top of the canvas
    const x = 100 + Math.random() * 600;
    const y = 50;


    // Create a new circle body with physics properties, using current restitution
    const newObject = Bodies.circle(x, y, size / 2, {
        restitution: currentRestitution, // Use slider value
        friction: 0,
        render: {
            fillStyle: `hsl(${Math.random() * 360}, 70%, 50%)` // Give it a random color
        }
    });
// --- Initialize slider and value for gravity ---
gravitySlider.value = engine.world.gravity.y;
gravityValueSpan.textContent = engine.world.gravity.y.toFixed(1);
// --- Initialize slider and value for restitution ---
restitutionSlider.value = currentRestitution;
restitutionValueSpan.textContent = currentRestitution.toFixed(1);

    // Add the new object to our physics world
    World.add(world, newObject);
}

// --- NEW: Helper function to draw an arrow on the canvas ---
function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth, color) {
    const headlen = 10;
    const angle = Math.atan2(toy - fromy, tox - fromx);

    ctx.save();
    ctx.strokeStyle = color;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = arrowWidth;
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7), toy - headlen * Math.sin(angle + Math.PI / 7));
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));
    ctx.stroke();
    ctx.restore();
}


// --- Show Speed and Forces on Each Ball ---
Matter.Events.on(render, 'afterRender', function() {
    const ctx = render.context;
    world.bodies.forEach(body => {
        if (!body.isStatic && body.circleRadius) {
            // --- Draw Speed Text ---
            const speed = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
            ctx.save();
            ctx.font = '16px Arial';
            ctx.fillStyle = '#222';
            ctx.textAlign = 'left';
            ctx.fillText('Speed: ' + speed.toFixed(2), body.position.x + body.circleRadius + 8, body.position.y);
            ctx.restore();

            // --- NEW: Draw Gravity Vector ---
            const startPoint = body.position;
            // The length of the arrow is proportional to the gravity strength
            const endPoint = {
                x: body.position.x,
                y: body.position.y + (engine.world.gravity.y * 50) 
            };
            drawArrow(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y, 3, 'red');
        }
    });
});





