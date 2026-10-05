/**
 * Asuna 3D Character & Interactive Core Engine (Three.js / WebGL)
 * Model: Asuna Yuuki (Sword Art Online - Knights of the Blood Oath)
 * High-Fidelity Realism: Anime Hair with Angel Ring Shine, Multi-Strand Physics,
 *                       8 Facial Expressions, Eyeball Tracking, Emote Particle Bursts
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

        // Expression Suite (8 Expressions: HAPPY, WINK, DETERMINED, BLUSH, SURPRISED, SMUG, POUT, LAUGHING)
        this.expressions = ['HAPPY', 'WINK', 'DETERMINED', 'BLUSH', 'SURPRISED', 'SMUG', 'POUT', 'LAUGHING'];
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
            50,
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
        this.scene.add(ambientLight);

        const mainDirLight = new THREE.DirectionalLight(0xfffaee, 1.7);
        mainDirLight.position.set(3, 4, 5);
        this.scene.add(mainDirLight);

        const fillLight = new THREE.DirectionalLight(0xffe2d1, 0.6);
        fillLight.position.set(-3, 2, 4);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
        rimLight.position.set(0, 4, -4);
        this.scene.add(rimLight);

        // Crimson Knights Accent Light
        this.crimsonLight = new THREE.PointLight(0xff2a4b, 3.8, 12);
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

        // Face Base Mesh (Warm Porcelain Peach Anime Skin Tone)
        const skullGeo = new THREE.IcosahedronGeometry(0.85, 3);
        skullGeo.scale(0.84, 1.14, 0.92);
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xfde8db,
            roughness: 0.52,
            metalness: 0.05,
            emissive: 0x3d1418,
            emissiveIntensity: 0.20
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

        // Subtle Nose Tip
        const noseGeo = new THREE.ConeGeometry(0.04, 0.12, 8);
        const noseMesh = new THREE.Mesh(noseGeo, skinMat);
        noseMesh.rotation.x = -Math.PI / 4;
        noseMesh.position.set(0, -0.04, 0.78);
        this.headGroup.add(noseMesh);

        // Cheeks & Rosy Blush Meshes
        this.blushGroup = new THREE.Group();
        const blushMat = new THREE.MeshBasicMaterial({
            color: 0xff5577,
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

        // Morpable Anime Mouth System (Smile, Open, Pout, Laughing)
        this.mouthGroup = new THREE.Group();
        this.mouthGroup.position.set(0, -0.32, 0.74);

        const mouthLineMat = new THREE.MeshBasicMaterial({ color: 0x8a2b37 });
        this.defaultSmileMesh = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 16, Math.PI * 0.8), mouthLineMat);
        this.defaultSmileMesh.rotation.x = Math.PI / 1.1;
        this.mouthGroup.add(this.defaultSmileMesh);

        // Open mouth for Speaking / Gasping / Laughing
        const innerMouthMat = new THREE.MeshBasicMaterial({ color: 0xc93648 });
        this.openMouthMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.7), innerMouthMat);
        this.openMouthMesh.scale.set(1.1, 0.8, 0.4);
        this.openMouthMesh.rotation.x = Math.PI / 2;
        this.openMouthMesh.visible = false;
        this.mouthGroup.add(this.openMouthMesh);

        // Pout Mouth (Small cute rounded puff)
        this.poutMouthMesh = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.022, 10, 16), mouthLineMat);
        this.poutMouthMesh.position.set(0, -0.02, 0.02);
        this.poutMouthMesh.visible = false;
        this.mouthGroup.add(this.poutMouthMesh);

        this.headGroup.add(this.mouthGroup);

        // Eyebrows (Dynamic tilt based on expression & cursor)
        const browMat = new THREE.MeshBasicMaterial({ color: 0x8a3f20 });
        const createBrow = (side) => {
            const brow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.04), browMat);
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
            color: 0xc46d29,
            roughness: 0.18,
            metalness: 0.1,
            emissive: 0x62310b,
            emissiveIntensity: 0.45
        });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1f0b05 });
        const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const createAnimeEyeAssembly = (side) => {
            const eyeGroup = new THREE.Group();
            eyeGroup.position.set(side * 0.28, 0.14, 0.71);

            // Outer Eyeliner Frame & Lashes
            const topLash = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.048, 0.06), eyelinerMat);
            topLash.position.set(0, 0.155, 0.04);
            topLash.rotation.z = side * -0.12;

            const lashWing = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), eyelinerMat);
            lashWing.rotation.z = side * -0.8;
            lashWing.position.set(side * 0.18, 0.17, 0.04);

            const bottomLash = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.04), eyelinerMat);
            bottomLash.position.set(0, -0.15, 0.03);

            // Eyeball Container (Pivots & Tracks Cursor)
            const eyeball = new THREE.Group();

            // Sclera (White Eye Base)
            const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), scleraMat);
            sclera.scale.set(1.0, 1.25, 0.7);

            // Hazel-Amber Iris
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.094, 20, 20), irisMat);
            iris.scale.set(1.0, 1.15, 0.28);
            iris.position.z = 0.09;

            // Inner Pupil
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 14), pupilMat);
            pupil.scale.set(1.0, 1.1, 0.25);
            pupil.position.z = 0.115;

            // Shiny Specular Catchlight Highlights (Anime Twinkle)
            const sparkle1 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), catchlightMat);
            sparkle1.position.set(-0.028, 0.036, 0.122);

            const sparkle2 = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), catchlightMat);
            sparkle2.position.set(0.026, -0.03, 0.120);

            eyeball.add(sclera, iris, pupil, sparkle1, sparkle2);
            eyeGroup.add(topLash, lashWing, bottomLash, eyeball);

            this.headGroup.add(eyeGroup);
            return { eyeGroup, eyeball, topLash };
        };

        this.leftEye = createAnimeEyeAssembly(-1);
        this.rightEye = createAnimeEyeAssembly(1);

        // Closed Happy Anime Eyes Arc Meshes for LAUGHING expression
        this.happyEyeArcs = new THREE.Group();
        [-1, 1].forEach(side => {
            const arc = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 16, Math.PI * 0.8), eyelinerMat);
            arc.rotation.z = Math.PI / 1.1;
            arc.position.set(side * 0.28, 0.14, 0.74);
            this.happyEyeArcs.add(arc);
        });
        this.happyEyeArcs.visible = false;
        this.headGroup.add(this.happyEyeArcs);

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
        // 3. REALISTIC ASUNA AUBURN HAIR SYSTEM & ANGEL RING SHINE HALO
        // -------------------------------------------------------------
        this.hairGroup = new THREE.Group();

        // Main Golden Honey-Auburn Hair Material
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0xd47335,
            roughness: 0.36,
            metalness: 0.12,
            emissive: 0x3d1708,
            emissiveIntensity: 0.25
        });

        // Under-layer Shadow Hair Material
        const shadowHairMat = new THREE.MeshStandardMaterial({
            color: 0x8a3818,
            roughness: 0.45,
            metalness: 0.08
        });

        // Angel Ring Glossy Shine Halo Material (Signature Anime Hair Highlight)
        const shineMat = new THREE.MeshBasicMaterial({
            color: 0xffeaaf,
            transparent: true,
            opacity: 0.65
        });

        // Crown Gloss Shine Ring (Angel Ring)
        const shineRing = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.05, 8, 36), shineMat);
        shineRing.rotation.x = Math.PI / 2.3;
        shineRing.position.set(0, 0.46, 0.02);
        this.hairGroup.add(shineRing);

        // A. Swept Front Bangs (Fringe Layered Multi-Strands)
        this.fringeGroup = new THREE.Group();

        // Under-bang shadow cap
        const shadowCap = new THREE.Mesh(new THREE.SphereGeometry(0.82, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), shadowHairMat);
        shadowCap.position.set(0, 0.35, 0.04);
        this.fringeGroup.add(shadowCap);

        // 12 Layered Tapered Strand Cones sweeping across forehead
        const bangOffsets = [-0.42, -0.32, -0.22, -0.12, -0.04, 0.04, 0.12, 0.22, 0.32, 0.42];
        bangOffsets.forEach((offset, idx) => {
            const len = 0.42 + Math.cos(idx * 0.5) * 0.08;
            const strand = new THREE.Mesh(new THREE.ConeGeometry(0.075, len, 8), hairMat);
            strand.rotation.x = Math.PI - 0.22;
            strand.rotation.z = offset * -0.42;
            strand.position.set(offset * 0.95, 0.32, 0.74 - Math.abs(offset) * 0.12);
            this.fringeGroup.add(strand);
        });
        this.hairGroup.add(this.fringeGroup);

        // B. Signature Long Front Side Locks (Framing cheeks down to chest)
        this.sideLocksGroup = new THREE.Group();
        [-1, 1].forEach((side) => {
            const lockGroup = new THREE.Group();
            
            // Outer main honey-auburn strand
            const mainLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 1.15, 8, 14), hairMat);
            mainLock.position.set(side * 0.68, -0.32, 0.25);
            mainLock.rotation.z = side * -0.12;
            mainLock.rotation.x = 0.14;

            // Inner shadow accent strand
            const innerLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.95, 8, 12), shadowHairMat);
            innerLock.position.set(side * 0.62, -0.28, 0.20);
            innerLock.rotation.z = side * -0.10;

            lockGroup.add(innerLock, mainLock);
            this.sideLocksGroup.add(lockGroup);
        });
        this.hairGroup.add(this.sideLocksGroup);

        // C. Signature Half-Up Side Braids (Temple twists wrapped behind ears)
        this.braidsGroup = new THREE.Group();
        [-1, 1].forEach((side) => {
            const braid = new THREE.Group();
            for (let b = 0; b < 6; b++) {
                const braidNode = new THREE.Mesh(new THREE.SphereGeometry(0.065 - b * 0.005, 10, 10), hairMat);
                braidNode.scale.set(1.25, 0.7, 0.85);
                braidNode.position.set(side * (0.66 - b * 0.075), 0.24 - b * 0.045, 0.38 - b * 0.13);
                braidNode.rotation.z = side * 0.32;
                braid.add(braidNode);
            }
            this.braidsGroup.add(braid);
        });
        this.hairGroup.add(this.braidsGroup);

        // D. Flowing Long Back Hair Curtain
        this.backHairGroup = new THREE.Group();
        const backHairCap = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.96, 1.5, 18, 1, true, Math.PI * 0.6, Math.PI * 0.8), hairMat);
        backHairCap.position.set(0, -0.48, -0.28);
        backHairCap.rotation.y = Math.PI;
        
        // Multi-strand layered back tips
        for (let i = -3; i <= 3; i++) {
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.7, 8), hairMat);
            tip.rotation.x = Math.PI;
            tip.position.set(i * 0.16, -1.15, -0.32);
            this.backHairGroup.add(tip);
        }
        this.backHairGroup.add(backHairCap);
        this.hairGroup.add(this.backHairGroup);

        this.headGroup.add(this.hairGroup);

        // -------------------------------------------------------------
        // 4. KNIGHTS OF THE BLOOD OATH OUTFIT & HARNESS
        // -------------------------------------------------------------
        this.torsoGroup = new THREE.Group();
        this.manGroup.add(this.torsoGroup);

        const collarMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.28, metalness: 0.18 });
        const redTrimMat = new THREE.MeshBasicMaterial({ color: 0xd91e42 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xd0d5dd, roughness: 0.22, metalness: 0.88 });

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

        // White & Silver Armor Chestplate
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

        // Swarm Particles
        this.particleCount = 220;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const r = 2.0 + Math.random() * 1.3;
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

    // Interactive Click Handler: Cycles 8 Expressions & Spawns Emote Burst Particles
    triggerClickExpressionCycle() {
        this.expressionIndex = (this.expressionIndex + 1) % this.expressions.length;
        this.currentExpression = this.expressions[this.expressionIndex];

        this.vibrationIntensity = 0.18;
        this.clickPulse = 1.0;
        setTimeout(() => { this.vibrationIntensity = 0.0; }, 220);

        this.spawnBurstParticles();
    }

    spawnBurstParticles() {
        const starColors = [0xffea00, 0xff2a4b, 0xffffff, 0xff6699, 0x00e5ff];
        for (let i = 0; i < 22; i++) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.065, 0.065, 0.065),
                new THREE.MeshBasicMaterial({ color: starColors[i % starColors.length] })
            );
            mesh.position.set(0, 0.45, 0.7);
            const speed = 0.045 + Math.random() * 0.065;
            const angle = Math.random() * Math.PI * 2;
            const vz = (Math.random() - 0.3) * 0.05;

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

        // Body Follow-Through Motion
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
            this.skullMesh.material.emissiveIntensity = 0.20 + this.clickPulse * 0.6;
        }

        // -------------------------------------------------------------
        // EYEBALL CURSOR ANIMATION & BLINKING SYSTEM
        // -------------------------------------------------------------
        if (this.leftEye && this.rightEye) {
            let aimX = this.currentEyeAim.x;
            let aimY = this.currentEyeAim.y;

            if (this.currentExpression === 'SMUG' || this.currentExpression === 'POUT') {
                aimX += 0.06; // Cheeky side glance
            }

            this.leftEye.eyeball.rotation.y = aimX * 1.2;
            this.leftEye.eyeball.rotation.x = -aimY * 1.1;

            this.rightEye.eyeball.rotation.y = aimX * 1.2;
            this.rightEye.eyeball.rotation.x = -aimY * 1.1;

            // Natural Blinking
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

            // Wink & Laughing Eye Expressions
            if (this.currentExpression === 'WINK') {
                this.leftEye.eyeball.scale.y = 0.05;
                this.rightEye.eyeball.scale.y = eyeScaleY;
                if (this.winkStarMesh) {
                    this.winkStarMesh.visible = true;
                    this.winkStarMesh.rotation.z = time * 3.0;
                }
                if (this.happyEyeArcs) this.happyEyeArcs.visible = false;
            } else if (this.currentExpression === 'LAUGHING') {
                this.leftEye.eyeball.visible = false;
                this.rightEye.eyeball.visible = false;
                if (this.happyEyeArcs) this.happyEyeArcs.visible = true;
                if (this.winkStarMesh) this.winkStarMesh.visible = false;
            } else {
                this.leftEye.eyeball.visible = true;
                this.rightEye.eyeball.visible = true;
                this.leftEye.eyeball.scale.y = eyeScaleY;
                this.rightEye.eyeball.scale.y = eyeScaleY;
                if (this.winkStarMesh) this.winkStarMesh.visible = false;
                if (this.happyEyeArcs) this.happyEyeArcs.visible = false;
            }
        }

        // -------------------------------------------------------------
        // DYNAMIC 8-EXPRESSION ENGINE (Mouth, Eyebrows, Blush)
        // -------------------------------------------------------------
        if (this.blushGroup) {
            const isBlushing = ['BLUSH', 'HAPPY', 'WINK', 'POUT', 'LAUGHING'].includes(this.currentExpression);
            const targetOpacity = isBlushing ? (this.currentExpression === 'BLUSH' ? 0.88 : 0.42) : 0.15;
            this.blushGroup.children.forEach(blush => {
                blush.material.opacity = targetOpacity;
            });
        }

        if (this.leftBrow && this.rightBrow) {
            let browTilt = 0;
            let browY = 0.32;
            if (this.currentExpression === 'DETERMINED') {
                browTilt = 0.28;
                browY = 0.28;
            } else if (this.currentExpression === 'SURPRISED') {
                browY = 0.38;
            } else if (this.currentExpression === 'POUT') {
                browTilt = -0.22;
                browY = 0.34;
            } else if (this.currentExpression === 'SMUG') {
                this.leftBrow.position.y = 0.36;
                this.rightBrow.position.y = 0.30;
            } else if (this.currentExpression === 'BLUSH') {
                browTilt = -0.15;
            }

            if (this.currentExpression !== 'SMUG') {
                const cursorBrowOffset = this.currentEyeAim.y * 0.15;
                this.leftBrow.rotation.z = 0.08 + browTilt;
                this.rightBrow.rotation.z = -0.08 - browTilt;
                this.leftBrow.position.y = browY + cursorBrowOffset;
                this.rightBrow.position.y = browY + cursorBrowOffset;
            }
        }

        // Mouth Expression Morphing
        if (this.mouthGroup) {
            this.defaultSmileMesh.visible = false;
            this.openMouthMesh.visible = false;
            this.poutMouthMesh.visible = false;

            if (this.state === 'SPEAKING') {
                const jawOpen = Math.abs(Math.sin(time * 16.0)) * 0.14;
                this.openMouthMesh.visible = true;
                this.openMouthMesh.scale.set(1.1, 0.4 + jawOpen * 2.0, 0.4);
            } else if (this.currentExpression === 'SURPRISED') {
                this.openMouthMesh.visible = true;
                this.openMouthMesh.scale.set(0.6, 0.8, 0.4);
            } else if (this.currentExpression === 'LAUGHING') {
                this.openMouthMesh.visible = true;
                this.openMouthMesh.scale.set(1.2, 0.9, 0.4);
            } else if (this.currentExpression === 'POUT') {
                this.poutMouthMesh.visible = true;
            } else {
                this.defaultSmileMesh.visible = true;
            }
        }

        // -------------------------------------------------------------
        // MULTI-JOINT HAIR PHYSICS & SWAY ANIMATION
        // -------------------------------------------------------------
        if (this.sideLocksGroup) {
            const sway = Math.sin(time * 2.2) * 0.06 + Math.cos(time * 1.1) * 0.03 + this.currentHeadRotation.roll * 0.35;
            this.sideLocksGroup.rotation.z = sway;
            this.sideLocksGroup.rotation.x = Math.sin(time * 1.6) * 0.04;
        }
        if (this.braidsGroup) {
            this.braidsGroup.rotation.z = Math.cos(time * 1.8) * 0.04;
        }
        if (this.fringeGroup) {
            this.fringeGroup.rotation.z = Math.sin(time * 1.5) * 0.025 + this.currentHeadRotation.roll * 0.15;
        }
        if (this.backHairGroup) {
            this.backHairGroup.rotation.z = Math.sin(time * 1.4) * 0.045;
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
            const pulse = this.currentExpression === 'DETERMINED' ? 6.5 : 3.8;
            this.crimsonLight.intensity = pulse + Math.sin(time * 3.0) * 0.5;
        }

        // Floating Motion
        this.coreGroup.position.y = Math.sin(time * 1.4) * 0.08;

        if (this.particleSystem) this.particleSystem.rotation.y = time * 0.12 * speedMultiplier;

        this.renderer.render(this.scene, this.camera);
    }
}
