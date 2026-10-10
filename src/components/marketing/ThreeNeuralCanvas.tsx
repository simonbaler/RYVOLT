import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeNeuralCanvasProps {
  className?: string;
  intensity?: number;
}

export const ThreeNeuralCanvas: React.FC<ThreeNeuralCanvasProps> = ({
  className = '',
  intensity = 1.0,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 300;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 85;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle nodes definition
    const nodeCount = 38;
    const nodePositions: THREE.Vector3[] = [];
    const nodeColors: THREE.Color[] = [];
    const colorViolet = new THREE.Color('#8B5CF6');
    const colorCyan = new THREE.Color('#22D3EE');
    const colorIce = new THREE.Color('#A5F3FC');
    const colorIndigo = new THREE.Color('#4F46E5');

    const group = new THREE.Group();
    scene.add(group);

    // Create node clusters
    for (let i = 0; i < nodeCount; i++) {
      const radius = 28 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(phi);
      const z = radius * Math.sin(theta) * Math.cos(phi) * 0.7;

      const pos = new THREE.Vector3(x, y, z);
      nodePositions.push(pos);

      // Node sphere mesh
      const sphereGeo = new THREE.SphereGeometry(i % 5 === 0 ? 1.6 : 0.9, 12, 12);
      const chosenColor = i % 3 === 0 ? colorCyan : i % 2 === 0 ? colorViolet : colorIce;
      nodeColors.push(chosenColor);

      const sphereMat = new THREE.MeshBasicMaterial({
        color: chosenColor,
        transparent: true,
        opacity: 0.85,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      group.add(sphere);
    }

    // Connect nodes with proximity lines
    const lineIndices: number[] = [];
    const maxDistance = 22;

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < maxDistance) {
          lineIndices.push(i, j);
        }
      }
    }

    const linePositions = new Float32Array(lineIndices.length * 3);
    for (let i = 0; i < lineIndices.length; i++) {
      const nodeIndex = lineIndices[i];
      linePositions[i * 3] = nodePositions[nodeIndex].x;
      linePositions[i * 3 + 1] = nodePositions[nodeIndex].y;
      linePositions[i * 3 + 2] = nodePositions[nodeIndex].z;
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: colorViolet,
      transparent: true,
      opacity: 0.28 * intensity,
      blending: THREE.AdditiveBlending,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(linesMesh);

    // Floating pulse signal particles
    const pulseCount = 16;
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePosArray = new Float32Array(pulseCount * 3);
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePosArray, 3));

    const pulseMaterial = new THREE.PointsMaterial({
      color: colorCyan,
      size: 3.0,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const pulses = new THREE.Points(pulseGeo, pulseMaterial);
    group.add(pulses);

    // Pulse state tracking along random line segments
    const pulseStates = Array.from({ length: pulseCount }, () => ({
      segmentIndex: Math.floor(Math.random() * (lineIndices.length / 2)) * 2,
      progress: Math.random(),
      speed: 0.006 + Math.random() * 0.008,
    }));

    // Mouse parallax tracking
    let targetRotationX = 0;
    let targetRotationY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.35;
      targetRotationX = y * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      if (!prefersReducedMotion) {
        group.rotation.y += 0.0025;
        group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;
        group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;

        // Update pulses
        const posAttr = pulseGeo.attributes.position;
        const arr = posAttr.array as Float32Array;

        for (let p = 0; p < pulseCount; p++) {
          const state = pulseStates[p];
          state.progress += state.speed;
          if (state.progress > 1) {
            state.progress = 0;
            state.segmentIndex = Math.floor(Math.random() * (lineIndices.length / 2)) * 2;
          }

          const nA = lineIndices[state.segmentIndex];
          const nB = lineIndices[state.segmentIndex + 1];
          if (nA !== undefined && nB !== undefined) {
            const pA = nodePositions[nA];
            const pB = nodePositions[nB];
            arr[p * 3] = pA.x + (pB.x - pA.x) * state.progress;
            arr[p * 3 + 1] = pA.y + (pB.y - pA.y) * state.progress;
            arr[p * 3 + 2] = pA.z + (pB.z - pA.z) * state.progress;
          }
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      pulseGeo.dispose();
      pulseMaterial.dispose();
    };
  }, [intensity]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full relative overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};
