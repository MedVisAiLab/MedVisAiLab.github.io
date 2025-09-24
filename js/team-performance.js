/**
 * Team Page Performance Optimization
 * Enhances loading speed and visual stability for member cards
 */

(function() {
    'use strict';

    // Progressive loading configuration
    const LOADING_CONFIG = {
        rootMargin: '50px',
        threshold: 0.1,
        maxConcurrentLoads: 4
    };

    let loadingQueue = [];
    let currentlyLoading = 0;

    // Create placeholder for missing images
    function createImagePlaceholder(width = 140, height = 140) {
        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <circle cx="${width/2}" cy="${height/2 - 15}" r="20" fill="#d1d5db"/>
                <path d="M${width/2 - 25} ${height/2 + 10} Q${width/2} ${height/2 + 25} ${width/2 + 25} ${height/2 + 10}"
                      stroke="#d1d5db" stroke-width="3" fill="none"/>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    // Optimize images with proper attributes and placeholders
    function optimizeImages() {
        const images = document.querySelectorAll('.member img');

        images.forEach((img, index) => {
            // Add loading performance attributes
            if (!img.hasAttribute('width')) img.setAttribute('width', '140');
            if (!img.hasAttribute('height')) img.setAttribute('height', '140');
            if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');

            // Store original src and set placeholder
            const originalSrc = img.src;
            img.dataset.originalSrc = originalSrc;
            img.src = createImagePlaceholder();

            // Add fade-in animation class
            img.classList.add('team-image-loading');

            // Handle external image loading with timeout
            img.addEventListener('load', function() {
                this.classList.remove('team-image-loading');
                this.classList.add('team-image-loaded');
            });

            img.addEventListener('error', function() {
                console.warn('Failed to load image:', originalSrc);
                this.src = createImagePlaceholder();
                this.classList.remove('team-image-loading');
                this.classList.add('team-image-error');
            });
        });
    }

    // Progressive image loading with intersection observer
    function setupProgressiveLoading() {
        const images = document.querySelectorAll('.member img[data-original-src]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        loadImageProgressive(img);
                        imageObserver.unobserve(img);
                    }
                });
            }, LOADING_CONFIG);

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => loadImageProgressive(img));
        }
    }

    // Load image with queue management
    function loadImageProgressive(img) {
        if (currentlyLoading >= LOADING_CONFIG.maxConcurrentLoads) {
            loadingQueue.push(img);
            return;
        }

        currentlyLoading++;
        const originalSrc = img.dataset.originalSrc;

        // Create new image element for preloading
        const preloadImg = new Image();

        // Set timeout for external images
        const timeoutId = setTimeout(() => {
            console.warn('Image loading timeout:', originalSrc);
            preloadImg.src = '';
            finishLoading(img);
        }, 5000);

        preloadImg.onload = () => {
            clearTimeout(timeoutId);
            img.src = originalSrc;
            finishLoading(img);
        };

        preloadImg.onerror = () => {
            clearTimeout(timeoutId);
            console.warn('Failed to preload:', originalSrc);
            finishLoading(img);
        };

        preloadImg.src = originalSrc;
    }

    // Finish loading and process queue
    function finishLoading(img) {
        currentlyLoading--;

        // Process next image in queue
        if (loadingQueue.length > 0 && currentlyLoading < LOADING_CONFIG.maxConcurrentLoads) {
            const nextImg = loadingQueue.shift();
            loadImageProgressive(nextImg);
        }
    }

    // Add CSS for smooth transitions
    function addPerformanceStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .team-image-loading {
                opacity: 0.7;
                filter: blur(2px);
                transition: all 0.3s ease;
            }

            .team-image-loaded {
                opacity: 1;
                filter: blur(0);
                transition: all 0.3s ease;
            }

            .team-image-error {
                opacity: 0.8;
                filter: grayscale(50%);
            }

            .member {
                contain: layout;
                will-change: transform;
            }

            .members-grid {
                contain: layout;
            }

            /* Skeleton loading animation */
            .member-loading {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
            }

            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* Improved hover performance */
            .member {
                transform: translateZ(0);
                backface-visibility: hidden;
                perspective: 1000px;
            }

            .member:hover {
                will-change: transform;
            }
        `;
        document.head.appendChild(style);
    }

    // Preload critical images (first few visible members)
    function preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('.member:nth-child(-n+6) img[data-original-src]');
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.dataset.originalSrc;
            document.head.appendChild(link);
        });
    }

    // Virtual scrolling for large lists (if needed)
    function setupVirtualScrolling() {
        const memberCards = document.querySelectorAll('.member');
        if (memberCards.length > 20) {
            // Add virtual scrolling for very large teams
            console.log('Large team detected, consider implementing virtual scrolling');
        }
    }

    // Defer non-critical JavaScript
    function deferNonCriticalJS() {
        // Defer hover animations until user interaction
        let interactionStarted = false;

        function startInteractions() {
            if (interactionStarted) return;
            interactionStarted = true;

            document.querySelectorAll('.member').forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-5px) translateZ(0)';
                });

                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) translateZ(0)';
                });
            });
        }

        // Start interactions on first user interaction
        ['mouseenter', 'touchstart', 'scroll'].forEach(event => {
            document.addEventListener(event, startInteractions, { once: true, passive: true });
        });
    }

    // Main initialization
    function init() {
        // Run performance optimizations immediately
        addPerformanceStyles();
        optimizeImages();

        // Run after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setupProgressiveLoading();
                preloadCriticalImages();
                setupVirtualScrolling();
                deferNonCriticalJS();
            });
        } else {
            setupProgressiveLoading();
            preloadCriticalImages();
            setupVirtualScrolling();
            deferNonCriticalJS();
        }

        // Performance monitoring
        if (window.performance && window.performance.mark) {
            window.performance.mark('team-optimization-complete');
        }

        console.log('Team page performance optimization initialized');
    }

    // Initialize optimization
    init();

})();