/**
 * Wafflerace - Canvas Rendering Module
 */

/**
 * Draws the loading preloader progress bar.
 */
export function drawLoadingProgressBar(ctx, width, height, loadProgress) {
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f4e9d8';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading premium waffles & river...', width / 2, height / 2 - 8);

  const barW = 260;
  const barX = (width - barW) / 2;
  ctx.fillStyle = '#3f2a1d';
  ctx.fillRect(barX, height / 2 + 12, barW, 4);
  ctx.fillStyle = '#c48a3a';
  ctx.fillRect(barX, height / 2 + 12, barW * loadProgress, 4);
}

/**
 * Draws parallax background layers based on current progress.
 * If transparent mode (OBS overlay) is active, skips drawing to keep canvas transparent.
 */
export function drawParallaxBackgrounds(
  ctx,
  width,
  height,
  parallaxLayers,
  startTime
) {
  const params = new URLSearchParams(window.location.search);
  const isTransparent =
    params.get('theme') === 'obs' || params.get('transparent') === '1';

  if (isTransparent) {
    // Skip drawing backgrounds to keep canvas transparent for OBS browser overlays
    return;
  }

  if (parallaxLayers.length === 3) {
    parallaxLayers.forEach((layer) => {
      if (!layer.img || !layer.img.complete || layer.img.naturalWidth === 0)
        return;
      const speed = layer.speed;
      const tileWidth = layer.img.width;
      const scrolled = startTime
        ? ((Date.now() - startTime) / 1000) * speed
        : 0;
      const offset = scrolled % tileWidth;
      const baseTileIndex = Math.floor(scrolled / tileWidth);

      let drawX = -offset;
      let currentIndex = baseTileIndex;

      while (drawX < width) {
        const isMirrored = currentIndex % 2 !== 0;

        if (isMirrored) {
          ctx.save();
          ctx.translate(drawX + tileWidth, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(layer.img, 0, 0, tileWidth, height);
          ctx.restore();
        } else {
          ctx.drawImage(layer.img, drawX, 0, tileWidth, height);
        }

        drawX += tileWidth;
        currentIndex++;
      }
    });
  } else {
    ctx.fillStyle = '#a8c8dc';
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Draws the checkboard finish line dynamically fading in as racers approach.
 */
export function drawFinishLine(ctx, height, finishLineX, progress) {
  const finishVisibility = Math.max(0, (progress - 0.72) / 0.28);
  if (finishVisibility > 0.05) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, finishVisibility);
    ctx.strokeStyle = '#3f2a1d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(finishLineX, 30);
    ctx.lineTo(finishLineX, height - 30);
    ctx.stroke();
    ctx.fillStyle = '#3f2a1d';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', finishLineX, 22);
    ctx.restore();
  }
}

/**
 * Draws an individual waffle boat, its tilt, rocking, and flag.
 * Displays the pre-calculated displayName parameter.
 */
export function drawBoat(
  ctx,
  x,
  y,
  bob,
  displayName,
  spriteIndex,
  tilt,
  boatImages,
  nameDisplayMode
) {
  const img = boatImages[spriteIndex];
  if (!img || !img.complete || img.naturalWidth === 0) {
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = '#f4c95f';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const targetHeight = 72;
  const scale = targetHeight / img.height;
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;

  // 1. Draw water ripple/wake under the boat (in screen/water coordinates, no boat rotation)
  ctx.save();
  ctx.translate(x, y + bob);

  // Draw subtle wake/splash waves behind the boat (extending to the left)
  ctx.strokeStyle = 'rgba(235, 245, 255, 0.45)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  // Back wave 1 (longer, trailing)
  ctx.beginPath();
  const waveY1 = drawHeight / 2 - 10;
  ctx.moveTo(-drawWidth * 0.3, waveY1);
  ctx.quadraticCurveTo(
    -drawWidth * 0.6,
    waveY1 - 2 + Math.sin(Date.now() * 0.015 + x) * 1.5,
    -drawWidth * 1.1,
    waveY1 + 1
  );
  ctx.stroke();

  // Back wave 2 (shorter, closer to hull)
  ctx.beginPath();
  const waveY2 = drawHeight / 2 - 8;
  ctx.moveTo(-drawWidth * 0.2, waveY2);
  ctx.quadraticCurveTo(
    -drawWidth * 0.45,
    waveY2 - 1 + Math.sin(Date.now() * 0.02 + x) * 1.0,
    -drawWidth * 0.75,
    waveY2 + 2
  );
  ctx.stroke();

  // 2. Sub-hull ripple ellipse (drawn under the boat hull)
  ctx.beginPath();
  ctx.ellipse(
    -2, // slightly shifted left
    drawHeight / 2 - 9, // sits right at the hull's contact line
    drawWidth * 0.42, // width of ripple
    4.5 + Math.sin(Date.now() * 0.01 + x) * 1.2, // height pulsing
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(195, 225, 255, 0.5)';
  ctx.stroke();
  ctx.restore();

  // Now draw the actual boat (which HAS rocking/tilt applied)
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate((tilt || 0) * 0.035); // subtle rocking

  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  // Reactive flag
  const flagColor = '#c48a3a';
  const outlineColor = '#8b5a2b';
  const attachX = -drawWidth / 2 + 6;
  const attachY = -8 + (tilt || 0) * 0.4;

  ctx.fillStyle = flagColor;
  ctx.beginPath();
  ctx.moveTo(attachX, attachY - 4);
  ctx.quadraticCurveTo(
    attachX - 14 - (tilt || 0) * 0.3,
    attachY - 8,
    attachX - 34,
    attachY - 1
  );
  ctx.quadraticCurveTo(attachX - 33, attachY + 4, attachX - 34, attachY + 7);
  ctx.quadraticCurveTo(
    attachX - 14 - (tilt || 0) * 0.3,
    attachY + 6,
    attachX,
    attachY + 5
  );
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(attachX, attachY - 4);
  ctx.quadraticCurveTo(
    attachX - 14 - (tilt || 0) * 0.3,
    attachY - 8,
    attachX - 34,
    attachY - 1
  );
  ctx.quadraticCurveTo(attachX - 33, attachY + 4, attachX - 34, attachY + 7);
  ctx.quadraticCurveTo(
    attachX - 14 - (tilt || 0) * 0.3,
    attachY + 6,
    attachX,
    attachY + 5
  );
  ctx.stroke();

  if (nameDisplayMode !== 'hidden' && displayName) {
    ctx.fillStyle = '#3f2a1d';
    ctx.font = '8px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(displayName, attachX - 2, attachY + 2);
  }

  ctx.restore();
}

/**
 * Draws the Sugar Rush Engaged overlay when the final phase is active.
 */
export function drawSugarRushOverlay(ctx, width, height, progress) {
  if (progress <= 0.82 || progress >= 0.98) return;

  // Fade in quickly, then fade out slowly towards the end
  let alpha = 0;
  if (progress < 0.85) {
    // Fade in over progress 0.82 to 0.85
    alpha = (progress - 0.82) / 0.03;
  } else {
    // Fade out over progress 0.85 to 0.98
    alpha = 1.0 - (progress - 0.85) / 0.13;
  }

  alpha = Math.max(0, Math.min(1, alpha));

  ctx.save();
  ctx.globalAlpha = alpha;

  // Scale pulse based on time
  const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.04;

  ctx.translate(width / 2, height / 2 - 40);
  ctx.scale(pulse, pulse);

  // Background blur/backing banner
  ctx.fillStyle = 'rgba(251, 191, 36, 0.12)'; // amber-400 with opacity
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)'; // amber-600 with opacity
  ctx.lineWidth = 2;
  const bannerW = 320;
  const bannerH = 48;
  ctx.fillRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH);
  ctx.strokeRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH);

  // Sugar Rush Text
  ctx.font =
    'bold 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text glow/shadow
  ctx.shadowColor = '#d97706'; // amber-600 glow
  ctx.shadowBlur = 8;

  ctx.fillStyle = '#fef08a'; // yellow-200
  ctx.strokeStyle = '#78350f'; // amber-900 border
  ctx.lineWidth = 4;
  ctx.strokeText('⚡ SUGAR RUSH ENGAGED! ⚡', 0, 0);
  ctx.fillText('⚡ SUGAR RUSH ENGAGED! ⚡', 0, 0);

  ctx.restore();
}
