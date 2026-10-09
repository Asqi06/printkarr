import fs from 'node:fs';const path='lib/views_public.js';let s=fs.readFileSync(path,'utf8');const start=s.indexOf('      <section class="arrival story-chapter"'),end=s.indexOf('      <section class="story-chapter transformation-world"',start);const hero=`      <section class="arrival story-chapter" data-chapter="0" aria-labelledby="home-title">
        <h1 id="home-title" class="hero-type">Beyond paper<span>.</span></h1>
        <div class="story-frame">
          <p class="cinema-eyebrow hero-eyebrow"><span class="blue-mark"></span> PRINTKARR / THE NEXT CHAPTER</p>
          <div class="hero-concept"><span>MEET THE PRINTKARR KIOSK</span><b>A new world of printing.</b><small>IN DEVELOPMENT · CONCEPT PREVIEW</small></div>
          <div class="scene-slot arrival-art" data-scene="0"><img class="hero-kiosk-fallback" src="/images/kiosk-hero.webp" width="1152" height="1728" fetchpriority="high" alt="PrintKarr self-service kiosk concept"></div>
          <div class="hero-footnote"><p class="arrival-description">Your notes. Your essentials.<br><strong>At your door.</strong></p><p class="hero-small">Print delivery is live. Self-service kiosks are in development.<br>Upload now, or scroll into what comes next.</p><a class="arrival-shop-link" href="/shops">Find nearby shops \${icon('arrow-up-right')}</a></div>
          <div class="hero-actions"><a class="btn loud big cinema-magnet" href="/order">Upload &amp; Print \${icon('arrow-up-right')}</a><a class="cinema-text-link" href="#how-it-works">Explore PrintKarr \${icon('arrow-down')}</a></div>
          <div class="landing-readout" aria-hidden="true"><span data-landing-label>01 / THE ARRIVAL</span><b data-landing-caption>From a new perspective.</b><i><em data-landing-progress></em></i></div>
          <div class="arrival-bottom"><a href="#how-it-works">\${icon('arrow-down')} Scroll to land</a><span>A CONCEPT IN MOTION. A REAL WAY TO PRINT.</span><span>VAPI, INDIA</span></div>
        </div>
      </section>
`;
s=s.slice(0,start)+hero+s.slice(end);fs.writeFileSync(path,s);
