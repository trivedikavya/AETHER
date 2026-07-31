// 1. Initialize Lenis Smooth Scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

// Update ScrollTrigger on Lenis scroll
lenis.on('scroll', ScrollTrigger.update);

// Lenis requestAnimationFrame ticker
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Disable scrolling initially during intro
lenis.stop();

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, CustomEase);

// 2. State & Constants
let isIntroActive = true;
const totalFlightPathLength = 100; // arbitrary reference for percentage math

// Core DOM cache
const droneContainer = document.getElementById('global-drone-container');
const droneRotator = document.getElementById('global-drone-rotator');
const flightPathActive = document.getElementById('global-flight-path-active');
const flightPathBg = document.getElementById('global-flight-path-bg');
const pathSvg = document.getElementById('global-flight-path-svg');
const landingDeck = document.getElementById('landing-deck');
const touchdownSection = document.getElementById('touchdown');
const heroAnchor = document.getElementById('anchor-hero');

// 3. Coordinate Tracking & Flight Path Generation
let coordinates = {
  hero: { x: 0, y: 0 },
  feature1: { x: 0, y: 0 },
  feature2: { x: 0, y: 0 },
  feature3: { x: 0, y: 0 },
  touchdown: { x: 0, y: 0 }
};

function calculateAnchorCoords() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  
  // Hero Center Anchor
  if (heroAnchor) {
    const r = heroAnchor.getBoundingClientRect();
    coordinates.hero = {
      x: r.left + r.width / 2,
      y: r.top + scrollTop + r.height / 2
    };
  }
  
  // Feature Blocks
  ['feature-1', 'feature-2-pin', 'feature-3'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      const visual = el.querySelector('.feature-visual');
      if (visual) {
        const r = visual.getBoundingClientRect();
        coordinates[`feature${idx + 1}`] = {
          x: r.left + r.width / 2,
          y: r.top + scrollTop + r.height / 2
        };
      }
    }
  });

  // Touchdown Deck Anchor
  if (landingDeck) {
    const r = landingDeck.getBoundingClientRect();
    coordinates.touchdown = {
      x: r.left + r.width / 2,
      y: r.top + scrollTop + r.height / 2 - 12 // slightly offset for visual touchdown lock
    };
  }
}

function generateFlightPathSVG() {
  const w = window.innerWidth;
  const h = document.documentElement.scrollHeight;
  
  // Update overlay SVG dimensions
  if (pathSvg) {
    pathSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    pathSvg.style.height = `${h}px`;
  }
  
  // Curved Bezier Path passing through each stage cleanly
  const dPath = `
    M ${coordinates.hero.x} ${coordinates.hero.y}
    C ${coordinates.hero.x + (w * 0.1)} ${coordinates.hero.y + 200},
      ${coordinates.feature1.x - (w * 0.1)} ${coordinates.feature1.y - 200},
      ${coordinates.feature1.x} ${coordinates.feature1.y}
    S ${coordinates.feature2.x + (w * 0.15)} ${coordinates.feature2.y - 150},
      ${coordinates.feature2.x} ${coordinates.feature2.y}
    S ${coordinates.feature3.x - (w * 0.1)} ${coordinates.feature3.y - 150},
      ${coordinates.feature3.x} ${coordinates.feature3.y}
    C ${coordinates.feature3.x + (w * 0.05)} ${coordinates.feature3.y + 150},
      ${coordinates.touchdown.x} ${coordinates.touchdown.y - 300},
      ${coordinates.touchdown.x} ${coordinates.touchdown.y}
  `;
  
  if (flightPathBg) flightPathBg.setAttribute('d', dPath);
  if (flightPathActive) flightPathActive.setAttribute('d', dPath);
}

// 4. Drone Telemetry Updater
const telemVel = document.querySelector('#global-drone-telemetry .id-vel');
const telemAlt = document.querySelector('#global-drone-telemetry .id-alt');

function updateDroneTelemetry(progress) {
  // Map progress (0 - 1) to flight metrics
  // Altitude goes from 1402M to 0M
  // Velocity starts high, decelerates, stabilizes, and locks to 0.0 at touchdown
  let altVal = Math.round(gsap.utils.mapRange(0, 1, 1402, 0, progress));
  let velVal = 72.4;
  
  if (progress < 0.3) {
    velVal = gsap.utils.mapRange(0, 0.3, 72.4, 76.7, progress);
  } else if (progress < 0.6) {
    velVal = gsap.utils.mapRange(0.3, 0.6, 76.7, 58.0, progress);
  } else if (progress < 0.85) {
    velVal = gsap.utils.mapRange(0.6, 0.85, 58.0, 25.4, progress);
  } else {
    velVal = gsap.utils.mapRange(0.85, 1, 25.4, 0.0, progress);
  }

  if (telemAlt) telemAlt.textContent = `${altVal.toLocaleString()} M`;
  if (telemVel) telemVel.textContent = `${velVal.toFixed(1)} M/S`;
  
  // Mirror to status strip ticker elements if active
  const tickAlt = document.getElementById('ticker-alt');
  const tickVel = document.getElementById('ticker-vel');
  if (tickAlt) tickAlt.textContent = Math.round(altVal).toLocaleString();
  if (tickVel) tickVel.textContent = velVal.toFixed(1);
}

// 5. ScrollTrigger Mechanics for Drone Path Positioning
let pathScrollTrigger = null;

function initDescentMechanics() {
  if (pathScrollTrigger) pathScrollTrigger.kill();
  
  // Calculate total path length for dash array/offset math
  if (flightPathActive) {
    const pathLength = flightPathActive.getTotalLength();
    flightPathActive.style.strokeDasharray = pathLength;
    flightPathActive.style.strokeDashoffset = pathLength;

    // Track drone container along path via ScrollTrigger
    pathScrollTrigger = ScrollTrigger.create({
      id: 'drone-scroll',
      trigger: "body",
      start: "top top",
      end: () => {
        if (landingDeck) {
          const r = landingDeck.getBoundingClientRect();
          return r.top + window.scrollY - window.innerHeight / 2;
        }
        return "bottom bottom";
      },
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Find point coordinates along the curved path
        const currentLength = progress * pathLength;
        const point = flightPathActive.getPointAtLength(currentLength);
        
        // Find a secondary forward point to calculate rotation angle
        const lookAheadLength = Math.min(pathLength, currentLength + 2);
        const nextPoint = flightPathActive.getPointAtLength(lookAheadLength);
        
        const angleRad = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
        let angleDeg = angleRad * (180 / Math.PI) - 90; // offset to point forward direction
        
        // Update drone overlay position and rotation
        if (droneContainer) {
          gsap.set(droneContainer, { x: point.x, y: point.y });
        }
        if (droneRotator) {
          // Compensate for severe horizontal tilting to keep drone relatively flat
          const dampAngle = angleDeg * 0.25;
          gsap.set(droneRotator, { rotate: dampAngle });
        }
        
        // Update path fill svg offset
        flightPathActive.style.strokeDashoffset = pathLength - currentLength;
        
        // Update dynamic telemetry
        updateDroneTelemetry(progress);
        
        // Stage status markers triggers (turns Lidar and Dock crosshairs green on scroll focus)
        toggleStageIndicators(progress);
      }
    });
  }
}

function toggleStageIndicators(p) {
  // Check progress thresholds and apply "drone-present" styling hooks
  const stage1 = document.getElementById('feature-1');
  const stage2 = document.getElementById('feature-2-pin');
  const stage3 = document.getElementById('feature-3');
  
  if (stage1) {
    if (p > 0.14 && p < 0.32) stage1.classList.add('drone-present');
    else stage1.classList.remove('drone-present');
  }
  if (stage2) {
    if (p > 0.42 && p < 0.62) stage2.classList.add('drone-present');
    else stage2.classList.remove('drone-present');
  }
  if (stage3) {
    if (p > 0.72 && p < 0.90) stage3.classList.add('drone-present');
    else stage3.classList.remove('drone-present');
  }
}

// 6. Section Specific Dynamic Interactions
function initGlobalDescent() {
  const feature2Pin = document.getElementById('feature-2-pin');
  const feature2Content = document.getElementById('feature-2-content');
  const touchdownSection = document.getElementById('touchdown');
  
  // Sticky Pin feature 2 container
  if (feature2Pin && feature2Content) {
    ScrollTrigger.create({
      trigger: feature2Pin,
      start: "top top",
      end: "bottom bottom",
      pin: feature2Content,
      pinSpacing: false,
      id: "pin-stage-2"
    });
  }

  // Smooth parallax visual panels
  gsap.utils.toArray('.feature-visual').forEach((visual) => {
    const speed = parseFloat(visual.getAttribute('data-speed')) || 1.1;
    gsap.fromTo(visual.querySelector('.tech-panel'), {
      y: -40
    }, {
      y: 40,
      ease: "none",
      scrollTrigger: {
        trigger: visual,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });

  // Color inversion on Landing section entrance
  if (touchdownSection) {
    ScrollTrigger.create({
      id: 'touchdown-trigger',
      trigger: touchdownSection,
      start: "top 65%",
      end: "bottom 90%",
      onEnter: () => {
        if (!isIntroActive) {
          document.body.classList.add('inverted-colors');
        }
      },
      onLeaveBack: () => {
        if (!isIntroActive) {
          document.body.classList.remove('inverted-colors');
        }
      },
      onEnterBack: () => {
        if (!isIntroActive) {
          document.body.classList.add('inverted-colors');
        }
      }
    });
    
    // Background Glow activation trigger
    ScrollTrigger.create({
      trigger: touchdownSection,
      start: "top 40%",
      onEnter: () => {
        const glow = document.getElementById('landing-glow');
        if (glow) glow.classList.add('active');
      },
      onLeaveBack: () => {
        const glow = document.getElementById('landing-glow');
        if (glow) glow.classList.remove('active');
      }
    });
    
    // Actual Landing Touchdown Lock Trigger
    ScrollTrigger.create({
      trigger: touchdownSection,
      start: "top 12%",
      end: "bottom bottom",
      onEnter: () => {
        if (isIntroActive) return;
        
        // Add Landing Gear classes
        document.body.classList.add('is-landing');
        
        // Hide global telemetry tag at touchdown
        const tag = document.getElementById('global-drone-telemetry');
        if (tag) gsap.to(tag, { opacity: 0, duration: 0.3 });
        
        // Animate descent vector line path
        const vectorPath = document.getElementById('landing-vector-path');
        if (vectorPath) {
          gsap.to(vectorPath, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" });
        }
      },
      onLeaveBack: () => {
        if (isIntroActive) return;
        document.body.classList.remove('is-landing');
        document.body.classList.remove('is-landed');
        
        const tag = document.getElementById('global-drone-telemetry');
        if (tag) gsap.to(tag, { opacity: 0.85, duration: 0.3 });
        
        const vectorPath = document.getElementById('landing-vector-path');
        if (vectorPath) {
          gsap.to(vectorPath, { strokeDashoffset: 100, duration: 0.6, ease: "power2.out" });
        }
      }
    });

    ScrollTrigger.create({
      trigger: touchdownSection,
      start: "top 2%",
      end: "bottom bottom",
      onEnter: () => {
        if (isIntroActive) return;
        document.body.classList.add('is-landed');
        createTouchdownExplosion();
      }
    });
  }
}

// 7. Interactive UI & Custom Micro-Animations
function initCursorDot() {
  const cursorDot = document.getElementById('cursorDot');
  const cursorTrail = document.getElementById('cursorTrail');
  
  if (!cursorDot || !cursorTrail) return;
  
  gsap.set(cursorDot, { xPercent: -50, yPercent: -50 });
  gsap.set(cursorTrail, { xPercent: -50, yPercent: -50 });
  
  let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let mouse = { x: pos.x, y: pos.y };
  
  const fp = { x: 0.12, y: 0.12 }; // trail interpolation delay
  
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Reveal pointer on first movement
    gsap.to([cursorDot, cursorTrail], { opacity: 1, duration: 0.3, overwrite: "auto" });
  });

  gsap.ticker.add(() => {
    // Interpolate trail pos
    pos.x += (mouse.x - pos.x) * fp.x;
    pos.y += (mouse.y - pos.y) * fp.y;
    
    gsap.set(cursorDot, { x: mouse.x, y: mouse.y });
    gsap.set(cursorTrail, { x: pos.x, y: pos.y });
  });

  // Magnetic button effects
  const magneticButtons = document.querySelectorAll('.magnetic-btn');
  magneticButtons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const strength = parseFloat(btn.getAttribute('data-strength')) || 10;
      
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      
      gsap.to(btn, {
        x: mx * (strength / 25),
        y: my * (strength / 25),
        rotate: mx * 0.02,
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(cursorTrail, {
        scale: 1.6,
        borderColor: 'var(--accent-red)',
        backgroundColor: 'rgba(194, 13, 38, 0.04)',
        duration: 0.3
      });
    });
    
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        rotate: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
      
      gsap.to(cursorTrail, {
        scale: 1,
        borderColor: 'rgba(194, 13, 38, 0.35)',
        backgroundColor: 'transparent',
        duration: 0.3
      });
    });
  });
}

function initRippleCTA() {
  const btn = document.getElementById('ultimate-cta');
  if (!btn) return;
  
  btn.addEventListener('mouseenter', (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    
    const wave = btn.querySelector('.ripple-wave');
    if (wave) {
      gsap.set(wave, { x: x, y: y, scale: 0, opacity: 1 });
      gsap.to(wave, {
        scale: 4,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  });
}

function createTouchdownExplosion() {
  const container = document.getElementById('particle-burst-container');
  if (!container) return;
  
  container.innerHTML = ''; // clear previous
  const count = 36;
  const colors = ['var(--accent-red)', 'var(--ink)', 'var(--line)'];
  
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('dust-particle');
    
    const size = gsap.utils.random(2, 6);
    const color = gsap.utils.random(colors);
    
    gsap.set(p, {
      width: size,
      height: size,
      backgroundColor: color,
      x: 0,
      y: 0,
      opacity: 0.95
    });
    
    container.appendChild(p);
    
    const angle = (i / count) * Math.PI * 2 + gsap.utils.random(-0.15, 0.15);
    const distance = gsap.utils.random(40, 110);
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance * 0.45; // flatten circle into perspective ellipse
    
    gsap.to(p, {
      x: destX,
      y: destY,
      opacity: 0,
      scale: 0.1,
      duration: gsap.utils.random(0.8, 1.4),
      ease: "power3.out"
    });
  }
}

// 8. Ticker simulated sensor updates
const tickerAlt = document.getElementById('ticker-alt');
const tickerVel = document.getElementById('ticker-vel');
if (tickerAlt && tickerVel) {
  setInterval(() => {
    const currentAlt = parseFloat(tickerAlt.getAttribute('data-val'));
    const currentVel = parseFloat(tickerVel.getAttribute('data-val'));
    
    const newAlt = Math.max(0, currentAlt + (Math.random() - 0.5) * 3);
    const newVel = Math.max(0, currentVel + (Math.random() - 0.5) * 0.6);
    
    tickerAlt.setAttribute('data-val', newAlt.toFixed(1));
    tickerVel.setAttribute('data-val', newVel.toFixed(1));
    
    tickerAlt.textContent = Math.round(newAlt).toLocaleString();
    tickerVel.textContent = newVel.toFixed(1);
    
    const dupAlt = document.querySelector('.telemetry-num-dup1');
    const dupVel = document.querySelector('.telemetry-num-dup2');
    if (dupAlt) dupAlt.textContent = Math.round(newAlt).toLocaleString();
    if (dupVel) dupVel.textContent = newVel.toFixed(1);
  }, 1000);
}

// 9. Mobile menu toggle
const menuBtn = document.getElementById('mobile-menu-btn');
const dropdown = document.getElementById('mobile-dropdown');
if (menuBtn && dropdown) {
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('open');
    dropdown.classList.toggle('open');
    if (dropdown.classList.contains('open')) {
      lenis.stop();
    } else if (!isIntroActive) {
      lenis.start();
    }
  });
  
  dropdown.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      dropdown.classList.remove('open');
      if (!isIntroActive) lenis.start();
    });
  });
}

// 10. Stat counters triggers
const statCards = document.querySelectorAll('.stat-card');
statCards.forEach((card) => {
  const num = card.querySelector('.stat-number');
  if (!num) return;
  
  const target = parseFloat(num.getAttribute('data-target'));
  const decimals = parseInt(num.getAttribute('data-decimals')) || 0;
  
  ScrollTrigger.create({
    trigger: card,
    start: "top 80%",
    onEnter: () => {
      const obj = { value: 0 };
      gsap.to(obj, {
        value: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          num.textContent = obj.value.toFixed(decimals);
        }
      });
    },
    once: true
  });
});

// 11. Initial Startup & Custom Loading Sequence
function runIntroLandingSequence() {
  const title = document.getElementById('hero-heading');
  const desc = document.querySelector('.hero-desc');
  const btn = document.querySelector('.hero-actions');
  const logo = document.querySelector('.nav-logo');
  const navLinks = document.querySelectorAll('.nav-link-item');
  const navCta = document.querySelector('.nav-cta-link');
  const tracker = document.querySelector('.live-status-strip');
  
  // Cache and absolute hide everything for smooth timeline reveal
  gsap.set('body', { backgroundColor: '#141414', color: '#FAF8F5' });
  document.body.classList.add('inverted-colors');
  
  const originalLogoColor = getComputedStyle(document.documentElement).getPropertyValue('--ink');
  
  // Set starting values for elements
  gsap.set([title, desc, btn, logo, navLinks, navCta, tracker], { opacity: 0 });
  gsap.set(droneContainer, { opacity: 0 });
  
  // Generate coordinates for path calculations
  calculateAnchorCoords();
  generateFlightPathSVG();
  initDescentMechanics();
  
  // Set path dash offset initially hidden
  if (flightPathBg) gsap.set(flightPathBg, { strokeDashoffset: flightPathBg.getTotalLength(), strokeDasharray: flightPathBg.getTotalLength() });
  
  const introTl = gsap.timeline({
    onComplete: () => {
      // Transition page back to cream paper
      gsap.to('body', {
        backgroundColor: '#FAF8F5',
        color: '#141414',
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => {
          document.body.classList.remove('inverted-colors');
          isIntroActive = false;
          lenis.start(); // Enable scroll
          ScrollTrigger.refresh();
        }
      });
      
      // Cache played session state
      sessionStorage.setItem('aether-intro-played-v3', 'true');
    }
  });

  // Timeline
  introTl
    .to(logo, { opacity: 1, duration: 0.6, ease: "power2.out" })
    .to(navLinks, { opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }, "-=0.3")
    .to(navCta, { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.3")
    .to(tracker, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.2")
    .to(title, { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.3")
    .to(desc, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.5")
    .to(btn, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.5")
    .add(() => {
      // Fade in flight path and drone
      gsap.to(droneContainer, { opacity: 1, duration: 0.6 });
      if (flightPathBg) gsap.to(flightPathBg, { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" });
    }, "-=0.4");
}

function startApp() {
  // Check if intro has already run this session to skip long loader
  const hasPlayed = sessionStorage.getItem('aether-intro-played-v3');
  
  initCursorDot();
  initRippleCTA();
  
  if (hasPlayed) {
    isIntroActive = false;
    lenis.start();
    
    // Set colors directly to cream
    document.body.classList.remove('inverted-colors');
    gsap.set('body', { backgroundColor: '#FAF8F5', color: '#141414' });
    
    calculateAnchorCoords();
    generateFlightPathSVG();
    initDescentMechanics();
    initGlobalDescent();
    
    // Refresh ScrollTrigger to sync
    ScrollTrigger.refresh();
    
    // Set starting position of drone along path (at progress 0)
    if (flightPathActive && droneContainer) {
      const point = flightPathActive.getPointAtLength(0);
      gsap.set(droneContainer, { x: point.x, y: point.y });
    }
  } else {
    runIntroLandingSequence();
    initGlobalDescent();
  }

  // Handle Resize recalculations
  window.addEventListener('resize', gsap.utils.debounce(() => {
    calculateAnchorCoords();
    generateFlightPathSVG();
    initDescentMechanics();
    ScrollTrigger.refresh();
  }, 150));
}

// Trigger initialization
const handleLoad = () => {
  if (document.fonts) {
    document.fonts.ready.then(startApp);
  } else {
    startApp();
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(handleLoad, 50);
} else {
  window.addEventListener('load', handleLoad);
}
