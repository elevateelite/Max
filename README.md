<style>
    body {
        /* Background image replaced with the WhatsApp sky background from Image 2 */
        background: linear-gradient(rgba(9, 19, 25, 0.45), rgba(9, 19, 25, 0.45)), 
                    url('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1000&auto=format&fit=crop') no-repeat center center fixed;
        background-size: cover;
        color: #ffffff;
        font-family: 'Plus Jakarta Sans', sans-serif;
        height: 100dvh;
        width: 100vw;
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
    }

    /* Glassmorphism Refinements tuned for image background visibility */
    .glass {
        background: rgba(13, 22, 31, 0.72);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }

    .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .glass-card:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(34, 211, 238, 0.4);
    }

    .message-bubble { 
        animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        transition: all 0.2s ease;
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .highlight-msg {
        animation: highlightPulse 2s ease-in-out;
    }

    @keyframes highlightPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
        50% { box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.6); }
    }

    /* Christmas / Tipster message customization with translucent backdrop */
    .christmas-message {
        position: relative;
        isolation: isolate;
        overflow: visible;
    }

    .christmas-message::before {
        content: "";
        position: absolute;
        inset: -2px;
        border-radius: 18px;
        background: conic-gradient(from 0deg, #22d3ee, #a855f7, #f43f5e, #f59e0b, #22c55e, #22d3ee);
        z-index: -2;
        opacity: .95;
    }

    .christmas-message::after {
        content: "✦";
        position: absolute;
        right: -7px;
        top: -10px;
        color: #facc15;
        font-size: 13px;
        text-shadow: 0 0 8px rgba(250,204,21,.8);
        animation: christmasTwinkle 1.8s ease-in-out infinite;
        pointer-events: none;
        z-index: 5;
    }

    .christmas-bubble {
        position: relative;
        border: 0 !important;
        background-clip: padding-box !important;
        box-shadow: 0 8px 28px rgba(0,0,0,.45), 0 0 18px rgba(34,211,238,.12);
    }

    .christmas-bubble::before {
        content: "";
        position: absolute;
        inset: 0;
        padding: 1.5px;
        border-radius: inherit;
        background: linear-gradient(135deg, #22d3ee, #a855f7 30%, #f43f5e 55%, #f59e0b 76%, #22c55e);
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        animation: christmasEdge 5s ease-in-out infinite alternate;
    }

    .christmas-bubble::after {
        content: "";
        position: absolute;
        left: 10%;
        right: 10%;
        bottom: -3px;
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, #22d3ee, #f43f5e, #facc15, #22c55e, transparent);
        filter: blur(1px);
        opacity: .9;
        pointer-events: none;
        animation: christmasGlow 3s ease-in-out infinite;
    }

    .christmas-text {
        background: linear-gradient(90deg, #f8fafc, #67e8f9, #f0abfc, #fde68a, #86efac, #f8fafc);
        background-size: 250% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: christmasText 7s linear infinite;
        text-shadow: 0 0 10px rgba(0,0,0,.5);
    }

    .christmas-self-text {
        background: linear-gradient(90deg, #ffffff, #bae6fd, #fef3c7, #dcfce7, #ffffff);
        background-size: 220% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: christmasText 6s linear infinite;
    }

    @keyframes christmasEdge {
        0% { filter: hue-rotate(0deg); opacity: .72; }
        100% { filter: hue-rotate(45deg); opacity: 1; }
    }

    @keyframes christmasGlow {
        0%, 100% { transform: scaleX(.82); opacity: .45; }
        50% { transform: scaleX(1); opacity: 1; }
    }

    @keyframes christmasText {
        from { background-position: 0% 50%; }
        to { background-position: 250% 50%; }
    }

    @keyframes christmasTwinkle {
        0%, 100% { transform: scale(.7) rotate(0deg); opacity: .35; }
        50% { transform: scale(1.25) rotate(18deg); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
        .christmas-message::before, .christmas-message::after,
        .christmas-bubble::before, .christmas-bubble::after,
        .christmas-text, .christmas-self-text { animation: none; }
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.6); }
</style>
