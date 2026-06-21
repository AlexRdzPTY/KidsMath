// ===== ESTADO DEL JUEGO =====
let grupoEdad = '';
let modoActual = '';
let preguntas = [];
let preguntaActual = 0;
let correctas = 0;
let racha = 0;
let rachaMax = parseInt(localStorage.getItem('kidsmath_racha')) || 0;
let totalEstrellas = parseInt(localStorage.getItem('kidsmath_estrellas')) || 0;

const EMOJIS_OBJETOS = ['🍎','🍌','🍇','🍓','🍊','🐶','🐱','🐰','🐻','🦋','🌟','🌸','🚗','✈️','🎈','🎨'];

const CONFIG_EDAD = {
    'menos5': {
        nombre: 'Menos de 5 años',
        operaciones: ['sumar'],
        permiteFracciones: false
    },
    '5-6': {
        nombre: '5 - 6 años',
        operaciones: ['sumar', 'restar', 'multiplicar'],
        permiteFracciones: false
    },
    '7-8': {
        nombre: '7 - 8 años',
        operaciones: ['sumar', 'restar', 'multiplicar', 'dividir'],
        permiteFracciones: false
    },
    '9-10': {
        nombre: '9 - 10 años',
        operaciones: ['sumar', 'restar', 'multiplicar', 'dividir', 'fracciones'],
        permiteFracciones: true
    }
};

// ===== AUDIO =====
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(tipo) {
    try {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (tipo === 'correcto') {
            osc.frequency.setValueAtTime(523, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.4);
        } else if (tipo === 'incorrecto') {
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.4);
        } else if (tipo === 'click') {
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (tipo === 'win') {
            osc.frequency.setValueAtTime(523, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.15);
            osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.3);
            osc.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.45);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.8);
        }
    } catch(e) {
        console.log('Audio no disponible');
    }
}

function vibrar(duracion) {
    if (navigator.vibrate) {
        navigator.vibrate(duracion);
    }
}

// ===== CONFETI =====
let confetiAnimacion = null;

function lanzarConfeti() {
    let canvas = document.getElementById('confeti-canvas');
    if (!canvas) return;

    canvas.style.display = 'block';
    let ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particulas = [];
    let colores = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

    for (let i = 0; i < 150; i++) {
        particulas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            color: colores[Math.floor(Math.random() * colores.length)],
            size: Math.random() * 8 + 4,
            rotacion: Math.random() * 360,
            vRotacion: (Math.random() - 0.5) * 10
        });
    }

    let tiempoInicio = Date.now();

    function animar() {
        let tiempoTranscurrido = Date.now() - tiempoInicio;
        if (tiempoTranscurrido > 5000) {
            canvas.style.display = 'none';
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particulas.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotacion += p.vRotacion;

            if (p.y > canvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotacion * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        });

        confetiAnimacion = requestAnimationFrame(animar);
    }

    if (confetiAnimacion) cancelAnimationFrame(confetiAnimacion);
    animar();
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    actualizarStats();
});

function actualizarStats() {
    document.getElementById('estrellas-total').textContent = totalEstrellas;
    document.getElementById('racha-max').textContent = rachaMax;
}

// ===== SELECCIÓN DE EDAD =====
function seleccionarEdad(edad) {
    playSound('click');
    vibrar(30);

    grupoEdad = edad;
    let config = CONFIG_EDAD[edad];

    document.getElementById('grupo-edad-texto').textContent = config.nombre;

    let contenedor = document.getElementById('botones-operaciones');
    contenedor.innerHTML = '';

    const emojis = { sumar: '➕', restar: '➖', multiplicar: '✖️', dividir: '➗', fracciones: '🍕' };
    const textos = { sumar: 'Sumar', restar: 'Restar', multiplicar: 'Multiplicar', dividir: 'Dividir', fracciones: 'Fracciones' };

    config.operaciones.forEach(op => {
        let btn = document.createElement('button');
        btn.className = 'btn-op' + (op === 'fracciones' ? ' fraccion' : '');
        btn.innerHTML = `<span class="emoji">${emojis[op]}</span><span class="texto">${textos[op]}</span>`;
        btn.onclick = () => irA(op);
        contenedor.appendChild(btn);
    });

    mostrarPantalla('pantalla-inicio');
}

function volverEdad() {
    playSound('click');
    vibrar(30);
    mostrarPantalla('pantalla-edad');
}

// ===== NAVEGACIÓN =====
function irA(modo) {
    playSound('click');
    vibrar(30);

    modoActual = modo;
    preguntaActual = 0;
    correctas = 0;
    racha = 0;
    preguntas = generarPreguntas(modo);

    let titulo = modo === 'fracciones' ? 'Fracciones' : 
                 modo.charAt(0).toUpperCase() + modo.slice(1);
    document.getElementById('titulo-modo').textContent = titulo;

    mostrarPantalla('pantalla-juego');
    mostrarPregunta();
}

function volverInicio() {
    playSound('click');
    vibrar(30);
    mostrarPantalla('pantalla-inicio');
    actualizarStats();
}

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
}

// ===== GENERADOR DE PREGUNTAS =====
function generarPreguntas(modo) {
    let lista = [];
    for (let i = 0; i < 10; i++) {
        lista.push(crearPregunta(modo));
    }
    return lista;
}

function aleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function crearPregunta(modo) {
    let a, b, respuesta, texto, tipo = 'normal';
    let usarImagenes = false;

    switch(grupoEdad) {
        case 'menos5':
            if (modo === 'sumar') {
                a = aleatorio(1, 5);
                b = aleatorio(1, 4);
                respuesta = a + b;
                usarImagenes = Math.random() > 0.3;
                if (usarImagenes) {
                    texto = '';
                    tipo = 'imagenes';
                } else {
                    texto = `¿Cuánto es ${a} + ${b}?`;
                }
            }
            break;

        case '5-6':
            if (modo === 'sumar') {
                if (Math.random() > 0.5) {
                    a = aleatorio(1, 9);
                    b = aleatorio(1, 9);
                } else {
                    a = aleatorio(10, 45);
                    b = aleatorio(1, Math.min(9, 50 - a));
                }
                respuesta = a + b;
                texto = `¿Cuánto es ${a} + ${b}?`;
            } else if (modo === 'restar') {
                a = aleatorio(5, 20);
                b = aleatorio(1, a);
                respuesta = a - b;
                texto = `¿Cuánto es ${a} - ${b}?`;
            } else if (modo === 'multiplicar') {
                a = aleatorio(1, 4);
                b = aleatorio(1, 12);
                respuesta = a * b;
                texto = `¿Cuánto es ${a} × ${b}?`;
            }
            break;

        case '7-8':
            if (modo === 'sumar') {
                a = aleatorio(10, 99);
                b = aleatorio(10, 99);
                respuesta = a + b;
                texto = `¿Cuánto es ${a} + ${b}?`;
            } else if (modo === 'restar') {
                a = aleatorio(10, 80);
                b = aleatorio(5, Math.min(a, 50));
                respuesta = a - b;
                texto = `¿Cuánto es ${a} - ${b}?`;
            } else if (modo === 'multiplicar') {
                a = aleatorio(2, 7);
                b = aleatorio(2, 12);
                respuesta = a * b;
                texto = `¿Cuánto es ${a} × ${b}?`;
            } else if (modo === 'dividir') {
                b = aleatorio(2, 9);
                respuesta = aleatorio(2, Math.floor(20 / b));
                a = b * respuesta;
                texto = `¿Cuánto es ${a} ÷ ${b}?`;
            }
            break;

        case '9-10':
            if (modo === 'sumar') {
                a = aleatorio(50, 500);
                b = aleatorio(50, 500);
                respuesta = a + b;
                texto = `¿Cuánto es ${a} + ${b}?`;
            } else if (modo === 'restar') {
                a = aleatorio(100, 999);
                b = aleatorio(50, a);
                respuesta = a - b;
                texto = `¿Cuánto es ${a} - ${b}?`;
            } else if (modo === 'multiplicar') {
                if (Math.random() > 0.5) {
                    a = aleatorio(10, 99);
                    b = aleatorio(2, 9);
                } else {
                    a = aleatorio(100, 500);
                    b = aleatorio(2, 9);
                }
                respuesta = a * b;
                texto = `¿Cuánto es ${a} × ${b}?`;
            } else if (modo === 'dividir') {
                b = aleatorio(2, 20);
                respuesta = aleatorio(5, 50);
                a = b * respuesta;
                if (a > 999) { a = Math.floor(a / 10); respuesta = Math.floor(a / b); a = b * respuesta; }
                texto = `¿Cuánto es ${a} ÷ ${b}?`;
            } else if (modo === 'fracciones') {
                tipo = 'fraccion';
                let denominador = aleatorio(4, 8);
                let numerador = aleatorio(1, denominador - 1);
                // La respuesta es el string completo de la fracción
                respuesta = `${numerador}/${denominador}`;
                texto = `¿Qué parte está coloreada?`;
                return {
                    texto, respuesta, tipo,
                    denominador, numerador,
                    opciones: generarOpcionesFraccion(numerador, denominador)
                };
            }
            break;
    }

    let p = {
        texto, respuesta, tipo,
        opciones: generarOpciones(respuesta)
    };

    if (usarImagenes) {
        p.a = a;
        p.b = b;
        p.emojiA = EMOJIS_OBJETOS[aleatorio(0, EMOJIS_OBJETOS.length - 1)];
        p.emojiB = EMOJIS_OBJETOS[aleatorio(0, EMOJIS_OBJETOS.length - 1)];
    }

    return p;
}

function generarOpciones(correcta) {
    let ops = new Set([correcta]);
    while (ops.size < 4) {
        let variacion = aleatorio(-8, 8);
        let op = correcta + variacion;
        if (op >= 0 && op !== correcta) ops.add(op);
    }
    return [...ops].sort(() => Math.random() - 0.5);
}

function generarOpcionesFraccion(numerador, denominador) {
    let ops = new Set([`${numerador}/${denominador}`]);
    let intentos = 0;
    while (ops.size < 4 && intentos < 100) {
        intentos++;
        let d = denominador;
        let n = aleatorio(1, d - 1);
        let frac = `${n}/${d}`;
        if (frac !== `${numerador}/${denominador}`) {
            ops.add(frac);
        }
        if (intentos > 20 && ops.size < 4) {
            d = aleatorio(2, 10);
            n = aleatorio(1, d - 1);
            frac = `${n}/${d}`;
            if (frac !== `${numerador}/${denominador}`) {
                ops.add(frac);
            }
        }
    }
    while (ops.size < 4) {
        let d = aleatorio(2, 12);
        let n = aleatorio(1, d - 1);
        ops.add(`${n}/${d}`);
    }
    return [...ops].sort(() => Math.random() - 0.5);
}

// ===== MOSTRAR PREGUNTA =====
function mostrarPregunta() {
    let p = preguntas[preguntaActual];

    document.getElementById('pregunta').textContent = p.texto;
    document.getElementById('num-pregunta').textContent = preguntaActual + 1;

    let estrellasActuales = Math.floor(correctas / 2);
    document.getElementById('contador-estrellas').textContent = `⭐ ${estrellasActuales}/5`;

    document.getElementById('feedback').textContent = '';

    let progreso = ((preguntaActual + 1) / 10) * 100;
    document.getElementById('barra-progreso-fill').style.width = progreso + '%';

    document.getElementById('visual-imagenes').style.display = 'none';
    document.getElementById('visual-fraccion').style.display = 'none';

    if (p.tipo === 'imagenes') {
        let contenedor = document.getElementById('visual-imagenes');
        contenedor.style.display = 'flex';
        contenedor.innerHTML = '';

        for (let i = 0; i < p.a; i++) {
            let span = document.createElement('span');
            span.className = 'item-imagen';
            span.textContent = p.emojiA;
            contenedor.appendChild(span);
        }
        let mas = document.createElement('span');
        mas.className = 'item-imagen mas';
        mas.textContent = '+';
        contenedor.appendChild(mas);
        for (let i = 0; i < p.b; i++) {
            let span = document.createElement('span');
            span.className = 'item-imagen';
            span.textContent = p.emojiB;
            contenedor.appendChild(span);
        }
        let igual = document.createElement('span');
        igual.className = 'item-imagen igual';
        igual.textContent = '=';
        contenedor.appendChild(igual);
        let pregunta = document.createElement('span');
        pregunta.className = 'item-imagen';
        pregunta.textContent = '❓';
        contenedor.appendChild(pregunta);
    }

    if (p.tipo === 'fraccion') {
        document.getElementById('visual-fraccion').style.display = 'block';
        setTimeout(() => dibujarFraccionCanvas(p.numerador, p.denominador), 50);
    }

    let contenedor = document.getElementById('opciones');
    contenedor.innerHTML = '';

    p.opciones.forEach(op => {
        let btn = document.createElement('button');
        btn.className = 'btn-respuesta';
        btn.textContent = op;
        btn.onclick = () => verificarRespuesta(op, p.respuesta, btn);
        contenedor.appendChild(btn);
    });
}

// ===== DIBUJAR FRACCIÓN CON CANVAS =====
function dibujarFraccionCanvas(numerador, denominador) {
    let canvas = document.getElementById('canvas-fraccion');
    if (!canvas) {
        console.error('Canvas no encontrado');
        return;
    }

    let ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('No se pudo obtener contexto 2D');
        return;
    }

    let w = canvas.width;
    let h = canvas.height;
    let cx = w / 2;
    let cy = h / 2;
    let radio = 85;

    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, 2 * Math.PI);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    let anguloPorcion = (2 * Math.PI) / denominador;

    for (let i = 0; i < numerador; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        let startAngle = i * anguloPorcion - Math.PI / 2;
        let endAngle = (i + 1) * anguloPorcion - Math.PI / 2;
        ctx.arc(cx, cy, radio - 2, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    for (let i = 0; i < denominador; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        let angulo = i * anguloPorcion - Math.PI / 2;
        ctx.lineTo(cx + Math.cos(angulo) * radio, cy + Math.sin(angulo) * radio);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// ===== VERIFICAR RESPUESTA =====
function verificarRespuesta(seleccionada, correcta, boton) {
    document.querySelectorAll('.btn-respuesta').forEach(b => b.disabled = true);

    let esCorrecta = seleccionada == correcta;
    let feedback = document.getElementById('feedback');

    if (esCorrecta) {
        boton.classList.add('correcto');
        playSound('correcto');
        vibrar([50, 30, 50]);
        let mensajes = ['¡Excelente!', '¡Muy bien!', '¡Correcto!', '¡Genial!', '¡Súper!'];
        feedback.textContent = mensajes[aleatorio(0, mensajes.length - 1)];
        correctas++;
        racha++;
        if (racha > rachaMax) {
            rachaMax = racha;
            localStorage.setItem('kidsmath_racha', rachaMax);
        }
    } else {
        boton.classList.add('incorrecto');
        playSound('incorrecto');
        vibrar(200);
        document.querySelectorAll('.btn-respuesta').forEach(b => {
            if (b.textContent == correcta) b.classList.add('correcto');
        });
        feedback.textContent = `La respuesta era ${correcta}`;
        racha = 0;
    }

    setTimeout(() => {
        preguntaActual++;
        if (preguntaActual < 10) {
            mostrarPregunta();
        } else {
            mostrarResultados();
        }
    }, 1500);
}

// ===== ESTRELLAS CON EMOJIS: 🌟 llena, ⭐ media, ⚪ vacía =====
function generarEstrellasHTML(correctas) {
    let llenas = Math.floor(correctas / 2);
    let media = correctas % 2;
    let vacias = 5 - llenas - media;

    let html = '';
    for (let i = 0; i < llenas; i++) html += '🌟';
    for (let i = 0; i < media; i++) html += '⭐';
    for (let i = 0; i < vacias; i++) html += '⚪';

    return html;
}

// ===== RESULTADOS =====
function mostrarResultados() {
    mostrarPantalla('pantalla-resultado');

    let estrellasObtenidas = Math.floor(correctas / 2);
    let mediaEstrella = correctas % 2 === 1;

    totalEstrellas += estrellasObtenidas + (mediaEstrella ? 0.5 : 0);
    localStorage.setItem('kidsmath_estrellas', Math.floor(totalEstrellas));

    let titulo = document.getElementById('titulo-resultado');
    let mensaje = document.getElementById('mensaje-resultado');
    let estrellasDiv = document.getElementById('resultado-estrellas');

    if (correctas >= 9) {
        titulo.textContent = '¡Eres un Math Hero! 🦸';
    } else if (correctas >= 7) {
        titulo.textContent = '¡Muy bien! 🌟';
    } else if (correctas >= 5) {
        titulo.textContent = '¡Buen trabajo! 👍';
    } else if (correctas >= 3) {
        titulo.textContent = '¡Sigue practicando! 💪';
    } else {
        titulo.textContent = '¡No te rindas! 🌈';
    }

    let textoDecimal = estrellasObtenidas + (mediaEstrella ? '.5' : '');
    mensaje.textContent = `Obtuviste ${textoDecimal} de 5 estrellas (${correctas}/10 correctas)`;

    estrellasDiv.innerHTML = generarEstrellasHTML(correctas);

    if (correctas >= 9) {
        playSound('win');
        vibrar([100, 50, 100, 50, 200]);
        lanzarConfeti();
    }
}
