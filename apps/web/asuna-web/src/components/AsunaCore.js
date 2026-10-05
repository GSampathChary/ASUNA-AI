/**
 * Asuna 3D Character & Interactive Core Engine (Three.js / WebGL)
 * Model: Asuna Yuuki (Sword Art Online - Knights of the Blood Oath)
 * Features: Real-time Cursor Eyeball Tracking, Dynamic Hair Sway Physics,
 *           Knights of the Blood Oath Armor, Multi-Expression Click Reactions & Burst Particles
 */

import * as THREE from 'three';

export class AsunaCoreEngine {
    constructor(containerElement, symbolType = 'humanoid') {
        this.container = containerElement;
        this.state = 'IDLE';
        this.symbolType = symbolType;

        // Head & Eyeball Tracking Variables
        this.targetHeadRotation = { pitch: 0, yaw: 0, roll: 0 };
        this.currentHeadRotation = { pitch: 0, yaw: 0, roll: 0 };
        this.targetEyeAim = { x: 0, y: 0 };
        this.currentEyeAim = { x: 0, y: 0 };
        this.cameraOverride = false;
        this.cameraOverrideTimer = null;

        // Expression & Interactive States
        // Expressions: 'HAPPY', 'WINK', 'DETERMINED', 'BLUSH', 'SURPRISED'
        this.expressions = ['HAPPY', 'WINK', 'DETERMINED', 'BLUSH', 'SURPRISED'];
        this.expressionIndex = 0;
        this.currentExpression = 'HAPPY';

        // Blinking system
        this.blinkProgress = 0;
        this.isBlinking = false;
        this.nextBlinkTime = 2.0 + Math.random() * 3.0;

        // Click feedback & burst dynamics
        this.vibrationIntensity = 0.0;
        this.clickPulse = 0.0;
        this.burstParticles = [];

        // Three.js Scene Setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            52,
            containerElement.clientWidth / containerElement.clientHeight,
            0.1,
            100
        );
        this.camera.position.z = 5.2;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        this.renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
        containerElement.appendChild(this.renderer.domElement);

        this.coreGroup = new THREE.Group();
        this.scene.add(this.coreGroup);

        this.buildAsunaCharacterGeometry();
        this.setupLighting();

        this.clock = new THREE.Clock();

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('resize', this.onWindowResize);
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);

        const mainDirLight = new THREE.DirectionalLight(0xfffaed, 1.6);
        mainDirLight.position.set(3, 4, 5);
        this.scene.add(mainDirLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
        rimLight.position.set(-3, 3, -4);
        this.scene.add(rimLight);

        // Crimson Knights Accent Light
        this.crimsonLight = new THREE.PointLight(0xff2a4b, 3.5, 12);
        this.crimsonLight.position.set(-2.5, -1.5, 3.5);
        this.scene.add(this.crimsonLight);
    }

    buildAsunaCharacterGeometry() {
        while (this.coreGroup.children.length > 0) {
            this.coreGroup.remove(this.coreGroup.children[0]);
        }

        this.manGroup = new THREE.Group();
        this.manGroup.position.y = -0.15;
        this.coreGroup.add(this.manGroup);

        // -------------------------------------------------------------
        // 1. HEAD & ANIME FACE STRUCTURE
        // -------------------------------------------------------------
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 0.50, 0);
        this.manGroup.add(this.headGroup);

        // Face / Head Base Mesh (Porcelain Peach Anime Skin Tone)
        const skullGeo = new THREE.IcosahedronGeometry(0.85, 3);
        skullGeo.scale(0.84, 1.14, 0.92);
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xfde8db,
            roughness: 0.55,
            metalness: 0.08,
            emissive: 0x3d1418,
            emissiveIntensity: 0.22
        });
        this.skullMesh = new THREE.Mesh(skullGeo, skinMat);
        this.headGroup.add(this.skullMesh);

        // Delicate Anime Chin & Jawline
        const chinGeo = new THREE.ConeGeometry(0.48, 0.55, 12);
        chinGeo.scale(0.9, 0.7, 0.75);
        const chinMesh = new THREE.Mesh(chinGeo, skinMat);
        chinMesh.rotation.x = Math.PI;
        chinMesh.position.set(0, -0.52, 0.22);
        this.headGroup.add(chinMesh);

        // Cute Nose Tip
        const noseGeo = new THREE.ConeGeometry(0.045, 0.12, 8);
        const noseMesh = new THREE.Mesh(noseGeo, skinMat);
        noseMesh.rotation.x = -Math.PI / 4;
        noseMesh.position.set(0, -0.04, 0.78);
        this.headGroup.add(noseMesh);

        // Cheeks & Rosy Blush Meshes
        this.blushGroup = new THREE.Group();
        const blushMat = new THREE.MeshBasicMaterial({
            color: 0xff6688,
            transparent: true,
            opacity: 0.35
        });
        [-1, 1].forEach(side => {
            const blush = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.18, 8, 12), blushMat);
            blush.rotation.z = Math.PI / 2 + side * 0.15;
            blush.position.set(side * 0.36, -0.12, 0.70);
            this.blushGroup.add(blush);
        });
        this.headGroup.add(this.blushGroup);

        // Morpable Anime Mouth (Smile, Open, Gasp)
        this.mouthGroup = new THREE.Group();
        this.mouthGroup.position.set(0, -0.32, 0.74);

        const mouthLineMat = new THREE.MeshBasicMaterial({ color: 0x8a2b37 });
        this.defaultSmileMesh = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 16, Math.PI * 0.8), mouthLineMat);
        this.defaultSmileMesh.rotation.x = Math.PI / 1.1;
        this.mouthGroup.add(this.defaultSmileMesh);

        // Open mouth for Speaking / Gasping
        const innerMouthMat = new THREE.MeshBasicMaterial({ color: 0xc93648 });
        this.openMouthMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.7), innerMouthMat);
        this.openMouthMesh.scale.set(1.1, 0.8, 0.4);
        this.openMouthMesh.rotation.x = Math.PI / 2;
        this.openMouthMesh.visible = false;
        this.mouthGroup.add(this.openMouthMesh);

        this.headGroup.add(this.mouthGroup);

        // Eyebrows (Dynamic tilt based on expression & cursor)
        const browMat = new THREE.MeshBasicMaterial({ color: 0x8f4626 });
        const createBrow = (side) => {
            const brow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.04), browMat);
            brow.position.set(side * 0.28, 0.32, 0.73);
            brow.rotation.z = side * -0.08;
            this.headGroup.add(brow);
            return brow;
        };
        this.leftBrow = createBrow(-1);
        this.rightBrow = createBrow(1);

        // -------------------------------------------------------------
        // 2. HIGH-FIDELITY ANIME EYES & EYEBALL CURSOR TRACKING
        // -------------------------------------------------------------
        const eyelinerMat = new THREE.MeshBasicMaterial({ color: 0x1c0c08 });
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xfffcf7 });
        const irisMat = new THREE.MeshStandardMaterial({
            color: 0xb86928,
            roughness: 0.2,
            metalness: 0.1,
            emissive: 0x5a2d0b,
            emissiveIntensity: 0.4
        });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1f0b05 });
        const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const createAnimeEyeAssembly = (side) => {
            const eyeGroup = new THREE.Group();
            eyeGroup.position.set(side * 0.28, 0.14, 0.71);

            // Outer Eyeliner Frame
            const topLash = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, 0.06), eyelinerMat);
            topLash.position.set(0, 0.15, 0.04);
            topLash.rotation.z = side * -0.12;

            const bottomLash = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.04), eyelinerMat);
            bottomLash.position.set(0, -0.15, 0.03);

            // Eyeball Container (Pivots & Tracks Cursor)
            const eyeball = new THREE.Group();

            // Sclera (White Eye Base)
            const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), scleraMat);
            sclera.scale.set(1.0, 1.25, 0.7);

            // Hazel-Amber Iris
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.092, 20, 20), irisMat);
            iris.scale.set(1.0, 1.15, 0.28);
            iris.position.z = 0.09;

            // Deep Inner Pupil
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 14), pupilMat);
            pupil.scale.set(1.0, 1.1, 0.25);
            pupil.position.z = 0.115;

            // Shiny Specular Catchlight Highlights (Anime Twinkle)
            const sparkle1 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), catchlightMat);
            sparkle1.position.set(-0.028, 0.035, 0.122);

            const sparkle2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), catchlightMat);
            sparkle2.position.set(0.025, -0.03, 0.120);

            eyeball.add(sclera, iris, pupil, sparkle1, sparkle2);
            eyeGroup.add(topLash, bottomLash, eyeball);

            this.headGroup.add(eyeGroup);
            return { eyeGroup, eyeball, topLash };
        };

        this.leftEye = createAnimeEyeAssembly(-1);
        this.rightEye = createAnimeEyeAssembly(1);

        // Wink Sparkle Star Mesh over left eye when winking
        const starShape = new THREE.Shape();
        for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? 0.12 : 0.04;
            const a = (i / 8) * Math.PI * 2;
            if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        const starGeo = new THREE.ShapeGeometry(starShape);
        const starMat = new THREE.MeshBasicMaterial({ color: 0xffea00, side: THREE.DoubleSide });
        this.winkStarMesh = new THREE.Mesh(starGeo, starMat);
        this.winkStarMesh.position.set(-0.28, 0.14, 0.80);
        this.winkStarMesh.visible = false;
        this.headGroup.add(this.winkStarMesh);

        // -------------------------------------------------------------
        // 3. ASUNA'S SIGNATURE CHESTNUT / AUBURN HAIR SYSTEM
        // -------------------------------------------------------------
        this.hairGroup = new THREE.Group();
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x9b4b2a,
            roughness: 0.42,
            metalness: 0.18,
            emissive: 0x2b0d06,
            emissiveIntensity: 0.3
        });

        // Swept Front Bangs (Fringe)
        this.fringeGroup = new THREE.Group();
        const mainBangs = new THREE.Mesh(new THREE.SphereGeometry(0.82, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.46), hairMat);
        mainBangs.scale.set(1.02, 1.08, 1.04);
        mainBangs.position.set(0, 0.36, 0.06);
        this.fringeGroup.add(mainBangs);

        // Individual Bang Locks framing forehead
        [-0.32, -0.12, 0.12, 0.32].forEach((offset, idx) => {
            const bangTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 8), hairMat);
            bangTip.rotation.x = Math.PI - 0.2;
            bangTip.rotation.z = offset * -0.4;
            bangTip.position.set(offset, 0.32, 0.74 - Math.abs(offset) * 0.1);
            this.fringeGroup.add(bangTip);
        });
        this.hairGroup.add(this.fringeGroup);

        // Signature Long Front Side Locks (Resting over shoulders)
        this.sideLocksGroup = new THREE.Group();
        [-1, 1].forEach((side) => {
            const sideLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.95, 8, 12), hairMat);
            sideLock.position.set(side * 0.68, -0.28, 0.22);
            sideLock.rotation.z = side * -0.14;
            sideLock.rotation.x = 0.15;
            this.sideLocksGroup.add(sideLock);
        });
        this.hairGroup.add(this.sideLocksGroup);

        // Signature Half-Up Side Braids (Temple twists gathered in back)
        this.braidsGroup = new THREE.Group();
        [-1, 1].forEach((side) => {
            const braid = new THREE.Group();
            for (let b = 0; b < 5; b++) {
                const braidSegment = new THREE.Mesh(new THREE.SphereGeometry(0.065 - b * 0.006, 10, 10), hairMat);
                braidSegment.scale.set(1.2, 0.7, 0.8);
                braidSegment.position.set(side * (0.64 - b * 0.08), 0.22 - b * 0.05, 0.35 - b * 0.14);
                braidSegment.rotation.z = side * 0.3;
                braid.add(braidSegment);
            }
            this.braidsGroup.add(braid);
        });
        this.hairGroup.add(this.braidsGroup);

        // Flowing Long Back Hair Curtain
        this.backHairGroup = new THREE.Group();
        const backHairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.92, 1.4, 16, 1, true, Math.PI * 0.6, Math.PI * 0.8), hairMat);
        backHairBase.position.set(0, -0.45, -0.28);
        backHairBase.rotation.y = Math.PI;
        this.backHairGroup.add(backHairBase);
        this.hairGroup.add(this.backHairGroup);

        this.headGroup.add(this.hairGroup);

        // -------------------------------------------------------------
        // 4. KNIGHTS OF THE BLOOD OATH OUTFIT & HARNESS
        // -------------------------------------------------------------
        this.torsoGroup = new THREE.Group();
        this.manGroup.add(this.torsoGroup);

        // High White Collar with Red Edging
        const collarMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.3, metalness: 0.2 });
        const redTrimMat = new THREE.MeshBasicMaterial({ color: 0xd91e42 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xd0d5dd, roughness: 0.25, metalness: 0.85 });

        const neckGeo = new THREE.CylinderGeometry(0.26, 0.34, 0.48, 16);
        const neckMesh = new THREE.Mesh(neckGeo, skinMat);
        neckMesh.position.set(0, -0.14, -0.02);
        this.torsoGroup.add(neckMesh);

        const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.30, 16), collarMat);
        collarMesh.position.set(0, -0.28, 0.02);
        this.torsoGroup.add(collarMesh);

        const collarRedTrim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.022, 10, 24), redTrimMat);
        collarRedTrim.rotation.x = Math.PI / 2;
        collarRedTrim.position.set(0, -0.15, 0.02);
        this.torsoGroup.add(collarRedTrim);

        // Knights Cross Pin Emblem on Collar
        const crossGroup = new THREE.Group();
        const vCross = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.03), redTrimMat);
        const hCross = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.03), redTrimMat);
        crossGroup.add(vCross, hCross);
        crossGroup.position.set(0, -0.28, 0.40);
        this.torsoGroup.add(crossGroup);

        // White & Silver Armor Chestplate with Red Accents
        const chestplate = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), collarMat);
        chestplate.scale.set(1.15, 0.72, 0.55);
        chestplate.position.set(0, -0.92, 0.05);
        this.torsoGroup.add(chestplate);

        const armorTrimTop = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.045, 0.06), redTrimMat);
        armorTrimTop.position.set(0, -0.74, 0.38);
        this.torsoGroup.add(armorTrimTop);

        const armorPlateSilver = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.28, 0.08), silverMat);
        armorPlateSilver.position.set(0, -0.92, 0.35);
        this.torsoGroup.add(armorPlateSilver);

        // Red Pleated Waist Skirt Trim
        const skirtGeo = new THREE.ConeGeometry(0.85, 0.55, 16, 1, true);
        const skirtMesh = new THREE.Mesh(skirtGeo, redTrimMat);
        skirtMesh.position.set(0, -1.35, 0.02);
        this.torsoGroup.add(skirtMesh);

        // -------------------------------------------------------------
        // 5. ORBITAL SAO ENERGY RINGS & FLOATING PARTICLES
        // -------------------------------------------------------------
        const whiteRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
        this.goldRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.02, 8, 48), whiteRingMat);
        this.goldRing.rotation.x = Math.PI / 3;
        this.coreGroup.add(this.goldRing);

        const crimsonRingMat = new THREE.MeshBasicMaterial({ color: 0xff1e42, transparent: true, opacity: 0.90 });
        this.crimsonRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.025, 8, 48), crimsonRingMat);
        this.crimsonRing.rotation.y = Math.PI / 4;
        this.coreGroup.add(this.crimsonRing);

        // Ambient Swarm Particles
        this.particleCount = 200;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const r = 2.0 + Math.random() * 1.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            if (Math.random() > 0.35) {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.92;
                colors[i * 3 + 2] = 0.95;
            } else {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.14;
                colors[i * 3 + 2] = 0.30;
            }
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.88
        });

        this.particleSystem = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.particleSystem);

        // Interactive Click Burst Particle Container Group
        this.burstGroup = new THREE.Group();
        this.scene.add(this.burstGroup);
    }

    setSymbolType(newSymbolType) {
        this.symbolType = newSymbolType;
        this.buildAsunaCharacterGeometry();
    }

    onWindowResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // -------------------------------------------------------------
    // CURSOR TRACKING & POINTER EVENTS
    // -------------------------------------------------------------
    onPointerMove(event) {
        if (this.cameraOverride) return;

        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Smooth Head Rotation Target (Yaw, Pitch, Roll)
        this.targetHeadRotation.yaw = x * 0.72;
        this.targetHeadRotation.pitch = -y * 0.42;
        this.targetHeadRotation.roll = x * -0.14;

        // Eyeball 3D Target Aim
        this.targetEyeAim.x = x * 0.14;
        this.targetEyeAim.y = y * 0.11;
    }

    onPointerDown() {
        this.triggerClickExpressionCycle();
    }

    // Interactive Click Handler: Cycles Expressions & Spawns Energy Particles
    triggerClickExpressionCycle() {
        this.expressionIndex = (this.expressionIndex + 1) % this.expressions.length;
        this.currentExpression = this.expressions[this.expressionIndex];

        this.vibrationIntensity = 0.16;
        this.clickPulse = 1.0;
        setTimeout(() => { this.vibrationIntensity = 0.0; }, 220);

        this.spawnBurstParticles();
    }

    spawnBurstParticles() {
        const starColors = [0xffea00, 0xff2a4b, 0xffffff, 0xff7597];
        for (let i = 0; i < 18; i++) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.06, 0.06),
                new THREE.MeshBasicMaterial({ color: starColors[i % starColors.length] })
            );
            mesh.position.set(0, 0.45, 0.7);
            const speed = 0.04 + Math.random() * 0.06;
            const angle = Math.random() * Math.PI * 2;
            const vz = (Math.random() - 0.3) * 0.04;

            this.burstParticles.push({
                mesh,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz,
                life: 1.0
            });
            this.burstGroup.add(mesh);
        }
    }

    setCameraPose(pose) {
        if (!pose) return;
        const { pitch = 0, yaw = 0, roll = 0 } = pose;
        this.cameraOverride = true;
        this.targetHeadRotation.pitch = pitch;
        this.targetHeadRotation.yaw = yaw;
        this.targetHeadRotation.roll = roll;

        if (this.cameraOverrideTimer) clearTimeout(this.cameraOverrideTimer);
        this.cameraOverrideTimer = setTimeout(() => {
            this.cameraOverride = false;
        }, 1500);
    }

    setState(newState) {
        this.state = newState;
        if (newState === 'CLICKING' || newState === 'TOUCH_BURST') {
            this.triggerClickExpressionCycle();
        }
    }

    // -------------------------------------------------------------
    // MAIN ANIMATION LOOP
    // -------------------------------------------------------------
    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();

        const speedMultiplier = this.state === 'THINKING' ? 2.2 : 1.0;

        // Smooth Dampening Interpolation for Head Tracking
        this.currentHeadRotation.yaw += (this.targetHeadRotation.yaw - this.currentHeadRotation.yaw) * 0.09;
        this.currentHeadRotation.pitch += (this.targetHeadRotation.pitch - this.currentHeadRotation.pitch) * 0.09;
        this.currentHeadRotation.roll += (this.targetHeadRotation.roll - this.currentHeadRotation.roll) * 0.09;

        // Smooth Dampening Interpolation for Eyeball Tracking
        this.currentEyeAim.x += (this.targetEyeAim.x - this.currentEyeAim.x) * 0.18;
        this.currentEyeAim.y += (this.targetEyeAim.y - this.currentEyeAim.y) * 0.18;

        if (this.headGroup) {
            this.headGroup.rotation.y = this.currentHeadRotation.yaw;
            this.headGroup.rotation.x = this.currentHeadRotation.pitch;
            this.headGroup.rotation.z = this.currentHeadRotation.roll;
        }

        // Slight Body Follow-Through Motion
        if (this.torsoGroup) {
            this.torsoGroup.rotation.y = this.currentHeadRotation.yaw * 0.28;
            this.torsoGroup.rotation.x = this.currentHeadRotation.pitch * 0.22;
        }

        // Tactile Spring Bounce & Glow Impulse on Click
        this.clickPulse = Math.max(0, this.clickPulse - 0.032);
        const clickJolt = Math.sin(time * 70) * this.vibrationIntensity;
        this.coreGroup.rotation.z = clickJolt;
        this.coreGroup.scale.setScalar(1 + this.clickPulse * 0.06);

        if (this.skullMesh?.material) {
            this.skullMesh.material.emissiveIntensity = 0.22 + this.clickPulse * 0.6;
        }

        // -------------------------------------------------------------
        // EYEBALL CURSOR ANIMATION & BLINKING SYSTEM
        // -------------------------------------------------------------
        if (this.leftEye && this.rightEye) {
            // Eyeballs pivot inside eye socket towards cursor coordinates
            const aimX = this.currentEyeAim.x;
            const aimY = this.currentEyeAim.y;

            this.leftEye.eyeball.rotation.y = aimX * 1.2;
            this.leftEye.eyeball.rotation.x = -aimY * 1.1;

            this.rightEye.eyeball.rotation.y = aimX * 1.2;
            this.rightEye.eyeball.rotation.x = -aimY * 1.1;

            // Natural Periodic Blinking Simulation
            if (time > this.nextBlinkTime && !this.isBlinking) {
                this.isBlinking = true;
                this.blinkProgress = 0;
            }

            let eyeScaleY = 1.0;
            if (this.isBlinking) {
                this.blinkProgress += 0.16;
                eyeScaleY = Math.abs(Math.cos(this.blinkProgress * Math.PI));
                if (this.blinkProgress >= 1.0) {
                    this.isBlinking = false;
                    this.nextBlinkTime = time + 2.5 + Math.random() * 3.5;
                }
            }

            // Wink Expression Logic
            if (this.currentExpression === 'WINK') {
                this.leftEye.eyeball.scale.y = 0.05;
                this.rightEye.eyeball.scale.y = eyeScaleY;
                if (this.winkStarMesh) {
                    this.winkStarMesh.visible = true;
                    this.winkStarMesh.rotation.z = time * 3.0;
                }
            } else {
                this.leftEye.eyeball.scale.y = eyeScaleY;
                this.rightEye.eyeball.scale.y = eyeScaleY;
                if (this.winkStarMesh) this.winkStarMesh.visible = false;
            }
        }

        // -------------------------------------------------------------
        // DYNAMIC FACIAL EXPRESSIONS & MOUTH MORPHING
        // -------------------------------------------------------------
        if (this.blushGroup) {
            const isBlushing = this.currentExpression === 'BLUSH' || this.currentExpression === 'HAPPY';
            const targetOpacity = isBlushing ? (this.currentExpression === 'BLUSH' ? 0.85 : 0.40) : 0.15;
            this.blushGroup.children.forEach(blush => {
                blush.material.opacity = targetOpacity;
            });
        }

        if (this.leftBrow && this.rightBrow) {
            let browTilt = 0;
            let browY = 0.32;
            if (this.currentExpression === 'DETERMINED') {
                browTilt = 0.25;
                browY = 0.29;
            } else if (this.currentExpression === 'SURPRISED') {
                browY = 0.37;
            } else if (this.currentExpression === 'BLUSH') {
                browTilt = -0.15;
            }
            // Add cursor influence on eyebrows
            const cursorBrowOffset = this.currentEyeAim.y * 0.15;
            this.leftBrow.rotation.z = 0.08 + browTilt;
            this.rightBrow.rotation.z = -0.08 - browTilt;
            this.leftBrow.position.y = browY + cursorBrowOffset;
            this.rightBrow.position.y = browY + cursorBrowOffset;
        }

        // Mouth Articulation
        if (this.mouthGroup) {
            if (this.state === 'SPEAKING') {
                const jawOpen = Math.abs(Math.sin(time * 16.0)) * 0.14;
                this.defaultSmileMesh.visible = false;
                this.openMouthMesh.visible = true;
                this.openMouthMesh.scale.set(1.1, 0.4 + jawOpen * 2.0, 0.4);
            } else if (this.currentExpression === 'SURPRISED') {
                this.defaultSmileMesh.visible = false;
                this.openMouthMesh.visible = true;
                this.openMouthMesh.scale.set(0.6, 0.8, 0.4);
            } else {
                this.defaultSmileMesh.visible = true;
                this.openMouthMesh.visible = false;
            }
        }

        // -------------------------------------------------------------
        // HAIR PHYSICS & SWAY ANIMATION
        // -------------------------------------------------------------
        if (this.sideLocksGroup) {
            const sway = Math.sin(time * 2.2) * 0.05 + this.currentHeadRotation.roll * 0.3;
            this.sideLocksGroup.rotation.z = sway;
        }
        if (this.braidsGroup) {
            this.braidsGroup.rotation.z = Math.cos(time * 1.8) * 0.03;
        }
        if (this.fringeGroup) {
            this.fringeGroup.rotation.z = Math.sin(time * 1.5) * 0.02 + this.currentHeadRotation.roll * 0.15;
        }
        if (this.backHairGroup) {
            this.backHairGroup.rotation.z = Math.sin(time * 1.4) * 0.04;
        }

        // -------------------------------------------------------------
        // CLICK BURST PARTICLES UPDATE
        // -------------------------------------------------------------
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
            const p = this.burstParticles[i];
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;
            p.life -= 0.035;
            p.mesh.scale.setScalar(p.life);
            if (p.life <= 0) {
                this.burstGroup.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.burstParticles.splice(i, 1);
            }
        }

        // Energy Rings & Floating Motion
        if (this.goldRing) this.goldRing.rotation.z += 0.01 * speedMultiplier;
        if (this.crimsonRing) this.crimsonRing.rotation.x += 0.012 * speedMultiplier;
        if (this.crimsonLight) {
            const pulse = this.currentExpression === 'DETERMINED' ? 6.0 : 3.5;
            this.crimsonLight.intensity = pulse + Math.sin(time * 3.0) * 0.5;
        }

        // Gentle Floating Breathing Motion
        this.coreGroup.position.y = Math.sin(time * 1.4) * 0.08;

        if (this.particleSystem) this.particleSystem.rotation.y = time * 0.12 * speedMultiplier;

        this.renderer.render(this.scene, this.camera);
    }
}
