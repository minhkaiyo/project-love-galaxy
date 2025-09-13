// OrbitControls implementation
THREE.OrbitControls = function (object, domElement) {
    this.object = object;
    this.domElement = domElement;
    this.enabled = true;
    this.target = new THREE.Vector3();

    this.minDistance = 10;
    this.maxDistance = 200;
    this.enableDamping = true;
    this.dampingFactor = 0.05;

    let spherical = new THREE.Spherical();
    let sphericalDelta = new THREE.Spherical();
    let scale = 1;
    let panOffset = new THREE.Vector3();
    let rotateStart = new THREE.Vector2();
    let rotateEnd = new THREE.Vector2();
    let rotateDelta = new THREE.Vector2();

    const scope = this;

    function handleMouseMoveRotate(event) {
        rotateEnd.set(event.clientX, event.clientY);
        rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(0.005);
        sphericalDelta.theta -= rotateDelta.x;
        sphericalDelta.phi -= rotateDelta.y;
        rotateStart.copy(rotateEnd);
        scope.update();
    }

    function handleMouseDown(event) {
        rotateStart.set(event.clientX, event.clientY);
        document.addEventListener('mousemove', handleMouseMoveRotate);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMoveRotate);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function handleMouseWheel(event) {
        if (event.deltaY < 0) {
            scale *= 0.95;
        } else {
            scale *= 1.05;
        }
        scope.update();
    }

    this.domElement.addEventListener('mousedown', handleMouseDown);
    this.domElement.addEventListener('wheel', handleMouseWheel);

    // Sửa lỗi trong hàm update của OrbitControls
    this.update = function () {
        const offset = new THREE.Vector3();
        const quat = new THREE.Quaternion().setFromUnitVectors(
            object.up, new THREE.Vector3(0, 1, 0)
        );
        const quatInverse = quat.clone().invert(); // Sửa lỗi: tạo copy trước khi invert
        const position = scope.object.position;

        offset.copy(position).sub(scope.target);
        offset.applyQuaternion(quat);
        spherical.setFromVector3(offset);

        spherical.theta += sphericalDelta.theta;
        spherical.phi += sphericalDelta.phi;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        spherical.radius *= scale;
        spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

        scope.target.add(panOffset);
        offset.setFromSpherical(spherical);
        offset.applyQuaternion(quatInverse); // Sử dụng quatInverse thay vì quat.invert()
        position.copy(scope.target).add(offset);
        scope.object.lookAt(scope.target);

        if (scope.enableDamping) {
            sphericalDelta.theta *= (1 - scope.dampingFactor);
            sphericalDelta.phi *= (1 - scope.dampingFactor);
        } else {
            sphericalDelta.set(0, 0, 0);
        }

        scale = 1;
        panOffset.set(0, 0, 0);
    };

    this.update();
};

// Biến toàn cục
let scene, camera, renderer, controls;
let planet, textRings = [], particles;
let clock = new THREE.Clock();
let ringGroup, glowSphere;
let hearts3D = [];
let shootingStars = [];
let imageSprites = [];
let sparklingStars = [];
let floatingHearts = [];
let rotationSpeed = 1;
let brightnessLevel = 2.0;
let numShootingStars = 5;

// Khởi tạo cảnh
function init() {
    // Tạo scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 100, 300);

    // Tạo camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 10, 30);

    // Tạo renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // Thêm ánh sáng
    setupLights();

    // Tạo hành tinh trung tâm
    createPlanet();



    // Tạo các vòng chữ
    createTextRings();

    // Tạo trường sao nền
    createStarfield();

    // Tạo trái tim 3D
    create3DHearts();


    // Tạo ảnh bay quanh
    createImageSprites();

    // Tạo sao lấp lánh
    createSparklingStars();

    // Tạo trái tim bay
    createFloatingHearts();

    createShootingStarSystem();


    integrateSimpleMusicSystem();
    createEnhancedAuroraBackground();

    // Thêm điều khiển
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 200;
    controls.enabled = false; // Tắt trong lúc intro
    // Xử lý sự kiện
    setupEventListeners();
    setupPanelControls();
    startCameraShow();
    addCameraShowButton();
    initRainSystem();

    // Ẩn loading
    document.querySelector('.loading').style.display = 'none';
    // Bắt đầu animation
    animate();
}

// Thiết lập ánh sáng
function setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ánh sáng hồng chính
    const pinkLight = new THREE.PointLight(0xff69b4, 2, 50);
    pinkLight.position.set(0, 0, 10);
    scene.add(pinkLight);

    // Ánh sáng tím phụ
    const purpleLight = new THREE.PointLight(0x9400d3, 1, 40);
    purpleLight.position.set(-10, 5, -10);
    scene.add(purpleLight);

    // Ánh sáng động
    const movingLight = new THREE.PointLight(0xffffff, 0.5, 30);
    movingLight.name = 'movingLight';
    scene.add(movingLight);
}

// Tạo hành tinh trung tâm
function createPlanet() {
    const geometry = new THREE.SphereGeometry(4, 80, 80);

    // Load ảnh làm texture
    const loader = new THREE.TextureLoader();
    const planetTexture = loader.load(
        'https://symbols.vn/wp-content/uploads/2021/12/Anh-nen-laptop-Anime-dep-chat-luong-cao-1.jpg', // Thay bằng đường dẫn ảnh của bạn
        function (texture) {
            console.log('Texture loaded successfully');
        },
        function (progress) {
            console.log('Loading progress:', progress);
        },
        function (error) {
            console.error('Error loading texture:', error);
        }
    );



    // Material cầu vồng đơn giản hơn
    const material = new THREE.MeshPhongMaterial({
        color: 0xff69b4,
        transparent: true,
        opacity: 0.9,
        shininess: 100,
        emissive: 0xff1493,
        emissiveIntensity: 1.2, // Độ sáng ban đầu - thay đổi giá trị này (0.1 - 3.0)
        specular: 0xffffff
    });

    planet = new THREE.Mesh(geometry, material);

    // Thêm hiệu ứng cầu vồng bằng cách thay đổi màu theo thời gian
    planet.userData.rainbowColors = [
        0xff0080, // Hồng đậm
        0x4000ff, // Tím xanh
        0x8000ff, // Tím
        0xff0040  // Hồng
    ];
    planet.userData.colorIndex = 0;
    planet.userData.colorTransition = 0;
    planet = new THREE.Mesh(geometry, material);
    planet.castShadow = true;
    planet.receiveShadow = true;
    scene.add(planet);

    // Hào quang
    const glowGeometry = new THREE.SphereGeometry(4.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff69b4,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowSphere);

    // Vành đai
    createPlanetRings();

    createPlanetParticles();

}


// Tạo vành đai hành tinh
function createPlanetRings() {
    ringGroup = new THREE.Group();

    const ringConfigs = [
        { inner: 5.5, outer: 7.5, color: 0xffb6c1, opacity: 0.6 },
        { inner: 8, outer: 8.8, color: 0xff69b4, opacity: 0.4 },
        { inner: 4.8, outer: 5.2, color: 0xffc0cb, opacity: 0.3 }
    ];

    ringConfigs.forEach(config => {
        const geometry = new THREE.RingGeometry(config.inner, config.outer, 64);
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: config.opacity,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2;
        ringGroup.add(ring);
    });

    scene.add(ringGroup);
}

// Tạo particles quanh hành tinh
function createPlanetParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const radius = 6 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;

        sizes[i] = Math.random() * 0.3 + 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    planet.particles = new THREE.Points(geometry, material);
    scene.add(planet.particles);
}

// Tạo vòng chữ
function createTextRings() {
    const ringConfigs = [
        { radius: 12, text: "💖 I LOVE YOU 💖", color: '#ff1493', fontSize: 120, yOffset: 2 },
        { radius: 16, text: "✨ FOREVER ✨", color: '#ff69b4', fontSize: 100, yOffset: -1 },
        { radius: 20, text: "💕 YOU & ME 💕", color: '#ffb6c1', fontSize: 80, yOffset: 1.5 }
    ];

    ringConfigs.forEach((config, i) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 3072;
        canvas.height = 512;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, config.color);
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, config.color);

        context.shadowColor = config.color;
        context.shadowBlur = 20;
        context.fillStyle = gradient;
        context.font = `Bold ${config.fontSize}px "Comic Sans MS", cursive`;
        context.textAlign = 'left';
        context.textBaseline = 'middle';

        const textMetrics = context.measureText(config.text);
        const spacing = textMetrics.width + 100;
        const repeatCount = Math.ceil(canvas.width / spacing) + 1;

        for (let j = 0; j < repeatCount; j++) {
            context.fillText(config.text, j * spacing, canvas.height / 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const geometry = new THREE.TorusGeometry(config.radius, 0.8, 20, 100);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.y = config.yOffset;
        ring.rotation.x = Math.PI / 2;

        ring.userData = {
            speed: 0.005 + Math.random() * 0.005,
            floatSpeed: 0.5 + Math.random() * 0.5,
            floatAmplitude: 0.5,
            originalY: config.yOffset,
            textureSpeed: 0.0005
        };

        scene.add(ring);
        textRings.push(ring);
    });
}

// Tạo trường sao nền
function createStarfield() {
    const particlesCount = 8000; // Tăng số lượng sao
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount; i++) {
        const radius = 50 + Math.random() * 200; // Mở rộng phạm vi
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        if (Math.random() < 0.4) { // Nhiều sao hồng hơn
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
            colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
        } else {
            colors[i * 3] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 2] = 1;
        }

        sizes[i] = Math.random() * 0.8 + 0.1; // Sao to hơn
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.4, // Tăng kích thước
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    // Thêm vào cuối hàm createStarfield(), trước scene.add(particles):
    particles = new THREE.Points(geometry, material);

    // Lưu trữ colors gốc để tối ưu animation
    particles.userData.originalColors = new Float32Array(colors.length);
    for (let i = 0; i < colors.length; i++) {
        particles.userData.originalColors[i] = colors[i];
    }
    particles.userData.colorUpdateCounter = 0;

    scene.add(particles);
}

// Tạo sao lấp lánh đặc biệt
function createSparklingStars() {
    const sparkleCount = 100;

    for (let i = 0; i < sparkleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(
                0.8 + Math.random() * 0.2, // Màu từ hồng đến tím
                1,
                0.5 + Math.random() * 0.5
            ),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const star = new THREE.Mesh(geometry, material);

        // Vị trí ngẫu nhiên xung quanh thiên hà
        const radius = 25 + Math.random() * 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        star.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );

        star.userData = {
            originalOpacity: material.opacity,
            twinkleSpeed: 1 + Math.random() * 3,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.05,
                z: (Math.random() - 0.5) * 0.05
            }
        };

        sparklingStars.push(star);
        scene.add(star);
    }
}

// Tạo trái tim 3D
function create3DHearts() {
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.5, y + 0.5);
    heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    heartShape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    heartShape.bezierCurveTo(x + 1.3, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1, y);
    heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);

    const extrudeSettings = {
        depth: 0.4,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.1,
        bevelThickness: 0.1
    };

    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);

    for (let i = 0; i < 200; i++) { // Tăng số lượng trái tim
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(0.95 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.2),
            emissive: 0xff1493,
            emissiveIntensity: 0.4, // Tăng độ phát sáng
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        const heart = new THREE.Mesh(geometry, material);

        const scale = 0.2 + Math.random() * 0.6; // Đa dạng kích thước hơn
        heart.scale.set(scale, scale, scale);

        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 30;
        const height = (Math.random() - 0.5) * 25;

        heart.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );

        heart.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        heart.userData = {
            orbitSpeed: 0.001 + Math.random() * 0.002,
            floatSpeed: 0.8 + Math.random() * 1.0, // Chậm hơn
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01, // Xoay chậm hơn
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            originalPosition: heart.position.clone(),
            orbitRadius: radius,
            orbitAngle: angle,
            pulseSpeed: 0.8 + Math.random() * 1.0 // Chậm hơn nhiều (từ 2-5 xuống 0.8-1.8)
        };

        hearts3D.push(heart);
        scene.add(heart);
    }
}

// Tạo trái tim bay nhỏ
function createFloatingHearts() {
    const heartCount = 300; // Nhiều trái tim bay

    for (let i = 0; i < heartCount; i++) {
        // Tạo trái tim đơn giản bằng hình cầu
        const geometry = new THREE.SphereGeometry(0.2, 12, 8);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(
                0.9 + Math.random() * 0.1,
                1,
                0.6 + Math.random() * 0.4
            ),
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        const heart = new THREE.Mesh(geometry, material);

        // Vị trí ban đầu ngẫu nhiên
        const radius = 20 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        heart.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            (Math.random() - 0.5) * 30,
            radius * Math.sin(phi) * Math.sin(theta)
        );

        // Tạo đường bay ngẫu nhiên
        heart.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            ),
            life: Math.random() * 10,
            maxLife: 10 + Math.random() * 5,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            }
        };

        floatingHearts.push(heart);
        scene.add(heart);
    }
}

// Hệ thống sao băng hoàn toàn mới
let shootingStarSystem = {
    stars: [],
    maxStars: 5,
    spawnTimer: 0,
    spawnInterval: 1500 // milliseconds
};

function createShootingStarSystem() {
    console.log('Khởi tạo hệ thống sao băng mới...');

    // Xóa sao băng cũ nếu có
    shootingStars.forEach(star => {
        if (star.geometry) star.geometry.dispose();
        if (star.material) star.material.dispose();
        scene.remove(star);
    });
    shootingStars.length = 0;

    // Tạo pool sao băng
    for (let i = 0; i < 10; i++) {
        const star = createSingleShootingStar();
        star.visible = false;
        shootingStarSystem.stars.push(star);
        scene.add(star);
    }

    console.log('Đã tạo pool 10 sao băng');
}

function createSingleShootingStar() {
    const group = new THREE.Group();

    // Đầu sao băng - hình cầu sáng
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    group.add(head);

    // Đuôi sao băng - line với gradient
    const tailLength = 25;
    const tailPositions = new Float32Array(tailLength * 3);
    const tailColors = new Float32Array(tailLength * 3);

    for (let i = 0; i < tailLength; i++) {
        tailPositions[i * 3] = 0;
        tailPositions[i * 3 + 1] = 0;
        tailPositions[i * 3 + 2] = -i * 0.5;

        const intensity = Math.pow(1 - i / tailLength, 2);
        tailColors[i * 3] = intensity;     // R
        tailColors[i * 3 + 1] = intensity * 0.8; // G
        tailColors[i * 3 + 2] = intensity; // B
    }

    const tailGeometry = new THREE.BufferGeometry();
    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));

    const tailMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        linewidth: 2
    });

    const tail = new THREE.Line(tailGeometry, tailMaterial);
    group.add(tail);

    // Lưu reference để dễ cập nhật
    group.userData = {
        head: head,
        tail: tail,
        tailPositions: tailPositions,
        active: false,
        speed: 0,
        direction: new THREE.Vector3(),
        life: 0,
        maxLife: 3
    };

    return group;
}

function spawnShootingStar() {
    // Tìm sao băng không active
    const availableStar = shootingStarSystem.stars.find(star => !star.userData.active);
    if (!availableStar) return;

    // Đặt vị trí bắt đầu (từ rìa màn hình)
    const side = Math.random() * 4; // 4 phía
    let startPos = new THREE.Vector3();
    let direction = new THREE.Vector3();

    if (side < 1) { // Từ trên
        startPos.set(
            (Math.random() - 0.5) * 100,
            60 + Math.random() * 20,
            (Math.random() - 0.5) * 100
        );
        direction.set(
            (Math.random() - 0.5) * 0.5,
            -0.7 - Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
        );
    } else if (side < 2) { // Từ trái
        startPos.set(
            -80 - Math.random() * 20,
            30 + Math.random() * 20,
            (Math.random() - 0.5) * 60
        );
        direction.set(
            0.8 + Math.random() * 0.2,
            -0.3 - Math.random() * 0.2,
            (Math.random() - 0.5) * 0.3
        );
    } else if (side < 3) { // Từ phải
        startPos.set(
            80 + Math.random() * 20,
            30 + Math.random() * 20,
            (Math.random() - 0.5) * 60
        );
        direction.set(
            -0.8 - Math.random() * 0.2,
            -0.3 - Math.random() * 0.2,
            (Math.random() - 0.5) * 0.3
        );
    } else { // Từ sau
        startPos.set(
            (Math.random() - 0.5) * 60,
            30 + Math.random() * 20,
            80 + Math.random() * 20
        );
        direction.set(
            (Math.random() - 0.5) * 0.3,
            -0.3 - Math.random() * 0.2,
            -0.8 - Math.random() * 0.2
        );
    }

    // Thiết lập sao băng
    availableStar.position.copy(startPos);
    availableStar.userData.direction = direction.normalize();
    availableStar.userData.speed = 60 + Math.random() * 40;
    availableStar.userData.active = true;
    availableStar.userData.life = 0;
    availableStar.userData.maxLife = 2 + Math.random() * 2;
    availableStar.visible = true;

    // Xoay sao băng theo hướng bay
    availableStar.lookAt(
        availableStar.position.x + direction.x,
        availableStar.position.y + direction.y,
        availableStar.position.z + direction.z
    );

    console.log('Đã spawn sao băng');
}

function updateShootingStarSystem(deltaTime) {
    // Spawn sao băng mới theo interval
    shootingStarSystem.spawnTimer += deltaTime * 1000;
    if (shootingStarSystem.spawnTimer >= shootingStarSystem.spawnInterval) {
        spawnShootingStar();
        shootingStarSystem.spawnTimer = 0;
        // Random interval cho lần tiếp theo
        shootingStarSystem.spawnInterval = 800 + Math.random() * 1500;
    }

    // Cập nhật từng sao băng
    shootingStarSystem.stars.forEach(star => {
        if (!star.userData.active) return;

        const userData = star.userData;

        // Di chuyển
        const movement = userData.direction.clone().multiplyScalar(userData.speed * deltaTime);
        star.position.add(movement);

        // Cập nhật đuôi
        updateShootingStarTail(star);

        // Cập nhật tuổi thọ
        userData.life += deltaTime;

        // Fade out khi gần hết đời
        const fadeStart = userData.maxLife * 0.7;
        if (userData.life > fadeStart) {
            const fadeProgress = (userData.life - fadeStart) / (userData.maxLife - fadeStart);
            const opacity = 1 - fadeProgress;
            userData.head.material.opacity = opacity;
            userData.tail.material.opacity = opacity * 0.8;
        }

        // Deactivate khi hết đời hoặc bay quá xa
        if (userData.life > userData.maxLife || star.position.length() > 200) {
            userData.active = false;
            star.visible = false;
            userData.head.material.opacity = 1;
            userData.tail.material.opacity = 0.8;
        }
    });
}

function updateShootingStarTail(star) {
    const tail = star.userData.tail;
    const positions = star.userData.tailPositions;

    // Dịch chuyển các điểm đuôi
    for (let i = positions.length - 3; i >= 3; i -= 3) {
        positions[i] = positions[i - 3];
        positions[i + 1] = positions[i - 2];
        positions[i + 2] = positions[i - 1];
    }

    // Điểm đầu luôn ở vị trí head (local coordinate)
    positions[0] = 0;
    positions[1] = 0;
    positions[2] = 0;

    tail.geometry.attributes.position.needsUpdate = true;
}

function setShootingStarCount(count) {
    shootingStarSystem.maxStars = Math.max(1, Math.min(10, count));
    numShootingStars = shootingStarSystem.maxStars;
    console.log('Số sao băng tối đa:', shootingStarSystem.maxStars);
}


// Tạo ảnh bay quanh
function createImageSprites() {
    const loader = new THREE.TextureLoader();

    // Tạo texture cho emoji trái tim
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;

    context.font = '80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ff69b4';
    context.fillText('💗', 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < 20; i++) { // Nhiều sprite hơn
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1.5, 1.5, 1);

        const angle = (i / 20) * Math.PI * 2;
        const radius = 8 + Math.random() * 6;

        sprite.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 6,
            Math.sin(angle) * radius
        );

        sprite.userData = {
            orbitSpeed: 0.005 + Math.random() * 0.01,
            floatSpeed: 1 + Math.random(),
            orbitRadius: radius,
            orbitAngle: angle,
            originalY: sprite.position.y
        };

        imageSprites.push(sprite);
        scene.add(sprite);
    }
}



// Xử lý sự kiện
function setupEventListeners() {

    // Điều khiển tốc độ xoay
    const rotationSlider = document.getElementById('rotation');
    const rotationValue = document.getElementById('rotation-value');
    rotationSlider.addEventListener('input', (e) => {
        rotationSpeed = parseFloat(e.target.value);
        rotationValue.textContent = rotationSpeed.toFixed(1);
    });

    // Điều khiển số sao băng
    const shootingSlider = document.getElementById('shooting-stars');
    const shootingValue = document.getElementById('shooting-value');
    shootingSlider.addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        shootingValue.textContent = newCount;

        shootingStars.forEach(star => {
            if (star.geometry) star.geometry.dispose();
            if (star.material) star.material.dispose();
            scene.remove(star);
        });
        shootingStars.length = 0; // Clear array

    });

    // Điều khiển tốc độ Aurora
    const auroraSpeedSlider = document.getElementById('aurora-speed');
    const auroraSpeedValue = document.getElementById('aurora-speed-value');
    if (auroraSpeedSlider && auroraSpeedValue) {
        auroraSpeedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            setAuroraSpeed(speed);
            auroraSpeedValue.textContent = speed.toFixed(1);
        });
    }

    // Toggle bật/tắt Aurora background
    const auroraToggle = document.getElementById('aurora-toggle');
    if (auroraToggle) {
        auroraToggle.addEventListener('change', (e) => {
            toggleAuroraBackground(e.target.checked);
        });
    }


    // Điều khiển độ sáng
    const brightnessSlider = document.getElementById('brightness');
    const brightnessValue = document.getElementById('brightness-value');
    brightnessSlider.addEventListener('input', (e) => {
        brightnessLevel = parseFloat(e.target.value);
        brightnessValue.textContent = brightnessLevel.toFixed(2);
        renderer.toneMappingExposure = brightnessLevel;
    });

    document.getElementById('reset').addEventListener('click', () => {
        rotationSpeed = 1;
        brightnessLevel = 2;
        numShootingStars = 5;

        rotationSlider.value = 1;
        rotationValue.textContent = '1';
        brightnessSlider.value = 2.0;
        brightnessValue.textContent = '2.0';
        shootingSlider.value = 5;
        shootingValue.textContent = '5';

        renderer.toneMappingExposure = 1.5;

        // Cleanup và tạo lại sao băng với proper disposal
        shootingStars.forEach(star => {
            if (star.geometry) star.geometry.dispose();
            if (star.material) star.material.dispose();
            scene.remove(star);
        });
        shootingStars.length = 0;


        // Cập nhật UI
        const auroraSpeedSlider = document.getElementById('aurora-speed');
        const auroraSpeedValue = document.getElementById('aurora-speed-value');
        const auroraToggle = document.getElementById('aurora-toggle');

        if (auroraSpeedSlider) auroraSpeedSlider.value = 0.5;
        if (auroraSpeedValue) auroraSpeedValue.textContent = '0.5';
        if (auroraToggle) auroraToggle.checked = true;
        resetAuroraSettings();
    });

    // Nút nhạc nền (placeholder)
    // Nút nhạc nền - sử dụng toggleMusic function
    const musicBtn = document.getElementById('toggle-music');
    if (musicBtn) {
        musicBtn.addEventListener('click', toggleMusic);
    }

    setupAuroraControls();
    // Xử lý thay đổi kích thước cửa sổ
    window.addEventListener('resize', onWindowResize);

    function setupAuroraControls() {
        // Độ sáng Aurora
        const brightnessSlider = document.getElementById('aurora-brightness');
        const brightnessValue = document.getElementById('aurora-brightness-value');
        if (brightnessSlider && brightnessValue) {
            brightnessSlider.addEventListener('input', (e) => {
                const brightness = parseFloat(e.target.value);
                setAuroraBrightness(brightness);
                brightnessValue.textContent = brightness.toFixed(1);
            });
        }

        // Chế độ màu Aurora
        const colorModeSelect = document.getElementById('aurora-color-mode');
        if (colorModeSelect) {
            colorModeSelect.addEventListener('change', (e) => {
                setAuroraColorMode(e.target.value);
            });
        }

        // Cường độ màu
        const intensitySlider = document.getElementById('aurora-color-intensity');
        const intensityValue = document.getElementById('aurora-color-intensity-value');
        if (intensitySlider && intensityValue) {
            intensitySlider.addEventListener('input', (e) => {
                const intensity = parseFloat(e.target.value);
                setAuroraColorIntensity(intensity);
                intensityValue.textContent = intensity.toFixed(1);
            });
        }

        // Biên độ sóng
        const waveSlider = document.getElementById('aurora-wave-amplitude');
        const waveValue = document.getElementById('aurora-wave-amplitude-value');
        if (waveSlider && waveValue) {
            waveSlider.addEventListener('input', (e) => {
                const amplitude = parseFloat(e.target.value);
                setAuroraWaveAmplitude(amplitude);
                waveValue.textContent = amplitude.toFixed(1);
            });
        }

        // Toggle Aurora
        const auroraToggle = document.getElementById('aurora-toggle');
        if (auroraToggle) {
            auroraToggle.addEventListener('change', (e) => {
                toggleAuroraBackground(e.target.checked);
            });
        }
    }

    /**
     * Reset Aurora settings
     */
    function resetAuroraSettings() {
        setAuroraBrightness(0.5);
        setAuroraColorMode('rainbow');
        setAuroraColorIntensity(0.5);
        setAuroraWaveAmplitude(1.0);

        // Cập nhật UI
        const brightnessSlider = document.getElementById('aurora-brightness');
        const brightnessValue = document.getElementById('aurora-brightness-value');
        const colorModeSelect = document.getElementById('aurora-color-mode');
        const intensitySlider = document.getElementById('aurora-color-intensity');
        const intensityValue = document.getElementById('aurora-color-intensity-value');
        const waveSlider = document.getElementById('aurora-wave-amplitude');
        const waveValue = document.getElementById('aurora-wave-amplitude-value');
        const auroraToggle = document.getElementById('aurora-toggle');

        if (brightnessSlider) brightnessSlider.value = 1.0;
        if (brightnessValue) brightnessValue.textContent = '1.0';
        if (colorModeSelect) colorModeSelect.value = 'rainbow';
        if (intensitySlider) intensitySlider.value = 1.0;
        if (intensityValue) intensityValue.textContent = '1.0';
        if (waveSlider) waveSlider.value = 1.0;
        if (waveValue) waveValue.textContent = '1.0';
        if (auroraToggle) auroraToggle.checked = true;
    }


}

// Xử lý thay đổi kích thước cửa sổ
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Vòng lặp animation chính
function animate() {
    requestAnimationFrame(animate);


    const elapsedTime = clock.getElapsedTime();
    const deltaTime = clock.getDelta();
    updateEnhancedAuroraBackground(elapsedTime);
    updateNebulaClouds(elapsedTime, deltaTime);
    updateAuroraParticles(elapsedTime);
    updateHeartFramedImages(elapsedTime, rotationSpeed);
    updateShootingStarSystem(deltaTime);
    updateFlowerRain(elapsedTime)

    // Xoay hành tinh trung tâm
    if (planet) {
        planet.rotation.y += 0.005 * rotationSpeed;
        planet.rotation.x += 0.002 * rotationSpeed;
        // Hiệu ứng nhấp nháy cho hành tinh với màu sắc thay đổi
        const pulseIntensity = 0.3 + Math.sin(elapsedTime * 2) * 0.1;
        planet.material.emissiveIntensity = pulseIntensity;

        // Thêm hiệu ứng đổi màu cầu vồng (chỉ thêm, không xóa code cũ)
        const hue = (elapsedTime * 0.1) % 1; // Chuyển màu chậm
        planet.material.color.setHSL(hue, 0.8, 0.6);
        planet.material.emissive.setHSL(hue, 0.8, 0.3);
    }

    // Xoay hào quang
    if (glowSphere) {
        glowSphere.rotation.y -= 0.003 * rotationSpeed;
        glowSphere.rotation.z += 0.001 * rotationSpeed;

        // Hiệu ứng thay đổi độ trong suốt
        glowSphere.material.opacity = 0.2 + Math.sin(elapsedTime * 1.5) * 0.1;
    }

    // Xoay vành đai
    if (ringGroup) {
        ringGroup.rotation.z += 0.0005 * rotationSpeed;
        ringGroup.children.forEach((ring, i) => {
            ring.rotation.z += (0.002 + i * 0.001) * rotationSpeed;
        });
    }

    // Cập nhật particles quanh hành tinh
    if (planet && planet.particles) {
        planet.particles.rotation.y += 0.005 * rotationSpeed;
        planet.particles.rotation.x += 0.0006 * rotationSpeed;
    }

    // Cập nhật vòng chữ
    textRings.forEach((ring, i) => {
        // Xoay và di chuyển texture
        ring.rotation.z += ring.userData.speed * rotationSpeed;
        if (ring.material.map) {
            ring.material.map.offset.x += ring.userData.textureSpeed * rotationSpeed;
        }

        // Hiệu ứng bay lơ lửng
        ring.position.y = ring.userData.originalY +
            Math.sin(elapsedTime * ring.userData.floatSpeed) * ring.userData.floatAmplitude;

        // Hiệu ứng thay đổi opacity
        ring.material.opacity = 0.8 + Math.sin(elapsedTime * 2 + i) * 0.1;
    });

    // Cập nhật trường sao (tối ưu hiệu suất)
    if (particles) {
        particles.rotation.y += 0.0005 * rotationSpeed;
        particles.rotation.x += 0.0002 * rotationSpeed;

        // Tối ưu: chỉ cập nhật colors mỗi 10 frames thay vì 5 frames
        if (!particles.userData.colorUpdateCounter) particles.userData.colorUpdateCounter = 0;
        particles.userData.colorUpdateCounter++;

        if (particles.userData.colorUpdateCounter % 10 === 0) {
            const colors = particles.geometry.attributes.color.array;
            const time = elapsedTime * 3;

            // Giảm batch size để tối ưu hơn
            const batchSize = Math.floor(colors.length / 20); // Từ 15 xuống 20
            const startIndex = (Math.floor(particles.userData.colorUpdateCounter / 10) % 20) * batchSize;
            const endIndex = Math.min(startIndex + batchSize, colors.length);

            for (let i = startIndex; i < endIndex; i += 3) {
                const originalR = particles.userData.originalColors[i];
                const originalG = particles.userData.originalColors[i + 1];
                const originalB = particles.userData.originalColors[i + 2];

                const twinkle = Math.sin(time + i * 0.1) * 0.3 + 0.7;
                colors[i] = originalR * twinkle;
                colors[i + 1] = originalG * twinkle;
                colors[i + 2] = originalB * twinkle;
            }
            particles.geometry.attributes.color.needsUpdate = true;
        }
    }

    // Cập nhật sao lấp lánh đặc biệt
    sparklingStars.forEach((star, i) => {
        // Hiệu ứng nhấp nháy
        const twinkle = Math.sin(elapsedTime * star.userData.twinkleSpeed + i) * 0.4 + 0.6;
        star.material.opacity = star.userData.originalOpacity * twinkle;

        // Xoay sao
        star.rotation.x += star.userData.rotationSpeed.x;
        star.rotation.y += star.userData.rotationSpeed.y;
        star.rotation.z += star.userData.rotationSpeed.z;

        // Hiệu ứng thay đổi kích thước
        const scale = 1 + Math.sin(elapsedTime * 2 + i * 0.5) * 0.5;
        star.scale.setScalar(scale);
    });

    // Cập nhật trái tim 3D
    hearts3D.forEach((heart, i) => {
        // Quỹ đạo xoay quanh trung tâm
        heart.userData.orbitAngle += heart.userData.orbitSpeed * rotationSpeed;
        const orbitX = Math.cos(heart.userData.orbitAngle) * heart.userData.orbitRadius;
        const orbitZ = Math.sin(heart.userData.orbitAngle) * heart.userData.orbitRadius;

        heart.position.x = orbitX;
        heart.position.z = orbitZ;

        // Hiệu ứng bay lơ lửng
        heart.position.y = heart.userData.originalPosition.y +
            Math.sin(elapsedTime * heart.userData.floatSpeed + i) * 2;

        // Xoay trái tim
        heart.rotation.x += heart.userData.rotationSpeed.x * rotationSpeed;
        heart.rotation.y += heart.userData.rotationSpeed.y * rotationSpeed;
        heart.rotation.z += heart.userData.rotationSpeed.z * rotationSpeed;

        const pulse = Math.sin(elapsedTime * heart.userData.pulseSpeed + i) * 0.1 + 0.9;
        heart.material.emissiveIntensity = 0.3 * pulse;

        // Hiệu ứng thay đổi kích thước rất nhẹ và chậm
        const heartScale = 1 + Math.sin(elapsedTime * 10 + i * 0.5) * 0.05;
        const baseScale = 0.2 + (i % 3) * 0.2; // Scale cố định theo index thay vì random
        heart.scale.setScalar(heartScale * baseScale);


    });

    // Cập nhật trái tim bay
    floatingHearts.forEach((heart, i) => {
        // Di chuyển theo velocity
        heart.position.add(heart.userData.velocity);

        // Xoay
        heart.rotation.x += heart.userData.rotationSpeed.x;
        heart.rotation.y += heart.userData.rotationSpeed.y;
        heart.rotation.z += heart.userData.rotationSpeed.z;

        // Cập nhật tuổi thọ
        heart.userData.life += deltaTime;

        // Làm mờ dần khi gần hết tuổi thọ
        const lifeFactor = 1 - (heart.userData.life / heart.userData.maxLife);
        heart.material.opacity = 0.7 * Math.max(0, lifeFactor);

        // Reset khi hết tuổi thọ
        if (heart.userData.life > heart.userData.maxLife) {
            const radius = 20 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            heart.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                (Math.random() - 0.5) * 30,
                radius * Math.sin(phi) * Math.sin(theta)
            );

            heart.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.1
            );

            heart.userData.life = 0;
            heart.material.opacity = 0.7;
        }
    });

    imageSprites.forEach((sprite, i) => {
        sprite.userData.orbitAngle += sprite.userData.orbitSpeed * rotationSpeed;
        const x = Math.cos(sprite.userData.orbitAngle) * sprite.userData.orbitRadius;
        const z = Math.sin(sprite.userData.orbitAngle) * sprite.userData.orbitRadius;
        sprite.position.x = x;
        sprite.position.z = z;
        // Hiệu ứng bay lơ lửng
        sprite.position.y = sprite.userData.originalY +
            Math.sin(elapsedTime * sprite.userData.floatSpeed + i) * 1.5;

        // Hiệu ứng thay đổi kích thước
        const scale = 1 + Math.sin(elapsedTime * 2 + i * 0.5) * 0.4;
        sprite.scale.set(scale * 1.5, scale * 1.5, 1);
    });


    const movingLight = scene.getObjectByName('movingLight');
    if (movingLight) {
        movingLight.position.x = Math.cos(elapsedTime * 0.5) * 20;
        movingLight.position.y = Math.sin(elapsedTime * 0.3) * 15;
        movingLight.position.z = Math.sin(elapsedTime * 0.7) * 20;
        movingLight.intensity = 0.5 + Math.sin(elapsedTime * 2) * 0.3;
    }

    if (controls) {
        controls.update();
    }

    const brightness = planet.userData.brightness || 1.2;
    const colorSpeed = planet.userData.colorSpeed || 1.0;
    const hue = (elapsedTime * colorSpeed * 0.1) % 1;
    planet.material.color.setHSL(hue, 0.8, 0.6);
    planet.material.emissive.setHSL(hue, 0.8, 0.3);
    planet.material.emissiveIntensity = brightness + Math.sin(elapsedTime * 2) * 0.3;

    updateDiamondRain(elapsedTime);
    updateFlowerRain(elapsedTime);

    renderer.render(scene, camera);
}

// Xử lý đặc biệt cho mobile devices

let uploadedImages = [];
let predefinedImages = [];

imageSprites.forEach((sprite, i) => {
    const userData = sprite.userData;

    if (userData.billboardEffect) {
        sprite.lookAt(camera.position);
    }
    userData.orbitAngle += userData.orbitSpeed * rotationSpeed;
    const orbitX = Math.cos(userData.orbitAngle) * userData.orbitRadius;
    const orbitZ = Math.sin(userData.orbitAngle) * userData.orbitRadius;
    sprite.position.x = orbitX;
    sprite.position.z = orbitZ;

    sprite.position.y = userData.orbitHeight +
        Math.sin(elapsedTime * userData.floatSpeed + i) * userData.floatAmplitude;

    if (userData.isUploaded) {
        // Hiệu ứng pulse
        const pulse = Math.sin(elapsedTime * userData.pulseSpeed) * 0.08 + 1;
        const originalScale = sprite.scale.clone();
        sprite.scale.multiplyScalar(pulse);

        // Cập nhật glow
        if (userData.glow) {
            userData.glow.position.copy(sprite.position);
            userData.glow.position.z -= 0.1;

            userData.glow.lookAt(camera.position);

            const glowPulse = Math.sin(elapsedTime * 2 + i) * 0.2 + 0.4;
            userData.glow.material.opacity = glowPulse;

            userData.glow.scale.copy(sprite.scale);
            userData.glow.scale.multiplyScalar(1.1);
        }

        // Hiệu ứng lấp lánh
        const sparkle = Math.sin(elapsedTime * 4 + i * 0.5) * 0.1 + 0.9;
        sprite.material.opacity = sparkle;

    } else {
        // Hiệu ứng nhẹ cho ảnh có sẵn
        const gentle = Math.sin(elapsedTime * 1.5 + i * 0.3) * 0.05 + 0.95;
        sprite.material.opacity = gentle;

        // Xoay nhẹ
        sprite.rotation.z += userData.rotationSpeed * 0.5;
    }

    const distanceToCamera = sprite.position.distanceTo(camera.position);
    const scaleFactor = Math.max(0.5, Math.min(1.5, 50 / distanceToCamera));

    const baseScale = userData.isUploaded ? 4 : 3;
    const aspectRatio = sprite.material.map ?
        (sprite.material.map.image.width / sprite.material.map.image.height) : 1;

    sprite.scale.set(
        baseScale * aspectRatio * scaleFactor,
        baseScale * scaleFactor,
        1
    );
});

// Hệ thống nhạc đơn giản
let musicPlayer = {
    audio: null,
    isPlaying: false,
    volume: 0.5,
    currentFile: null,
    duration: 0,
    currentTime: 0
};

function initSimpleMusicSystem() {
    // Tạo audio element
    musicPlayer.audio = new Audio();
    musicPlayer.audio.volume = musicPlayer.volume;
    musicPlayer.audio.loop = true;
    musicPlayer.audio.addEventListener('loadedmetadata', () => {
        musicPlayer.duration = musicPlayer.audio.duration;
        updateProgressBar();
        updateMusicDisplay();
    });

    musicPlayer.audio.addEventListener('timeupdate', () => {
        musicPlayer.currentTime = musicPlayer.audio.currentTime;
        updateProgressBar();
    });

    musicPlayer.audio.addEventListener('play', () => {
        musicPlayer.isPlaying = true;
        updateMusicButton();
    });

    musicPlayer.audio.addEventListener('pause', () => {
        musicPlayer.isPlaying = false;
        updateMusicButton();
    });

    musicPlayer.audio.addEventListener('ended', () => {
        musicPlayer.isPlaying = false;
        updateMusicButton();
    });

    musicPlayer.audio.addEventListener('error', (e) => {
        console.error('Lỗi phát nhạc:', e);
        alert('Không thể phát file nhạc này. Vui lòng chọn file khác.');
    });
}

function setupMusicControlsInPanel() {

    const controlsPanel = document.querySelector('.controls');

    if (controlsPanel) {
        const musicControlsContainer = document.createElement('div');
        musicControlsContainer.className = 'music-controls';
        musicControlsContainer.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 105, 180, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(255, 105, 180, 0.3);
        `;
        createMusicUploadControl(musicControlsContainer);
        createMusicDisplayControl(musicControlsContainer);
        createProgressControl(musicControlsContainer);
        createVolumeControl(musicControlsContainer);
        controlsPanel.appendChild(musicControlsContainer);
    }
}

function createMusicUploadControl(container) {
    const uploadSection = document.createElement('div');
    uploadSection.style.cssText = `
        margin-bottom: 15px;
    `;

    const uploadLabel = document.createElement('label');
    uploadLabel.textContent = '🎵 Chọn file nhạc:';
    uploadLabel.style.cssText = `
        display: block;
        color: #ff69b4;
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 14px;
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.cssText = `
        width: 100%;
        padding: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 105, 180, 0.5);
        border-radius: 5px;
        color: white;
        font-size: 12px;
    `;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadMusicFile(file);
        }
    });

    uploadSection.appendChild(uploadLabel);
    uploadSection.appendChild(fileInput);
    container.appendChild(uploadSection);
}

// Tạo display tên nhạc
function createMusicDisplayControl(container) {
    const displaySection = document.createElement('div');
    displaySection.style.cssText = `
        margin-bottom: 15px;
        text-align: center;
    `;

    const musicDisplay = document.createElement('div');
    musicDisplay.id = 'music-display';
    musicDisplay.style.cssText = `
        background: rgba(0, 0, 0, 0.3);
        padding: 10px;
        border-radius: 5px;
        color: #ff69b4;
        font-size: 13px;
        font-weight: bold;
        min-height: 20px;
        border: 1px solid rgba(255, 105, 180, 0.3);
    `;
    musicDisplay.textContent = 'Chưa chọn nhạc';

    displaySection.appendChild(musicDisplay);
    container.appendChild(displaySection);
}

// Tạo thanh progress/seek
function createProgressControl(container) {
    const progressSection = document.createElement('div');
    progressSection.style.cssTime = `
        margin-bottom: 15px;
    `;

    const progressLabel = document.createElement('label');
    progressLabel.textContent = '⏯️ Điều khiển phát:';
    progressLabel.style.cssText = `
        display: block;
        color: #ff69b4;
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 14px;
    `;
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'time-display';
    timeDisplay.style.cssText = `
        display: flex;
        justify-content: space-between;
        color: white;
        font-size: 12px;
        margin-bottom: 5px;
    `;

    const currentTimeSpan = document.createElement('span');
    currentTimeSpan.id = 'current-time';
    currentTimeSpan.textContent = '0:00';

    const durationSpan = document.createElement('span');
    durationSpan.id = 'duration-time';
    durationSpan.textContent = '0:00';

    timeDisplay.appendChild(currentTimeSpan);
    timeDisplay.appendChild(durationSpan);
    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.id = 'music-progress';
    progressBar.min = '0';
    progressBar.max = '100';
    progressBar.value = '0';
    progressBar.style.cssText = `
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        outline: none;
        cursor: pointer;
        -webkit-appearance: none;
    `;

    const style = document.createElement('style');
    style.textContent = `
        #music-progress::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #ff69b4;
            border-radius: 50%;
            cursor: pointer;
        }
        #music-progress::-webkit-slider-track {
            background: rgba(255, 255, 255, 0.2);
            height: 8px;
            border-radius: 5px;
        }
        #music-progress::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #ff69b4;
            border-radius: 50%;
            cursor: pointer;
            border: none;
        }
    `;
    document.head.appendChild(style);

    progressBar.addEventListener('input', (e) => {
        if (musicPlayer.audio && musicPlayer.duration > 0) {
            const seekTime = (e.target.value / 100) * musicPlayer.duration;
            musicPlayer.audio.currentTime = seekTime;
        }
    });

    progressSection.appendChild(progressLabel);
    progressSection.appendChild(timeDisplay);
    progressSection.appendChild(progressBar);
    container.appendChild(progressSection);
}

function createVolumeControl(container) {
    const volumeSection = document.createElement('div');
    volumeSection.style.cssText = `
        margin-bottom: 10px;
    `;

    const volumeLabel = document.createElement('label');
    volumeLabel.textContent = '🔊 Âm lượng:';
    volumeLabel.style.cssText = `
        display: block;
        color: #ff69b4;
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 14px;
    `;

    const volumeContainer = document.createElement('div');
    volumeContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.id = 'music-volume';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.1';
    volumeSlider.value = musicPlayer.volume;
    volumeSlider.style.cssText = `
        flex: 1;
        height: 5px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        outline: none;
        cursor: pointer;
    `;

    const volumeValue = document.createElement('span');
    volumeValue.id = 'music-volume-value';
    volumeValue.style.cssText = `
        color: white;
        font-size: 12px;
        min-width: 35px;
        text-align: center;
    `;
    volumeValue.textContent = Math.round(musicPlayer.volume * 100) + '%';

    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        setMusicVolume(volume);
    });

    volumeContainer.appendChild(volumeSlider);
    volumeContainer.appendChild(volumeValue);

    volumeSection.appendChild(volumeLabel);
    volumeSection.appendChild(volumeContainer);
    container.appendChild(volumeSection);
}

function loadMusicFile(file) {
    if (!musicPlayer.audio) {
        console.error('Audio player chưa được khởi tạo');
        return;
    }

    // Giải phóng URL cũ nếu có
    if (musicPlayer.audio.src && musicPlayer.audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(musicPlayer.audio.src);
    }

    const url = URL.createObjectURL(file);
    musicPlayer.audio.src = url;
    musicPlayer.currentFile = file;

    // Cập nhật hiển thị
    updateMusicDisplay();

    // Tự động phát (tùy chọn)
    musicPlayer.audio.load();

    console.log('Đã load file nhạc:', file.name);
    console.log('Audio src:', musicPlayer.audio.src);
}
function toggleMusic() {
    if (!musicPlayer.audio) {
        console.error('Audio player chưa được khởi tạo');
        alert('Hệ thống âm thanh chưa sẵn sàng!');
        return;
    }

    if (!musicPlayer.audio.src) {
        alert('Vui lòng chọn file nhạc trước!');
        return;
    }

    if (musicPlayer.isPlaying) {
        musicPlayer.audio.pause();
        console.log('Dừng phát nhạc');
    } else {
        // Thử phát với xử lý lỗi chi tiết
        musicPlayer.audio.play().then(() => {
            console.log('Bắt đầu phát nhạc');
        }).catch(error => {
            console.error('Lỗi khi phát nhạc:', error);

            if (error.name === 'NotAllowedError') {
                alert('Trình duyệt chặn tự động phát nhạc. Vui lòng click vào trang web trước khi phát nhạc.');
            } else if (error.name === 'NotSupportedError') {
                alert('Định dạng file này không được hỗ trợ.');
            } else {
                alert('Không thể phát nhạc: ' + error.message);
            }
        });
    }
}
function setMusicVolume(volume) {
    musicPlayer.volume = volume;
    if (musicPlayer.audio) {
        musicPlayer.audio.volume = volume;
    }

    const volumeValue = document.getElementById('music-volume-value');
    if (volumeValue) {
        volumeValue.textContent = Math.round(volume * 100) + '%';
    }
}
function updateMusicButton() {
    const musicButton = document.getElementById('toggle-music');
    if (musicButton) {
        if (musicPlayer.isPlaying) {
            musicButton.textContent = '⏸️ Tạm dừng';
        } else {
            musicButton.textContent = '🎵 Nhạc nền';
        }
    }
}

function updateMusicDisplay() {
    const display = document.getElementById('music-display');
    if (display) {
        if (musicPlayer.currentFile) {
            display.textContent = `🎵 ${musicPlayer.currentFile.name}`;
        } else {
            display.textContent = 'Chưa chọn nhạc';
        }
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('music-progress');
    const currentTimeSpan = document.getElementById('current-time');
    const durationSpan = document.getElementById('duration-time');

    if (progressBar && musicPlayer.duration > 0) {
        const progress = (musicPlayer.currentTime / musicPlayer.duration) * 100;
        progressBar.value = progress;
    }

    if (currentTimeSpan) {
        currentTimeSpan.textContent = formatTime(musicPlayer.currentTime);
    }

    if (durationSpan) {
        durationSpan.textContent = formatTime(musicPlayer.duration);
    }
}
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
function integrateSimpleMusicSystem() {
    initSimpleMusicSystem();
    setupMusicControlsInPanel();
    setInterval(() => {
        if (musicPlayer.isPlaying) {
            updateProgressBar();
        }
    }, 1000);

    setupMusicKeyboardShortcuts();
    setTimeout(() => {
        loadMusicSettings();
    }, 1000);
    const originalSetVolume = setMusicVolume;
    setMusicVolume = function (volume) {
        originalSetVolume(volume);
        saveMusicSettings();
    };

    console.log('Simple Music System đã được tích hợp!');
}



function setupMusicKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT') return;

        switch (event.key.toLowerCase()) {
            case ' ': // Spacebar để play/pause
                event.preventDefault();
                toggleMusic();
                break;

            case 'arrowup': // Tăng volume
                event.preventDefault();
                const currentVol = musicPlayer.volume;
                setMusicVolume(Math.min(1, currentVol + 0.1));
                document.getElementById('music-volume').value = musicPlayer.volume;
                break;

            case 'arrowdown': // Giảm volume
                event.preventDefault();
                const currentVol2 = musicPlayer.volume;
                setMusicVolume(Math.max(0, currentVol2 - 0.1));
                document.getElementById('music-volume').value = musicPlayer.volume;
                break;

            case 'arrowright': // Tua tiến 10 giây
                if (musicPlayer.audio && musicPlayer.duration > 0) {
                    event.preventDefault();
                    const newTime = Math.min(musicPlayer.duration, musicPlayer.currentTime + 10);
                    musicPlayer.audio.currentTime = newTime;
                }
                break;

            case 'arrowleft': // Tua lùi 10 giây
                if (musicPlayer.audio && musicPlayer.duration > 0) {
                    event.preventDefault();
                    const newTime = Math.max(0, musicPlayer.currentTime - 10);
                    musicPlayer.audio.currentTime = newTime;
                }
                break;
        }
    });
}

function saveMusicSettings() {
    const settings = {
        volume: musicPlayer.volume,
    };

    try {
        localStorage.setItem('galaxyMusicSettings', JSON.stringify(settings));
    } catch (error) {
        console.warn('Không thể lưu settings nhạc:', error);
    }
}

function loadMusicSettings() {
    try {
        const saved = localStorage.getItem('galaxyMusicSettings');
        if (saved) {
            const settings = JSON.parse(saved);

            if (settings.volume !== undefined) {
                setMusicVolume(settings.volume);
                const volumeSlider = document.getElementById('music-volume');
                if (volumeSlider) {
                    volumeSlider.value = settings.volume;
                }
            }
        }
    } catch (error) {
        console.warn('Không thể load settings nhạc:', error);
    }
}



// Hiển thị hướng dẫn sử dụng (tùy chọn)
function showMusicInstructions() {
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        border: 2px solid #ff69b4;
        z-index: 10000;
        max-width: 400px;
        text-align: center;
        font-size: 14px;
    `;

    instructions.innerHTML = `
        <h3 style="color: #ff69b4; margin-top: 0;">🎵 Hướng dẫn sử dụng nhạc</h3>
        <p><strong>📁 Upload:</strong> Chọn file MP3, WAV, OGG từ máy tính</p>
        <p><strong>⏯️ Phím tắt:</strong></p>
        <p>• <kbd>Space</kbd> - Play/Pause</p>
        <p>• <kbd>↑↓</kbd> - Tăng/giảm volume</p>
        <p>• <kbd>←→</kbd> - Tua lùi/tiến 10s</p>
        <br>
        <button id="close-instructions" style="
            background: #ff69b4;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            color: white;
            cursor: pointer;
        ">Đã hiểu</button>
    `;

    document.body.appendChild(instructions);

    document.getElementById('close-instructions').addEventListener('click', () => {
        document.body.removeChild(instructions);
    });

    setTimeout(() => {
        if (document.body.contains(instructions)) {
            document.body.removeChild(instructions);
        }
    }, 10000);
}
setTimeout(() => {
    if (!localStorage.getItem('musicInstructionsShown')) {
        showMusicInstructions();
        localStorage.setItem('musicInstructionsShown', 'true');
    }
}, 3000);
// =================== TÍNH NĂNG 1: HỆ THỐNG ẢNH KHUNG TRÁI TIM ===================
let heartFramedImages = [];
let heartImageUploader = null;
function createHeartShape() {
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    const scale = 1;

    // Vẽ hình trái tim bằng các đường cong Bezier
    heartShape.moveTo(x + 0.5 * scale, y + 0.5 * scale);
    heartShape.bezierCurveTo(x + 0.5 * scale, y + 0.5 * scale, x + 0.4 * scale, y, x, y);
    heartShape.bezierCurveTo(x - 0.6 * scale, y, x - 0.6 * scale, y + 0.7 * scale, x - 0.6 * scale, y + 0.7 * scale);
    heartShape.bezierCurveTo(x - 0.6 * scale, y + 1.1 * scale, x - 0.3 * scale, y + 1.54 * scale, x + 0.5 * scale, y + 1.9 * scale);
    heartShape.bezierCurveTo(x + 1.3 * scale, y + 1.54 * scale, x + 1.6 * scale, y + 1.1 * scale, x + 1.6 * scale, y + 0.7 * scale);
    heartShape.bezierCurveTo(x + 1.6 * scale, y + 0.7 * scale, x + 1.6 * scale, y, x + 1 * scale, y);
    heartShape.bezierCurveTo(x + 0.7 * scale, y, x + 0.5 * scale, y + 0.5 * scale, x + 0.5 * scale, y + 0.5 * scale);

    return heartShape;
}
function createHeartFramedImage(imageSrc, size = 3, index = 0) {
    const loader = new THREE.TextureLoader();

    loader.load(
        imageSrc,
        function (texture) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const canvasSize = 512;
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const heartPath = new Path2D();
            const scale = 120;
            const offsetX = canvasSize / 2 - scale * 0.5;
            const offsetY = canvasSize / 2 - scale * 0.95;

            // Vẽ hình trái tim
            heartPath.moveTo(offsetX + 0.5 * scale, offsetY + 0.5 * scale);
            heartPath.bezierCurveTo(offsetX + 0.5 * scale, offsetY + 0.5 * scale, offsetX + 0.4 * scale, offsetY, offsetX, offsetY);
            heartPath.bezierCurveTo(offsetX - 0.6 * scale, offsetY, offsetX - 0.6 * scale, offsetY + 0.7 * scale, offsetX - 0.6 * scale, offsetY + 0.7 * scale);
            heartPath.bezierCurveTo(offsetX - 0.6 * scale, offsetY + 1.1 * scale, offsetX - 0.3 * scale, offsetY + 1.54 * scale, offsetX + 0.5 * scale, offsetY + 1.9 * scale);
            heartPath.bezierCurveTo(offsetX + 1.3 * scale, offsetY + 1.54 * scale, offsetX + 1.6 * scale, offsetY + 1.1 * scale, offsetX + 1.6 * scale, offsetY + 0.7 * scale);
            heartPath.bezierCurveTo(offsetX + 1.6 * scale, offsetY + 0.7 * scale, offsetX + 1.6 * scale, offsetY, offsetX + 1 * scale, offsetY);
            heartPath.bezierCurveTo(offsetX + 0.7 * scale, offsetY, offsetX + 0.5 * scale, offsetY + 0.5 * scale, offsetX + 0.5 * scale, offsetY + 0.5 * scale);

            // Vẽ background gradient cho khung
            const gradient = ctx.createRadialGradient(canvasSize / 2, canvasSize / 2, 0, canvasSize / 2, canvasSize / 2, canvasSize / 2);
            gradient.addColorStop(0, '#ff69b4');
            gradient.addColorStop(0.7, '#ff1493');
            gradient.addColorStop(1, '#8b0040');

            ctx.fillStyle = gradient;
            ctx.fill(heartPath);

            // Clip theo hình trái tim và vẽ ảnh
            ctx.save();
            ctx.clip(heartPath);

            const img = texture.image;
            const imgAspect = img.width / img.height;
            let drawWidth = canvasSize;
            let drawHeight = canvasSize;
            let drawX = 0;
            let drawY = 0;

            if (imgAspect > 1) {
                drawHeight = canvasSize / imgAspect;
                drawY = (canvasSize - drawHeight) / 2;
            } else {
                drawWidth = canvasSize * imgAspect;
                drawX = (canvasSize - drawWidth) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();

            // Vẽ viền trái tim
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ff69b4';
            ctx.shadowBlur = 10;
            ctx.stroke(heartPath);

            // Tạo texture từ canvas
            const heartTexture = new THREE.CanvasTexture(canvas);

            // Tạo sprite với texture trái tim
            const spriteMaterial = new THREE.SpriteMaterial({
                map: heartTexture,
                transparent: true,
                opacity: 0.95,
                alphaTest: 0.1
            });

            const sprite = new THREE.Sprite(spriteMaterial);

            const spriteSize = size * 1.5; // Scale từ 1.5 đến 7.5
            sprite.scale.set(spriteSize, spriteSize, 1);

            // Đặt vị trí xung quanh hành tinh
            const angle = (index * 60 + Math.random() * 30) * (Math.PI / 180); // Góc phân bố
            const radius = 15 + Math.random() * 10; // Bán kính từ 15-25
            const height = (Math.random() - 0.5) * 8; // Chiều cao từ -4 đến 4

            sprite.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );

            sprite.userData = {
                orbitSpeed: 0.003 + Math.random() * 0.007, // Tốc độ quỹ đạo
                floatSpeed: 1 + Math.random() * 2, // Tốc độ bay lơ lửng
                orbitRadius: radius,
                orbitAngle: angle,
                originalY: height,
                pulseSpeed: 2 + Math.random() * 3, // Tốc độ nhấp nháy
                rotationSpeed: (Math.random() - 0.5) * 0.02, // Tốc độ xoay
                isHeartFramed: true, // Đánh dấu là ảnh khung trái tim
                size: size
            };

            heartFramedImages.push(sprite);
            scene.add(sprite);

            console.log(`Đã thêm ảnh khung trái tim số ${heartFramedImages.length}`);
        },
        function (progress) {
            console.log('Đang tải ảnh:', Math.round(progress.loaded / progress.total * 100) + '%');
        },
        function (error) {
            console.error('Lỗi tải ảnh:', error);
            alert('Không thể tải ảnh. Vui lòng thử file khác.');
        }
    );
}




function updateHeartFramedImages(elapsedTime, rotationSpeed) {
    heartFramedImages.forEach((sprite, i) => {
        const userData = sprite.userData;
        userData.orbitAngle += userData.orbitSpeed * rotationSpeed;
        const orbitX = Math.cos(userData.orbitAngle) * userData.orbitRadius;
        const orbitZ = Math.sin(userData.orbitAngle) * userData.orbitRadius;

        sprite.position.x = orbitX;
        sprite.position.z = orbitZ;

        // Bay lơ lửng lên xuống
        sprite.position.y = userData.originalY +
            Math.sin(elapsedTime * userData.floatSpeed + i) * 2;

        // Hiệu ứng pulse (thay đổi kích thước nhẹ)
        const pulse = Math.sin(elapsedTime * userData.pulseSpeed + i) * 0.1 + 1;
        const baseSize = userData.size * 1.5;
        sprite.scale.set(baseSize * pulse, baseSize * pulse, 1);

        // Xoay nhẹ
        sprite.rotation.z += userData.rotationSpeed;

        // Hiệu ứng fade in/out nhẹ
        const fade = Math.sin(elapsedTime * 1.5 + i * 0.5) * 0.1 + 0.9;
        sprite.material.opacity = fade;

        // Billboard effect - luôn hướng về camera
        sprite.lookAt(camera.position);
    });
}



// =================== TÍNH NĂNG 3: AURORA/NEBULA BACKGROUND ===================
let auroraBackground = null;
let nebulaClouds = [];
let auroraAnimationData = {
    time: 0,
    speed: 1
};

function createAuroraBackground() {
    const geometry = new THREE.SphereGeometry(400, 64, 64);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },                                    // Thời gian cho animation
            colorA: { value: new THREE.Color(0x1a0033) },         // Màu tím đậm
            colorB: { value: new THREE.Color(0x000066) },         // Màu xanh đậm
            colorC: { value: new THREE.Color(0x330066) },         // Màu tím hồng
            colorD: { value: new THREE.Color(0xff69b4) },         // Màu hồng sáng
            waveIntensity: { value: 1.0 },                        // Cường độ sóng
            colorMixing: { value: 0.5 }                           // Độ pha trộn màu
        },
        vertexShader: `
            // Biến truyền từ vertex sang fragment shader
            varying vec2 vUv;          // Tọa độ UV
            varying vec3 vPosition;    // Vị trí trong không gian
            varying vec3 vNormal;      // Vector pháp tuyến
            
            void main() {
                // Truyền dữ liệu sang fragment shader
                vUv = uv;
                vPosition = position;
                vNormal = normal;
                
                // Tính toán vị trí cuối cùng
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            // Uniform variables (truyền từ JavaScript)
            uniform float time;
            uniform vec3 colorA, colorB, colorC, colorD;
            uniform float waveIntensity;
            uniform float colorMixing;
            
            // Varying variables (nhận từ vertex shader)
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            // Hàm tạo noise giả (pseudo-random)
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            // Hàm tạo fractal noise (nhiều lớp noise)
            float fractalNoise(vec2 st, int octaves) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                
                for(int i = 0; i < 4; i++) {
                    if(i >= octaves) break;
                    value += amplitude * (noise(st * frequency) - 0.5);
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                return value;
            }
            
            void main() {
                vec2 st = vUv;
                
                // Tạo các wave pattern phức tạp cho Aurora
                float wave1 = sin(st.x * 3.0 + time * 0.5) * cos(st.y * 2.0 + time * 0.3);
                float wave2 = cos(st.x * 4.0 - time * 0.4) * sin(st.y * 3.0 + time * 0.6);
                float wave3 = sin((st.x + st.y) * 5.0 + time * 0.8) * 0.5;
                float wave4 = cos((st.x - st.y) * 2.0 + time * 0.2) * 0.7;
                
                // Kết hợp các wave với cường độ
                float combinedWaves = (wave1 + wave2 + wave3 + wave4) * waveIntensity * 0.25;
                
                // Tạo gradient chính dựa trên vị trí Y và wave
                float mainGradient = (st.y * 0.7 + combinedWaves * 0.3) * 0.5 + 0.5;
                mainGradient = smoothstep(0.0, 1.0, mainGradient);
                
                // Tạo gradient phụ cho hiệu ứng layer
                float secondaryGradient = (st.x * 0.3 + sin(time * 0.1 + st.y * 6.0) * 0.4) * 0.5 + 0.5;
                
                // Thêm fractal noise cho texture tự nhiên
                float noiseValue = fractalNoise(st * 8.0 + time * 0.05, 3) * 0.3;
                
                // Tạo vùng sáng di chuyển (như Aurora thật)
                float auroral_band1 = smoothstep(0.3, 0.7, sin(st.y * 12.0 + time * 0.3 + st.x * 2.0));
                float auroral_band2 = smoothstep(0.2, 0.8, cos(st.y * 8.0 - time * 0.5 + st.x * 3.0));
                
                // Mixing màu sắc phức tạp
                vec3 color1 = mix(colorA, colorB, mainGradient);
                vec3 color2 = mix(colorC, colorD, secondaryGradient);
                vec3 baseColor = mix(color1, color2, colorMixing);
                
                // Thêm các vùng Aurora sáng
                baseColor += colorD * auroral_band1 * 0.4;
                baseColor += colorC * auroral_band2 * 0.3;
                
                // Thêm noise cho texture
                baseColor += vec3(noiseValue);
                
                // Tạo hiệu ứng shimmer (lấp lánh)
                float shimmer = sin(time * 2.0 + st.x * 20.0 + st.y * 15.0) * 0.1 + 0.9;
                baseColor *= shimmer;
                
                // Đảm bảo màu không vượt quá giới hạn
                baseColor = clamp(baseColor, 0.0, 1.0);
                
                gl_FragColor = vec4(baseColor, 1.0);
            }
        `,

        side: THREE.BackSide,
        transparent: false,
        depthWrite: false
    });
    auroraBackground = new THREE.Mesh(geometry, material);
    auroraBackground.name = 'AuroraBackground';
    auroraBackground.renderOrder = -1;

    scene.add(auroraBackground);
    console.log('Đã tạo Aurora background');
}
function createNebulaClouds() {
    const cloudCount = 12;
    const nebulaColorSets = [
        ['#ff69b4', '#ff1493', '#8b008b', '#4b0082'],  // Hồng-tím
        ['#4169e1', '#1e90ff', '#00bfff', '#87ceeb'],  // Xanh dương
        ['#9400d3', '#8a2be2', '#4b0082', '#663399'],  // Tím đậm
        ['#ff6347', '#ff4500', '#dc143c', '#b22222'],  // Đỏ cam
        ['#00ced1', '#20b2aa', '#008b8b', '#2f4f4f'],  // Xanh lam
        ['#ffd700', '#ffb347', '#ff8c00', '#ff6347']   // Vàng cam
    ];

    for (let i = 0; i < cloudCount; i++) {
        const width = 80 + Math.random() * 120;   // Chiều rộng 80-200
        const height = 40 + Math.random() * 80;   // Chiều cao 40-120
        const geometry = new THREE.PlaneGeometry(width, height, 20, 15);
        const canvas = createNebulaCloudTexture(nebulaColorSets[i % nebulaColorSets.length]);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.3 + Math.random() * 0.4,     // Độ trong suốt 0.3-0.7
            blending: THREE.AdditiveBlending,        // Blending cộng để tạo hiệu ứng sáng
            side: THREE.DoubleSide                   // Render cả hai mặt
        });
        const cloud = new THREE.Mesh(geometry, material);
        const radius = 150 + Math.random() * 100;  // Bán kính 150-250
        const phi = Math.random() * Math.PI * 2;   // Góc ngang 0-360°
        const theta = Math.PI * 0.2 + Math.random() * Math.PI * 0.6;  // Góc dọc 36-144°

        cloud.position.set(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.cos(theta) - 50,  // Hạ thấp một chút
            radius * Math.sin(theta) * Math.sin(phi)
        );

        // Xoay ngẫu nhiên
        cloud.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // Biến đổi hình dạng geometry để tạo độ tự nhiên
        const positions = geometry.attributes.position.array;
        for (let j = 0; j < positions.length; j += 3) {
            // Thêm noise vào các vertex
            positions[j] += (Math.random() - 0.5) * 10;     // X
            positions[j + 1] += (Math.random() - 0.5) * 8;  // Y  
            positions[j + 2] += (Math.random() - 0.5) * 6;  // Z
        }
        geometry.attributes.position.needsUpdate = true;

        // Lưu thông tin animation
        cloud.userData = {
            driftSpeed: 0.1 + Math.random() * 0.2,        // Tốc độ trôi
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.005
            },
            floatAmplitude: 2 + Math.random() * 4,        // Biên độ bay lơ lửng
            floatSpeed: 0.3 + Math.random() * 0.7,        // Tốc độ bay lơ lửng
            originalPosition: cloud.position.clone(),      // Vị trí gốc
            pulseSpeed: 0.5 + Math.random() * 1.0,        // Tốc độ nhấp nháy opacity
            originalOpacity: material.opacity              // Opacity gốc
        };

        nebulaClouds.push(cloud);
        scene.add(cloud);
    }

    console.log(`Đã tạo ${cloudCount} đám mây Nebula`);
}
function createNebulaCloudTexture(colors) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const layerCount = 4 + Math.floor(Math.random() * 3);  // 4-6 layers

    for (let layer = 0; layer < layerCount; layer++) {
        // Tạo gradient radial cho mỗi layer
        const centerX = canvas.width * (0.3 + Math.random() * 0.4);
        const centerY = canvas.height * (0.3 + Math.random() * 0.4);
        const radius = (canvas.width * 0.4) * (0.5 + Math.random() * 0.8);

        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );

        // Chọn màu ngẫu nhiên từ bảng màu
        const color1 = colors[Math.floor(Math.random() * colors.length)];
        const color2 = colors[Math.floor(Math.random() * colors.length)];

        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.4, color2);
        gradient.addColorStop(0.8, color1 + '80'); // Thêm alpha
        gradient.addColorStop(1, 'transparent');

        // Vẽ layer
        ctx.globalCompositeOperation = layer === 0 ? 'source-over' : 'screen';
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
            const noise = (Math.random() - 0.5) * 30;
            data[i + 3] = Math.max(0, Math.min(255, data[i + 3] + noise));
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
function createAuroraParticles() {
    const particleCount = 800;  // Số lượng particles
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Bảng màu cho particles Aurora
    const auroraColors = [
        new THREE.Color(0xff69b4),  // Hồng
        new THREE.Color(0x00ffff),  // Cyan
        new THREE.Color(0x9400d3),  // Violet
        new THREE.Color(0x00ff00),  // Xanh lá (như Aurora thật)
        new THREE.Color(0xffd700),  // Vàng
    ];

    for (let i = 0; i < particleCount; i++) {
        // Vị trí ngẫu nhiên trong không gian xa
        const radius = 200 + Math.random() * 150;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;

        positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
        positions[i * 3 + 1] = radius * Math.cos(theta);
        positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);

        // Màu sắc từ bảng màu Aurora
        const color = auroraColors[Math.floor(Math.random() * auroraColors.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Kích thước ngẫu nhiên
        sizes[i] = Math.random() * 2 + 0.5;  // 0.5 - 2.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Material cho particles
    const material = new THREE.PointsMaterial({
        size: 1.5,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const auroraParticles = new THREE.Points(geometry, material);
    auroraParticles.name = 'AuroraParticles';

    // Lưu thông tin animation
    auroraParticles.userData = {
        originalColors: new Float32Array(colors),
        twinkleSpeed: 2.0
    };

    scene.add(auroraParticles);
    console.log('Đã tạo Aurora particles');
}

function updateAuroraNebulaBackground(elapsedTime, deltaTime) {
    auroraAnimationData.time = elapsedTime;

    updateAuroraBackground(elapsedTime);

    updateNebulaClouds(elapsedTime, deltaTime);

    updateAuroraParticles(elapsedTime);
}
function updateAuroraBackground(elapsedTime) {
    if (!auroraBackground) return;

    auroraBackground.material.uniforms.time.value = elapsedTime * auroraAnimationData.speed;

    // Thay đổi cường độ wave theo thời gian
    auroraBackground.material.uniforms.waveIntensity.value =
        0.8 + Math.sin(elapsedTime * 0.3) * 0.4;

    // Thay đổi độ pha trộn màu
    auroraBackground.material.uniforms.colorMixing.value =
        0.5 + Math.sin(elapsedTime * 0.2) * 0.3;
}

function updateNebulaClouds(elapsedTime, deltaTime) {
    nebulaClouds.forEach((cloud, i) => {
        const userData = cloud.userData;

        // Xoay đám mây
        cloud.rotation.x += userData.rotationSpeed.x;
        cloud.rotation.y += userData.rotationSpeed.y;
        cloud.rotation.z += userData.rotationSpeed.z;

        // Bay lơ lửng
        cloud.position.y = userData.originalPosition.y +
            Math.sin(elapsedTime * userData.floatSpeed + i) * userData.floatAmplitude;

        // Trôi chậm theo một hướng
        cloud.position.x += Math.sin(elapsedTime * userData.driftSpeed * 0.1 + i) * 0.02;
        cloud.position.z += Math.cos(elapsedTime * userData.driftSpeed * 0.1 + i) * 0.02;

        // Nhấp nháy opacity
        const pulse = Math.sin(elapsedTime * userData.pulseSpeed + i * 0.5) * 0.2 + 0.8;
        cloud.material.opacity = userData.originalOpacity * pulse;

        // Thay đổi kích thước nhẹ
        const scale = 1 + Math.sin(elapsedTime * 0.5 + i) * 0.1;
        cloud.scale.setScalar(scale);
    });
}

function updateAuroraParticles(elapsedTime) {
    const auroraParticles = scene.getObjectByName('AuroraParticles');
    if (!auroraParticles) return;

    auroraParticles.rotation.y += 0.0002;
    auroraParticles.rotation.x += 0.0001;

    // Cập nhật màu sắc lấp lánh
    const colors = auroraParticles.geometry.attributes.color.array;
    const originalColors = auroraParticles.userData.originalColors;
    const twinkleSpeed = auroraParticles.userData.twinkleSpeed;
    const batchSize = Math.floor(colors.length / 10);
    const startIndex = (Math.floor(elapsedTime * 60) % 10) * batchSize;
    const endIndex = Math.min(startIndex + batchSize, colors.length);

    for (let i = startIndex; i < endIndex; i += 3) {
        const twinkle = Math.sin(elapsedTime * twinkleSpeed + i * 0.01) * 0.5 + 0.7;
        colors[i] = originalColors[i] * twinkle;         // R
        colors[i + 1] = originalColors[i + 1] * twinkle; // G  
        colors[i + 2] = originalColors[i + 2] * twinkle; // B
    }

    auroraParticles.geometry.attributes.color.needsUpdate = true;
}

function setAuroraSpeed(speed = 1.0) {
    auroraAnimationData.speed = Math.max(0.1, Math.min(3.0, speed));
    console.log(`Đã đặt tốc độ Aurora: ${auroraAnimationData.speed}`);
}

function toggleAuroraBackground(visible = true) {
    if (auroraBackground) {
        auroraBackground.visible = visible;
    }

    nebulaClouds.forEach(cloud => {
        cloud.visible = visible;
    });

    const auroraParticles = scene.getObjectByName('AuroraParticles');
    if (auroraParticles) {
        auroraParticles.visible = visible;
    }

    console.log(`Aurora background: ${visible ? 'Hiện' : 'Ẩn'}`);
}

function disposeAuroraBackground() {
    if (auroraBackground) {
        scene.remove(auroraBackground);
        auroraBackground.geometry.dispose();
        auroraBackground.material.dispose();
        auroraBackground = null;
    }

    nebulaClouds.forEach(cloud => {
        scene.remove(cloud);
        cloud.geometry.dispose();
        cloud.material.dispose();
        if (cloud.material.map) {
            cloud.material.map.dispose();
        }
    });
    nebulaClouds.length = 0;

    const auroraParticles = scene.getObjectByName('AuroraParticles');
    if (auroraParticles) {
        scene.remove(auroraParticles);
        auroraParticles.geometry.dispose();
        auroraParticles.material.dispose();
    }

    console.log('Đã dọn dẹp Aurora background');
}

let auroraSettings = {
    brightness: 0.5,      // Độ sáng Aurora (0.1 - 3.0)
    colorMode: 'cosmic', // Chế độ màu: 'rainbow', 'northern', 'cosmic', 'sunset'
    colorIntensity: 0.6,  // Cường độ màu (0.5 - 2.0)
    waveAmplitude: 0.6    // Biên độ sóng (0.1 - 2.0)
};

function createEnhancedAuroraBackground() {
    if (auroraBackground) {
        scene.remove(auroraBackground);
        auroraBackground.geometry.dispose();
        auroraBackground.material.dispose();
    }

    const geometry = new THREE.SphereGeometry(400, 64, 64);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            brightness: { value: auroraSettings.brightness },
            colorIntensity: { value: auroraSettings.colorIntensity },
            waveAmplitude: { value: auroraSettings.waveAmplitude },

            // Bảng màu cầu vồng
            rainbowColors: {
                value: [
                    new THREE.Color(0xff0080), // Hồng đậm
                    new THREE.Color(0xff4000), // Cam đỏ
                    new THREE.Color(0xff8000), // Cam
                    new THREE.Color(0xffff00), // Vàng
                    new THREE.Color(0x80ff00), // Xanh lá vàng
                    new THREE.Color(0x00ff80), // Xanh lá
                    new THREE.Color(0x00ffff), // Cyan
                    new THREE.Color(0x0080ff), // Xanh dương
                    new THREE.Color(0x4000ff), // Tím xanh
                    new THREE.Color(0x8000ff), // Tím
                    new THREE.Color(0xff00ff), // Magenta
                    new THREE.Color(0xff0040)  // Hồng
                ]
            },

            northernColors: {
                value: [
                    new THREE.Color(0x00ff88), // Xanh lá Aurora
                    new THREE.Color(0x44ff00), // Xanh lá sáng
                    new THREE.Color(0x88ffaa), // Xanh lá nhạt
                    new THREE.Color(0x0088ff), // Xanh dương
                    new THREE.Color(0x8844ff), // Tím nhạt
                    new THREE.Color(0xff4488)  // Hồng Aurora
                ]
            },

            // Màu vũ trụ
            cosmicColors: {
                value: [
                    new THREE.Color(0x4a0e4e), // Tím đậm
                    new THREE.Color(0x81288a), // Tím
                    new THREE.Color(0xa663cc), // Tím sáng
                    new THREE.Color(0x4fc3f7), // Xanh sáng
                    new THREE.Color(0x29b6f6), // Xanh dương
                    new THREE.Color(0x039be5), // Xanh đậm
                    new THREE.Color(0x8e24aa), // Tím hồng
                    new THREE.Color(0xe91e63)  // Hồng đậm
                ]
            },

            // Màu hoàng hôn
            sunsetColors: {
                value: [
                    new THREE.Color(0xff6b35), // Cam đỏ
                    new THREE.Color(0xf7931e), // Cam
                    new THREE.Color(0xffd23f), // Vàng cam
                    new THREE.Color(0xfee857), // Vàng
                    new THREE.Color(0xff7597), // Hồng cam
                    new THREE.Color(0xc77dff), // Tím sáng
                    new THREE.Color(0x7209b7), // Tím đậm
                    new THREE.Color(0x560bad)  // Tím rất đậm
                ]
            },

            colorMode: { value: 0 } // 0=rainbow, 1=northern, 2=cosmic, 3=sunset
        },

        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vUv = uv;
                vPosition = position;
                vNormal = normal;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,

        fragmentShader: `
            uniform float time;
            uniform float brightness;
            uniform float colorIntensity;
            uniform float waveAmplitude;
            uniform vec3 rainbowColors[12];
            uniform vec3 northernColors[6];
            uniform vec3 cosmicColors[8];
            uniform vec3 sunsetColors[8];
            uniform int colorMode;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            // Hàm noise nâng cao
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                    f.y
                );
            }
            
            float fbm(vec2 p) {
                float f = 0.0;
                f += 0.5000 * noise(p); p = p * 2.01;
                f += 0.2500 * noise(p); p = p * 2.02;
                f += 0.1250 * noise(p); p = p * 2.03;
                f += 0.0625 * noise(p);
                return f;
            }
            
            // Hàm lấy màu theo chế độ
            vec3 getColorFromMode(float t) {
                t = fract(t); // Đảm bảo t trong khoảng [0,1]
                
                if (colorMode == 0) { // Rainbow
                    int index = int(t * 11.0);
                    float frac = fract(t * 11.0);
                    if (index >= 11) return rainbowColors[11];
                    return mix(rainbowColors[index], rainbowColors[index + 1], frac);
                }
                else if (colorMode == 1) { // Northern
                    int index = int(t * 5.0);
                    float frac = fract(t * 5.0);
                    if (index >= 5) return northernColors[5];
                    return mix(northernColors[index], northernColors[index + 1], frac);
                }
                else if (colorMode == 2) { // Cosmic
                    int index = int(t * 7.0);
                    float frac = fract(t * 7.0);
                    if (index >= 7) return cosmicColors[7];
                    return mix(cosmicColors[index], cosmicColors[index + 1], frac);
                }
                else { // Sunset
                    int index = int(t * 7.0);
                    float frac = fract(t * 7.0);
                    if (index >= 7) return sunsetColors[7];
                    return mix(sunsetColors[index], sunsetColors[index + 1], frac);
                }
            }
            
            void main() {
                vec2 st = vUv;
                float t = time * 0.3;
                
                // Tạo các pattern sóng phức tạp
                float wave1 = sin(st.x * 4.0 + t) * cos(st.y * 3.0 + t * 0.7);
                float wave2 = cos(st.x * 6.0 - t * 0.8) * sin(st.y * 4.0 + t * 1.2);
                float wave3 = sin((st.x + st.y) * 8.0 + t * 1.5) * 0.7;
                float wave4 = cos((st.x - st.y) * 5.0 + t * 0.5) * 0.8;
                
                float combinedWaves = (wave1 + wave2 + wave3 + wave4) * waveAmplitude * 0.2;
                
                // Thêm fractal noise cho texture tự nhiên
                float noiseValue = fbm(st * 6.0 + t * 0.1) * 0.4;
                
                // Gradient chính với nhiều layer
                float mainGradient = st.y + combinedWaves + noiseValue;
                mainGradient = smoothstep(-0.5, 1.5, mainGradient);
                
                // Tạo các bands Aurora di chuyển
                float band1 = smoothstep(0.2, 0.8, sin(st.y * 15.0 + t * 2.0 + st.x * 4.0));
                float band2 = smoothstep(0.1, 0.9, cos(st.y * 12.0 - t * 1.5 + st.x * 3.0));
                float band3 = smoothstep(0.3, 0.7, sin(st.y * 18.0 + t * 2.5 + st.x * 5.0));
                
                // Tính toán màu sắc
                vec3 baseColor = getColorFromMode(mainGradient + t * 0.1);
                
                // Thêm các bands với màu khác nhau
                baseColor += getColorFromMode(mainGradient + 0.2) * band1 * 0.6;
                baseColor += getColorFromMode(mainGradient + 0.4) * band2 * 0.5;
                baseColor += getColorFromMode(mainGradient + 0.6) * band3 * 0.4;
                
                // Áp dụng cường độ màu
                baseColor *= colorIntensity;
                
                // Tạo hiệu ứng shimmer
                float shimmer = sin(t * 3.0 + st.x * 25.0 + st.y * 20.0) * 0.15 + 0.85;
                baseColor *= shimmer;
                
                // Áp dụng độ sáng
                baseColor *= brightness;
                
                float darkness = smoothstep(0.0, 0.3, sin(st.y * 8.0 + t));
                baseColor *= (0.7 + darkness * 0.3);
                
                gl_FragColor = vec4(baseColor, 1.0);
            }
        `,

        side: THREE.BackSide,
        transparent: false,
        depthWrite: false
    });

    auroraBackground = new THREE.Mesh(geometry, material);
    auroraBackground.name = 'EnhancedAuroraBackground';
    auroraBackground.renderOrder = -1;

    scene.add(auroraBackground);
    console.log('Đã tạo Enhanced Aurora Background');
}

function updateEnhancedAuroraBackground(elapsedTime) {
    if (!auroraBackground || !auroraBackground.material.uniforms) return;

    const uniforms = auroraBackground.material.uniforms;

    uniforms.time.value = elapsedTime * auroraAnimationData.speed;
    uniforms.brightness.value = auroraSettings.brightness;
    uniforms.colorIntensity.value = auroraSettings.colorIntensity;
    uniforms.waveAmplitude.value = auroraSettings.waveAmplitude;

    // Đặt color mode
    const modeMap = {
        'rainbow': 0,
        'northern': 1,
        'cosmic': 2,
        'sunset': 3
    };
    uniforms.colorMode.value = modeMap[auroraSettings.colorMode] || 0;
}
function setAuroraBrightness(brightness) {
    auroraSettings.brightness = Math.max(0.1, Math.min(3.0, brightness));
    console.log(`Aurora brightness: ${auroraSettings.brightness}`);
}

function setAuroraColorMode(mode) {
    const validModes = ['rainbow', 'northern', 'cosmic', 'sunset'];
    if (validModes.includes(mode)) {
        auroraSettings.colorMode = mode;
        console.log(`Aurora color mode: ${mode}`);
    }
}

function setAuroraColorIntensity(intensity) {
    auroraSettings.colorIntensity = Math.max(0.5, Math.min(1.0, intensity));
    console.log(`Aurora color intensity: ${auroraSettings.colorIntensity}`);
}

function setAuroraWaveAmplitude(amplitude) {
    auroraSettings.waveAmplitude = Math.max(0.1, Math.min(2.0, amplitude));
    console.log(`Aurora wave amplitude: ${auroraSettings.waveAmplitude}`);
}


function setupPanelControls() {
    console.log('Setting up panel controls...');

    // Tạo hàm global để HTML có thể gọi được
    window.closePanel = function (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panel.style.display = 'none';
    };

    // Hàm toggle panel cải thiện
    function togglePanel(panelId) {
        const allPanels = ['planet-panel', 'aurora-panel', 'music-panel'];
        const targetPanel = document.getElementById(panelId);

        if (!targetPanel) {
            console.error(`Panel ${panelId} not found`);
            return;
        }

        const isCurrentlyVisible = targetPanel.style.display === 'block';

        // Đóng tất cả panels
        allPanels.forEach(id => {
            const panel = document.getElementById(id);
            if (panel) panel.style.display = 'none';
        });

        // Toggle panel hiện tại
        targetPanel.style.display = isCurrentlyVisible ? 'none' : 'block';
        console.log(`Panel ${panelId} toggled to: ${isCurrentlyVisible ? 'hidden' : 'visible'}`);





    }

    // Setup event listeners
    const setupButtons = () => {
        const buttonConfigs = [
            { buttonId: 'toggle-planet', panelId: 'planet-panel' },
            { buttonId: 'toggle-aurora', panelId: 'aurora-panel' },
            { buttonId: 'toggle-music-panel', panelId: 'music-panel' }
        ];

        buttonConfigs.forEach(({ buttonId, panelId }) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePanel(panelId);
                };
                console.log(`✓ ${buttonId} listener added`);
            } else {
                console.warn(`✗ Button ${buttonId} not found`);
            }
        });

        // Setup upload ảnh trái tim
        // Setup upload ảnh trái tim với số lượng
        const heartUpload = document.getElementById('heart-image-upload');
        if (heartUpload) {
            heartUpload.onchange = (event) => {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const imageURL = URL.createObjectURL(file);

                    // Hỏi số lượng và kích thước
                    const countChoice = prompt('Số lượng ảnh muốn thêm (1-50, mặc định 10):', '10');
                    const count = Math.max(1, Math.min(50, parseInt(countChoice) || 20));

                    const sizeChoice = prompt('Chọn kích thước ảnh (1-5, mặc định 3):', '3');
                    const size = Math.max(1, Math.min(9, parseInt(sizeChoice) || 3));

                    // Thêm nhiều ảnh với delay nhỏ để không lag
                    let addedCount = 0;
                    const addInterval = setInterval(() => {
                        if (addedCount >= count) {
                            clearInterval(addInterval);
                            return;
                        }

                        if (typeof createHeartFramedImage === 'function') {
                            createHeartFramedImage(imageURL, size, heartFramedImages.length + addedCount);
                            addedCount++;
                        }
                    }, 500); // Thêm mỗi 500ms một ảnh

                    console.log(`Đang thêm ${count} ảnh trái tim...`);
                    event.target.value = '';
                } else {
                    alert('Vui lòng chọn file ảnh hợp lệ');
                }
            };
            console.log('✓ Heart upload listener added');
        }

        // Setup upload nhạc
        const musicUpload = document.getElementById('music-file-input');
        if (musicUpload) {
            musicUpload.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    loadMusicFile(file);
                    console.log('Đã load file nhạc:', file.name);
                }
            };
            console.log('✓ Music upload listener added');
        }

        // Setup nút toggle music
        const musicToggleBtn = document.getElementById('toggle-music');
        if (musicToggleBtn) {
            musicToggleBtn.onclick = toggleMusic;
            console.log('✓ Music toggle button listener added');
        }

        // Setup volume control
        const volumeSlider = document.getElementById('music-volume');
        const volumeValue = document.getElementById('music-volume-value');
        if (volumeSlider && volumeValue) {
            volumeSlider.oninput = (e) => {
                const volume = parseFloat(e.target.value);
                setMusicVolume(volume);
                volumeValue.textContent = Math.round(volume * 100) + '%';
            };
            console.log('✓ Volume control listener added');
        }

        console.log('✓ All panel controls setup completed');
    };

    // Đợi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupButtons);
    } else {
        setupButtons();
    }
}
function togglePanel(panelId) {
    console.log(`Toggling panel: ${panelId}`);

    const allPanels = ['planet-panel', 'aurora-panel', 'music-panel'];

    // Đóng tất cả panels khác
    allPanels.forEach(id => {
        if (id !== panelId) {
            const panel = document.getElementById(id);
            if (panel) {
                panel.style.display = 'none';
            }
        }
    });

    // Toggle panel được chọn
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        const isHidden = targetPanel.style.display === 'none';
        targetPanel.style.display = isHidden ? 'block' : 'none';
        console.log(`Panel ${panelId} is now ${isHidden ? 'visible' : 'hidden'}`);
    } else {
        console.error(`Panel ${panelId} not found`);
    }
}
function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'none';
    }
}


// Hệ thống Intro
let introActive = false;
let introTimeline = null;


// Hệ thống Camera Show nâng cấp
let cameraShow = {
    active: false,
    timeline: null,
    currentSequence: 0,
    sequences: []
};

function createCameraShowSequences() {
    cameraShow.sequences = [
        {
            name: "Cosmic Entry",
            duration: 3000,
            camera: {
                start: { x: 0, y: 30, z: 50 },
                end: { x: 0, y: 50, z: 150 },
                lookAt: { x: 0, y: 0, z: 0 }
            },
            effects: ["starBurst", "slowZoom"]
        },
        {
            name: "Planet Orbit",
            duration: 12000, //12000
            camera: {
                orbit: true,
                radius: 100,
                height: 25,
                speed: 1,
                lookAt: { x: 0, y: 0, z: 0 }
            },
            effects: ["planetGlow", "heartRain"]
        },
        {
            name: "Heart Zone Fly-through",
            duration: 6000, //6000
            camera: {
                path: [
                    { x: -30, y: 10, z: 20 },

                    { x: 0, y: 80, z: 100 }
                ]
            },
            effects: ["heartHighlight", "sparkleTrail"]
        },
        {
            name: "Aurora Showcase",
            duration: 3500,
            camera: {
                start: { x: 0, y: 80, z: 100 },
                end: { x: 80, y: 60, z: 80 },
                lookAt: { x: 0, y: 0, z: 0 }
            },
            effects: ["auroraIntensify", "colorCycle"]
        },
        {
            name: "Final Position",
            duration: 2000,
            camera: {
                start: { x: 80, y: 60, z: 80 },
                end: { x: 0, y: 10, z: 30 },
                lookAt: { x: 0, y: 0, z: 0 }
            },
            effects: ["uiFadeIn"]
        }
    ];
}

function startCameraShow() {
    console.log('Bắt đầu Camera Show nâng cấp...');
    cameraShow.active = true;
    cameraShow.currentSequence = 0;

    // Tắt controls
    if (controls) controls.enabled = false;
    createCameraShowSequences();
    executeSequence(0);
}

function executeSequence(index) {
    if (index >= cameraShow.sequences.length) {
        finishCameraShow();
        return;
    }

    const sequence = cameraShow.sequences[index];
    console.log(`Executing sequence: ${sequence.name}`);

    const startTime = Date.now();

    function animateSequence() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / sequence.duration, 1);
        const easeProgress = easeInOutCubic(progress);

        // Xử lý camera movement
        if (sequence.camera.orbit) {
            // Chuyển động quỹ đạo
            const angle = easeProgress * Math.PI * 2 * sequence.camera.speed;
            camera.position.set(
                Math.cos(angle) * sequence.camera.radius,
                sequence.camera.height + Math.sin(angle * 3) * 5,
                Math.sin(angle) * sequence.camera.radius
            );
        } else if (sequence.camera.path) {
            // Di chuyển theo đường path
            const pathIndex = easeProgress * (sequence.camera.path.length - 1);
            const currentIndex = Math.floor(pathIndex);
            const nextIndex = Math.min(currentIndex + 1, sequence.camera.path.length - 1);
            const t = pathIndex - currentIndex;

            const current = sequence.camera.path[currentIndex];
            const next = sequence.camera.path[nextIndex];

            camera.position.set(
                current.x + (next.x - current.x) * t,
                current.y + (next.y - current.y) * t,
                current.z + (next.z - current.z) * t
            );
        } else {
            // Di chuyển thẳng
            const start = sequence.camera.start;
            const end = sequence.camera.end;

            camera.position.set(
                start.x + (end.x - start.x) * easeProgress,
                start.y + (end.y - start.y) * easeProgress,
                start.z + (end.z - start.z) * easeProgress
            );
        }
        if (sequence.camera.lookAt) {
            camera.lookAt(
                sequence.camera.lookAt.x,
                sequence.camera.lookAt.y,
                sequence.camera.lookAt.z
            );
        }

        processSequenceEffects(sequence.effects, easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animateSequence);
        } else {
            executeSequence(index + 1);
        }
    }

    animateSequence();
}

function processSequenceEffects(effects, progress) {
    effects.forEach(effect => {
        switch (effect) {
            case 'starBurst':
                if (particles) {
                    particles.material.opacity = 0.5 + progress * 0.5;
                }
                break;

            case 'planetGlow':
                if (planet) {
                    planet.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;
                }
                break;

            case 'heartHighlight':
                hearts3D.forEach((heart, i) => {
                    const highlight = Math.sin(Date.now() * 0.005 + i) * 0.3 + 0.7;
                    heart.material.emissiveIntensity = 0.8 * highlight;
                });
                break;

            case 'auroraIntensify':
                if (auroraBackground && auroraBackground.material.uniforms) {
                    auroraBackground.material.uniforms.brightness.value = 1.5 + Math.sin(Date.now() * 0.002) * 0.5;
                }
                break;

            case 'uiFadeIn':
                const controlButtons = document.querySelector('.control-buttons');
                const title = document.querySelector('.title');
                if (controlButtons) controlButtons.style.opacity = progress;
                if (title) title.style.opacity = progress;
                break;
        }
    });
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hideUIForShow() {
    const controlButtons = document.querySelector('.control-buttons');
    const title = document.querySelector('.title');

    if (controlButtons) controlButtons.style.opacity = '0';
    if (title) title.style.opacity = '0';
}

function finishCameraShow() {
    console.log('Camera Show hoàn thành');
    cameraShow.active = false;

    // Đặt camera về vị trí cuối
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);

    // Bật controls
    if (controls) controls.enabled = true;

    // Hiện UI
    showUIAfterShow();

    // Reset effects
    resetShowEffects();
}

function showUIAfterShow() {
    const controlButtons = document.querySelector('.control-buttons');
    const title = document.querySelector('.title');

    if (controlButtons) {
        controlButtons.style.opacity = '1';
        controlButtons.style.transition = 'opacity 1s ease';
    }

    if (title) {
        title.style.opacity = '1';
        title.style.transition = 'opacity 1s ease';
    }
}

function resetShowEffects() {
    // Reset planet glow
    if (planet) {
        planet.material.emissiveIntensity = 0.3;
    }

    // Reset aurora
    if (auroraBackground && auroraBackground.material.uniforms) {
        auroraBackground.material.uniforms.brightness.value = auroraSettings.brightness;
    }

    // Reset particles
    if (particles) {
        particles.material.opacity = 0.9;
    }
}

// Thêm nút trigger camera show
function addCameraShowButton() {
    const button = document.createElement('button');
    button.innerHTML = '🎬';
    button.className = 'control-btn';
    button.title = 'Camera Show';
    button.style.background = 'linear-gradient(135deg, #ffd700, #ff8c00)';
    button.onclick = startCameraShow;

    const controlButtons = document.querySelector('.control-buttons');
    if (controlButtons) {
        controlButtons.appendChild(button);
    }
}

// Hàm debug music system
function debugMusicSystem() {
    console.log('=== MUSIC SYSTEM DEBUG ===');
    console.log('musicPlayer:', musicPlayer);
    console.log('Audio element:', musicPlayer?.audio);
    console.log('Current file:', musicPlayer?.currentFile?.name);
    console.log('Audio src:', musicPlayer?.audio?.src);
    console.log('Audio readyState:', musicPlayer?.audio?.readyState);
    console.log('Audio error:', musicPlayer?.audio?.error);
    console.log('Is playing:', musicPlayer?.isPlaying);
    console.log('=========================');
}

// Gọi debug khi cần thiết
window.debugMusic = debugMusicSystem;


// Hệ thống mưa kim cương và hoa rơi
let rainSystem = {
    diamonds: [],
    flowers: [],
    active: true,
    intensity: 1.0
};

function createDiamondRain() {
    const diamondCount = 50;

    for (let i = 0; i < diamondCount; i++) {
        // Tạo hình kim cương
        const geometry = new THREE.OctahedronGeometry(0.3 + Math.random() * 0.4, 0);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(0.6 + Math.random() * 0.4, 0.8, 0.9),
            transparent: true,
            opacity: 0.8,
            shininess: 100,
            emissive: new THREE.Color().setHSL(0.6 + Math.random() * 0.4, 0.3, 0.3),
            emissiveIntensity: 0.5
        });

        const diamond = new THREE.Mesh(geometry, material);

        // Vị trí ban đầu
        resetDiamondPosition(diamond);

        // Thông tin animation
        diamond.userData = {
            fallSpeed: 0.1 + Math.random() * 0.15,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            },
            swayAmplitude: 1 + Math.random() * 2,
            swaySpeed: 0.5 + Math.random() * 1,
            twinkleSpeed: 2 + Math.random() * 3
        };

        rainSystem.diamonds.push(diamond);
        scene.add(diamond);
    }

    console.log(`Đã tạo ${diamondCount} kim cương`);
}


function resetCrystalPosition(crystal) {
    crystal.position.set(
        (Math.random() - 0.5) * 200,
        60 + Math.random() * 30,
        (Math.random() - 0.5) * 200
    );
    crystal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
}

function updateFlowerRain(elapsedTime) {
    if (!rainSystem.active) return;

    rainSystem.flowers.forEach((flower, i) => {
        const userData = flower.userData;

        // Di chuyển
        flower.position.y -= userData.fallSpeed * rainSystem.intensity;
        flower.position.x += Math.sin(elapsedTime * userData.swaySpeed + i) * userData.swayAmplitude * 0.01;
        flower.position.z += Math.cos(elapsedTime * userData.swaySpeed * 0.8 + i) * userData.swayAmplitude * 0.008;

        // Xoay
        flower.rotation.x += userData.rotationSpeed.x;
        flower.rotation.y += userData.rotationSpeed.y;
        flower.rotation.z += userData.rotationSpeed.z;

        // Hiệu ứng phát sáng nhấp nháy
        const pulse = Math.sin(elapsedTime * userData.pulseSpeed + i) * 0.4 + 0.8;
        flower.children.forEach(child => {
            if (child.material && child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity = userData.glowIntensity * pulse;
            }
        });

        // Đổi màu nhẹ
        const colorShift = Math.sin(elapsedTime * 0.5 + i) * 0.1 + 0.9;
        flower.children[0].material.color.multiplyScalar(colorShift);

        if (flower.position.y < -20) {
            resetFlowerPosition(flower);
        }
    });
}

function createFlowerRain() {
    const flowerCount = 25; // Số lượng hoa

    for (let i = 0; i < flowerCount; i++) {
        const flowerGroup = new THREE.Group();

        // Tâm hoa phát sáng
        const centerGeometry = new THREE.SphereGeometry(0.15, 12, 10);
        const centerMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8, // ↑ Tăng cường độ phát sáng
            shininess: 100
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        flowerGroup.add(center);

        // Cánh hoa phát sáng
        const petalCount = 6;
        const petalColors = [
            0xff69b4, 0xff1493, 0x00ffff, 0x9400d3, 0x00ff00, 0xffd700
        ];

        for (let j = 0; j < petalCount; j++) {
            const petalGeometry = new THREE.SphereGeometry(0.3, 12, 10);
            petalGeometry.scale(1.2, 0.4, 0.9);

            const petalMaterial = new THREE.MeshPhongMaterial({
                color: petalColors[j % petalColors.length],
                emissive: petalColors[j % petalColors.length],
                emissiveIntensity: 0.6, // ← Cánh hoa cũng phát sáng
                transparent: true,
                opacity: 0.9,
                shininess: 80
            });

            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (j / petalCount) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4);
            petal.rotation.y = angle;

            flowerGroup.add(petal);
        }

        // Thêm hiệu ứng hào quang (glow)
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff69b4,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        flowerGroup.add(glow);

        // Vị trí ban đầu
        resetFlowerPosition(flowerGroup);

        // Thông tin animation với hiệu ứng phát sáng
        flowerGroup.userData = {
            fallSpeed: 0.1 + Math.random() * 0.15,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.08,
                y: (Math.random() - 0.5) * 0.08,
                z: (Math.random() - 0.5) * 0.08
            },
            swayAmplitude: 2.5 + Math.random() * 3.5,
            swaySpeed: 0.4 + Math.random() * 0.8,
            originalScale: 0.6 + Math.random() * 0.7,
            glowIntensity: 0.5 + Math.random() * 0.5,
            pulseSpeed: 2 + Math.random() * 3
        };

        flowerGroup.scale.setScalar(flowerGroup.userData.originalScale);
        rainSystem.flowers.push(flowerGroup);
        scene.add(flowerGroup);
    }
}



function resetDiamondPosition(diamond) {
    diamond.position.set(
        (Math.random() - 0.5) * 200, // X: -100 to 100
        50 + Math.random() * 30,     // Y: 50 to 80
        (Math.random() - 0.5) * 200  // Z: -100 to 100
    );

    // Random rotation
    diamond.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
}

function resetFlowerPosition(flower) {
    flower.position.set(
        (Math.random() - 0.5) * 180, // X: -90 to 90
        45 + Math.random() * 25,     // Y: 45 to 70
        (Math.random() - 0.5) * 180  // Z: -90 to 90
    );

    // Random rotation
    flower.rotation.set(
        Math.random() * Math.PI * 0.5, // Nhẹ nhàng hơn
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 0.5
    );
}

function updateDiamondRain(elapsedTime) {
    if (!rainSystem.active) return;

    rainSystem.diamonds.forEach((diamond, i) => {
        const userData = diamond.userData;

        // Rơi xuống
        diamond.position.y -= userData.fallSpeed * rainSystem.intensity;

        // Chuyển động lắc lư
        diamond.position.x += Math.sin(elapsedTime * userData.swaySpeed + i) * userData.swayAmplitude * 0.02;
        diamond.position.z += Math.cos(elapsedTime * userData.swaySpeed * 0.7 + i) * userData.swayAmplitude * 0.015;

        // Xoay
        diamond.rotation.x += userData.rotationSpeed.x;
        diamond.rotation.y += userData.rotationSpeed.y;
        diamond.rotation.z += userData.rotationSpeed.z;

        // Hiệu ứng lấp lánh
        const twinkle = Math.sin(elapsedTime * userData.twinkleSpeed + i) * 0.3 + 0.7;
        diamond.material.opacity = 0.8 * twinkle;
        diamond.material.emissiveIntensity = 0.5 * twinkle;
        if (diamond.position.y < -50) {
            resetDiamondPosition(diamond);
        }
    });
}

function updateFlowerRain(elapsedTime) {
    if (!rainSystem.active) return;

    rainSystem.flowers.forEach((flower, i) => {
        const userData = flower.userData;
        flower.position.y -= userData.fallSpeed * rainSystem.intensity;
        flower.position.x += Math.sin(elapsedTime * userData.swaySpeed + i) * userData.swayAmplitude * 0.01;
        flower.position.z += Math.cos(elapsedTime * userData.swaySpeed * 0.8 + i) * userData.swayAmplitude * 0.008;

        // Xoay nhẹ
        flower.rotation.x += userData.rotationSpeed.x;
        flower.rotation.y += userData.rotationSpeed.y;
        flower.rotation.z += userData.rotationSpeed.z;

        const scaleVariation = Math.sin(elapsedTime * 2 + i) * 0.1 + 1;
        flower.scale.setScalar(userData.originalScale * scaleVariation);

        if (flower.position.y < -15) {
            resetFlowerPosition(flower);
        }
    });
}

function toggleRainSystem() {
    rainSystem.active = !rainSystem.active;
    console.log(`Rain system: ${rainSystem.active ? 'ON' : 'OFF'}`);
}
function setRainIntensity(intensity) {
    rainSystem.intensity = Math.max(0, Math.min(2, intensity));
    console.log(`Rain intensity: ${rainSystem.intensity}`);
}

function initRainSystem() {
    createDiamondRain();
    createFlowerRain();

    console.log('Rain system initialized');
}




// Thêm đoạn code này vào file JavaScript của bạn
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    alert('Sorry, right-click is disabled!');
});

document.addEventListener('keydown', function (e) {

    if (
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
    ) {
        e.preventDefault();
        alert('Developer tools are disabled!');
    }
});

function sayHello(name) {
    console.log("Hello, " + name);
}
sayHello("World");

window.addEventListener('load', init);