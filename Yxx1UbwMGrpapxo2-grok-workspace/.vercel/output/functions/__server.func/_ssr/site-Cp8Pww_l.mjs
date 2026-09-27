import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, f as useRouterState, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Clock3, a as Timer, b as ArrowUpRight, c as Smartphone, d as Phone, f as Menu, g as Earth, h as Lock, l as ShieldCheck, m as Mail, n as X, o as Star, p as MapPin, r as Users, s as Sparkles, t as Zap, u as Printer, v as Check, y as Building2 } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { _ as SRGBColorSpace, a as CircleGeometry, b as TorusGeometry, c as Group, d as Mesh, f as MeshBasicMaterial, g as PlaneGeometry, h as PerspectiveCamera, i as CanvasTexture, l as HemisphereLight, m as MeshStandardMaterial, n as WebGLRenderer, o as CylinderGeometry, p as MeshPhysicalMaterial, r as BoxGeometry, s as DirectionalLight, t as RoundedBoxGeometry, u as MathUtils, v as Scene, y as SphereGeometry } from "../_libs/three.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/site-Cp8Pww_l.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function canvasTexture(w, h, draw) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const ctx = c.getContext("2d");
	if (!ctx) throw new Error("2d context missing");
	draw(ctx, w, h);
	const tex = new CanvasTexture(c);
	tex.colorSpace = SRGBColorSpace;
	tex.anisotropy = 8;
	tex.needsUpdate = true;
	return tex;
}
function qrTexture(seed) {
	return canvasTexture(256, 256, (ctx, w, h) => {
		ctx.fillStyle = "#F4F7FC";
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = "#071833";
		const cells = 21;
		const s = w / cells;
		const bit = (x, y) => {
			const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
			return n - Math.floor(n) > .46;
		};
		const finder = (ox, oy) => {
			for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (x === 0 || y === 0 || x === 6 || y === 6 || x >= 2 && x <= 4 && y >= 2 && y <= 4) ctx.fillRect((ox + x) * s, (oy + y) * s, s + .5, s + .5);
		};
		finder(0, 0);
		finder(14, 0);
		finder(0, 14);
		for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
			if (x < 9 && y < 9 || x > 11 && y < 9 || x < 9 && y > 11) continue;
			if (bit(x, y)) ctx.fillRect(x * s, y * s, s + .5, s + .5);
		}
	});
}
function screenTexture() {
	return canvasTexture(1024, 640, (ctx, w, h) => {
		const g = ctx.createLinearGradient(0, 0, 0, h);
		g.addColorStop(0, "#0B1F4A");
		g.addColorStop(1, "#071833");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = "#1A5BFF";
		ctx.fillRect(0, 0, w, 8);
		ctx.font = "700 72px ui-sans-serif, system-ui, sans-serif";
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText("Print", 80, 170);
		ctx.fillStyle = "#5B8CFF";
		ctx.fillText("Karr", 80 + ctx.measureText("Print").width, 170);
		ctx.font = "500 34px ui-sans-serif, system-ui, sans-serif";
		ctx.fillStyle = "#9BB0D0";
		ctx.fillText("Ready to print  ·  24/7", 80, 230);
		ctx.fillStyle = "#13284F";
		roundRect(ctx, 80, 300, w - 160, 88, 22);
		ctx.fill();
		ctx.fillStyle = "#1A5BFF";
		roundRect(ctx, 92, 312, 210, 64, 16);
		ctx.fill();
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "600 28px ui-sans-serif, system-ui, sans-serif";
		ctx.fillText("ONLINE", 128, 354);
		ctx.fillStyle = "#8AA0C4";
		ctx.font = "500 26px ui-sans-serif, system-ui, sans-serif";
		ctx.fillText("Scan kiosk QR to start", 330, 354);
		ctx.fillStyle = "#1A5BFF";
		ctx.globalAlpha = .9;
		roundRect(ctx, 80, 430, w - 160, 110, 24);
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "600 36px ui-sans-serif, system-ui, sans-serif";
		ctx.fillText("Tap phone  ·  Print in 60s", 110, 498);
	});
}
function wrapTexture() {
	return canvasTexture(1024, 1024, (ctx, w, h) => {
		ctx.fillStyle = "#1A5BFF";
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "700 120px ui-sans-serif, system-ui, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("Print", w / 2 - 10, 430);
		ctx.fillStyle = "#D6E4FF";
		ctx.fillText("Karr", w / 2 - 10, 560);
		ctx.font = "600 36px ui-sans-serif, system-ui, sans-serif";
		ctx.fillStyle = "rgba(255,255,255,0.75)";
		ctx.fillText("INSTANT PRINT KIOSK", w / 2, 650);
	});
}
function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}
function mat(color, extras = {}) {
	return new MeshPhysicalMaterial({
		color,
		roughness: .32,
		metalness: .08,
		clearcoat: .55,
		clearcoatRoughness: .28,
		...extras
	});
}
function buildKiosk(textures) {
	const root = new Group();
	const white = mat("#F7F9FD");
	const ink = mat("#0C1C33");
	const blue = mat("#1A5BFF");
	const pale = mat("#D9E6FF");
	mat("#070F1C", {
		roughness: .12,
		metalness: .2,
		transmission: 0,
		opacity: 1
	});
	const body = new Mesh(new RoundedBoxGeometry(1.28, 3.42, .92, 6, .12), white);
	body.castShadow = true;
	body.receiveShadow = true;
	root.add(body);
	const wrap = new Mesh(new RoundedBoxGeometry(1.32, 1.18, .96, 4, .08), new MeshPhysicalMaterial({
		map: textures.wrap,
		roughness: .28,
		metalness: .06,
		clearcoat: .4
	}));
	wrap.position.y = -.62;
	root.add(wrap);
	const left = new Mesh(new RoundedBoxGeometry(.08, 3.2, .78, 2, .04), blue);
	left.position.set(-.66, .02, .02);
	root.add(left);
	const right = left.clone();
	right.position.x = .66;
	root.add(right);
	const bezel = new Mesh(new RoundedBoxGeometry(1.08, .78, .1, 4, .05), ink);
	bezel.position.set(0, 1.22, .46);
	root.add(bezel);
	const screen = new Mesh(new PlaneGeometry(.96, .66), new MeshBasicMaterial({ map: textures.screen }));
	screen.position.set(0, 1.22, .515);
	root.add(screen);
	const cam = new Mesh(new CircleGeometry(.028, 24), ink);
	cam.position.set(0, 1.58, .52);
	root.add(cam);
	const camDot = new Mesh(new CircleGeometry(.012, 16), new MeshBasicMaterial({ color: "#1A5BFF" }));
	camDot.position.set(0, 1.58, .522);
	root.add(camDot);
	const slot = new Mesh(new RoundedBoxGeometry(.72, .08, .12, 2, .02), ink);
	slot.position.set(0, .12, .48);
	root.add(slot);
	const paper = new Mesh(new BoxGeometry(.58, .01, .36), pale);
	paper.position.set(0, .12, .62);
	paper.rotation.x = -.18;
	root.add(paper);
	const tray = new Mesh(new RoundedBoxGeometry(.82, .06, .28, 2, .03), white);
	tray.position.set(0, -.08, .54);
	root.add(tray);
	const qrMatA = new MeshBasicMaterial({ map: textures.qrA });
	const qrMatB = new MeshBasicMaterial({ map: textures.qrB });
	const qrA = new Mesh(new PlaneGeometry(.32, .32), qrMatA);
	qrA.position.set(-.28, -.72, .49);
	root.add(qrA);
	const qrB = new Mesh(new PlaneGeometry(.32, .32), qrMatB);
	qrB.position.set(.28, -.72, .49);
	root.add(qrB);
	const led = new Mesh(new SphereGeometry(.03, 16, 16), new MeshStandardMaterial({
		color: "#3D7EFF",
		emissive: "#1A5BFF",
		emissiveIntensity: 1.4
	}));
	led.position.set(.48, .42, .47);
	root.add(led);
	const mascot = buildMascot();
	mascot.position.set(0, .52, .5);
	mascot.scale.setScalar(.92);
	root.add(mascot);
	for (const sx of [-.42, .42]) for (const sz of [-.28, .28]) {
		const foot = new Mesh(new CylinderGeometry(.07, .08, .08, 16), ink);
		foot.position.set(sx, -1.78, sz);
		root.add(foot);
	}
	const cap = new Mesh(new RoundedBoxGeometry(1.2, .08, .86, 3, .04), pale);
	cap.position.y = 1.74;
	root.add(cap);
	root.position.y = -.12;
	root.traverse((obj) => {
		const mesh = obj;
		if (mesh.isMesh) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
	});
	return {
		root,
		paper,
		led,
		mascot
	};
}
function buildMascot() {
	const g = new Group();
	const blue = mat("#1A5BFF", { roughness: .4 });
	const white = mat("#F4F7FC", { roughness: .35 });
	const ink = mat("#071833");
	const head = new Mesh(new SphereGeometry(.22, 32, 32), blue);
	head.position.y = .08;
	g.add(head);
	const body = new Mesh(new SphereGeometry(.16, 28, 28), blue);
	body.scale.set(1.15, .85, .9);
	body.position.y = -.14;
	g.add(body);
	const eyeL = new Mesh(new SphereGeometry(.055, 16, 16), white);
	eyeL.position.set(-.07, .1, .18);
	const eyeR = eyeL.clone();
	eyeR.position.x = .07;
	g.add(eyeL, eyeR);
	const pupilL = new Mesh(new SphereGeometry(.026, 12, 12), ink);
	pupilL.position.set(-.07, .1, .225);
	const pupilR = pupilL.clone();
	pupilR.position.x = .07;
	g.add(pupilL, pupilR);
	const smile = new Mesh(new TorusGeometry(.07, .012, 8, 16, Math.PI), ink);
	smile.position.set(0, .02, .2);
	smile.rotation.set(Math.PI, 0, 0);
	g.add(smile);
	return g;
}
function mountScene(el) {
	const scene = new Scene();
	const camera = new PerspectiveCamera(32, 1, .1, 40);
	camera.position.set(0, .35, 7.4);
	camera.lookAt(0, .1, 0);
	const renderer = new WebGLRenderer({
		antialias: true,
		alpha: true,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
	renderer.setClearColor(0, 0);
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.05;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = 2;
	el.appendChild(renderer.domElement);
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.inset = "0";
	renderer.domElement.style.width = "100%";
	renderer.domElement.style.height = "100%";
	renderer.domElement.style.zIndex = "1";
	const hemi = new HemisphereLight(15660031, 12109016, .95);
	scene.add(hemi);
	const key = new DirectionalLight(16777215, 1.55);
	key.position.set(3.2, 6.2, 4.4);
	key.castShadow = true;
	key.shadow.mapSize.set(1024, 1024);
	key.shadow.camera.near = 1;
	key.shadow.camera.far = 18;
	key.shadow.camera.left = -4;
	key.shadow.camera.right = 4;
	key.shadow.camera.top = 5;
	key.shadow.camera.bottom = -4;
	scene.add(key);
	const fill = new DirectionalLight(10404095, .55);
	fill.position.set(-4.5, 2.2, 2.4);
	scene.add(fill);
	const rim = new DirectionalLight(16777215, .45);
	rim.position.set(.4, 3.2, -5);
	scene.add(rim);
	const screen = screenTexture();
	const wrap = wrapTexture();
	const qrA = qrTexture(1.7);
	const qrB = qrTexture(4.2);
	const { root, paper, led, mascot } = buildKiosk({
		screen,
		wrap,
		qrA,
		qrB
	});
	scene.add(root);
	const shadow = new Mesh(new CircleGeometry(1.35, 48), new MeshBasicMaterial({
		color: "#0C1C33",
		transparent: true,
		opacity: .12
	}));
	shadow.rotation.x = -Math.PI / 2;
	shadow.position.y = -1.86;
	scene.add(shadow);
	const progress = { value: 0 };
	const mouse = {
		x: 0,
		y: 0
	};
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let raf = 0;
	let last = performance.now();
	let disposed = false;
	const resize = () => {
		const w = el.clientWidth || 1;
		const h = el.clientHeight || 1;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h, false);
		camera.position.z = w < 720 ? 9.6 : 7.4;
	};
	const ro = new ResizeObserver(resize);
	ro.observe(el);
	resize();
	const tick = (now) => {
		if (disposed) return;
		const dt = Math.min((now - last) / 1e3, .1);
		last = now;
		const p = reduced ? .42 : progress.value;
		const turn = -.42 + p * Math.PI * 1.55;
		const scale = .78 + Math.sin(p * Math.PI) * .38;
		const bob = reduced ? 0 : Math.sin(now * .0014) * .04;
		root.rotation.y = MathUtils.damp(root.rotation.y, turn + mouse.x * .28, 6, dt);
		root.rotation.x = MathUtils.damp(root.rotation.x, .08 + p * .12 + mouse.y * .12, 6, dt);
		const s = MathUtils.damp(root.scale.x, scale, 5, dt);
		root.scale.setScalar(s);
		root.position.y = -.12 + bob;
		paper.position.z = .52 + p * .22;
		const ledMat = led.material;
		ledMat.emissiveIntensity = .8 + Math.sin(now * .006) * .7;
		mascot.rotation.y = Math.sin(now * .0018) * .15;
		renderer.render(scene, camera);
		raf = requestAnimationFrame(tick);
	};
	raf = requestAnimationFrame(tick);
	return {
		setProgress: (p) => {
			progress.value = Math.min(1, Math.max(0, p));
		},
		setMouse: (nx, ny) => {
			mouse.x = nx;
			mouse.y = ny;
		},
		dispose: () => {
			disposed = true;
			cancelAnimationFrame(raf);
			ro.disconnect();
			renderer.dispose();
			scene.traverse((obj) => {
				const mesh = obj;
				if (mesh.geometry) mesh.geometry.dispose();
				const m = mesh.material;
				if (Array.isArray(m)) m.forEach((x) => x.dispose());
				else if (m) m.dispose();
			});
			screen.dispose();
			wrap.dispose();
			qrA.dispose();
			qrB.dispose();
			if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
		}
	};
}
function KioskStage({ className }) {
	const ref = (0, import_react.useRef)(null);
	const handle = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		let scene = null;
		try {
			scene = mountScene(el);
			handle.current = scene;
		} catch {
			handle.current = null;
		}
		const onScroll = () => {
			const hero = document.getElementById("hero-stage");
			if (!hero || !handle.current) return;
			const rect = hero.getBoundingClientRect();
			const span = Math.max(hero.offsetHeight - window.innerHeight, 1);
			const p = Math.min(1, Math.max(0, -rect.top / span));
			handle.current.setProgress(p);
		};
		const onMove = (e) => {
			if (!handle.current) return;
			const nx = e.clientX / window.innerWidth * 2 - 1;
			const ny = e.clientY / window.innerHeight * 2 - 1;
			handle.current.setMouse(nx, -ny);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("pointermove", onMove, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("pointermove", onMove);
			scene?.dispose();
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 flex items-end justify-center pb-10 sm:items-center sm:pb-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-[58vh] w-[min(220px,46vw)] max-h-[520px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-[8%] top-0 h-[18%] rounded-t-[18px] bg-navy" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-[12%] top-[3%] h-[12%] rounded-[10px] bg-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 top-[16%] rounded-[22px] bg-paper shadow-card ring-1 ring-line" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-[18%] h-[32%] rounded-b-[18px] bg-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-1/2 top-[38%] size-16 -translate-x-1/2 rounded-full bg-primary ring-4 ring-paper" })
				]
			})
		})
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var PHONE = "080-4122-9900";
var EMAIL = "team@printkarr.in";
var ADDRESS = "14, 100 Feet Road, Indiranagar, Bengaluru 560038";
function PageShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#main",
				className: "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-paper",
				children: "Skip to content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				id: "main",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DockNav, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				richColors: true
			})
		]
	});
}
function BrandWord({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("font-display font-semibold tracking-tight", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-paper",
			children: "Print"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-blue-bright",
			children: "Karr"
		})]
	});
}
function Logo({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		className: cn("inline-flex items-center rounded-full bg-navy shadow-[0_10px_30px_-18px_rgb(7_24_51_/_0.8)]", compact ? "px-3 py-1.5" : "px-3.5 py-2"),
		"aria-label": "PrintKarr home",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandWord, { className: compact ? "text-lg" : "text-xl" })
	});
}
function SiteHeader() {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/contact",
					className: "hidden rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition-transform duration-150 ease-out hover:ring-primary active:scale-[0.96] sm:inline-flex",
					children: "Contact Us"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink ring-1 ring-line sm:hidden",
					"aria-label": open ? "Close menu" : "Open menu",
					onClick: () => setOpen((v) => !v),
					children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
				})]
			})]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "pointer-events-auto mx-auto mt-3 max-w-6xl rounded-3xl bg-paper p-4 shadow-card ring-1 ring-line sm:hidden",
			children: [
				["/", "Home"],
				["/how-it-works", "How it works"],
				["/franchise", "Franchise"],
				["/xerox", "Xerox shops"],
				["/about", "About"],
				["/contact", "Contact"]
			].map(([to, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to,
				onClick: () => setOpen(false),
				className: "block rounded-2xl px-3 py-3 text-sm font-medium hover:bg-pale",
				children: label
			}, to))
		}) : null]
	});
}
function DockNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 items-center rounded-full bg-paper/95 p-1.5 shadow-card ring-1 ring-line backdrop-blur md:flex",
		"aria-label": "Primary",
		children: [
			{
				to: "/about",
				label: "About Us"
			},
			{
				to: "/how-it-works",
				label: "Features"
			},
			{
				to: "/",
				label: "PrintKarr",
				home: true
			},
			{
				to: "/franchise",
				label: "Franchise"
			},
			{
				to: "/contact",
				label: "Contact us"
			}
		].map((item) => {
			const active = pathname === item.to;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: item.to,
				className: cn("rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150", "home" in item && item.home ? "bg-pale px-5 font-display font-semibold text-primary" : active ? "text-primary" : "text-muted hover:text-ink"),
				children: "home" in item && item.home ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-navy",
					children: "Print"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-primary",
					children: "Karr"
				})] }) : item.label
			}, item.to);
		})
	});
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "border-t border-line bg-paper px-4 pb-24 pt-16 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-sm text-sm leading-relaxed text-muted",
						children: "India's first & only self-service printing vending kiosk. Instant, private, 24/7 — no shop, no queue, no USB."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-sm text-ink",
						children: "Have a Xerox shop? Join the modern way of running a print desk."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/xerox",
						className: "mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg transition-transform duration-150 active:scale-[0.96]",
						children: ["View details ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-[0.16em] text-muted",
					children: "Navigation"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-4 space-y-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/xerox",
							className: "hover:text-primary",
							children: "Xerox Shops"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/how-it-works",
							className: "hover:text-primary",
							children: "How it works"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/franchise",
							className: "hover:text-primary",
							children: "Franchise"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/contact",
							className: "hover:text-primary",
							children: "Contact Us"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/blogs",
							className: "hover:text-primary",
							children: "Blogs"
						}) })
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-[0.16em] text-muted",
					children: "Social"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-4 space-y-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://x.com",
							className: "hover:text-primary",
							target: "_blank",
							rel: "noreferrer",
							children: "Twitter / X"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://instagram.com",
							className: "hover:text-primary",
							target: "_blank",
							rel: "noreferrer",
							children: "Instagram"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://maps.google.com",
							className: "hover:text-primary",
							target: "_blank",
							rel: "noreferrer",
							children: "Google Business"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://linkedin.com",
							className: "hover:text-primary",
							target: "_blank",
							rel: "noreferrer",
							children: "LinkedIn"
						}) })
					]
				})] })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-12 flex max-w-6xl flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"© ",
				(/* @__PURE__ */ new Date()).getFullYear(),
				" PrintKarr · PrintKarr Technologies Private Limited"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/terms",
					className: "hover:text-ink",
					children: "Terms & Conditions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/privacy",
					className: "hover:text-ink",
					children: "Privacy Policy"
				})]
			})]
		})]
	});
}
function useParallax(speed) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let raf = 0;
		const update = () => {
			raf = 0;
			const rect = el.getBoundingClientRect();
			const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
			el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(update);
		};
		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, [speed]);
	return ref;
}
function Pill({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex items-center gap-2 rounded-full bg-pale px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/15",
		children
	});
}
function PrimaryLink({ to, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-transform duration-150 ease-out hover:bg-blue-bright active:scale-[0.96]",
		children: [
			children,
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })
		]
	});
}
function GhostLink({ to, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink ring-1 ring-line transition-transform duration-150 ease-out hover:ring-primary active:scale-[0.96]",
		children: [
			children,
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })
		]
	});
}
function FloatBadge({ className, speed, icon, label }) {
	const ref = useParallax(speed);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: cn("absolute z-10 hidden w-36 flex-col items-center gap-2 sm:flex", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-card",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-center text-xs font-semibold leading-snug text-ink",
			children: label
		})]
	});
}
function HomePage() {
	const grid = useParallax(.12);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "hero-stage",
			className: "relative h-[220vh]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 h-dvh overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: grid,
						className: "grid-veil pointer-events-none absolute inset-0 opacity-70"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-20 mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 text-center sm:pt-28",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), " India's First, Smartest, Fastest & Only"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "mt-5 font-display text-[2.05rem] font-semibold leading-[1.08] tracking-[-0.04em] text-ink sm:text-5xl md:text-6xl",
								children: [
									"Meet ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-primary",
										children: "PrintKarr"
									}),
									", Your Anytime, Anywhere Instant Printing Kiosk"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-7 flex flex-wrap items-center justify-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrimaryLink, {
									to: "/contact",
									children: "Contact Us"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostLink, {
									to: "/franchise",
									children: "Start a Franchise"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KioskStage, { className: "hero-fade absolute inset-0 top-28 h-[calc(100%-2rem)] w-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatBadge, {
						className: "left-[8%] top-[42%]",
						speed: -.08,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-6" }),
						label: "100% Secured Documents"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatBadge, {
						className: "right-[8%] top-[38%]",
						speed: -.12,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "size-6" }),
						label: "Print Under 60 Seconds"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatBadge, {
						className: "left-[12%] top-[62%]",
						speed: -.05,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-6" }),
						label: "24/7 Availability"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute bottom-6 right-6 z-20 hidden text-[10px] font-semibold tracking-[0.28em] text-muted sm:block",
						children: "SCROLL"
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowToSection, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeaturesSection, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompareSection, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndiaSection, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HostBanner, {})
	] });
}
function HowToSection() {
	const title = useParallax(-.04);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative px-4 py-24 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: title,
			className: "mx-auto max-w-6xl text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-3.5" }), " How to Use?"] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl",
					children: [
						"How to Print using a",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: "PrintKarr"
						}),
						" kiosk?"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: "Fast. Secure. Completely Contactless."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-4",
			children: STEPS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "overflow-hidden rounded-[28px] bg-primary p-4 text-primary-fg shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-[11px] font-semibold tracking-[0.22em]",
						children: step.n
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-2 text-center font-display text-lg font-semibold",
						children: step.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-center text-xs leading-relaxed text-primary-fg/80",
						children: step.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMock, { variant: step.variant })
					})
				]
			}, step.n))
		})]
	});
}
var STEPS = [
	{
		n: "STEP 1",
		title: "Scan the Kiosk QR",
		body: "Each PrintKarr vending machine has its own unique QR — scan it using your mobile camera.",
		variant: "qr"
	},
	{
		n: "STEP 2",
		title: "Upload Your Document",
		body: "Choose your file from phone, laptop, or Drive. No sign-up required.",
		variant: "upload"
	},
	{
		n: "STEP 3",
		title: "Set Print Preference",
		body: "Set copies, B&W or colour, duplex, and orientation before you pay.",
		variant: "settings"
	},
	{
		n: "STEP 4",
		title: "Get Your Print Instantly",
		body: "Enter the 4-digit OTP or scan the dynamic QR on the kiosk to collect your print.",
		variant: "ready"
	}
];
function PhoneMock({ variant }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative h-[280px] w-[148px] rounded-[28px] bg-navy p-2 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-full flex-col overflow-hidden rounded-[22px] bg-paper",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-3 py-2 text-[9px] font-semibold text-navy",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "PrintKarr" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "phone-screen relative mx-2 flex flex-1 flex-col items-center justify-center rounded-2xl p-3 text-primary-fg",
					children: [
						variant === "qr" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative size-24 rounded-lg bg-paper p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-full w-full grid-cols-5 grid-rows-5 gap-0.5",
								children: Array.from({ length: 25 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("rounded-[1px] bg-navy", [
									0,
									1,
									2,
									4,
									5,
									6,
									8,
									10,
									12,
									14,
									16,
									18,
									20,
									22,
									24
								].includes(i) ? "opacity-100" : "opacity-20") }, i))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -inset-2 rounded-xl border-2 border-paper/80" })]
						}) : null,
						variant === "upload" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-20 items-center justify-center rounded-full bg-paper",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "size-10 text-primary",
								strokeWidth: 2.6
							})
						}) : null,
						variant === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid w-full grid-cols-2 gap-2",
							children: [
								"B&W",
								"Colour",
								"Single",
								"Duplex"
							].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-xl bg-paper/15 px-2 py-3 text-center text-[10px] font-semibold",
								children: t
							}, t))
						}) : null,
						variant === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase tracking-widest text-primary-fg/70",
									children: "Print code"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-display text-3xl font-semibold",
									children: "4821"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mt-3 size-16 rounded-lg bg-paper" })
							]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-3 py-2 text-center text-[9px] font-medium text-muted",
					children: variant === "qr" ? "Scan QR" : variant === "upload" ? "File ready" : variant === "settings" ? "Preferences" : "Collect print"
				})
			]
		})
	});
}
function FeaturesSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "features",
		className: "px-4 py-20 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-3.5" }), " Features"] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl",
					children: [
						"So, Why PrintKarr is the best",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"way to print?"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: "Smarter Printing for a Busy World"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3",
			children: [
				{
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-5" }),
					title: "Your Documents Are Completely Safe",
					body: "Files are encrypted, never shared, and automatically deleted after printing. You’re the only one who can access them."
				},
				{
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "size-5" }),
					title: "Print in Under 60 Seconds",
					body: "From scanning the kiosk QR to collecting your print — the entire process is lightning-fast and seamless."
				},
				{
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-5" }),
					title: "Always Available — 24/7",
					body: "Print even when shops are shut — early mornings, late nights, weekends, and holidays."
				},
				{
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-5" }),
					title: "India’s Only Self-Service Print Solution",
					body: "No shop visits. No waiting in line. Print directly from your phone — anytime."
				},
				{
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-5" }),
					title: "100% Contactless & Hassle-Free",
					body: "No touching shared devices, no pen drives, no staff needed. Just scan, upload & print."
				},
				{
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" }),
					title: "Perfect for Students, Professionals & Travellers",
					body: "Need a last-minute assignment, ticket, or ID proof? PrintKarr has your back, wherever you are."
				}
			].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-[28px] bg-paper p-6 text-left shadow-[0_1px_0_rgb(12_28_51_/_0.04)] ring-1 ring-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-10 items-center justify-center rounded-2xl bg-pale text-primary",
						children: c.icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-4 font-display text-lg font-semibold",
						children: c.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: c.body
					})
				]
			}, c.title))
		})]
	});
}
function CompareSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "px-4 py-20 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), " Smarter vs Traditional"] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl",
					children: [
						"And, why ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: "PrintKarr"
						}),
						" stands out?"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: "Self-Service Printing vs. Traditional Print Shops"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-10 grid max-w-4xl overflow-hidden rounded-[32px] bg-paper ring-1 ring-line md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-lg font-semibold text-muted",
					children: "Traditional Print Shops"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-5 space-y-3 text-sm",
					children: [
						"Limited working hours",
						"Long queues and delayed service",
						"Files often visible to shop staff",
						"Shopkeepers often download to print",
						"Requires staff interaction"
					].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-3 text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 flex size-5 items-center justify-center rounded-full bg-danger/10 text-danger",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
						}), t]
					}, t))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-pale p-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-lg font-semibold text-primary",
					children: "PrintKarr"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-5 space-y-3 text-sm",
					children: [
						"24×7 access",
						"Instant prints under 60 seconds",
						"Private, encrypted & auto-deleted",
						"No one downloads your file",
						"No human interaction needed"
					].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-3 text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-fg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" })
						}), t]
					}, t))
				})]
			})]
		})]
	});
}
function IndiaMap() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 420 470",
		className: "h-auto w-full max-w-md",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "var(--color-pale)",
				d: "M210 18c22 2 48 14 62 32 14 16 36 22 52 40 18 20 28 46 22 74-4 20 8 40 16 62 10 28-2 54-16 74-8 12-4 32-14 50-12 24-36 44-62 58-18 10-32 36-54 42-22 6-38-10-46-32-6-16-14-28-28-34-16-6-28 8-44 16-18 10-40 2-50-18-10-18-22-40-38-52-22-18-48-28-54-52-6-22 12-38 8-60-4-20-22-30-18-52 4-22 28-28 34-50 6-20 24-36 46-42 24-8 44 8 62-2 16-8 28-24 48-28z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "var(--color-primary)",
				d: "M96 250c-22-8-42 6-54 22-8 12 4 28 22 32 16 4 30-8 38-22 6-10 8-26-6-32z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "var(--color-primary)",
				opacity: "0.85",
				d: "M150 210c28 8 40 38 34 64-6 24-32 40-56 34-22-6-32-34-24-56 8-20 26-50 46-42z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "var(--color-blue-bright)",
				d: "M200 300c22 10 28 42 16 64-12 22-40 34-58 20-16-12-14-42-4-60 10-16 28-32 46-24z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "var(--color-primary)",
				d: "M232 150c24 4 38 28 32 50-6 20-28 30-46 24-18-6-26-30-18-46 8-16 18-32 32-28z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "248",
				cy: "428",
				rx: "16",
				ry: "22",
				fill: "var(--color-pale)"
			})
		]
	});
}
function IndiaSection() {
	const map = useParallax(-.07);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "px-4 py-20 sm:px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }), " Where To Find Us"] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl",
					children: [
						"Across India,",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: "Growing Every Day"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-md text-sm leading-relaxed text-muted",
					children: "PrintKarr is expanding across cities and states, bringing self-service instant printing closer to where people need it most."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-3 sm:grid-cols-3",
					children: [
						{
							n: "64+",
							l: "Active Kiosks",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4" })
						},
						{
							n: "22+",
							l: "Cities",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4" })
						},
						{
							n: "11+",
							l: "States",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, { className: "size-4" })
						}
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl bg-pale p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-8 items-center justify-center rounded-full bg-paper text-primary",
								children: s.icon
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 font-display text-2xl font-semibold tabular-nums",
								children: s.n
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: s.l
							})
						]
					}, s.l))
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: map,
				className: "flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndiaMap, {})
			})]
		})
	});
}
function HostBanner() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "px-4 pb-20 sm:px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[32px] bg-navy text-paper md:flex-row md:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "z-10 flex-1 p-8 md:p-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl",
						children: "Want to offer 24/7 printing to students, employees, or visitors?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-lg text-sm leading-relaxed text-paper/70",
						children: "You can host your own PrintKarr machine in your college, hostel, co-working space or public area."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/contact",
						className: "mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-transform duration-150 active:scale-[0.96]",
						children: ["Request Installation ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-64 w-full md:h-72 md:w-[42%]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/images/host-cta.jpg",
					alt: "Student smiling while requesting a print from her phone",
					className: "h-full w-full object-cover object-[50%_20%]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy to-transparent" })]
			})]
		})
	});
}
function HowItWorksPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pb-20 pt-28 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-3xl text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: "How it works" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl",
						children: "Four taps. One print. Sixty seconds."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-muted",
						children: "PrintKarr never asks you to stand at a counter, share a pen drive, or wait for a shop to open. The kiosk is the shop."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowToSection, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid max-w-5xl gap-4 md:grid-cols-3",
				children: [
					{
						t: "No app required",
						d: "The kiosk QR opens a lightweight web flow. Camera in, document out."
					},
					{
						t: "Pay on the phone",
						d: "UPI and cards, encrypted end to end. The kiosk never stores a payment method."
					},
					{
						t: "Collect with OTP",
						d: "A rotating 4-digit code or on-screen QR releases the job. Nobody else can."
					}
				].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-[28px] bg-paper p-6 ring-1 ring-line",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold",
						children: x.t
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: x.d
					})]
				}, x.t))
			})
		]
	}) });
}
function AboutPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-4 pb-24 pt-28 sm:px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: "About PrintKarr" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
					className: "mt-6 font-display text-2xl font-medium leading-snug tracking-[-0.03em] sm:text-4xl",
					children: "“If groceries can reach us in minutes, why is printing still stuck behind a shutter at 9 pm? PrintKarr is our answer to that question.”"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm font-semibold text-primary",
					children: "— Karan Shah, Founder"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 space-y-5 text-base leading-relaxed text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "PrintKarr is India’s self-service printing kiosk, built to make document printing instant, private, and available any hour of the day." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The idea came from a problem we lived: rushing to print assignments, tickets, and affidavits only to find the shop closed, overcrowded, or asking for a USB we didn’t carry. Waiting in a queue for something this simple never made sense." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "With encrypted file handling, auto-delete after print, and a machine that never takes a lunch break, PrintKarr is how document printing should work in a digital-first India." })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-[28px] bg-pale p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Mission"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: "Fully automated, staff-free printing operations in every campus, transit hub, and workplace that still depends on a xerox counter."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-[28px] bg-navy p-6 text-paper",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Vision"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-paper/70",
							children: "Build India’s largest network of smart printing kiosks — the default place you go when a document needs to exist on paper, now."
						})]
					})]
				})
			]
		})
	}) });
}
function FranchisePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pb-24 pt-28 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-3xl text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: "Franchise & Partnerships" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl",
						children: "Own the kiosk. We run the platform."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-muted",
						children: "Partnership models for entrepreneurs and space owners — passive or active income through automated instant printing, backed by a fully managed stack."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3",
				children: [
					{
						t: "Franchise-Owned",
						d: "You own the kiosk. PrintKarr runs the platform.",
						you: [
							"No staff required",
							"Provide space, power, internet",
							"Refill paper & consumables"
						],
						us: [
							"Orders & payments",
							"Support & maintenance",
							"Software, backend, monitoring"
						],
						who: "Entrepreneurs, retailers, investors"
					},
					{
						t: "Space Partner",
						d: "You provide the square footage. We handle the rest.",
						you: [
							"Space, power, internet",
							"Keep the area accessible",
							"That’s it"
						],
						us: [
							"Hardware deployment",
							"Orders & payments",
							"Support & monitoring"
						],
						who: "Colleges, malls, offices, hostels, transit"
					},
					{
						t: "Custom Partnership",
						d: "White-label, multi-kiosk, or campus-wide integrations.",
						you: [
							"Location network",
							"Brand or workflow needs",
							"A named operator"
						],
						us: [
							"Custom hardware mix",
							"Dedicated workflows",
							"SLA & reporting"
						],
						who: "Universities, enterprises, government"
					}
				].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "flex flex-col rounded-[28px] bg-paper p-6 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: m.t
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: m.d
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-xs font-semibold uppercase tracking-wider text-primary",
							children: "Your role"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-1 text-sm",
							children: m.you.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", x] }, x))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-xs font-semibold uppercase tracking-wider text-primary",
							children: "Our role"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-1 text-sm",
							children: m.us.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", x] }, x))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-auto pt-5 text-xs text-muted",
							children: ["Best for: ", m.who]
						})
					]
				}, m.t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-16 grid max-w-4xl gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-[28px] bg-navy p-8 text-paper",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-wider text-blue-bright",
							children: "PrintKarr PRO"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 font-display text-3xl font-semibold",
							children: "₹2.89 L + GST"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-paper/70",
							children: "Designed for high-footfall locations."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-5 space-y-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Faster print speeds" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 1,950-sheet paper capacity" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Heavy-duty printing module" })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-[28px] bg-paper p-8 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-wider text-primary",
							children: "PrintKarr MINI"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 font-display text-3xl font-semibold",
							children: "₹1.35 L + GST"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Ideal for low and medium-footfall sites."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-5 space-y-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Moderate print speeds" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 650-sheet paper capacity" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Reliable printing module" })
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-4",
				children: [
					[
						"01",
						"Submit application",
						"Share details and a preferred location."
					],
					[
						"02",
						"Site review",
						"We check footfall, power, and network."
					],
					[
						"03",
						"Paperwork",
						"Agreement, payment, and install window."
					],
					[
						"04",
						"Launch in 10 days",
						"Kiosk live. You start earning."
					]
				].map(([n, t, d]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-[28px] bg-pale p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl font-semibold text-primary",
							children: n
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 font-display font-semibold",
							children: t
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: d
						})
					]
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-16 max-w-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-center font-display text-3xl font-semibold",
					children: "Apply to partner"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadForm, { intent: "franchise" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-16 max-w-3xl space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-6 text-center font-display text-3xl font-semibold",
					children: "Frequently asked"
				}), [
					["What is PrintKarr?", "A printing platform that connects customers, kiosks, and print shops in one digital ecosystem — automate orders, skip queues, and keep files private."],
					["Who can become a partner?", "Xerox shop owners, entrepreneurs, campus administrators, and anyone with high-footfall space and a power socket."],
					["Do you provide support after launch?", "Yes. Hardware warranty, remote monitoring, software updates, and a support desk for refunds and escalations."],
					["What does a kiosk cost to run?", "A 4 sq ft footprint, modest electricity and internet, paper and ink that scale with volume, and a 10% platform commission on gross prints."]
				].map(([q, a]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "rounded-3xl bg-paper p-5 ring-1 ring-line",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer font-display font-semibold",
						children: q
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: a
					})]
				}, q))]
			})
		]
	}) });
}
function XeroxPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pb-24 pt-28 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-3xl text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: "Xerox shops" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl",
						children: "The modern way of running a Xerox shop"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-muted",
						children: "Customers pick you, upload, and pay online. You unlock the job with an OTP — no file sitting on your desktop, no settings to guess."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3",
				children: [
					{
						t: "Track orders & earnings",
						d: "See prints, popular jobs, and payouts in one dashboard."
					},
					{
						t: "Zero rework",
						d: "Colour, pages, and copies are set by the customer before they pay."
					},
					{
						t: "Any printer",
						d: "Every brand you already own is supported. We sit on top, not instead."
					}
				].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-[28px] bg-paper p-6 ring-1 ring-line",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: c.t
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: c.d
					})]
				}, c.t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mx-auto mt-12 max-w-3xl space-y-4",
				children: [
					"Customer selects your shop on PrintKarr",
					"They upload a document and choose print settings",
					"They pay online and receive an OTP",
					"You enter the OTP — no file download required",
					"Click print and hand over the pages"
				].map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-4 rounded-3xl bg-pale p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-xl font-semibold text-primary",
						children: ["0", i + 1]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pt-1 text-sm font-medium",
						children: t
					})]
				}, t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrimaryLink, {
					to: "/contact",
					children: "Onboard your shop"
				})
			})
		]
	}) });
}
function ContactPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-4 pb-24 pt-28 sm:px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: "Contact" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-display text-4xl font-semibold tracking-[-0.04em]",
					children: "Let’s put a kiosk where the queues are."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-8 space-y-4 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "mt-0.5 size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: PHONE
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: "Please dial with the leading 0"
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "mt-0.5 size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "font-semibold hover:text-primary",
								href: `mailto:${EMAIL}`,
								children: EMAIL
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "mt-0.5 size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								"PrintKarr Technologies Private Limited",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								ADDRESS
							] })]
						})
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadForm, { intent: "contact" })]
		})
	}) });
}
function LeadForm({ intent }) {
	const [sent, setSent] = (0, import_react.useState)(false);
	const onSubmit = (e) => {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(e.currentTarget).entries());
		const key = "printkarr-leads";
		let prev = [];
		try {
			prev = JSON.parse(localStorage.getItem(key) || "[]");
			if (!Array.isArray(prev)) prev = [];
		} catch {
			prev = [];
		}
		localStorage.setItem(key, JSON.stringify([{
			intent,
			at: Date.now(),
			...data
		}, ...prev].slice(0, 50)));
		setSent(true);
		toast.success("Received. We’ll reply within one business day.");
		e.currentTarget.reset();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "rounded-[32px] bg-paper p-6 ring-1 ring-line sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm font-medium",
				children: ["How would you like to partner?", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "model",
					required: true,
					className: "mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary",
					defaultValue: "",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							disabled: true,
							children: "Choose one"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Own a PrintKarr kiosk" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Have a location to host" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Need a custom solution" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Onboard my Xerox shop" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Just saying hello" })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm font-medium",
					children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						name: "name",
						required: true,
						className: "mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm font-medium",
					children: ["Phone", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						name: "phone",
						required: true,
						inputMode: "tel",
						className: "mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block text-sm font-medium",
				children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "email",
					type: "email",
					required: true,
					className: "mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block text-sm font-medium",
				children: ["City / campus", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "city",
					className: "mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block text-sm font-medium",
				children: ["Message", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					name: "message",
					rows: 4,
					className: "mt-2 w-full resize-none rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "submit",
				className: "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-transform duration-150 active:scale-[0.96]",
				children: [
					sent ? "Sent — send another" : "Submit",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })
				]
			})
		]
	});
}
var POSTS = [
	{
		slug: "running-a-printkarr-kiosk",
		title: "What it actually costs to run a PrintKarr kiosk every month",
		excerpt: "Four square feet, a socket, and a predictable stack of paper. The rest scales with prints.",
		body: [
			"A PrintKarr kiosk needs just four square feet. College corridors, university lobbies, government office entrances, libraries, and commercial buildings are all fair game.",
			"Because the service is useful to students and staff, many institutions trial a unit rent-free. After that, space typically lands between ₹1,500 and ₹2,000 a month.",
			"Electricity for 24/7 operation is usually under ₹750. Internet under ₹600. Paper and ink move with volume; ink is supplied through PrintKarr so the per-print cost stays honest. Miscellaneous: ₹500–₹800. Platform commission is 10% of gross monthly revenue — only when the machine is earning."
		]
	},
	{
		slug: "replacing-xerox-queues",
		title: "Why self-service printing is replacing the xerox queue",
		excerpt: "The shop didn’t vanish. The waiting did.",
		body: [
			"Traditional counters still matter for spiral binding and passport photos. They fail at the thing people need at 11.40 pm: a PDF, on paper, now.",
			"PrintKarr splits that job away from the shop. Encrypted upload, prepaid settings, OTP collect. The file is never a USB, never a WhatsApp, never a desktop folder.",
			"Shops that partner with us keep the complex jobs and inherit a digital queue for the simple ones. Both sides print more."
		]
	},
	{
		slug: "colleges-24-7-print",
		title: "How campuses are installing 24/7 print without hiring a night shift",
		excerpt: "Hostels don’t close. Assignments don’t wait. The xerox shop does.",
		body: [
			"Every dean we meet has the same story: a line out the door at 8.50 am, and a locked shutter when the project is due at midnight.",
			"A hosted PrintKarr machine sits in a corridor with CCTV and a power drop. Students scan, pay, collect. No attendant, no argument about colour vs B&W — they chose before they paid.",
			"Administrators like the audit trail. Students like that it works on Sunday. That’s the whole product."
		]
	}
];
function BlogsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pb-24 pt-28 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: "Journal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-4xl font-semibold",
				children: "Notes from the print floor"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3",
			children: POSTS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/blogs/$slug",
				params: { slug: p.slug },
				className: "rounded-[28px] bg-paper p-6 ring-1 ring-line transition-transform duration-150 hover:-translate-y-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: p.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: p.excerpt
				})]
			}, p.slug))
		})]
	}) });
}
function BlogArticlePage({ slug }) {
	const post = (0, import_react.useMemo)(() => POSTS.find((p) => p.slug === slug), [slug]);
	if (!post) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-32 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-semibold",
			children: "Story not found"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/blogs",
			className: "mt-4 inline-block text-primary",
			children: "Back to blogs"
		})]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/blogs",
				className: "text-sm font-semibold text-primary",
				children: "← Journal"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-4xl font-semibold tracking-[-0.03em]",
				children: post.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: post.excerpt
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 space-y-4 text-base leading-relaxed text-ink",
				children: post.body.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p }, p))
			})
		]
	}) });
}
function TermsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto max-w-2xl px-4 pb-24 pt-28 text-sm leading-relaxed text-muted sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-semibold text-ink",
				children: "Terms & Conditions"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6",
				children: "PrintKarr kiosks and the companion web flow are provided by PrintKarr Technologies Private Limited. By scanning a kiosk QR, uploading a document, or applying as a partner, you agree to these terms."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl font-semibold text-ink",
				children: "Print jobs"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2",
				children: "You confirm you have the right to print the file you upload. We do not inspect document contents. Jobs are encrypted in transit, processed to complete the print, and deleted afterwards. Uncollected jobs expire."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl font-semibold text-ink",
				children: "Payments & refunds"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2",
				children: "Print fees are prepaid. Hardware misfires are refunded to the original method after a kiosk health check. Change of mind after a successful print is not refundable."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl font-semibold text-ink",
				children: "Partners"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2",
				children: "Franchise hardware remains subject to the partnership agreement. Platform commission, SLA, and consumable supply are defined there, not on this page."
			})
		]
	}) });
}
function PrivacyPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto max-w-2xl px-4 pb-24 pt-28 text-sm leading-relaxed text-muted sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-semibold text-ink",
				children: "Privacy Policy"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6",
				children: "We collect the minimum needed to print a document or reply to a partnership enquiry: file bytes for the life of the job, a phone or email if you submit a form, and payment tokens handled by our processor."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl font-semibold text-ink",
				children: "Documents"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2",
				children: "Uploaded files are encrypted, never written to partner shop desktops, and deleted after print or expiry. Kiosk screens do not preview your pages to bystanders."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl font-semibold text-ink",
				children: "Forms"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2",
				children: [
					"Contact and franchise forms on this demo site are stored in your browser only (localStorage) so you can try the flow. A production deployment would send them to",
					` ${EMAIL}`,
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl font-semibold text-ink",
				children: "Contact"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2",
				children: [
					"Privacy questions: ",
					EMAIL,
					". Postal: ",
					ADDRESS,
					"."
				]
			})
		]
	}) });
}
function HomeRoute() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomePage, {}) });
}
//#endregion
export { FranchisePage as a, PrivacyPage as c, ContactPage as i, TermsPage as l, BlogArticlePage as n, HomeRoute as o, BlogsPage as r, HowItWorksPage as s, AboutPage as t, XeroxPage as u };
