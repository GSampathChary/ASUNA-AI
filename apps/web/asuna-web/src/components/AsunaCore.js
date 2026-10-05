/**
 * Asuna 3D Cybernetic Man Core Engine (Three.js / WebGL)
 * Crimson Red & Pure Platinum White Aesthetic Theme
 * Real-Time Mouse & Camera Head Tracking + Speech Lip-Sync
 */

import * as THREE from 'three';

export class AsunaCoreEngine {
    constructor(containerElement, symbolType = 'humanoid') {
        this.container = containerElement;
        this.state = 'IDLE';
        this.symbolType = symbolType;

        // Head tracking rotations (Pitch, Yaw, Roll)
        this.targetHeadRotation = { pitch: 0, yaw: 0, roll: 0 };
        this.currentHeadRotation = { pitch: 0, yaw: 0, roll: 0 };
        this.cameraOverride = false;
        this.cameraOverrideTimer = null;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            55,
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

        this.buildHumanoidGeometry();

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
        this.scene.add(ambientLight);

        // Directional Light for Metallic Sculpting
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(3, 4, 5);
        this.scene.add(dirLight);

        // Crimson Red Accent Light
        const crimsonLight = new THREE.PointLight(0xff1e42, 3.0, 12);
        crimsonLight.position.set(-3, -2, 4);
        this.scene.add(crimsonLight);

        const cyanLight = new THREE.PointLight(0x28d7ff, 2.4, 10);
        cyanLight.position.set(3, 1.5, 4);
        this.scene.add(cyanLight);

        const violetRimLight = new THREE.PointLight(0x9d6cff, 1.8, 9);
        violetRimLight.position.set(0, 3, -3);
        this.scene.add(violetRimLight);

        this.clock = new THREE.Clock();
        this.vibrationIntensity = 0.0;

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('resize', this.onWindowResize);

        this.animate();
    }

    buildHumanoidGeometry() {
        while (this.coreGroup.children.length > 0) {
            this.coreGroup.remove(this.coreGroup.children[0]);
        }

        // Parent Group for Entire Man Figure
        this.manGroup = new THREE.Group();
        this.manGroup.position.y = -0.2;
        this.coreGroup.add(this.manGroup);

        // 1. Head Group (Rotates and tilts towards mouse/camera)
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 0.45, 0);
        this.manGroup.add(this.headGroup);

        // Skull Mesh (Cranium & Face Structure)
        const skullGeo = new THREE.IcosahedronGeometry(0.85, 2);
        skullGeo.scale(0.88, 1.15, 0.95);
        const skullMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a24,
            roughness: 0.25,
            metalness: 0.85,
            emissive: 0x3d000a,
            emissiveIntensity: 0.5
        });
        this.skullMesh = new THREE.Mesh(skullGeo, skullMat);
        this.headGroup.add(this.skullMesh);

        // Halo-like crown plate gives the cranium a cleaner silhouette from every angle.
        const crownGeo = new THREE.TorusGeometry(0.72, 0.045, 10, 32, Math.PI * 1.1);
        const crownMat = new THREE.MeshStandardMaterial({
            color: 0xffc66d,
            emissive: 0x7d3200,
            emissiveIntensity: 0.9,
            metalness: 0.9,
            roughness: 0.18
        });
        const crownMesh = new THREE.Mesh(crownGeo, crownMat);
        crownMesh.rotation.x = Math.PI / 2;
        crownMesh.position.set(0, 0.20, 0.82);
        this.headGroup.add(crownMesh);

        // Cybernetic Facial Wireframe Mesh
        const facialGridGeo = new THREE.IcosahedronGeometry(0.88, 2);
        facialGridGeo.scale(0.9, 1.17, 0.97);
        const facialGridMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.28
        });
        this.facialGridMesh = new THREE.Mesh(facialGridGeo, facialGridMat);
        this.headGroup.add(this.facialGridMesh);

        // Jawbone Mesh (Articulates when speaking)
        const jawGeo = new THREE.ConeGeometry(0.68, 0.95, 5);
        jawGeo.scale(1.0, 0.7, 0.85);
        const jawMat = new THREE.MeshStandardMaterial({
            color: 0xff1e42,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x770016
        });
        this.jawMesh = new THREE.Mesh(jawGeo, jawMat);
        this.jawMesh.rotation.x = Math.PI;
        this.jawMesh.position.set(0, -0.45, 0.1);
        this.headGroup.add(this.jawMesh);

        // Eyes & Ocular Pupils
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xff1e42 });

        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), eyeMat);
        leftEye.position.set(-0.27, 0.15, 0.72);
        const leftIris = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), irisMat);
        leftIris.position.set(-0.27, 0.15, 0.80);
        this.headGroup.add(leftEye, leftIris);

        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), eyeMat);
        rightEye.position.set(0.27, 0.15, 0.72);
        const rightIris = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), irisMat);
        rightIris.position.set(0.27, 0.15, 0.80);
        this.headGroup.add(rightEye, rightIris);

        this.leftIris = leftIris;
        this.rightIris = rightIris;

        // Brow Ridge & Nose Structure
        const browGeo = new THREE.BoxGeometry(0.72, 0.08, 0.22);
        const browMat = new THREE.MeshStandardMaterial({ color: 0xff1e42, metalness: 0.8, roughness: 0.2 });
        const browMesh = new THREE.Mesh(browGeo, browMat);
        browMesh.position.set(0, 0.26, 0.70);
        this.headGroup.add(browMesh);

        const noseGeo = new THREE.BoxGeometry(0.12, 0.32, 0.25);
        const noseMesh = new THREE.Mesh(noseGeo, browMat);
        noseMesh.position.set(0, 0.02, 0.75);
        this.headGroup.add(noseMesh);

        // Layered face armor: temple pods, cheek plates, and a glowing chin interface.
        const armorMat = new THREE.MeshStandardMaterial({
            color: 0x2c3a55,
            emissive: 0x07172c,
            emissiveIntensity: 0.8,
            metalness: 0.92,
            roughness: 0.2
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x28d7ff,
            emissive: 0x087da5,
            emissiveIntensity: 1.5,
            metalness: 0.65,
            roughness: 0.16
        });
        [-1, 1].forEach((side) => {
            const temple = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 6, 12), armorMat);
            temple.position.set(side * 0.66, 0.16, 0.43);
            temple.rotation.z = side * 0.22;
            this.headGroup.add(temple);

            const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.13), armorMat);
            cheek.position.set(side * 0.43, -0.20, 0.73);
            cheek.rotation.z = side * -0.35;
            this.headGroup.add(cheek);

            const cheekLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.035), accentMat);
            cheekLight.position.set(side * 0.45, -0.15, 0.81);
            cheekLight.rotation.z = side * -0.35;
            this.headGroup.add(cheekLight);
        });

        const chinCore = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), accentMat);
        chinCore.position.set(0, -0.56, 0.73);
        this.headGroup.add(chinCore);
        this.chinCore = chinCore;

        // 2. Neck & Upper Torso Harness (Base Structure)
        this.torsoGroup = new THREE.Group();
        this.manGroup.add(this.torsoGroup);

        const neckGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.55, 16);
        const neckMat = new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.9, roughness: 0.3 });
        const neckMesh = new THREE.Mesh(neckGeo, neckMat);
        neckMesh.position.set(0, -0.15, -0.05);
        this.torsoGroup.add(neckMesh);

        const neckLightMat = new THREE.MeshBasicMaterial({ color: 0x28d7ff });
        [-0.27, -0.12, 0.03].forEach((y) => {
            const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.018, 8, 24), neckLightMat);
            neckRing.rotation.x = Math.PI / 2;
            neckRing.position.set(0, y, 0.02);
            this.torsoGroup.add(neckRing);
        });

        const shouldersGeo = new THREE.BoxGeometry(2.1, 0.45, 0.9);
        const shouldersMat = new THREE.MeshStandardMaterial({ color: 0x1f1f2e, metalness: 0.8, roughness: 0.3 });
        const shouldersMesh = new THREE.Mesh(shouldersGeo, shouldersMat);
        shouldersMesh.position.set(0, -0.65, -0.1);
        this.torsoGroup.add(shouldersMesh);

        const chestPlate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.62, 0.82, 0.38, 6),
            new THREE.MeshStandardMaterial({ color: 0x182640, metalness: 0.9, roughness: 0.22 })
        );
        chestPlate.rotation.x = Math.PI / 2;
        chestPlate.position.set(0, -0.98, 0.13);
        this.torsoGroup.add(chestPlate);

        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x9d6cff,
            emissive: 0x4817a6,
            emissiveIntensity: 1.8,
            metalness: 0.5,
            roughness: 0.15
        });
        this.chestCore = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), coreMat);
        this.chestCore.position.set(0, -0.99, 0.36);
        this.torsoGroup.add(this.chestCore);

        const collarRingGeo = new THREE.TorusGeometry(1.05, 0.04, 12, 32);
        const collarRingMat = new THREE.MeshBasicMaterial({ color: 0xff1e42 });
        const collarRing = new THREE.Mesh(collarRingGeo, collarRingMat);
        collarRing.rotation.x = Math.PI / 2.2;
        collarRing.position.set(0, -0.42, 0.0);
        this.torsoGroup.add(collarRing);

        // 3. Orbital Crimson & Platinum Energy Rings
        const whiteRingGeo = new THREE.TorusGeometry(2.1, 0.025, 8, 36);
        const whiteRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.goldRing = new THREE.Mesh(whiteRingGeo, whiteRingMat);
        this.goldRing.rotation.x = Math.PI / 3;
        this.coreGroup.add(this.goldRing);

        const crimsonRingGeo = new THREE.TorusGeometry(1.75, 0.02, 8, 36);
        const crimsonRingMat = new THREE.MeshBasicMaterial({ color: 0xff1e42 });
        this.crimsonRing = new THREE.Mesh(crimsonRingGeo, crimsonRingMat);
        this.crimsonRing.rotation.y = Math.PI / 4;
        this.coreGroup.add(this.crimsonRing);

        // 4. 200 Particle Swarm
        this.particleCount = 200;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const r = 2.2 + Math.random() * 1.1;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            if (Math.random() > 0.4) {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 1.0;
            } else {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.12;
                colors[i * 3 + 2] = 0.26;
            }
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.90
        });

        this.particleSystem = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.particleSystem);
    }

    setSymbolType(newSymbolType) {
        this.symbolType = newSymbolType;
        this.buildHumanoidGeometry();
    }

    onWindowResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // React to Mouse Cursor Movement on PC / Browser
    onPointerMove(event) {
        if (this.cameraOverride) return;

        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Head turns towards mouse cursor (Yaw: X, Pitch: Y)
        this.targetHeadRotation.yaw = x * 0.75;
        this.targetHeadRotation.pitch = -y * 0.45;
        this.targetHeadRotation.roll = x * -0.15;
    }

    // React to Camera Movements from Mobile App / Webcam
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
            this.triggerClickVibration();
        }
    }

    triggerClickVibration() {
        this.vibrationIntensity = 0.12;
        setTimeout(() => { this.vibrationIntensity = 0.0; }, 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();

        const speedMultiplier = this.state === 'THINKING' ? 2.2 : 1.0;

        // Smooth Head Rotation Interpolation (Dampening lerp)
        this.currentHeadRotation.yaw += (this.targetHeadRotation.yaw - this.currentHeadRotation.yaw) * 0.08;
        this.currentHeadRotation.pitch += (this.targetHeadRotation.pitch - this.currentHeadRotation.pitch) * 0.08;
        this.currentHeadRotation.roll += (this.targetHeadRotation.roll - this.currentHeadRotation.roll) * 0.08;

        if (this.headGroup) {
            this.headGroup.rotation.y = this.currentHeadRotation.yaw;
            this.headGroup.rotation.x = this.currentHeadRotation.pitch;
            this.headGroup.rotation.z = this.currentHeadRotation.roll;
        }

        // Slight Body Follow-Through Motion
        if (this.torsoGroup) {
            this.torsoGroup.rotation.y = this.currentHeadRotation.yaw * 0.3;
            this.torsoGroup.rotation.x = this.currentHeadRotation.pitch * 0.25;
        }

        // Speech & Audio Lip-Sync Animation (Jaw Movement)
        if (this.jawMesh) {
            if (this.state === 'SPEAKING') {
                const jawOpen = Math.abs(Math.sin(time * 16.0)) * 0.18;
                this.jawMesh.position.y = -0.45 - jawOpen;
                this.headGroup.position.y = 0.45 + Math.sin(time * 8.0) * 0.02;
            } else {
                this.jawMesh.position.y = -0.45;
            }
        }

        // Eye Iris Pulsation
        if (this.leftIris && this.rightIris) {
            const irisScale = this.state === 'SPEAKING' || this.state === 'THINKING'
                ? 1.0 + Math.sin(time * 12) * 0.25
                : 1.0;
            this.leftIris.scale.set(irisScale, irisScale, 1);
            this.rightIris.scale.set(irisScale, irisScale, 1);
        }

        if (this.chinCore && this.chestCore) {
            const corePulse = 1 + Math.sin(time * (this.state === 'THINKING' ? 7 : 3.5)) * 0.12;
            this.chinCore.scale.setScalar(corePulse);
            this.chestCore.scale.setScalar(corePulse);
        }

        // Energy Rings & Particles Rotation
        if (this.goldRing) this.goldRing.rotation.z += 0.01 * speedMultiplier;
        if (this.crimsonRing) this.crimsonRing.rotation.x += 0.012 * speedMultiplier;

        // Floating Breathing Motion
        this.coreGroup.position.y = Math.sin(time * 1.4) * 0.08;

        if (this.particleSystem) this.particleSystem.rotation.y = time * 0.12 * speedMultiplier;

        this.renderer.render(this.scene, this.camera);
    }
}
