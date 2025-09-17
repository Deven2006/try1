// --- Module Aliases ---
const { Engine, Render, Runner, World, Bodies, Composite } = Matter;

// --- Basic Setup ---
const engine = Engine.create();
const world = engine.world;
engine.world.gravity.y = 0.1;

const canvasContainer = document.getElementById('canvas-container');
const render = Render.create({
    element: canvasContainer,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#f0f8ff'
    }
});
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// --- Create Static Objects ---
const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true, render: { fillStyle: '#cccccc' } });
const leftWall = Bodies.rectangle(-10, 300, 20, 600, { isStatic: true, render: { fillStyle: '#cccccc' } });
const rightWall = Bodies.rectangle(810, 300, 20, 600, { isStatic: true, render: { fillStyle: '#cccccc' } });
World.add(world, [ground, leftWall, rightWall]);


// --- Interactivity Elements ---
const apiKeyInput = document.getElementById('api-key-input');
const aiPromptInput = document.getElementById('ai-prompt-input');
const aiCreateButton = document.getElementById('ai-create-button');
const gravitySlider = document.getElementById('gravity-slider');
const gravityValueSpan = document.getElementById('gravity-value');
const restitutionSlider = document.getElementById('restitution-slider');
const restitutionValueSpan = document.getElementById('restitution-value');

let currentRestitution = 1.0;

// --- Event Listeners for Sliders ---
gravitySlider.addEventListener('input', (e) => {
    engine.world.gravity.y = parseFloat(e.target.value);
    gravityValueSpan.textContent = parseFloat(e.target.value).toFixed(1);
});
restitutionSlider.addEventListener('input', (e) => {
    currentRestitution = parseFloat(e.target.value);
    restitutionValueSpan.textContent = currentRestitution.toFixed(1);
});

// --- Add Mouse Control ---
const mouse = Matter.Mouse.create(render.canvas);
const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});
World.add(world, mouseConstraint);

// --- NEW: AI Integration Logic ---
aiCreateButton.addEventListener('click', async () => {
    const userPrompt = aiPromptInput.value;
    const apiKey = apiKeyInput.value;

    if (!apiKey) {
        alert("Please enter your Google AI API key.");
        return;
    }
    if (!userPrompt) {
        alert("Please enter a description for the AI.");
        return;
    }

    aiCreateButton.textContent = "Thinking...";
    aiCreateButton.disabled = true;

    const instructions = await getInstructionsFromAI(userPrompt, apiKey);

    if (instructions) {
        createSceneFromAI(instructions);
    const candidate = data.candidates?.[0];
    const aiTextResponse = candidate?.content?.parts?.[0]?.text;

    if (!aiTextResponse) {
        throw new Error("AI response format is invalid or incomplete.");
    }

    }

    aiCreateButton.textContent = "Create with AI";
    aiCreateButton.disabled = false;
});

async function getInstructionsFromAI(userPrompt, apiKey) {
    const systemPrompt = `
        You are an AI assistant that converts a user's text description into a scene for a 2D physics engine.
        Analyze the user's prompt and return ONLY a valid JSON array of objects. Do not include any other text or markdown formatting.
        Each object must have these properties:
        - shape: "circle" or "rectangle".
        - color: a valid CSS color name (e.g., "red", "blue").
        - size: a number between 20 and 80.
        - restitution: a number between 0.1 (not bouncy) and 1.2 (very bouncy).
        - mass: a number between 1 (light) and 10 (heavy).

        Interpret descriptive words. For example:
        - "A heavy blue box" should have shape: "rectangle", color: "blue", mass: 10.
        - "A small, bouncy red ball" should have shape: "circle", color: "red", size: 20, restitution: 1.2.
        - "A normal green circle" should have default values like mass: 1, restitution: 0.7.
    `;

    const fullPrompt = systemPrompt + "\nUser prompt: " + userPrompt;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "contents": [{ "parts": [{ "text": fullPrompt }] }] })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiTextResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const jsonString = aiTextResponse.match(/\[.*\]/s);
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error calling AI API:", error);
        alert("There was an error. Please check your API key and the console for more details.");
        return null;
    }
}

function createSceneFromAI(instructions) {
    // Clear all existing non-static bodies
    Composite.allBodies(world).forEach(body => {
        if (!body.isStatic) {
            World.remove(world, body);
        }
    });

    instructions.forEach(obj => {
        const x = 100 + Math.random() * 600;
        const y = 50 + Math.random() * 100;
        let newObject;

        const options = {
            restitution: obj.restitution || currentRestitution,
            friction: 0.1,
            mass: obj.mass || 1,
            render: { fillStyle: obj.color || 'grey' }
        };

        if (obj.shape === 'circle') {
            newObject = Bodies.circle(x, y, obj.size / 2, options);
        } else { // Default to rectangle
            newObject = Bodies.rectangle(x, y, obj.size, obj.size, options);
        }
        World.add(world, newObject);
    });
}

// --- Main Render Loop for Speed Display ---
Matter.Events.on(render, 'afterRender', function() {
    const ctx = render.context;
    const bodies = Composite.allBodies(world);

    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    bodies.forEach(body => {
        if (!body.isStatic) {
            const speed = body.speed;
            const speedText = speed.toFixed(2);
            ctx.fillText(speedText, body.position.x, body.position.y - 30);
        }
    });
});