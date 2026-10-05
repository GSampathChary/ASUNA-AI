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

        this.clock = new THREE.Clock();
        this.vibrationIntensity = 0.0;
        this.clickPulse = 0.0;

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('resize', this.onWindowResize);
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

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

        // A point-cloud shell replaces the old wireframe, creating a softer holographic 3D face.
        const facialPointGeo = new THREE.IcosahedronGeometry(0.89, 3);
        facialPointGeo.scale(0.9, 1.17, 0.97);
        const facialPointMat = new THREE.PointsMaterial({
            color: 0xff9bac,
            size: 0.026,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.82
        });
        this.facialPointCloud = new THREE.Points(facialPointGeo, facialPointMat);
        this.headGroup.add(this.facialPointCloud);

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

        // 2. Neck, chest, and arms turn the floating head into a complete upper body.
        this.torsoGroup = new THREE.Group();
        this.manGroup.add(this.torsoGroup);

        const neckGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.55, 16);
        const neckMat = new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.9, roughness: 0.3 });
        const neckMesh = new THREE.Mesh(neckGeo, neckMat);
        neckMesh.position.set(0, -0.15, -0.05);
        this.torsoGroup.add(neckMesh);

        const shouldersGeo = new THREE.BoxGeometry(2.35, 0.42, 0.82);
        const shouldersMat = new THREE.MeshStandardMaterial({ color: 0x1f1f2e, metalness: 0.8, roughness: 0.3 });
        const shouldersMesh = new THREE.Mesh(shouldersGeo, shouldersMat);
        shouldersMesh.position.set(0, -0.65, -0.1);
        this.torsoGroup.add(shouldersMesh);

        const torsoMat = new THREE.MeshStandardMaterial({
            color: 0x171827,
            metalness: 0.88,
            roughness: 0.24,
            emissive: 0x19030a,
            emissiveIntensity: 0.35
        });
        const chestMesh = new THREE.Mesh(new THREE.SphereGeometry(0.86, 24, 18), torsoMat);
        chestMesh.scale.set(1.08, 0.72, 0.54);
        chestMesh.position.set(0, -1.18, -0.05);
        this.torsoGroup.add(chestMesh);

        const chestLineMat = new THREE.MeshBasicMaterial({ color: 0xff1e42 });
        const chestLine = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.025, 0.035), chestLineMat);
        chestLine.position.set(0, -1.08, 0.44);
        this.torsoGroup.add(chestLine);

        [-1, 1].forEach((side) => {
            const shoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), torsoMat);
            shoulderPad.scale.set(1.15, 0.75, 0.9);
            shoulderPad.position.set(side * 1.05, -0.66, -0.04);
            this.torsoGroup.add(shoulderPad);

            const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.54, 8, 16), torsoMat);
            upperArm.position.set(side * 1.18, -1.2, -0.03);
            upperArm.rotation.z = side * -0.14;
            this.torsoGroup.add(upperArm);
        });

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

    onPointerDown() {
        this.triggerClickVibration();
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
        this.clickPulse = 1.0;
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

        // A tactile acknowledgement: the whole core briefly springs and shimmers on click.
        this.clickPulse = Math.max(0, this.clickPulse - 0.035);
        const clickJolt = Math.sin(time * 75) * this.vibrationIntensity;
        this.coreGroup.rotation.z = clickJolt;
        this.coreGroup.scale.setScalar(1 + this.clickPulse * 0.055);
        if (this.skullMesh?.material) {
            this.skullMesh.material.emissiveIntensity = 0.5 + this.clickPulse * 1.2;
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

        if (this.facialPointCloud) {
            this.facialPointCloud.rotation.y = time * 0.08;
            this.facialPointCloud.material.size = 0.026 + this.clickPulse * 0.015;
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
