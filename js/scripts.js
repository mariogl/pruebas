class CursosApp {
  constructor() {
    this.isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

    this.hostApi = 'https://api.mariogl.com/';
    this.urlCursosDisponibles = this.hostApi + 'cursos/';
    this.urlCursosUsuario = this.hostApi + 'usuario/';
    this.idUsuario = 1;

    this.cursosListaElem = document.querySelector('.cursos');
    this.cursosElem;
    this.cursoBase = document.querySelector('.curso-dummy');
    this.anyadirElem = document.querySelector('.icono-anyadir');
    this.volverElem = document.querySelector('.icono-volver');
    this.spinnerElem = document.querySelector('.loading');
    this.paginasElem = {
      lista: document.querySelector('.page-list'),
      form: document.querySelector('.page-form')
    }
    this.seleccionElem = document.querySelector('.seleccion');
    this.btnAnyadirElem = document.querySelector('.boton-anyadir');

    this.cursosDisponibles = [];
    this.misCursos = [];

    // Presionado largo
    this.Press = new Hammer.Press({
      time: 500
    });

    this.anyadeListeners();
    this.cargaCursosDisponibles().then(() => this.cargaMisCursos());
  }

  anyadeListeners() {
    document.addEventListener("contextmenu", e => e.preventDefault(), false);
    this.anyadirElem.addEventListener('click', () => this.cambiaPagina(this.paginasElem.lista, this.paginasElem.form));
    this.volverElem.addEventListener('click', () => this.cambiaPagina(this.paginasElem.form, this.paginasElem.lista));
    this.seleccionElem.addEventListener('change', e => {
      if (e.target.value !== '') {
        this.btnAnyadirElem.classList.remove('off');
      } else {
        this.btnAnyadirElem.classList.add('off');
      }
    });
    this.btnAnyadirElem.addEventListener('click', e => {
      if (this.seleccionElem.value !== '') {
        this.anyadeCurso(+this.seleccionElem.value);
      }
    });
  }

  anyadeEventoPresionado(cursoElem) {
    const manager = new Hammer.Manager(cursoElem);
    manager.add(this.Press);
    manager.on('press', e => {
      if (e.target.tagName !== 'LI') {
        e.target = e.target.parentElement;
      }
      this.cursosElem.forEach(curso => {
        if (curso !== e.target) {
          curso.classList.remove('delete');
        }
      });
      e.target.classList.toggle('delete');
    });
    cursoElem.querySelector('i').addEventListener('click', e => this.borraCurso(+e.target.parentElement.dataset.cursoId));
  };

  borraCurso(cursoId) {
    this.spinnerElem.classList.remove('off');
    this.misCursos = this.misCursos.filter(curso => curso !== cursoId);
    this.modificaMisCursos().then(() => {
      this.rellenaListaCursos();
      this.spinnerElem.classList.add('off');
    }).catch(err => {
      console.log("Error al enviar PATCH a la API: ", err);
      this.spinnerElem.classList.add('off');
    });
  }

  cambiaPagina(pagina1, pagina2) {
    pagina1.classList.add('off');
    pagina2.classList.remove('off');
    if (pagina2 === this.paginasElem.form) {
      this.cargaCursosDisponibles();
      this.volverElem.classList.remove('off');
    } else {
      this.cargaMisCursos();
      this.volverElem.classList.add('off');
    }
  }

  cargaCursosDisponibles() {
    this.spinnerElem.classList.remove('off');
    return new Promise((resolve, reject) => {
      fetch(this.urlCursosDisponibles).then(cursos => cursos.json()).then(cursos => {
        this.cursosDisponibles = cursos;
        this.rellenaSelectCursos();
        this.spinnerElem.classList.add('off');
        resolve();
      }).catch(err => {
        this.spinnerElem.classList.add('off');
        reject();
      });
    })
  }

  cargaMisCursos() {
    this.spinnerElem.classList.remove('off');
    fetch(this.urlCursosUsuario + this.idUsuario).then(cursos => cursos.json()).then(cursos => {
      this.misCursos = cursos.cursos;
      this.rellenaListaCursos();
      this.spinnerElem.classList.add('off');
    })
  }

  rellenaListaCursos() {
    this.cursosListaElem.innerHTML = '';
    for (const curso of this.misCursos) {
      const nuevoCurso = this.cursosDisponibles.find(cursoDisponible => cursoDisponible.id === curso);
      const nuevoCursoElem = this.cursoBase.cloneNode(true);
      nuevoCursoElem.querySelector('.curso-nombre').innerHTML = nuevoCurso.nombre;
      nuevoCursoElem.classList.remove('curso-dummy', 'off');
      nuevoCursoElem.dataset.cursoId = curso;
      this.cursosListaElem.appendChild(nuevoCursoElem);
    }
    this.cursosElem = document.querySelectorAll('.curso');
    this.cursosElem.forEach(cursoElem => this.anyadeEventoPresionado(cursoElem));
  }

  rellenaSelectCursos() {
    this.seleccionElem.querySelectorAll('option').forEach(opcion => {
      if (opcion.value !== '') {
        opcion.remove();
      }
    });
    for (let curso of this.cursosDisponibles.filter(cursoDisponible => !this.misCursos.includes(cursoDisponible.id))) {
      const nuevaOpcion = document.createElement('option');
      nuevaOpcion.value = curso.id;
      nuevaOpcion.innerText = curso.nombre;
      this.seleccionElem.appendChild(nuevaOpcion);
    }
  }

  anyadeCurso(idCurso) {
    const nuevoCurso = this.cursosDisponibles.find(curso => curso.id === idCurso);
    if (!this.misCursos.includes(idCurso)) {
      this.spinnerElem.classList.remove('off');
      this.btnAnyadirElem.classList.add('off');
      this.misCursos.push(nuevoCurso.id);
      this.modificaMisCursos()
        .then(() => {
          this.cambiaPagina(this.paginasElem.form, this.paginasElem.lista);
          this.spinnerElem.classList.add('off');
        })
        .catch(err => {
          console.log("Error al enviar PATCH a la API: ", err);
          this.spinnerElem.classList.add('off');
          this.btnAnyadirElem.classList.remove('off');
        })
    }
  }

  modificaMisCursos() {
    return fetch(this.urlCursosUsuario + this.idUsuario, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cursos: this.misCursos
      })
    });
  }
}

new CursosApp();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
