# AETHER — Physics-Driven Kinetic Landing Experience

A high-performance, scroll-driven interactive landing experience designed for modern airspace tracking and drone logistics orchestration. Built as a custom kinetic web interface showcasing continuous alignment animation, layout un-gridding, and real-time canvas coordination.

Official submission for the **Webflow × GSAP × CodeTV Hackathon 2026**.

---

## 🚀 Live Demonstrations & Links

- **Webflow Cloud Deployment**: `https://aether-logistics.webflow.io`
- **Standalone Interactive View**: `http://localhost:3000/standalone/index.html` (Local Dev server target)

---

## 🛠️ The Tech Stack

- **Astro**: High-performance, components-driven web framework for generating the foundational HTML and asset orchestration.
- **GSAP (GreenSock Animation Platform)**: The kinetic engine powering the entire landing experience:
  - **ScrollTrigger**: Syncing the flight trajectory and telemetry details of the descent vector directly to native user scroll.
  - **CustomEase**: Creating custom Bezier easing formulas for precise weight and inertia during vehicle descent.
- **Lenis Smooth Scroll**: Delivering a uniform, high-performance scroll experience across all browsers and operating systems.
- **Vanilla CSS (Warm Paper Editorial System)**: Curated styling system with clean custom design tokens, fluid clamp typography, and real-time color state inversion.
- **Webflow Cloud**: Deployed cloud interface matching native components structure.

---

## 💫 Premium Kinetic Animations

1. **Async Font Hydration (Reflow-Safe Text Splitting)**
   - Custom character-wrapping utility wrapped inside a `document.fonts.ready` promise. Text is only split once the custom web fonts (`Bricolage Grotesque`, `Fraunces`, `JetBrains Mono`) are fully loaded, preventing layout shifts, line squishing, or character clipping.
2. **Scroll-Driven SVG Trajectory Coordination**
   - The vehicle traces a complex S-curve vector down the viewport. Coordinates are calculated dynamically using element bounding rects, generating a custom Bezier path on the fly that integrates with responsive screen sizes.
3. **Asymmetric Grid Parallax**
   - Symmetrical layouts are broken down into asymmetric widths and vertical card offsets. Panels and cards float independently at varying velocities using custom scroll-scrubbed parallax triggers.
4. **Magnetic Physics Micro-Interactions**
   - Interactive CTA links and buttons magnetically pull toward the user's cursor on hover. On mouse leave, they snap back with a high-fidelity spring bounce utilizing the `elastic.out(1, 0.3)` GSAP ease.
5. **Dynamic Color Space Inversion**
   - The entire document seamlessly shifts color states (warm cream paper to charcoal ink black) depending on which waypoint block the tracking vector currently intersects.

---

## 📦 Installation & Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/trivedikavya/AETHER.git
   cd AETHER
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the local Astro dev server**:
   ```bash
   npx astro dev
   ```
   *Note: If the background dev server is preferred, use:*
   ```bash
   astro dev --background
   ```
4. **Build the production build**:
   ```bash
   npm run build
   ```

---

## ✍️ Hackathon Submission Credits

Built with precision and editorial focus by **Kavya Trivedi** for the **Webflow × GSAP × CodeTV Hackathon 2026**.
