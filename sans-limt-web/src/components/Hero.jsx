import React from 'react';

export const Hero = () => {
    return (
        <section style={heroStyles.heroSection}>
            <div style={heroStyles.heroOverlay}>
                <h2 style={heroStyles.heroText}>DRESS LIKE YOU’RE LIMITLESS</h2>
            </div>
        </section>
    );
};

const heroStyles = {
    heroSection: {
        width: '100%',
        height: '65vh',
        backgroundImage: "url('/images/hero-city.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
    },
    heroOverlay: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroText: {
        color: '#ffffff',
        fontSize: '2.8rem',
        fontWeight: '300',
        letterSpacing: '0.35em',
        textAlign: 'center',
        padding: '0 20px',
        textShadow: '2px 2px 15px rgba(0,0,0,0.6)',
    },
};