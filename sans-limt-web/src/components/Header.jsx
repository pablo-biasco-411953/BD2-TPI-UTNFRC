import React, { useState } from 'react';

export const Header = ({ usuario, isAdmin, setShowLogin, setShowLoginScreen, handleLogout, cartCount = 0, setShowCart, onFilterChange }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    const handleNavClick = (e, category) => {
        e.preventDefault();

        // 🔥 Apagamos el login si hacemos clic para movernos a otra pestaña
        if (setShowLoginScreen) {
            setShowLoginScreen(false);
        }

        if (onFilterChange) {
            onFilterChange(category);
        }
    };

    return (
        <>
            <div style={styles.announcementWrapper}>
                <div style={styles.marquee}>
                    <span>3 Y 6 CUOTAS SIN INTERÉS CON TODOS LOS BANCOS — ENVÍOS A TODO EL PAÍS — 10% OFF PAGANDO CON TRANSFERENCIA — </span>
                    <span>3 Y 6 CUOTAS SIN INTERÉS CON TODOS LOS BANCOS — ENVÍOS A TODO EL PAÍS — 10% OFF PAGANDO CON TRANSFERENCIA — </span>
                </div>
            </div>

            <header style={styles.header}>
                <div style={styles.logoContainer}>
                    <img
                        src="/sanslimit_logo.png"
                        alt="Sans Limit"
                        style={styles.logo}
                        onClick={(e) => handleNavClick(e, 'ALL')}
                        onError={(e) => console.error("Logo no encontrado")}
                    />
                </div>

                <nav style={styles.nav}>
                    <a href="#" style={styles.navLink} onClick={(e) => handleNavClick(e, 'NEW')}>NEW IN</a>

                    <div
                        style={styles.navItemContainer}
                        onMouseEnter={() => setShowDropdown(true)}
                        onMouseLeave={() => setShowDropdown(false)}
                    >
                        <a href="#" style={styles.navLink} onClick={(e) => handleNavClick(e, 'ALL')}>PRODUCTOS</a>
                        <div style={{
                            ...styles.dropdown,
                            opacity: showDropdown ? 1 : 0,
                            visibility: showDropdown ? 'visible' : 'hidden',
                            transform: showDropdown ? 'translateY(0)' : 'translateY(10px)'
                        }}>
                            <a href="#" style={styles.dropdownItem} onClick={(e) => handleNavClick(e, 'HOODIES')}>HOODIES</a>
                            <a href="#" style={styles.dropdownItem} onClick={(e) => handleNavClick(e, 'T-SHIRTS')}>T-SHIRTS</a>
                            <a href="#" style={styles.dropdownItem} onClick={(e) => handleNavClick(e, 'PANTS')}>PANTS</a>
                            <a href="#" style={styles.dropdownItem} onClick={(e) => handleNavClick(e, 'ACCESSORIES')}>ACCESSORIES</a>
                        </div>
                    </div>

                    <a href="#" style={styles.navLink} onClick={(e) => handleNavClick(e, 'PERFUMES')}>PERFUMES</a>
                    <a href="#" style={{ ...styles.navLink, color: '#999' }} onClick={(e) => handleNavClick(e, 'WINTER')}>WINTER '26</a>
                    <a href="#" style={{ ...styles.navLink, color: '#ff4444' }} onClick={(e) => handleNavClick(e, 'OUTLET')}>OUTLET</a>

                    {isAdmin && (
                        <a href="#" style={styles.dashboardLink} onClick={(e) => handleNavClick(e, 'DASHBOARD')}>
                            DASHBOARD
                        </a>
                    )}
                </nav>

                <div style={styles.iconsContainer}>
                    <div style={styles.cartIconContainer} onClick={() => setShowCart(true)}>
                        <span style={{ color: '#fff', fontSize: '1.2em' }}>🛒</span>
                        {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                    </div>

                    {!usuario ? (
                        <button onClick={() => setShowLogin(true)} style={styles.loginBtn}>
                            INGRESAR
                        </button>
                    ) : (
                        <div style={styles.userInfo}>
                            <span style={styles.username}>{usuario.Username?.toUpperCase()}</span>
                            <button
                                onClick={handleLogout}
                                style={isAdmin ? styles.adminActiveBtn : styles.logoutBtn}
                            >
                                SALIR
                            </button>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};

const styles = {
    announcementWrapper: { backgroundColor: '#f5f5f5', overflow: 'hidden', whiteSpace: 'nowrap', padding: '10px 0', borderBottom: '1px solid #eee' },
    marquee: { display: 'inline-block', paddingLeft: '100%', animation: 'marquee 25s linear infinite', fontSize: '0.65em', fontWeight: '700', letterSpacing: '0.15em', color: '#000' },
    header: { backgroundColor: '#000000', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', position: 'sticky', top: 0, zIndex: 1000 },
    logoContainer: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
    logo: { height: '80px', width: 'auto', display: 'block' },
    nav: { display: 'flex', gap: '35px', alignItems: 'center' },
    navItemContainer: { position: 'relative', height: '100%', display: 'flex', alignItems: 'center' },
    navLink: { textDecoration: 'none', color: '#ffffff', fontSize: '0.75em', fontWeight: '600', letterSpacing: '0.2em', padding: '25px 0', transition: 'color 0.2s ease' },
    dropdown: { position: 'absolute', top: '65px', left: '-20px', backgroundColor: '#000', minWidth: '180px', display: 'flex', flexDirection: 'column', padding: '15px 0', border: '1px solid #222', zIndex: 1001, transition: 'all 0.3s ease' },
    dropdownItem: { color: '#fff', padding: '12px 25px', textDecoration: 'none', fontSize: '0.7em', letterSpacing: '0.15em', borderBottom: '1px solid #111', cursor: 'pointer' },
    iconsContainer: { display: 'flex', alignItems: 'center', gap: '25px' },
    cartIconContainer: { position: 'relative', cursor: 'pointer' },
    cartBadge: { position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#fff', color: '#000', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.6em', fontWeight: 'bold' },
    loginBtn: { background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.7em', opacity: 0.8 },
    adminActiveBtn: { background: '#ff4444', color: '#fff', border: 'none', padding: '8px 15px', cursor: 'pointer', fontSize: '0.7em', fontWeight: 'bold' },
    dashboardLink: { textDecoration: 'none', color: '#00bb77', fontSize: '0.75em', fontWeight: '800', letterSpacing: '0.2em', padding: '25px 0' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
    username: { color: '#fff', fontSize: '0.75em', fontWeight: 'bold', letterSpacing: '0.05em' },
    logoutBtn: { background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.7em', fontWeight: 'bold' }
};

export default Header;