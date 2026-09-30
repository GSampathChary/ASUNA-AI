/**
 * Asuna 3D Visual Core Engine (Three.js / WebGL)
 * Red & Gold Imperial Aesthetic
 */

import * as THREE from 'three';

export class AsunaCoreEngine {
    constructor(containerElement) {
        this.container = containerElement;
        this.state = 'IDLE';

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            60,
            containerElement.clientWidth / containerElement.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerElement.appendChild(this.renderer.domElement);

        this.coreGroup = new THREE.Group();
        this.scene.add(this.coreGroup);

        // 1. Layered Octahedron / Diamond Crystal in Royal Crimson Red & Gold Facets
        const diamondGeo = new THREE.OctahedronGeometry(1.2, 0);
        const crystalMat = new THREE.MeshPhysicalMaterial({
            color: 0xff1e42,
            emissive: 0x660011,
            roughness: 0.1,
            transmission: 0.85,
            thickness: 1.2,
            ior: 1.5,
            wireframe: false,
            transparent: true,
            opacity: 0.92
        });

        this.diamondMesh = new THREE.Mesh(diamondGeo, crystalMat);
        this.coreGroup.add(this.diamondMesh);

        // Inner Glowing Gold Energy Core
        const innerGeo = new THREE.IcosahedronGeometry(0.5, 2);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            wireframe: true
        });
        this.innerCore = new THREE.Mesh(innerGeo, innerMat);
        this.coreGroup.add(this.innerCore);

        // 2. Orbital Imperial Gold Particle System
        this.particleCount = 450;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const r = 2.0 + Math.random() * 0.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Gold & Crimson particles
            if (Math.random() > 0.3) {
                colors[i * 3] = 1.0;       // Red
                colors[i * 3 + 1] = 0.84;  // Green (Gold blend)
                colors[i * 3 + 2] = 0.0;   // Blue
            } else {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.12;
                colors[i * 3 + 2] = 0.26;
            }
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.055,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.particleSystem);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xff1e42, 2.5, 10);
        pointLight.position.set(2, 3, 4);
        this.scene.add(pointLight);

        const goldLight = new THREE.PointLight(0xffd700, 2.0, 10);
        goldLight.position.set(-2, -2, 3);
        this.scene.add(goldLight);

        this.clock = new THREE.Clock();
        this.particleScale = 1.0;
        this.vibrationIntensity = 0.0;

        this.animate();
    }

    setState(newState) {
        this.state = newState;
        if (newState === 'CLICKING') {
            this.triggerClickVibration();
        } else if (newState === 'ZOOMING_IN') {
            this.particleScale = 1.4;
        } else if (newState === 'ZOOMING_OUT') {
            this.particleScale = 0.7;
        } else {
            this.particleScale = 1.0;
        }
    }

    triggerClickVibration() {
        this.vibrationIntensity = 0.09;
        setTimeout(() => { this.vibrationIntensity = -0.05; }, 80);
        setTimeout(() => { this.vibrationIntensity = 0.0; }, 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();

        const speedMultiplier = this.state === 'THINKING' ? 2.5 : 1.0;

        this.diamondMesh.rotation.y = time * 0.5 * speedMultiplier;
        this.diamondMesh.rotation.x = Math.sin(time * 0.3) * 0.1;
        this.innerCore.rotation.y = -time * 1.4 * speedMultiplier;

        this.coreGroup.position.y = Math.sin(time * 1.5) * 0.1;

        const currentScale = 1.0 + this.vibrationIntensity;
        this.diamondMesh.scale.set(currentScale, currentScale, currentScale);

        this.particleSystem.rotation.y = time * 0.25 * speedMultiplier;
        this.particleSystem.scale.lerp(new THREE.Vector3(this.particleScale, this.particleScale, this.particleScale), 0.08);

        this.renderer.render(this.scene, this.camera);
    }
}
