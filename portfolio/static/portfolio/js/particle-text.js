const canvas = document.getElementById("particleCanvas");

if (canvas) {

    const container = canvas.parentElement;

    const ctx = canvas.getContext("2d");

    let particles = [];

    let width = 0;
    let height = 0;

    let dpr = window.devicePixelRatio || 1;

    let animationFrame;

    let gathering = true;

    let gatherStart = performance.now();

    const TEXT = "AKILESH K";

    const PARTICLE_SIZE = 2;

    const DENSITY = 4;

    const COLOR = "#ffffff";

    const HIGHLIGHT_COLOR = "#00e5ff";

    const SCATTER = 180;

    const GATHER_DURATION = 1600;

    const STAGGER = 420;

    const POINTER_REPEL = 40;

    const REPEL_RADIUS = 120;

    const IDLE_DRIFT = 0.7;


    /* ================= COLORS ================= */

    function hexToRgb(hex) {

        const clean = hex
            .replace("#", "")
            .trim();

        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16)
        };
    }


    function mixColor(color1, color2, amount) {

        return {
            r: Math.round(
                color1.r +
                (color2.r - color1.r) *
                amount
            ),

            g: Math.round(
                color1.g +
                (color2.g - color1.g) *
                amount
            ),

            b: Math.round(
                color1.b +
                (color2.b - color1.b) *
                amount
            )
        };
    }


    function rgbToString(rgb) {

        return `rgb(
            ${rgb.r},
            ${rgb.g},
            ${rgb.b}
        )`;
    }


    const baseColor = hexToRgb(COLOR);

    const highlightColor =
        hexToRgb(HIGHLIGHT_COLOR);


    /* ================= POINTER ================= */

    const pointer = {

        active: false,

        x: 0,

        y: 0,

        smoothX: 0,

        smoothY: 0

    };


    /* ================= EASING ================= */

    function easeOutCubic(t) {

        return 1 - Math.pow(1 - t, 3);

    }


    /* ================= CANVAS SIZE ================= */

    function resizeCanvas() {

        const rect =
            container.getBoundingClientRect();

        width = Math.floor(rect.width);

        height = Math.floor(rect.height);

        dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        canvas.width =
            width * dpr;

        canvas.height =
            height * dpr;

        canvas.style.width = "100%";

        canvas.style.height = "100%";

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        createParticles();

    }


    /* ================= CREATE TEXT ================= */

    function createParticles() {

        if (width <= 0 || height <= 0) {
            return;
        }

        const offscreen =
            document.createElement("canvas");

        const offCtx =
            offscreen.getContext("2d");

        let fontSize =
            Math.min(
                width * 0.13,
                130
            );

        fontSize =
            Math.max(
                fontSize,
                45
            );

        const font =
            `800 ${fontSize}px Arial`;

        offCtx.font = font;

        const metrics =
            offCtx.measureText(TEXT);

        const textWidth =
            metrics.width;

        const textHeight =
            fontSize * 1.1;

        const padding = 30;

        offscreen.width =
            textWidth + padding * 2;

        offscreen.height =
            textHeight + padding * 2;

        offCtx.clearRect(
            0,
            0,
            offscreen.width,
            offscreen.height
        );

        offCtx.font = font;

        offCtx.textAlign = "left";

        offCtx.textBaseline = "middle";

        offCtx.fillStyle = "#ffffff";

        offCtx.fillText(
            TEXT,
            padding,
            offscreen.height / 2
        );


        const imageData =
            offCtx.getImageData(
                0,
                0,
                offscreen.width,
                offscreen.height
            );


        const targets = [];


        for (
            let y = 0;
            y < offscreen.height;
            y += DENSITY
        ) {

            for (
                let x = 0;
                x < offscreen.width;
                x += DENSITY
            ) {

                const index =
                    (
                        y *
                        offscreen.width +
                        x
                    ) * 4 + 3;

                const alpha =
                    imageData.data[index];


                if (alpha > 50) {

                    targets.push({

                        x:
                            width / 2 -
                            offscreen.width / 2 +
                            x,

                        y:
                            height / 2 -
                            offscreen.height / 2 +
                            y,

                        alpha:
                            alpha / 255

                    });

                }

            }

        }


        const maxParticles = Math.min(
            5000,
            Math.max(
                800,
                Math.floor(
                    width * height / 90
                )
            )
        );


        const stride =
            Math.max(
                1,
                Math.ceil(
                    targets.length /
                    maxParticles
                )
            );


        const selected =
            targets.filter(
                (_, index) =>
                    index % stride === 0
            );


        particles =
            selected.map(
                (target, index) => {

                    const seed =
                        (
                            index *
                            9301 +
                            49297
                        ) % 233280 /
                        233280;


                    const depth =
                        0.45 +
                        (
                            (
                                index *
                                233 +
                                97
                            ) % 1000
                        ) / 1000 *
                        0.9;


                    const angle =
                        seed *
                        Math.PI *
                        2;


                    const distance =
                        SCATTER *
                        (
                            0.35 +
                            depth *
                            0.75
                        );


                    const startX =
                        target.x +
                        Math.cos(angle) *
                        distance;


                    const startY =
                        target.y +
                        Math.sin(angle) *
                        distance;


                    const blend =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                target.x /
                                width +
                                (
                                    seed -
                                    0.5
                                ) *
                                0.35
                            )
                        );


                    const particleColor =
                        rgbToString(
                            mixColor(
                                baseColor,
                                highlightColor,
                                blend
                            )
                        );


                    return {

                        x: startX,

                        y: startY,

                        startX: startX,

                        startY: startY,

                        targetX: target.x,

                        targetY: target.y,

                        size:
                            Math.max(
                                0.7,
                                PARTICLE_SIZE *
                                (
                                    0.75 +
                                    target.alpha *
                                    0.45
                                )
                            ),

                        color:
                            particleColor,

                        seed:

                            seed,

                        depth:

                            depth,

                        delay:

                            seed *
                            STAGGER

                    };

                }
            );


        gatherStart =
            performance.now();

        gathering = true;

    }


    /* ================= DRAW PARTICLE ================= */

    function drawParticle(particle) {

        ctx.fillStyle =
            particle.color;

        const size =
            particle.size;


        if (size <= 2.1) {

            ctx.fillRect(
                particle.x - size / 2,
                particle.y - size / 2,
                size,
                size
            );

            return;
        }


        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            size / 2,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    /* ================= RENDER ================= */

    function render(now) {

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        ctx.shadowBlur =
            PARTICLE_SIZE * 3;

        ctx.shadowColor =
            HIGHLIGHT_COLOR;


        pointer.smoothX +=
            (
                pointer.x -
                pointer.smoothX
            ) * 0.18;


        pointer.smoothY +=
            (
                pointer.y -
                pointer.smoothY
            ) * 0.18;


        let complete = true;


        particles.forEach(
            particle => {

                let baseX =
                    particle.targetX;

                let baseY =
                    particle.targetY;


                let progress = 1;


                if (gathering) {

                    const local =
                        (
                            now -
                            gatherStart -
                            particle.delay
                        ) /
                        GATHER_DURATION;


                    progress =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                local
                            )
                        );


                    const eased =
                        easeOutCubic(
                            progress
                        );


                    baseX =
                        particle.startX +
                        (
                            particle.targetX -
                            particle.startX
                        ) *
                        eased;


                    baseY =
                        particle.startY +
                        (
                            particle.targetY -
                            particle.startY
                        ) *
                        eased;


                    if (progress < 1) {

                        complete = false;

                    }

                }

                else {

                    const time =
                        now * 0.001;


                    baseX +=
                        Math.sin(
                            time * 0.9 +
                            particle.seed * 10
                        ) *
                        IDLE_DRIFT *
                        particle.depth;


                    baseY +=
                        Math.cos(
                            time * 0.75 +
                            particle.depth * 10
                        ) *
                        IDLE_DRIFT *
                        particle.depth;

                }


                /* POINTER REPULSION */

                if (
                    pointer.active
                ) {

                    const dx =
                        baseX -
                        pointer.smoothX;

                    const dy =
                        baseY -
                        pointer.smoothY;


                    const distance =
                        Math.hypot(
                            dx,
                            dy
                        );


                    if (
                        distance > 0 &&
                        distance <
                        REPEL_RADIUS
                    ) {

                        const force =
                            Math.pow(
                                1 -
                                distance /
                                REPEL_RADIUS,
                                2
                            ) *
                            POINTER_REPEL;


                        baseX +=
                            (
                                dx /
                                distance
                            ) *
                            force;


                        baseY +=
                            (
                                dy /
                                distance
                            ) *
                            force;

                    }

                }


                const follow = 0.22;


                particle.x +=
                    (
                        baseX -
                        particle.x
                    ) *
                    follow;


                particle.y +=
                    (
                        baseY -
                        particle.y
                    ) *
                    follow;


                ctx.globalAlpha =
                    Math.max(
                        0.35,
                        progress
                    );


                drawParticle(
                    particle
                );

            }
        );


        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;


        if (
            gathering &&
            complete
        ) {

            gathering = false;

        }


        animationFrame =
            requestAnimationFrame(
                render
            );

    }


    /* ================= POINTER EVENTS ================= */

    canvas.addEventListener(
        "pointerenter",
        event => {

            const rect =
                canvas.getBoundingClientRect();

            pointer.x =
                event.clientX -
                rect.left;

            pointer.y =
                event.clientY -
                rect.top;

            pointer.active = true;

        }
    );


    canvas.addEventListener(
        "pointermove",
        event => {

            const rect =
                canvas.getBoundingClientRect();

            pointer.x =
                event.clientX -
                rect.left;

            pointer.y =
                event.clientY -
                rect.top;

            pointer.active = true;

        }
    );


    canvas.addEventListener(
        "pointerleave",
        () => {

            pointer.active = false;

        }
    );


    /* ================= CLICK ================= */

    canvas.addEventListener(
        "click",
        () => {

            createParticles();

        }
    );


    /* ================= RESIZE ================= */

    window.addEventListener(
        "resize",
        () => {

            resizeCanvas();

        }
    );


    /* ================= START ================= */

    resizeCanvas();

    animationFrame =
        requestAnimationFrame(
            render
        );

}