export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + Math.random() * 6,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 0.6 + Math.random() * 1.2,
        life: 28 + Math.random() * 18,
        size: 1.2 + Math.random() * 1.8,
      });
    }
  }

  emitWinnerConfetti(centerX, centerY) {
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 80,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 6,
        vy: -1.5 - Math.random() * 3.5,
        life: 45 + Math.random() * 35,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() > 0.6 ? '#facc15' : '#fde047',
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life--;
      p.size *= 0.985;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.fillStyle = p.color || 'rgba(140, 80, 45, 0.75)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  clear() {
    this.particles = [];
  }
}
