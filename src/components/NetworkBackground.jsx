import React, { useEffect, useRef } from 'react';

/**
 * Componente per animazione di rete a grafo sullo sfondo
 * Rappresenta visivamente la connessione dei dati aperti
 */
export default function NetworkBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.parentElement.offsetWidth;
    let height = canvas.parentElement.offsetHeight;

    // Imposta dimensioni canvas
    const setCanvasSize = () => {
      width = canvas.parentElement.offsetWidth;
      height = canvas.parentElement.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setCanvasSize();

    // Configurazione nodi
    const nodeCount = Math.floor((width * height) / 15000); // Densità adattiva
    const maxDistance = 150; // Distanza massima per connessioni
    const nodeSpeed = 0.3; // Velocità movimento

    // Classe Nodo
    class Node {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * nodeSpeed;
        this.vy = (Math.random() - 0.5) * nodeSpeed;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Rimbalza sui bordi
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mantieni nei limiti
        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
      }
    }

    // Inizializza nodi
    const initNodes = () => {
      nodesRef.current = [];
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push(new Node());
      }
    };
    initNodes();

    // Disegna connessioni tra nodi vicini
    const drawConnections = () => {
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const dx = nodesRef.current[i].x - nodesRef.current[j].x;
          const dy = nodesRef.current[i].y - nodesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.3;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(nodesRef.current[i].x, nodesRef.current[i].y);
            ctx.lineTo(nodesRef.current[j].x, nodesRef.current[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Loop animazione
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      drawConnections();
      
      nodesRef.current.forEach(node => {
        node.update();
        node.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Gestisci resize
    const handleResize = () => {
      setCanvasSize();
      initNodes();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.4
      }}
      aria-hidden="true"
    />
  );
}
