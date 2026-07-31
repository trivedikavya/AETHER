// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, CustomEase);

// Create Custom Ease - Editorial curve
CustomEase.create("editorial", "M0,0 C0.65,0.05 0.36,1 1,1");

// 1. Initialize Lenis Smooth Scroll
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// 2. Custom Text-Splitting Utility
function wrapWords(element) {
  const children = Array.from(element.childNodes);
  
  children.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const words = text.split(/(\s+)/);
      const fragment = document.createDocumentFragment();
      
      words.forEach(word => {
        if (word.trim() === '') {
          fragment.appendChild(document.createTextNode(word));
        } else {
          const span = document.createElement('span');
          span.textContent = word;
          span.classList.add('split-word');
          span.style.display = 'inline-block';
          fragment.appendChild(span);
        }
      });
      
      node.replaceWith(fragment);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      wrapWords(node);
    }
  });
}

function splitLines(element) {
  if (element._originalHTML) {
    element.innerHTML = element._originalHTML;
  } else {
    element._originalHTML = element.innerHTML;
  }

  wrapWords(element);
  
  const wordSpans = Array.from(element.querySelectorAll('.split-word'));
  if (wordSpans.length === 0) return;
  
  const lines = [];
  let currentLine = [];
  let lastTop = -1;
  
  wordSpans.forEach(span => {
    const top = span.getBoundingClientRect().top;
    if (lastTop === -1) lastTop = top;
    
    if (Math.abs(top - lastTop) > 6) {
      lines.push(currentLine);
      currentLine = [span];
      lastTop = top;
    } else {
      currentLine.push(span);
    }
  });
  if (currentLine.length > 0) lines.push(currentLine);
  
  element.innerHTML = '';
  
  lines.forEach(lineSpans => {
    const lineWrapper = document.createElement('div');
    lineWrapper.classList.add('split-line-wrapper');
    
    const lineContent = document.createElement('span');
    lineContent.classList.add('split-line-content');
    
    lineSpans.forEach((span, idx) => {
      const cloned = span.cloneNode(true);
      let parent = span.parentNode;
      let currentElement = cloned;
      
      while (parent && parent !== element) {
        if (parent.classList.contains('emphasis-italic')) {
          const emp = document.createElement('span');
          emp.classList.add('emphasis-italic');
          emp.appendChild(currentElement);
          currentElement = emp;
          break;
        }
        parent = parent.parentNode;
      }
      
      lineContent.appendChild(currentElement);
      if (idx < lineSpans.length - 1) {
        lineContent.appendChild(document.createTextNode(' '));
      }
    });
    
    lineWrapper.appendChild(lineContent);
    element.appendChild(lineWrapper);
  });
}

// 3. Custom Pointer Cursors
const cursorDot = document.getElementById('cursorDot');
const cursorTrail = document.getElementById('cursorTrail');

if (cursorDot && cursorTrail) {
  let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.1, overwrite: 'auto' });
    cursorDot.style.opacity = '1';
    cursorTrail.style.opacity = '1';
  });

  gsap.ticker.add(() => {
    trailX += (mouseX - trailX) * 0.15;
    trailY += (mouseY - trailY) * 0.15;
    gsap.to(cursorTrail, { x: trailX, y: trailY, duration: 0.1, overwrite: 'auto' });
  });

  document.addEventListener('mouseleave', () => {
    gsap.to([cursorDot, cursorTrail], { opacity: 0, duration: 0.3 });
  });

  const hoverables = document.querySelectorAll('a, button, .magnetic-btn, .hamburger');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(cursorDot, { scale: 1.4, backgroundColor: '#C20D26', duration: 0.2 });
      gsap.to(cursorTrail, { scale: 1.6, borderColor: '#C20D26', duration: 0.2 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(cursorDot, { scale: 1, backgroundColor: 'var(--accent-red)', duration: 0.2 });
      gsap.to(cursorTrail, { scale: 1, borderColor: 'rgba(194, 13, 38, 0.35)', duration: 0.2 });
    });
  });
}

// 4. Magnetic Buttons
const magneticBtns = document.querySelectorAll('.magnetic-btn');
magneticBtns.forEach(btn => {
  const strength = parseFloat(btn.getAttribute('data-strength')) || 12;
  const xTo = gsap.quickTo(btn, "x", { duration: 0.8, ease: "editorial" });
  const yTo = gsap.quickTo(btn, "y", { duration: 0.8, ease: "editorial" });

  const text = btn.querySelector('span');
  let textXTo, textYTo;
  if (text) {
    textXTo = gsap.quickTo(text, "x", { duration: 0.8, ease: "editorial" });
    textYTo = gsap.quickTo(text, "y", { duration: 0.8, ease: "editorial" });
  }

  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    xTo(relX * (strength / 100));
    yTo(relY * (strength / 100));
    if (text) {
      textXTo(relX * (strength / 60));
      textYTo(relY * (strength / 60));
    }
  });

  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
    if (text) {
      gsap.to(text, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
    }
  });
});

// Ripple click wave
const rippleBtns = document.querySelectorAll('.ripple-btn');
rippleBtns.forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const wave = this.querySelector('.ripple-wave');
    if (wave) {
      gsap.set(wave, { x: x, y: y, scale: 0, opacity: 0.6 });
      gsap.to(wave, { scale: 6, opacity: 0, duration: 0.8, ease: "power2.out" });
    }
  });
});

// 5. Active Flight Path SVG Drawing
const activePath = document.getElementById('flight-path-active');
if (activePath) {
  const pathLen = activePath.getTotalLength();
  gsap.set(activePath, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
  gsap.to(activePath, { strokeDashoffset: 0, duration: 2.2, ease: "editorial" });
}

// 6. Navigation Scroll toggling
const navbar = document.getElementById('navbar');
if (navbar) {
  ScrollTrigger.create({
    start: "top -50",
    end: 99999,
    onToggle: (self) => {
      if (self.isActive) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }
  });
}

// 7. Split-line reveals on Viewport Enter
const initSplitHeadings = () => {
  const splitHeadings = document.querySelectorAll('#hero-heading, #touchdown-heading, .feature-title');
  splitHeadings.forEach(heading => {
    splitLines(heading);
    const lines = heading.querySelectorAll('.split-line-content');
    if (lines.length > 0) {
      const trigger = heading.closest('section') || heading;
      
      if (heading.id !== 'hero-heading') {
        // Hide initially to prevent layout jumps or CSS translateY bugs
        gsap.set(lines, { yPercent: 110 });

        ScrollTrigger.create({
          trigger: trigger,
          start: "top 82%",
          onEnter: () => {
            gsap.to(lines, {
              yPercent: 0,
              duration: 1.2,
              stagger: 0.08,
              ease: "editorial"
            });
          }
        });
      } else {
        if (isIntroActive) {
          gsap.set(lines, { yPercent: 110 });
        } else {
          gsap.set(lines, { yPercent: 0 });
        }
      }
    }
  });
};

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileDropdown = document.getElementById('mobile-dropdown');
if (mobileMenuBtn && mobileDropdown) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('open');
    mobileDropdown.classList.toggle('open');
    document.body.classList.toggle('lenis-stopped');
  });
  mobileDropdown.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuBtn.classList.remove('open');
      mobileDropdown.classList.remove('open');
      document.body.classList.remove('lenis-stopped');
    });
  });
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

// 9. Stats Count Up
const initStatsCountUp = () => {
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(stat => {
    // Reset to initial representation
    const decimals = parseInt(stat.getAttribute('data-decimals')) || 0;
    stat.textContent = decimals > 0 ? "0.0" : "0";

    const target = parseFloat(stat.getAttribute('data-target'));
    
    ScrollTrigger.create({
      trigger: stat,
      start: "top 90%",
      onEnter: () => {
        const obj = { value: 0 };
        gsap.to(obj, {
          value: target,
          duration: 2.2,
          ease: "editorial",
          onUpdate: () => {
            if (decimals > 0) {
              let valStr = (obj.value / Math.pow(10, decimals)).toFixed(decimals);
              stat.textContent = valStr;
            } else {
              stat.textContent = Math.round(obj.value).toLocaleString();
            }
          }
        });
      }
    });
  });
};

// 10. Global Drone & Inversion Mechanics
const droneContainer = document.getElementById('global-drone-container');
const droneRotator = document.getElementById('global-drone-rotator');
const droneAltText = document.querySelector('#global-drone-telemetry .id-alt');
const droneVelText = document.querySelector('#global-drone-telemetry .id-vel');
const landingDeck = document.getElementById('landing-deck');
const landingGlow = document.getElementById('landing-glow');
const touchdownSection = document.getElementById('touchdown');

let anchors = [];
const anchorIds = ['anchor-hero', 'feature-1', 'feature-2-pin', 'feature-3', 'landing-deck'];

function calculateAnchorCoords() {
  anchors = anchorIds.map(id => {
    const el = document.getElementById(id);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    
    if (id === 'anchor-hero') {
      return {
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + rect.height / 2 + window.scrollY
      };
    }
    
    if (id === 'feature-1') {
      const panel = el.querySelector('.tech-panel');
      if (panel) {
        const pRect = panel.getBoundingClientRect();
        return {
          x: pRect.left + pRect.width * 0.9 + window.scrollX,
          y: pRect.top + pRect.height * 0.29 + window.scrollY
        };
      }
    }

    if (id === 'feature-2-pin') {
      const visual = el.querySelector('.sensor-shield-visual');
      if (visual) {
        const vRect = visual.getBoundingClientRect();
        return {
          x: vRect.left + vRect.width / 2 + window.scrollX,
          y: vRect.top + vRect.height / 2 + window.scrollY
        };
      }
    }

    if (id === 'feature-3') {
      const visual = el.querySelector('.landing-crosshairs');
      if (visual) {
        const vRect = visual.getBoundingClientRect();
        return {
          x: vRect.left + vRect.width / 2 + window.scrollX,
          y: vRect.top + vRect.height / 2 + window.scrollY
        };
      }
    }

    if (id === 'landing-deck') {
      const pad = el.querySelector('.docking-pad');
      if (pad) {
        const pRect = pad.getBoundingClientRect();
        return {
          x: pRect.left + pRect.width / 2 + window.scrollX,
          y: pRect.top + pRect.height / 2 + window.scrollY - 10
        };
      }
    }
    
    return {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY
    };
  }).filter(Boolean);
}

function updateDroneTelemetry(progress) {
  const alt = Math.max(0, 1402 * (1 - progress));
  let vel = 72.4;
  if (progress < 0.25) {
    vel = 72.4 - (progress * 4 * 20);
  } else if (progress < 0.5) {
    vel = 52.4 + ((progress - 0.25) * 4 * 40);
  } else if (progress < 0.75) {
    vel = 92.4 - ((progress - 0.5) * 4 * 60);
  } else {
    vel = Math.max(0, 32.4 * (1 - (progress - 0.75) * 4));
  }

  if (alt < 2) {
    if (droneAltText) droneAltText.textContent = "0 M";
    if (droneVelText) droneVelText.textContent = "0.0 M/S";
  } else {
    if (droneAltText) droneAltText.textContent = `${Math.round(alt).toLocaleString()} M`;
    if (droneVelText) droneVelText.textContent = `${vel.toFixed(1)} M/S`;
  }
}

function createDustParticles() {
  const container = document.getElementById('particle-burst-container');
  if (!container) return;
  
  container.innerHTML = '';
  const count = 30;
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('dust-particle');
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = '50%';
    particle.style.top = '50%';
    container.appendChild(particle);
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 80 + 30;
    const xDest = Math.cos(angle) * velocity;
    const yDest = Math.sin(angle) * velocity - (Math.random() * 20 + 5);
    
    gsap.set(particle, { scale: 1, opacity: 0.85 });
    gsap.to(particle, {
      x: xDest,
      y: yDest,
      scale: 0.1,
      opacity: 0,
      duration: Math.random() * 0.7 + 0.5,
      ease: "editorial",
      onComplete: () => particle.remove()
    });
  }
}

function triggerScreenShake() {
  const wrapper = document.getElementById('smooth-content');
  if (!wrapper) return;
  const shakeTl = gsap.timeline();
  shakeTl.to(wrapper, { y: 2.5, x: -1, duration: 0.04, ease: "none" })
         .to(wrapper, { y: -1.5, x: 1.5, duration: 0.04, ease: "none" })
         .to(wrapper, { y: 1, x: -0.5, duration: 0.04, ease: "none" })
         .to(wrapper, { y: 0, x: 0, duration: 0.04, ease: "none" });
}

// Bezier path generator (horizontal S-sweeps)
function generateBezierPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i+1];
    const dy = p1.y - p0.y;
    const cy0 = p0.y + dy * 0.45;
    const cx0 = p0.x;
    const cy1 = p1.y - dy * 0.45;
    const cx1 = p1.x;
    d += ` C ${cx0},${cy0} ${cx1},${cy1} ${p1.x},${p1.y}`;
  }
  return d;
}

// Global state trackers
let isIntroActive = true;

const verifyAndResetInversion = () => {
  if (isIntroActive) return;
  
  const touchdownSection = document.getElementById('touchdown');
  const touchdownTrigger = ScrollTrigger.getById('touchdown-trigger');
  if (touchdownTrigger && touchdownTrigger.isActive) {
    document.body.classList.add('inverted-colors');
    return;
  }
  
  let anyActive = false;
  const features = document.querySelectorAll('.feature-block');
  features.forEach(block => {
    const trigger = ScrollTrigger.getById(block.id + '-trigger');
    if (trigger && trigger.isActive) {
      block.classList.add('drone-present');
      if (block.id !== 'feature-2-pin') {
        anyActive = true;
      }
    }
  });
  
  if (!anyActive) {
    document.body.classList.remove('inverted-colors');
    features.forEach(b => {
      const trg = ScrollTrigger.getById(b.id + '-trigger');
      if (!trg || !trg.isActive) {
        b.classList.remove('drone-present');
      }
    });
  }
};

// Intro sequence animation (lands drone on Hero, makes background black, then reverts)
const runIntroLandingSequence = () => {
  lenis.stop(); // Stop scroll controls
  isIntroActive = true;
  
  document.body.classList.add('inverted-colors');
  calculateAnchorCoords();
  
  if (anchors.length > 0) {
    const startX = anchors[0].x;
    const startY = anchors[0].y - 450;
    
    gsap.set(droneContainer, { x: startX, y: startY, xPercent: -50, yPercent: -50, opacity: 1 });
    gsap.set(droneRotator, { scale: 2.2, rotate: -25 });
  }

  // Stagger reveal hero title split lines
  const heroLines = document.querySelectorAll('#hero-heading .split-line-content');
  gsap.to(heroLines, { yPercent: 0, duration: 1.5, stagger: 0.12, ease: "editorial", delay: 0.2 });

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
    }
  });

  // Animate descent onto Hero pad
  if (anchors.length > 0) {
    introTl.to(droneContainer, {
      x: anchors[0].x,
      y: anchors[0].y,
      xPercent: -50,
      yPercent: -50,
      duration: 2.2,
      ease: "power2.out"
    }, 0.2);

    introTl.to(droneRotator, {
      scale: 1.5, // Settle at 1.5 (larger size)
      rotate: 0,
      duration: 2.2,
      ease: "power2.out"
    }, 0.2);
  }
};

const initDescentMechanics = () => {
  calculateAnchorCoords();
  
  const activePath = document.getElementById('global-flight-path-active');
  const bgPath = document.getElementById('global-flight-path-bg');
  if (activePath && bgPath && anchors.length > 0) {
    const pathD = generateBezierPath(anchors);
    activePath.setAttribute('d', pathD);
    bgPath.setAttribute('d', pathD);
    const pathLen = activePath.getTotalLength();
    gsap.set(activePath, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
  }

  const hasPlayed = sessionStorage.getItem('aether-intro-played-v3');
  if (hasPlayed) {
    isIntroActive = false;
    lenis.start();
    
    // Immediately reveal hero title
    const heroLines = document.querySelectorAll('#hero-heading .split-line-content');
    gsap.set(heroLines, { yPercent: 0 });
    
    if (anchors.length > 0) {
      gsap.set(droneContainer, { x: anchors[0].x, y: anchors[0].y, xPercent: -50, yPercent: -50, opacity: 1 });
      gsap.set(droneRotator, { scale: 1.5, rotate: 0 });
    }
  } else {
    sessionStorage.setItem('aether-intro-played-v3', 'true');
    runIntroLandingSequence();
  }
};

const initGlobalDescent = () => {
  const isMobile = window.innerWidth < 768;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear previous triggers
  ScrollTrigger.getAll().forEach(t => {
    t.kill();
  });

  calculateAnchorCoords();
  
  // Re-register Stats triggers so they aren't lost when triggers are cleared
  initStatsCountUp();

  // Re-register Split Text headings triggers
  initSplitHeadings();

  // Subtle Parallax for [data-speed] elements
  if (!isMobile && !prefersReducedMotion) {
    gsap.utils.toArray('[data-speed]').forEach(el => {
      const speed = parseFloat(el.getAttribute('data-speed')) || 1;
      const yShift = (speed - 1) * 80;
      gsap.fromTo(el, 
        { y: -yShift },
        {
          y: yShift,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });
  }

  const activePath = document.getElementById('global-flight-path-active');
  const bgPath = document.getElementById('global-flight-path-bg');

  if (activePath && bgPath && anchors.length > 0) {
    const pathD = generateBezierPath(anchors);
    activePath.setAttribute('d', pathD);
    bgPath.setAttribute('d', pathD);

    const pathLen = activePath.getTotalLength();
    gsap.set(activePath, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
  }

  const redGuideLine = document.getElementById('landing-vector-path');
  if (redGuideLine) {
    ScrollTrigger.create({
      trigger: landingDeck,
      start: "top 80%",
      onEnter: () => {
        gsap.to(redGuideLine, { strokeDashoffset: 0, duration: 1.4, ease: "editorial" });
      }
    });
  }

  // Color inversion triggers on each feature block
  const features = document.querySelectorAll('.feature-block');
  features.forEach(block => {
    ScrollTrigger.create({
      id: block.id + '-trigger',
      trigger: block,
      start: "top 45%",
      end: "bottom 55%",
      onEnter: () => {
        if (!isIntroActive) {
          if (block.id !== 'feature-2-pin') {
            document.body.classList.add('inverted-colors');
          }
          block.classList.add('drone-present');
        }
      },
      onEnterBack: () => {
        if (!isIntroActive) {
          if (block.id !== 'feature-2-pin') {
            document.body.classList.add('inverted-colors');
          }
          block.classList.add('drone-present');
        }
      },
      onLeave: () => {
        if (!isIntroActive) {
          block.classList.remove('drone-present');
          setTimeout(verifyAndResetInversion, 50);
        }
      },
      onLeaveBack: () => {
        if (!isIntroActive) {
          block.classList.remove('drone-present');
          setTimeout(verifyAndResetInversion, 50);
        }
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
      onEnterBack: () => {
        if (!isIntroActive) {
          document.body.classList.add('inverted-colors');
        }
      },
      onLeave: () => {
        if (!isIntroActive) {
          setTimeout(verifyAndResetInversion, 50);
        }
      },
      onLeaveBack: () => {
        if (!isIntroActive) {
          setTimeout(verifyAndResetInversion, 50);
        }
      }
    });
  }

  if (isMobile || prefersReducedMotion) {
    gsap.set(droneContainer, { opacity: 0 });

    ScrollTrigger.create({
      trigger: landingDeck,
      start: "top 75%",
      onEnter: () => {
        document.body.classList.add('is-landing');
        document.body.classList.add('is-landed');
        if (landingGlow) landingGlow.classList.add('active');
        gsap.killTweensOf(droneContainer);
        gsap.set(droneContainer, {
          opacity: 1,
          x: anchors[anchors.length - 1].x,
          y: anchors[anchors.length - 1].y + 10,
          xPercent: -50,
          yPercent: -50
        });
      },
      onLeaveBack: () => {
        document.body.classList.remove('is-landing');
        document.body.classList.remove('is-landed');
        if (landingGlow) landingGlow.classList.remove('active');
        gsap.set(droneContainer, { opacity: 0 });
      }
    });

  } else {
    gsap.set(droneContainer, { opacity: 1 });

    if (activePath) {
      const pathLen = activePath.getTotalLength();
      
      ScrollTrigger.create({
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
        scrub: 1.2,
        onUpdate: (self) => {
          if (isIntroActive) return;
          const progress = self.progress;
          const currentLength = progress * pathLen;
          
          gsap.set(activePath, { strokeDashoffset: pathLen * (1 - progress) });

          const pCurrent = activePath.getPointAtLength(currentLength);
          if (pCurrent) {
            gsap.set(droneContainer, { x: pCurrent.x, y: pCurrent.y, xPercent: -50, yPercent: -50 });

            let angle = 0;
            if (currentLength < pathLen) {
              const pNext = activePath.getPointAtLength(Math.min(pathLen, currentLength + 2));
              const dx = pNext.x - pCurrent.x;
              const dy = pNext.y - pCurrent.y;
              angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
            }

            const scrollVel = self.getVelocity();
            const gyroTilt = Math.min(Math.max(scrollVel * -0.012, -15), 15);

            // Responsive scale profile: starts at 1.5 (Hero), shrinks to 0.8 in cards, touchdown approach expands to 1.25, lands at 1.0.
            let scale = 1.5;
            if (progress < 0.25) {
              scale = 1.5 - (progress * 4 * 0.7); // Shrinks from 1.5 to 0.8
            } else if (progress < 0.75) {
              scale = 0.8; // Regular / small inside cards
            } else if (progress < 0.93) {
              scale = 0.8 + ((progress - 0.75) / 0.18 * 0.45); // Expands close to touchdown (1.25)
            } else {
              scale = 1.25 - ((progress - 0.93) / 0.07 * 0.25); // Settles at 1.0
            }

            gsap.to(droneRotator, {
              rotate: angle + gyroTilt,
              scale: scale,
              duration: 0.35,
              overwrite: 'auto',
              ease: "power2.out"
            });
          }

          updateDroneTelemetry(progress);
        }
      });
    }

    if (landingDeck) {
      ScrollTrigger.create({
        trigger: landingDeck,
        start: "top 62%",
        onEnter: () => { document.body.classList.add('is-landing'); },
        onLeaveBack: () => { document.body.classList.remove('is-landing'); }
      });

      ScrollTrigger.create({
        trigger: landingDeck,
        start: "top 51%",
        onEnter: () => {
          document.body.classList.add('is-landed');
          if (landingGlow) landingGlow.classList.add('active');
          createDustParticles();
          triggerScreenShake();
          gsap.to('#global-drone-telemetry', { opacity: 0, duration: 0.3 });
          gsap.to(droneContainer, { y: anchors[anchors.length - 1].y + 10, xPercent: -50, yPercent: -50, duration: 0.2 });
        },
        onLeaveBack: () => {
          document.body.classList.remove('is-landed');
          if (landingGlow) landingGlow.classList.remove('active');
          gsap.to('#global-drone-telemetry', { opacity: 0.85, duration: 0.3 });
        }
      });
    }
  }
};

const startApp = () => {
  initGlobalDescent();
  initDescentMechanics();
};

window.addEventListener('load', () => {
  if (document.fonts) {
    document.fonts.ready.then(startApp);
  } else {
    startApp();
  }
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initGlobalDescent();
    calculateAnchorCoords();
  }, 150);
});
