'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Vape3D = () => {
  const buttonRef = useRef<THREE.Mesh | null>(null);
  const [smokeParticles, setSmokeParticles] = useState<THREE.Points[]>([]);
  const smokeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isButtonPressedRef = useRef(false);

  // Adicionando o áudio do vape
  const vapeSound = new Audio('/audio/vape-sound.mp3');

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);
      animateSmoke();
      renderer.render(scene, camera);
    };

    // Modelo vape
    const baseHeight = 5;
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, baseHeight, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(0, -baseHeight / 2, 0);

    const tankHeight = 1.5;
    const tankRadius = 1.35;
    const tankGeometry = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 32);
    const tankMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x999999,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      reflectivity: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
    tankMesh.position.set(0, tankHeight / 2, 0);

    const resistanceGeometry = new THREE.CylinderGeometry(0.4, 0.4, tankHeight, 32);
    const resistanceMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const resistanceMesh = new THREE.Mesh(resistanceGeometry, resistanceMaterial);
    resistanceMesh.position.set(0, 0.6, 0);

    const topHeight = 1.0;
    const topBaseRadius = 0.8;
    const topTopRadius = 1.0;
    const outerGeometry = new THREE.CylinderGeometry(topBaseRadius, topTopRadius, topHeight, 32);
    const innerGeometry = new THREE.CylinderGeometry(topBaseRadius * 0.6, topTopRadius * 0.6, topHeight, 32);
    const outerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    const innerMesh = new THREE.Mesh(innerGeometry, new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x000000,
      emissiveIntensity: 1.5,
    }));
    innerMesh.position.set(0, 0, 0);

    const topMesh = new THREE.Group();
    topMesh.add(outerMesh);
    topMesh.add(innerMesh);
    topMesh.position.set(0, tankHeight + topHeight / 2, 0);

    const buttonSize = 0.8;
    const buttonGeometry = new THREE.BoxGeometry(buttonSize, buttonSize, buttonSize);
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
    buttonMesh.position.set(0.9, -baseHeight / 2 + buttonSize / 1, 0);
    buttonRef.current = buttonMesh;

    const vapeGroup = new THREE.Group();
    vapeGroup.add(baseMesh);
    vapeGroup.add(tankMesh);
    vapeGroup.add(resistanceMesh);
    vapeGroup.add(topMesh);
    vapeGroup.add(buttonMesh);
    vapeGroup.rotation.y = Math.PI / -3;

    scene.add(vapeGroup);

    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onStartInteraction = (event: any) => {
      const x = event.clientX || event.touches[0].clientX;
      const y = event.clientY || event.touches[0].clientY;

      isDragging = true;
      previousMouseX = x;
      previousMouseY = y;

      mouse.x = (x / window.innerWidth) * 2 - 1;
      mouse.y = -(y / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(buttonMesh);

      if (intersects.length > 0) {
        buttonMesh.scale.set(0.9, 0.9, 0.9);
        startGeneratingSmoke();
        vapeSound.play(); // Reproduz o áudio quando o botão é clicado
      }
    };

    const onMoveInteraction = (event: any) => {
      if (isDragging) {
        const x = event.clientX || event.touches[0].clientX;
        const y = event.clientY || event.touches[0].clientY;

        const deltaX = x - previousMouseX;
        const deltaY = y - previousMouseY;
        vapeGroup.rotation.y += deltaX * 0.005;
        vapeGroup.rotation.x -= deltaY * 0.005;

        previousMouseX = x;
        previousMouseY = y;
      }
    };

    const onEndInteraction = () => {
      isDragging = false;
      buttonMesh.scale.set(1, 1, 1);
      stopGeneratingSmoke();
    };

    const generateSmokeParticle = () => {
      // Gerando partículas de fumaça em torno do bocal
      const smokeGeometry = new THREE.BufferGeometry();
      const vertices = [];
      for (let i = 0; i < 100; i++) {
        const spreadX = (Math.random() - 0.5) * 2;
        const spreadY = (Math.random() - 0.5) * 1;
        const spreadZ = (Math.random() - 0.5) * 1;

        vertices.push(
          spreadX,
          spreadY,
          spreadZ
        );
      }
      smokeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const smokeMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.5,
      });

      const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
      smoke.position.set(0, tankHeight + 0.5, 0);
      smokeParticles.push(smoke);
      scene.add(smoke);
    };
    const animateSmoke = () => {
      smokeParticles.forEach((particle, index) => {
        particle.position.y += 0.05;
        particle.position.x += (Math.random() - 0.5) * 0.05;
        particle.position.z += (Math.random() - 0.5) * 0.05;
    
        // TypeScript casting to PointsMaterial to access opacity
        const smokeMaterial = particle.material as THREE.PointsMaterial;
    
        smokeMaterial.opacity -= 0.002;
        if (smokeMaterial.opacity <= 0) {
          scene.remove(particle);
          smokeParticles.splice(index, 1);
        }
      });
    };
    
    const startGeneratingSmoke = () => {
      isButtonPressedRef.current = true;
      smokeIntervalRef.current = setInterval(() => {
        if (isButtonPressedRef.current) {
          for (let i = 0; i < 40; i++) {
            generateSmokeParticle();
          }
        }
      }, 30);
    };

    const stopGeneratingSmoke = () => {
      isButtonPressedRef.current = false;
      if (smokeIntervalRef.current) {
        clearInterval(smokeIntervalRef.current);
        smokeIntervalRef.current = null;
      }
    };

    window.addEventListener('mousedown', onStartInteraction);
    window.addEventListener('mousemove', onMoveInteraction);
    window.addEventListener('mouseup', onEndInteraction);
    window.addEventListener('touchstart', onStartInteraction);
    window.addEventListener('touchmove', onMoveInteraction);
    window.addEventListener('touchend', onEndInteraction);

    camera.position.z = 10;
    animate();

    return () => {
      window.removeEventListener('mousedown', onStartInteraction);
      window.removeEventListener('mousemove', onMoveInteraction);
      window.removeEventListener('mouseup', onEndInteraction);
      window.removeEventListener('touchstart', onStartInteraction);
      window.removeEventListener('touchmove', onMoveInteraction);
      window.removeEventListener('touchend', onEndInteraction);
    };
  }, []);

  return null;
};

export default Vape3D;
