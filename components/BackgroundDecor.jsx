// components/BackgroundDecor.jsx
import React from 'react';

function Cloud({ left, right, top, scale = 1, opacity = 0.7, delay = '0s' }) {
  const s = (n) => n * scale;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: left !== undefined ? (typeof left === 'number' ? `${left}px` : left) : undefined,
        right: right !== undefined ? (typeof right === 'number' ? `${right}px` : right) : undefined,
        opacity,
        width: `${s(120)}px`,
        height: `${s(60)}px`,
        animation: `floatCloud 6s ease-in-out infinite alternate`,
        animationDelay: delay,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div style={{ position: 'absolute', backgroundColor: 'white', borderRadius: '999px', width: `${s(50)}px`, height: `${s(40)}px`, left: `${s(10)}px`, top: `${s(20)}px` }} />
      <div style={{ position: 'absolute', backgroundColor: 'white', borderRadius: '999px', width: `${s(60)}px`, height: `${s(50)}px`, left: `${s(35)}px`, top: `${s(8)}px`  }} />
      <div style={{ position: 'absolute', backgroundColor: 'white', borderRadius: '999px', width: `${s(54)}px`, height: `${s(42)}px`, left: `${s(70)}px`, top: `${s(18)}px` }} />
      <div style={{ position: 'absolute', backgroundColor: 'white', borderRadius: '999px', width: `${s(80)}px`, height: `${s(28)}px`, left: `${s(20)}px`, top: `${s(28)}px` }} />
    </div>
  );
}

export default function BackgroundDecor() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* CSS float cloud animation */}
      <style>{`
        @keyframes floatCloud {
          from { transform: translateY(0px) translateX(0px); }
          to { transform: translateY(-8px) translateX(4px); }
        }
        @keyframes floatSparkle {
          0% { transform: translateY(0px) scale(1); opacity: 0.6; }
          50% { transform: translateY(-5px) scale(1.1); opacity: 0.9; }
          100% { transform: translateY(0px) scale(1); opacity: 0.6; }
        }
      `}</style>
      
      <Cloud top={40}  left={-30} scale={1.0} opacity={0.75} delay="0s" />
      <Cloud top={130} right={-20} scale={0.85} opacity={0.65} delay="1.5s" />
      <Cloud top={320} left="55%" scale={0.7} opacity={0.55} delay="0.5s" />
      <Cloud top={520} left={-20} scale={0.95} opacity={0.6} delay="2s" />
      <Cloud top={720} right={-30} scale={1.05} opacity={0.7} delay="1s" />

      <div style={{ position: 'absolute', top: '70px', left: '20%', fontSize: '22px', animation: 'floatSparkle 3s ease-in-out infinite' }}>✨</div>
      <div style={{ position: 'absolute', top: '250px', right: '24px', fontSize: '20px', animation: 'floatSparkle 4s ease-in-out infinite', animationDelay: '0.5s' }}>⭐</div>
      <div style={{ position: 'absolute', top: '420px', left: '18px', fontSize: '18px', animation: 'floatSparkle 3.5s ease-in-out infinite', animationDelay: '1s' }}>🌸</div>
      <div style={{ position: 'absolute', top: '580px', right: '30px', fontSize: '20px', animation: 'floatSparkle 4.5s ease-in-out infinite', animationDelay: '0.2s' }}>🌷</div>
      <div style={{ position: 'absolute', top: '800px', left: '25%', fontSize: '18px', animation: 'floatSparkle 3s ease-in-out infinite', animationDelay: '1.5s' }}>✨</div>
    </div>
  );
}
