/**
 * Asuna 3D Visual Core Engine (Three.js / WebGL)
 * Crimson Red & Pure Platinum White Aesthetic Theme
 */

import * as THREE from 'three';

export class AsunaCoreEngine {
    constructor(containerElement, symbolType = 'diamond') {
        this.container = containerElement;
        this.state = 'IDLE';
        this.symbolType = symbolType;
        this.targetRotation = { x: 0, y: 0 };

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
        
        this.renderer.setPixelRatio(1.0);
        this.renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
        containerElement.appendChild(this.renderer.domElement);

        this.coreGroup = new THREE.Group();
        this.scene.add(this.coreGroup);

        this.buildCoreGeometry(symbolType);

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xff1e42, 2.2, 10);
        pointLight.position.set(2, 3, 4);
        this.scene.add(pointLight);

        this.clock = new THREE.Clock();
        this.vibrationIntensity = 0.0;

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('resize', this.onWindowResize);

        this.animate();
    }

    buildCoreGeometry(symbolType) {
        while (this.coreGroup.children.length > 0) {
            this.coreGroup.remove(this.coreGroup.children[0]);
        }

        let mainGeo;
        if (symbolType === 'icosahedron') {
            mainGeo = new THREE.IcosahedronGeometry(1.3, 0);
        } else if (symbolType === 'sphere') {
            mainGeo = new THREE.SphereGeometry(1.2, 16, 16);
        } else if (symbolType === 'pyramid') {
            mainGeo = new THREE.ConeGeometry(1.3, 2.0, 4);
        } else {
            mainGeo = new THREE.OctahedronGeometry(1.3, 0);
        }

        // Crimson Red Main Crystal Shader
        const crystalMat = new THREE.MeshLambertMaterial({
            color: 0xff1e42,
            emissive: 0x660014,
            transparent: true,
            opacity: 0.94
        });

        this.diamondMesh = new THREE.Mesh(mainGeo, crystalMat);
        this.coreGroup.add(this.diamondMesh);

        // Inner Glowing Pure White Core Wireframe
        const innerGeo = new THREE.IcosahedronGeometry(0.58, 1);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
        this.innerCore = new THREE.Mesh(innerGeo, innerMat);
        this.coreGroup.add(this.innerCore);

        // Dual Energy Rings: Pure Platinum White & Crimson Red
        const whiteRingGeo = new THREE.TorusGeometry(2.1, 0.025, 8, 36);
        const whiteRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.goldRing = new THREE.Mesh(whiteRingGeo, whiteRingMat);
        this.goldRing.rotation.x = Math.PI / 3;
        this.coreGroup.add(this.goldRing);

        const crimsonRingGeo = new THREE.TorusGeometry(1.7, 0.02, 8, 36);
        const crimsonRingMat = new THREE.MeshBasicMaterial({ color: 0xff1e42 });
        this.crimsonRing = new THREE.Mesh(crimsonRingGeo, crimsonRingMat);
        this.crimsonRing.rotation.y = Math.PI / 4;
        this.coreGroup.add(this.crimsonRing);

        // 180 Particle Swarm: Pure White & Crimson Red
        this.particleCount = 180;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const r = 2.0 + Math.random() * 1.0;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            if (Math.random() > 0.45) {
                // Pure White Particle
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 1.0;
            } else {
                // Crimson Red Particle
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
        this.buildCoreGeometry(newSymbolType);
    }

    onWindowResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    onPointerMove(event) {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.targetRotation.x = y * 0.3;
        this.targetRotation.y = x * 0.4;
    }

    setState(newState) {
        this.state = newState;
        if (newState === 'CLICKING' || newState === 'TOUCH_BURST') {
            this.triggerClickVibration();
        }
    }

    triggerClickVibration() {
        this.vibrationIntensity = 0.1;
        setTimeout(() => { this.vibrationIntensity = 0.0; }, 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();

        const speedMultiplier = this.state === 'THINKING' ? 2.0 : 1.0;

        this.coreGroup.rotation.x += (this.targetRotation.x - this.coreGroup.rotation.x) * 0.05;
        this.coreGroup.rotation.y += (this.targetRotation.y - this.coreGroup.rotation.y) * 0.05;

        if (this.diamondMesh) this.diamondMesh.rotation.y += 0.01 * speedMultiplier;
        if (this.innerCore) this.innerCore.rotation.y -= 0.02 * speedMultiplier;

        if (this.goldRing) this.goldRing.rotation.z += 0.01 * speedMultiplier;
        if (this.crimsonRing) this.crimsonRing.rotation.x += 0.012 * speedMultiplier;

        this.coreGroup.position.y = Math.sin(time * 1.2) * 0.1;

        if (this.particleSystem) this.particleSystem.rotation.y = time * 0.15 * speedMultiplier;

        this.renderer.render(this.scene, this.camera);
    }
}
