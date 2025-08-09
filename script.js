// Enhanced image editor with advanced features
const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const uploadArea = document.getElementById('uploadArea');
const canvasContainer = document.getElementById('canvasContainer');
const controlsPanel = document.getElementById('controlsPanel');
const actionButtons = document.getElementById('actionButtons');
const closeImage = document.getElementById('closeImage');
const imageInfo = document.getElementById('imageInfo');
const fileSizeInfo = document.getElementById('fileSizeInfo');

// Performance optimization variables
let img = new Image();
let originalImg = new Image();
let rotation = 0;
let flipH = 1;
let flipV = 1;
let lastDrawTime = 0;
let originalFileSize = 0;
const drawDelay = 50; // milliseconds between redraws

// Initialize canvas
function initCanvas() {
    canvas.width = 400;
    canvas.height = 400;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Your edited image will appear here', canvas.width/2, canvas.height/2);
}

// Show/Hide UI elements based on image state
function showImageEditor() {
    uploadArea.style.display = 'none';
    canvasContainer.style.display = 'block';
    controlsPanel.style.display = 'block';
    actionButtons.style.display = 'block';
}

function hideImageEditor() {
    uploadArea.style.display = 'block';
    canvasContainer.style.display = 'none';
    controlsPanel.style.display = 'none';
    actionButtons.style.display = 'none';
    
    // Reset all values
    resetAllControls();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    img.src = '';
    originalImg.src = '';
}

// Reset all control values to default
function resetAllControls() {
    document.getElementById('width').value = 400;
    document.getElementById('height').value = 400;
    document.getElementById('ratio').value = 'free';
    document.getElementById('shape').value = 'rectangle';
    document.getElementById('radius').value = 0;
    document.getElementById('borderWidth').value = 0;
    document.getElementById('brightness').value = 100;
    document.getElementById('contrast').value = 100;
    document.getElementById('saturation').value = 100;
    document.getElementById('blur').value = 0;
    document.getElementById('sepia').value = 0;
    document.getElementById('grayscale').value = 0;
    document.getElementById('watermark').value = '';
    document.getElementById('watermarkSize').value = 24;
    document.getElementById('watermarkOpacity').value = 50;
    
    // Update value displays
    updateAllValueDisplays();
    
    // Reset transformations
    rotation = 0;
    flipH = 1;
    flipV = 1;
}

// Update all value displays
function updateAllValueDisplays() {
    document.getElementById('radius-value').textContent = document.getElementById('radius').value;
    document.getElementById('border-value').textContent = document.getElementById('borderWidth').value;
    document.getElementById('brightness-value').textContent = document.getElementById('brightness').value;
    document.getElementById('contrast-value').textContent = document.getElementById('contrast').value;
    document.getElementById('saturation-value').textContent = document.getElementById('saturation').value;
    document.getElementById('blur-value').textContent = document.getElementById('blur').value;
    document.getElementById('sepia-value').textContent = document.getElementById('sepia').value;
    document.getElementById('grayscale-value').textContent = document.getElementById('grayscale').value;
    document.getElementById('watermark-size-value').textContent = document.getElementById('watermarkSize').value;
    document.getElementById('watermark-opacity-value').textContent = document.getElementById('watermarkOpacity').value;
}

// Setup value displays with event listeners
function setupValueDisplays() {
    const controls = [
        'radius', 'borderWidth', 'brightness', 'contrast', 'saturation', 
        'blur', 'sepia', 'grayscale', 'watermarkSize', 'watermarkOpacity'
    ];
    
    controls.forEach(control => {
        const element = document.getElementById(control);
        const valueElement = document.getElementById(control.replace(/([A-Z])/g, '-$1').toLowerCase() + '-value');
        
        element.addEventListener('input', function() {
            valueElement.textContent = this.value;
            debouncedDraw();
        });
    });
}

// Debounce function to limit rapid redraws
let debounceTimer;
function debouncedDraw() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(drawImage, drawDelay);
}

// Handle image upload
upload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        loading.style.display = 'block';
        originalFileSize = file.size;
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            img.onload = function() {
                originalImg.src = evt.target.result; // Store original
                
                // Set initial dimensions to image's natural dimensions
                document.getElementById('width').value = img.naturalWidth;
                document.getElementById('height').value = img.naturalHeight;
                
                // Update image info
                updateImageInfo();
                
                applyAspectRatio();
                loading.style.display = 'none';
                showImageEditor();
                drawImage();
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Update image information display
function updateImageInfo() {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const sizeKB = Math.round(originalFileSize / 1024);
    
    imageInfo.textContent = `Image: ${width}x${height} pixels`;
    fileSizeInfo.textContent = `Size: ${sizeKB} KB`;
}

// Close image handler
closeImage.addEventListener('click', function() {
    hideImageEditor();
});

// Apply aspect ratio constraints
function applyAspectRatio() {
    const ratio = document.getElementById('ratio').value;
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    if (ratio !== 'free') {
        const [w, h] = ratio.split(':').map(Number);
        const newHeight = Math.round(widthInput.value * h / w);
        heightInput.value = newHeight;
    }
    
    applyShape();
}

// Apply shape constraints
function applyShape() {
    const shape = document.getElementById('shape').value;
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const radiusInput = document.getElementById('radius');
    const radiusValue = document.getElementById('radius-value');
    
    switch(shape) {
        case 'square':
            heightInput.value = widthInput.value;
            break;
        case 'circle':
            heightInput.value = widthInput.value;
            const circleRadius = Math.min(widthInput.value, heightInput.value) / 2;
            radiusInput.value = circleRadius;
            radiusValue.textContent = circleRadius;
            break;
        case 'rounded':
            const roundedRadius = Math.min(50, Math.min(widthInput.value, heightInput.value) / 8);
            radiusInput.value = roundedRadius;
            radiusValue.textContent = roundedRadius;
            break;
        case 'rectangle':
            radiusInput.value = 0;
            radiusValue.textContent = 0;
            break;
    }
    
    // Trigger redraw after shape change
    debouncedDraw();
}

// Main drawing function (enhanced)
function drawImage() {
    const now = Date.now();
    if (now - lastDrawTime < drawDelay) {
        return;
    }
    lastDrawTime = now;
    
    requestAnimationFrame(() => {
        const w = parseInt(document.getElementById('width').value);
        const h = parseInt(document.getElementById('height').value);
        const radius = parseInt(document.getElementById('radius').value);
        const borderWidth = parseInt(document.getElementById('borderWidth').value);
        const brightness = document.getElementById('brightness').value;
        const contrast = document.getElementById('contrast').value;
        const saturation = document.getElementById('saturation').value;
        const blur = document.getElementById('blur').value;
        const sepia = document.getElementById('sepia').value;
        const grayscale = document.getElementById('grayscale').value;
        const watermark = document.getElementById('watermark').value;
        const watermarkSize = document.getElementById('watermarkSize').value;
        const watermarkOpacity = document.getElementById('watermarkOpacity').value;
        const shape = document.getElementById('shape').value;
        
        // Only resize canvas if dimensions changed
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        
        ctx.save();
        ctx.clearRect(0, 0, w, h);
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.scale(flipH, flipV);
        
        // Apply filters
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) sepia(${sepia}%) grayscale(${grayscale}%)`;
        
        // Apply shape clipping
        if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(w, h) / 2, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();
        } else if (shape === 'rounded' && radius > 0) {
            const effectiveRadius = Math.min(radius, Math.min(w, h) / 2);
            ctx.beginPath();
            ctx.moveTo(-w / 2 + effectiveRadius, -h / 2);
            ctx.lineTo(w / 2 - effectiveRadius, -h / 2);
            ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + effectiveRadius);
            ctx.lineTo(w / 2, h / 2 - effectiveRadius);
            ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - effectiveRadius, h / 2);
            ctx.lineTo(-w / 2 + effectiveRadius, h / 2);
            ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - effectiveRadius);
            ctx.lineTo(-w / 2, -h / 2 + effectiveRadius);
            ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + effectiveRadius, -h / 2);
            ctx.closePath();
            ctx.clip();
        }
        
        // Draw image if loaded
        if (img.src) {
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
        
        ctx.restore();
        
        // Add border
        if (borderWidth > 0) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = borderWidth;
            if (shape === 'circle') {
                ctx.beginPath();
                ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - borderWidth / 2, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                ctx.strokeRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);
            }
        }
        
        // Add watermark
        if (watermark) {
            ctx.save();
            ctx.globalAlpha = watermarkOpacity / 100;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.font = `${watermarkSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(watermark, w / 2, h - watermarkSize - 10);
            ctx.fillText(watermark, w / 2, h - watermarkSize - 10);
            ctx.restore();
        }
    });
}

// Event listeners for controls
document.getElementById('width').addEventListener('input', debouncedDraw);
document.getElementById('height').addEventListener('input', debouncedDraw);
document.getElementById('ratio').addEventListener('change', function() {
    applyAspectRatio();
    debouncedDraw();
});
document.getElementById('shape').addEventListener('change', function() {
    applyShape();
    debouncedDraw();
});
document.getElementById('watermark').addEventListener('input', debouncedDraw);

// Action buttons
document.getElementById('rotate').addEventListener('click', function() {
    rotation += 90;
    if (rotation >= 360) rotation = 0;
    drawImage();
});

document.getElementById('flipH').addEventListener('click', function() {
    flipH *= -1;
    drawImage();
});

document.getElementById('flipV').addEventListener('click', function() {
    flipV *= -1;
    drawImage();
});

document.getElementById('reset').addEventListener('click', function() {
    if (originalImg.src) {
        img.src = originalImg.src;
        resetAllControls();
        setTimeout(() => {
            document.getElementById('width').value = img.naturalWidth;
            document.getElementById('height').value = img.naturalHeight;
            drawImage();
        }, 100);
    }
});

// Download functions
document.getElementById('download').addEventListener('click', function() {
    downloadImage('png');
});

document.getElementById('downloadJPG').addEventListener('click', function() {
    downloadImage('jpeg');
});

document.getElementById('downloadPNG').addEventListener('click', function() {
    downloadImage('png');
});

function downloadImage(format) {
    if (img.src) {
        const link = document.createElement('a');
        link.download = `edited-image.${format === 'jpeg' ? 'jpg' : 'png'}`;
        link.href = canvas.toDataURL(`image/${format}`, 0.9);
        link.click();
    } else {
        alert('Please upload an image first!');
    }
}

// Drag and drop functionality
const fileUpload = document.querySelector('.file-upload');

fileUpload.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#667eea';
    this.style.background = 'rgba(102, 126, 234, 0.1)';
    this.style.transform = 'translateY(-5px)';
});

fileUpload.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.style.borderColor = '#e2e8f0';
    this.style.background = 'white';
    this.style.transform = 'translateY(0)';
});

fileUpload.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = '#e2e8f0';
    this.style.background = 'white';
    this.style.transform = 'translateY(0)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        upload.files = files;
        upload.dispatchEvent(new Event('change'));
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (img.src) {
        switch(e.key) {
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    document.getElementById('rotate').click();
                }
                break;
            case 's':
            case 'S':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    downloadImage('png');
                }
                break;
            case 'Escape':
                closeImage.click();
                break;
        }
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initCanvas();
    setupValueDisplays();
    updateAllValueDisplays();
    
    // Add smooth animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Performance monitoring
let performanceMetrics = {
    drawCalls: 0,
    averageDrawTime: 0
};

function trackPerformance(startTime) {
    const endTime = performance.now();
    const drawTime = endTime - startTime;
    performanceMetrics.drawCalls++;
    performanceMetrics.averageDrawTime = 
        (performanceMetrics.averageDrawTime * (performanceMetrics.drawCalls - 1) + drawTime) / performanceMetrics.drawCalls;
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    // You could send this to an error tracking service
});

// Service worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}