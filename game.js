// Game variables
let scene, camera, renderer;
let bird, pipes = [];
let gameStarted = false;
let gameOver = false;
let score = 0;
let velocity = 0;
let pipeSpeed = 0.05;
let pipeSpawnTimer = 0;
let pipeGap = 3.5;
let ground;

// Constants
const GRAVITY = 0.003;
const JUMP_FORCE = 0.12;
const PIPE_SPACING = 4;
const PIPE_WIDTH = 0.8;
const BIRD_SIZE = 0.4;

// Initialize Three.js scene
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    // Renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadow;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Create bird
    createBird();

    // Create ground
    createGround();

    // Event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameStarted && !gameOver) {
            jump();
        }
    });

    canvas.addEventListener('click', () => {
        if (gameStarted && !gameOver) {
            jump();
        }
    });

    canvas.addEventListener('touchstart', () => {
        if (gameStarted && !gameOver) {
            jump();
        }
    });

    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

function createBird() {
    const geometry = new THREE.SphereGeometry(BIRD_SIZE, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xFFFF00,
        metalness: 0.3,
        roughness: 0.4
    });
    bird = new THREE.Mesh(geometry, material);
    bird.castShadow = true;
    bird.position.set(-2, 0, 0);

    // Add eye
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0.25, 0.1, 0.3);
    bird.add(eye);

    // Add beak
    const beakGeometry = new THREE.ConeGeometry(0.12, 0.3, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.4, 0, 0);
    bird.add(beak);

    scene.add(bird);
}

function createGround() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({
        color: 0x90EE90,
        side: THREE.DoubleSide
    });
    ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -5;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createPipe(x) {
    const pipeGroup = new THREE.Group();

    const randomHeight = Math.random() * 3 - 1.5;

    // Top pipe
    const topHeight = 10;
    const topGeometry = new THREE.BoxGeometry(PIPE_WIDTH, topHeight, PIPE_WIDTH);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        metalness: 0.2,
        roughness: 0.8
    });
    const topPipe = new THREE.Mesh(topGeometry, topMaterial);
    topPipe.position.y = randomHeight + pipeGap / 2 + topHeight / 2;
    topPipe.castShadow = true;
    topPipe.receiveShadow = true;

    // Top pipe cap
    const capGeometry = new THREE.BoxGeometry(PIPE_WIDTH + 0.2, 0.4, PIPE_WIDTH + 0.2);
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 });
    const topCap = new THREE.Mesh(capGeometry, capMaterial);
    topCap.position.y = randomHeight + pipeGap / 2;
    topCap.castShadow = true;

    // Bottom pipe
    const bottomHeight = 10;
    const bottomGeometry = new THREE.BoxGeometry(PIPE_WIDTH, bottomHeight, PIPE_WIDTH);
    const bottomMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        metalness: 0.2,
        roughness: 0.8
    });
    const bottomPipe = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottomPipe.position.y = randomHeight - pipeGap / 2 - bottomHeight / 2;
    bottomPipe.castShadow = true;
    bottomPipe.receiveShadow = true;

    // Bottom pipe cap
    const bottomCap = new THREE.Mesh(capGeometry, capMaterial);
    bottomCap.position.y = randomHeight - pipeGap / 2;
    bottomCap.castShadow = true;

    pipeGroup.add(topPipe);
    pipeGroup.add(topCap);
    pipeGroup.add(bottomPipe);
    pipeGroup.add(bottomCap);
    pipeGroup.position.x = x;

    pipeGroup.userData = {
        scored: false,
        gapCenter: randomHeight
    };

    scene.add(pipeGroup);
    pipes.push(pipeGroup);
}

function jump() {
    velocity = JUMP_FORCE;

    // Rotate bird up
    bird.rotation.z = Math.PI / 6;
}

function startGame() {
    gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    createPipe(5);
}

function restartGame() {
    // Reset variables
    gameOver = false;
    score = 0;
    velocity = 0;
    pipeSpawnTimer = 0;

    // Reset bird position
    bird.position.y = 0;
    bird.rotation.z = 0;

    // Remove all pipes
    pipes.forEach(pipe => scene.remove(pipe));
    pipes = [];

    // Update UI
    document.getElementById('score').textContent = '0';
    document.getElementById('gameOver').style.display = 'none';

    // Create first pipe
    createPipe(5);
}

function checkCollision() {
    // Check ground and ceiling collision
    if (bird.position.y < -4.5 + BIRD_SIZE || bird.position.y > 5 - BIRD_SIZE) {
        return true;
    }

    // Check pipe collision
    for (let pipe of pipes) {
        const pipeX = pipe.position.x;
        const birdX = bird.position.x;

        // Check if bird is within pipe's x range
        if (birdX + BIRD_SIZE > pipeX - PIPE_WIDTH / 2 &&
            birdX - BIRD_SIZE < pipeX + PIPE_WIDTH / 2) {

            const gapTop = pipe.userData.gapCenter + pipeGap / 2;
            const gapBottom = pipe.userData.gapCenter - pipeGap / 2;

            // Check if bird is outside the gap
            if (bird.position.y + BIRD_SIZE > gapTop ||
                bird.position.y - BIRD_SIZE < gapBottom) {
                return true;
            }
        }
    }

    return false;
}

function updateScore() {
    for (let pipe of pipes) {
        if (!pipe.userData.scored && pipe.position.x < bird.position.x) {
            pipe.userData.scored = true;
            score++;
            document.getElementById('score').textContent = score;
        }
    }
}

function endGame() {
    gameOver = true;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted && !gameOver) {
        // Apply gravity
        velocity -= GRAVITY;
        bird.position.y += velocity;

        // Rotate bird based on velocity
        bird.rotation.z = Math.max(-Math.PI / 3, Math.min(Math.PI / 2, velocity * 5));

        // Move pipes
        pipes.forEach(pipe => {
            pipe.position.x -= pipeSpeed;
        });

        // Remove off-screen pipes
        if (pipes.length > 0 && pipes[0].position.x < -10) {
            scene.remove(pipes[0]);
            pipes.shift();
        }

        // Spawn new pipes
        pipeSpawnTimer += pipeSpeed;
        if (pipeSpawnTimer > PIPE_SPACING) {
            createPipe(10);
            pipeSpawnTimer = 0;
        }

        // Check collisions
        if (checkCollision()) {
            endGame();
        }

        // Update score
        updateScore();
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the game
init();
